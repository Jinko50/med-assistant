begin;
create table public.app_admins (
 user_id uuid primary key references auth.users(id), revoked_at timestamptz
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to authenticated;
create policy own_admin on public.app_admins for select to authenticated using (user_id=auth.uid() and revoked_at is null);
create function private.is_app_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_admins where user_id=auth.uid() and revoked_at is null);
$$;
revoke all on function private.is_app_admin() from public;
grant execute on function private.is_app_admin() to authenticated;
create table public.managed_accounts (
 patient_id uuid not null references public.patients(id),
 email text not null check(email=lower(trim(email)) and length(email) between 3 and 254 and position('@' in email)>1),
 role text not null check(role in ('patient','caregiver')),
 active boolean not null default true,
 user_id uuid references auth.users(id),
 version integer not null default 1,
 primary key(patient_id,email)
);
create unique index one_active_patient_account on public.managed_accounts(patient_id) where role='patient' and active;
create table public.access_audit (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id),
 patient_id uuid not null references public.patients(id), email text, action text not null,
 created_at timestamptz not null default now()
);
alter table public.managed_accounts enable row level security;
alter table public.access_audit enable row level security;
revoke all on public.managed_accounts,public.access_audit from anon,authenticated;
grant select on public.managed_accounts,public.access_audit to authenticated;
create policy admin_accounts on public.managed_accounts for select to authenticated using(private.is_app_admin());
create policy admin_access_audit on public.access_audit for select to authenticated using(private.is_app_admin());
create policy admin_patients on public.patients for select to authenticated using(private.is_app_admin());
create function public.admin_create_patient(p_name text,p_locale text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform 1 from public.app_admins where user_id=auth.uid() and revoked_at is null for share;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 insert into public.patients(display_name,preferred_language) values(trim(p_name),p_locale) returning id into result;
 insert into public.access_audit(actor_id,patient_id,action) values(auth.uid(),result,'patient.created');
 return result;
end; $$;
create function public.admin_set_account(p_patient uuid,p_email text,p_role text,p_active boolean,p_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare old public.managed_accounts; target_user uuid; normalized text:=lower(trim(p_email));
begin
 perform 1 from public.app_admins where user_id=auth.uid() and revoked_at is null for share;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 -- Serialize new entries and patient-role uniqueness within this patient.
 perform 1 from public.patients where id=p_patient for update;
 if not found then raise exception 'Patient unavailable' using errcode='42501'; end if;
 select * into old from public.managed_accounts where patient_id=p_patient and email=normalized for update;
 if (found and old.version is distinct from p_version) or (not found and p_version is distinct from 0) then
  raise exception 'Version conflict' using errcode='40001';
 end if;
 select id into target_user from auth.users where lower(email)=normalized and email_confirmed_at is not null;
 if old.user_id is not null and old.user_id is distinct from target_user then
  update public.patient_access set revoked_at=now() where patient_id=p_patient and user_id=old.user_id;
 end if;
 insert into public.managed_accounts(patient_id,email,role,active,user_id)
 values(p_patient,normalized,p_role,p_active,target_user)
 on conflict(patient_id,email) do update set role=excluded.role,active=excluded.active,user_id=excluded.user_id,version=managed_accounts.version+1;
 if target_user is not null then
  insert into public.patient_access(patient_id,user_id,role,revoked_at,can_manage_access)
  values(p_patient,target_user,p_role,case when p_active then null else now() end,false)
  on conflict(patient_id,user_id) do update set role=excluded.role,revoked_at=excluded.revoked_at,can_manage_access=false;
 end if;
 insert into public.access_audit(actor_id,patient_id,email,action)
 values(auth.uid(),p_patient,normalized,case when p_active then 'account.enabled.'||p_role else 'account.revoked' end);
end; $$;
create function public.claim_managed_access() returns void
language plpgsql security definer set search_path='' as $$
declare verified_email text; entry public.managed_accounts;
begin
 select lower(email) into verified_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if verified_email is null then raise exception 'Verified account required' using errcode='42501'; end if;
 for entry in select * from public.managed_accounts where email=verified_email and active and user_id is null for update loop
  insert into public.patient_access(patient_id,user_id,role,can_manage_access)
  values(entry.patient_id,auth.uid(),entry.role,false)
  on conflict(patient_id,user_id) do nothing;
  update public.managed_accounts set user_id=auth.uid() where patient_id=entry.patient_id and email=entry.email;
  insert into public.access_audit(actor_id,patient_id,email,action) values(auth.uid(),entry.patient_id,entry.email,'account.claimed');
 end loop;
end; $$;
revoke all on function public.admin_create_patient(text,text),public.admin_set_account(uuid,text,text,boolean,integer),public.claim_managed_access() from public,anon;
grant execute on function public.admin_create_patient(text,text),public.admin_set_account(uuid,text,text,boolean,integer),public.claim_managed_access() to authenticated;
insert into public.schema_versions values(2);
commit;
