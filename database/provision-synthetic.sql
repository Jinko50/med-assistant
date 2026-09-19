-- Run AFTER 001_record_foundation.sql in a synthetic-only Supabase test project.
-- Create two confirmed Auth users first. Replace these TWO placeholder UUIDs.
-- Intentionally fails until replaced; never put passwords in SQL or Git.
begin;
insert into public.patients(id,display_name,preferred_language)
values ('10000000-0000-4000-8000-000000000001','Synthetic test patient','ru');
insert into public.patient_access(patient_id,user_id,role,can_manage_access)
values
('10000000-0000-4000-8000-000000000001','PATIENT_AUTH_UUID'::uuid,'patient',false),
('10000000-0000-4000-8000-000000000001','CAREGIVER_AUTH_UUID'::uuid,'caregiver',false);
commit;
