-- Apply to a fresh Supabase project. No real patient seed data.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.valid_source_date(value text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare parts text[];
begin
  if value = 'UNKNOWN' then return true; end if;
  if value is null or value !~ '^\d{4}(-\d{2}){0,2}$' then return false; end if;
  parts := string_to_array(value,'-');
  if parts[1]::integer not between 1900 and 2200 then return false; end if;
  perform make_date(parts[1]::integer,coalesce(parts[2]::integer,1),coalesce(parts[3]::integer,1));
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_source_date(text) from public;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(display_name) between 1 and 120),
  preferred_language text not null default 'ru' check (preferred_language in ('ru','he','en')),
  created_at timestamptz not null default now()
);
create table public.patient_access (
  patient_id uuid not null references public.patients(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('patient','caregiver')),
  can_manage_access boolean not null default false,
  revoked_at timestamptz,
  primary key (patient_id, user_id)
);
create index patient_access_by_user on public.patient_access(user_id, patient_id);
create table public.record_sources (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  description text not null check (length(trim(description)) between 1 and 500),
  source_date text not null check (private.valid_source_date(source_date)),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(patient_id, id)
);
create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  category text not null check (category in ('profile','medication','allergy','condition','lab','observation','care_plan','timeline','note')),
  label text not null check (length(trim(label)) between 1 and 120),
  value text,
  unit text check (length(unit) <= 40),
  provenance text not null check (provenance in ('DOCUMENTED','REPORTED','SEEN IN PHOTO','ESTIMATED','UNKNOWN')),
  unknown_reason text check (length(unknown_reason) <= 500),
  derivation text check (length(derivation) <= 500),
  source_id uuid not null,
  has_conflict boolean not null default false,
  version integer not null default 1 check (version > 0),
  confirmed_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  foreign key (patient_id,source_id) references public.record_sources(patient_id,id),
  unique(patient_id,id),
  check ((provenance = 'UNKNOWN' and value is null and length(trim(unknown_reason)) > 0 and unknown_reason is not null)
    or (provenance <> 'UNKNOWN' and value is not null and length(trim(value)) between 1 and 2000 and unknown_reason is null)),
  check (provenance <> 'ESTIMATED' or (derivation is not null and length(trim(derivation)) > 0)),
  -- Safety-relevant measurements, prescriptions and plans cannot be estimated.
  check (provenance <> 'ESTIMATED' or category in ('note','timeline')),
  check (category not in ('lab','observation') or provenance = 'UNKNOWN' or (unit is not null and length(trim(unit)) > 0))
);
create table public.record_revisions (
  patient_id uuid not null,
  record_id uuid not null,
  version integer not null,
  snapshot jsonb not null,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(record_id,version),
  foreign key(patient_id,record_id) references public.medical_records(patient_id,id)
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  actor_id uuid not null references auth.users(id),
  event_type text not null,
  record_id uuid,
  created_at timestamptz not null default now()
);
create table public.schema_versions (version integer primary key);
insert into public.schema_versions values (1);

create function private.has_access(target uuid, capability text default 'read_record')
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.patient_access a
    where a.patient_id = target and a.user_id = auth.uid() and a.revoked_at is null
      and (capability = 'read_record'
        or (capability = 'maintain_record' and a.role = 'caregiver')
        or (capability = 'manage_access' and a.can_manage_access)));
$$;
revoke all on function private.has_access(uuid,text) from public;
grant execute on function private.has_access(uuid,text) to authenticated;

alter table public.patients enable row level security;
alter table public.patient_access enable row level security;
alter table public.record_sources enable row level security;
alter table public.medical_records enable row level security;
alter table public.record_revisions enable row level security;
alter table public.audit_events enable row level security;
alter table public.schema_versions enable row level security;
create policy patient_read on public.patients for select to authenticated using (private.has_access(id));
create policy own_membership on public.patient_access for select to authenticated using (user_id = auth.uid() and revoked_at is null);
create policy source_read on public.record_sources for select to authenticated using (private.has_access(patient_id));
create policy record_read on public.medical_records for select to authenticated using (private.has_access(patient_id));
create policy revision_read on public.record_revisions for select to authenticated using (private.has_access(patient_id));
create policy audit_read on public.audit_events for select to authenticated using (private.has_access(patient_id));
create policy version_read on public.schema_versions for select to authenticated using (true);

-- No direct client inserts/updates/deletes, including sources, history and audit.
revoke all on public.patients, public.patient_access, public.record_sources, public.medical_records,
  public.record_revisions, public.audit_events, public.schema_versions from anon, authenticated;
grant select on public.patients, public.patient_access, public.record_sources, public.medical_records,
  public.record_revisions, public.audit_events, public.schema_versions to authenticated;

create function public.save_record(
  p_patient_id uuid, p_record_id uuid, p_expected_version integer,
  p_category text, p_label text, p_value text, p_unit text, p_provenance text,
  p_unknown_reason text, p_derivation text, p_source_description text,
  p_source_date text, p_has_conflict boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  membership public.patient_access;
  current_record public.medical_records;
  new_source uuid;
  saved_id uuid;
begin
  -- Fresh membership lock serializes mutations against revocation.
  select * into membership from public.patient_access
    where patient_id = p_patient_id and user_id = auth.uid() for share;
  if not found or membership.revoked_at is not null or membership.role <> 'caregiver' then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if p_record_id is not null then
    select * into current_record from public.medical_records
      where id = p_record_id and patient_id = p_patient_id for update;
    if not found then raise exception 'Record not available' using errcode = '42501'; end if;
    if p_expected_version is distinct from current_record.version then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
  elsif p_expected_version is distinct from 0 then
    raise exception 'Version conflict' using errcode = '40001';
  end if;
  insert into public.record_sources(patient_id,description,source_date,created_by)
    values(p_patient_id,p_source_description,p_source_date,auth.uid()) returning id into new_source;
  if p_record_id is null then
    insert into public.medical_records(patient_id,category,label,value,unit,provenance,unknown_reason,derivation,source_id,has_conflict,confirmed_by)
      values(p_patient_id,p_category,p_label,p_value,p_unit,p_provenance,p_unknown_reason,p_derivation,new_source,p_has_conflict,auth.uid()) returning * into current_record;
  else
    update public.medical_records set category=p_category,label=p_label,value=p_value,unit=p_unit,provenance=p_provenance,
      unknown_reason=p_unknown_reason,derivation=p_derivation,source_id=new_source,has_conflict=p_has_conflict,
      version=version+1,confirmed_by=auth.uid(),updated_at=now()
      where id=p_record_id and patient_id=p_patient_id returning * into current_record;
  end if;
  saved_id := current_record.id;
  insert into public.record_revisions(patient_id,record_id,version,snapshot,actor_id)
    values(p_patient_id,saved_id,current_record.version,to_jsonb(current_record),auth.uid());
  insert into public.audit_events(patient_id,actor_id,event_type,record_id)
    values(p_patient_id,auth.uid(),case when p_record_id is null then 'record.created' else 'record.updated' end,saved_id);
  return saved_id;
end;
$$;
revoke all on function public.save_record(uuid,uuid,integer,text,text,text,text,text,text,text,text,text,boolean) from public,anon;
grant execute on function public.save_record(uuid,uuid,integer,text,text,text,text,text,text,text,text,text,boolean) to authenticated;

-- Provisioning and access changes remain operator-only in this milestone.
-- No public grant/update membership function and no self-enrollment policy.
commit;
