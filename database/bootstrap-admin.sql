-- One-time action by the project owner in Supabase SQL Editor.
-- First register and confirm YOUR OWN account. Replace the placeholder below.
-- Never paste passwords into SQL. This intentionally fails for an unknown/unverified email.
do $$
declare target uuid; owner_email text := 'REPLACE_WITH_YOUR_VERIFIED_ADMIN_EMAIL';
begin
 if exists(select 1 from public.app_admins where revoked_at is null) then
  raise exception 'An administrator already exists. Use a reviewed operator procedure for additional administrators.';
 end if;
 select id into strict target from auth.users where lower(email)=lower(trim(owner_email)) and email_confirmed_at is not null;
 insert into public.app_admins(user_id) values(target);
end; $$;
