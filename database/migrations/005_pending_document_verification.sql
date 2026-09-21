-- Direct uploads must be readable by their original uploader before finalization.
-- Otherwise finishUpload cannot sign/read the object and pending -> uploaded deadlocks.
-- Other editors still see only completed originals; all reads require current membership.
begin;
create or replace function private.document_storage_access(object_name text,uploading boolean)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patient_documents d
 where object_name=d.patient_id::text||'/'||d.id::text
 and private.has_access(d.patient_id,'maintain_record')
 and case when uploading then d.uploaded_by=auth.uid() and d.state='pending'
          else d.state='uploaded' or (d.state='pending' and d.uploaded_by=auth.uid()) end);
$$;
-- CREATE OR REPLACE preserves existing grants; explicitly retain the same boundary.
revoke all on function private.document_storage_access(text,boolean) from public,anon;
grant execute on function private.document_storage_access(text,boolean) to authenticated;
insert into public.schema_versions(version) values(5);
commit;
