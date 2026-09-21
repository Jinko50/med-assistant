-- 006: gentle wellbeing check-ins.
--
-- Additive only. It adds one table and its policies. It does not alter any existing table,
-- function, policy, account, grant or bucket, and it never resets anything. Migrations
-- 001-005 were applied through the dashboard and are not in CLI migration history; apply
-- this one the same way and do not run `db push` without reconciling that history first.
--
-- These rows are what a person SAID TODAY. They are deliberately kept out of
-- medical_records, which holds the approved longitudinal record with its own provenance and
-- review. A check-in never becomes a diagnosis, is never reconciled into a confirmed fact by
-- this migration, and carries no clinical interpretation. The separation is the point: a
-- report of feeling tired must never silently turn into recorded medical history.
begin;

create table public.wellbeing_reports (
 id uuid primary key default gen_random_uuid(),
 patient_id uuid not null references public.patients(id),
 -- Who typed it. The patient reporting on themselves is the ordinary case; a caregiver may
 -- also record what they were told, and the two are distinguishable by this column.
 reported_by uuid not null references auth.users(id),
 -- Small closed vocabularies, not free scales, so nothing implies a validated instrument.
 -- Every one is optional: a person may answer one question and stop.
 feeling text check (feeling in ('good','ok','poor')),
 energy text check (energy in ('good','ok','low')),
 appetite text check (appetite in ('good','ok','low')),
 sleep text check (sleep in ('good','ok','poor')),
 activity text check (activity in ('active','some','resting')),
 note text check (note is null or length(note) between 1 and 2000),
 -- What the deterministic screen decided about the free-text note at the time of writing.
 -- Recorded for audit. 'none' means nothing matched, NOT that the text was judged safe.
 safety_level text not null default 'none'
  check (safety_level in ('none','urgent','medication','emergency')),
 created_at timestamptz not null default now(),
 -- An entirely empty check-in is not a report.
 constraint wellbeing_reports_not_empty check (
  feeling is not null or energy is not null or appetite is not null
  or sleep is not null or activity is not null or note is not null)
);
create index wellbeing_reports_recent on public.wellbeing_reports(patient_id, created_at desc);

alter table public.wellbeing_reports enable row level security;
revoke all on public.wellbeing_reports from anon, authenticated;
grant select, insert on public.wellbeing_reports to authenticated;

-- Anyone with current access to the record may read the reports: the patient sees their own
-- and a caregiver sees what the patient reported. Revocation removes this immediately,
-- because has_access is evaluated per statement against live membership.
create policy wellbeing_read on public.wellbeing_reports for select to authenticated
 using (private.has_access(patient_id));

-- Writing requires current access AND that the row is attributed to the writer. Nobody can
-- file a report in someone else's name, and a read-only patient CAN report about themselves
-- because this is their own account of today, not an edit to the medical record.
create policy wellbeing_write on public.wellbeing_reports for insert to authenticated
 with check (private.has_access(patient_id) and reported_by = auth.uid());

-- Deliberately no update or delete policy. A report is what was said at the time; a
-- correction is a new, later report. Removal needs the documented retention procedure.

insert into public.schema_versions(version) values(6);

commit;
