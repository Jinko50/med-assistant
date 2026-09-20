begin;
create table public.patient_documents (
 id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id),
 uploaded_by uuid not null references auth.users(id), filename text not null check(length(filename) between 1 and 200),
 media_type text not null check(media_type in ('application/pdf','image/jpeg','image/png')),
 bytes integer not null check(bytes between 1 and 10485760),
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 state text not null default 'pending' check(state in ('pending','uploaded')),
 created_at timestamptz not null default now()
);
alter table public.patient_documents enable row level security;
revoke all on public.patient_documents from anon,authenticated;
grant select on public.patient_documents to authenticated;
create policy documents_caregiver_read on public.patient_documents for select to authenticated using(private.has_access(patient_id,'maintain_record'));
create function public.reserve_document(p_patient uuid,p_filename text,p_media_type text,p_bytes integer,p_sha256 text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform 1 from public.patient_access where patient_id=p_patient and user_id=auth.uid() and role='caregiver' and revoked_at is null for share;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 insert into public.patient_documents(patient_id,uploaded_by,filename,media_type,bytes,sha256)
 values(p_patient,auth.uid(),p_filename,p_media_type,p_bytes,p_sha256) returning id into result;
 insert into public.audit_events(patient_id,actor_id,event_type) values(p_patient,auth.uid(),'document.reserved');
 return result;
end; $$;
create function private.document_storage_access(object_name text,uploading boolean) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patient_documents d where object_name=d.patient_id::text||'/'||d.id::text
 and private.has_access(d.patient_id,'maintain_record')
 and (case when uploading then d.uploaded_by=auth.uid() and d.state='pending' else d.state='uploaded' end));
$$;
create function public.finish_document(p_document uuid) returns void
language plpgsql security definer set search_path='' as $$
declare doc public.patient_documents;
begin
 select * into doc from public.patient_documents where id=p_document for update;
 if not found or doc.uploaded_by is distinct from auth.uid() then raise exception 'Access denied' using errcode='42501'; end if;
 perform 1 from public.patient_access where patient_id=doc.patient_id and user_id=auth.uid() and role='caregiver' and revoked_at is null for share;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 if not exists(select 1 from storage.objects where bucket_id='medical-originals' and name=doc.patient_id::text||'/'||doc.id::text) then
 raise exception 'Upload incomplete'; end if;
 if doc.state='uploaded' then return; end if;
 update public.patient_documents set state='uploaded' where id=p_document;
 insert into public.audit_events(patient_id,actor_id,event_type) values(doc.patient_id,auth.uid(),'document.uploaded');
end; $$;
revoke all on function public.reserve_document(uuid,text,text,integer,text),public.finish_document(uuid),private.document_storage_access(text,boolean) from public,anon;
grant execute on function public.reserve_document(uuid,text,text,integer,text),public.finish_document(uuid),private.document_storage_access(text,boolean) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('medical-originals','medical-originals',false,10485760,array['application/octet-stream']);
create policy medical_original_insert on storage.objects for insert to authenticated
with check(bucket_id='medical-originals' and private.document_storage_access(name,true));
create policy medical_original_read on storage.objects for select to authenticated
using(bucket_id='medical-originals' and private.document_storage_access(name,false));
-- No overwrite/delete policy: originals are immutable. No AI extraction or auto-confirmation.
insert into public.schema_versions values(3);
commit;
