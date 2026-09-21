-- 004: raise the supported original-document size from 10 MiB to 50 MB.
--
-- Additive only. It widens two existing limits and adds nothing that grants access.
-- It does not create, drop or reset any table, account, grant or policy, and it does not
-- make the bucket public. Migrations 001-003 were applied through the dashboard SQL editor
-- and are not registered in Supabase CLI migration history; apply this one the same way and
-- do not run `db push` against this project without reconciling that history first.
--
-- 50,000,000 decimal is deliberate. Supabase documents a 50 MB ceiling for Free projects
-- without stating decimal or binary, so the smaller reading is used. This number must stay
-- equal to MAX_DOCUMENT_BYTES in packages/domain/document.ts; a test asserts that.
--
-- Until this migration is applied, reserve_document still refuses anything above 10 MiB,
-- so a large upload fails immediately at the metadata step with a clear localized message
-- rather than part-way through a transfer.
begin;

alter table public.patient_documents drop constraint if exists patient_documents_bytes_check;
alter table public.patient_documents add constraint patient_documents_bytes_check
 check(bytes between 1 and 50000000);

-- Storage enforces its own per-object ceiling. If this is left at 10 MiB the browser's
-- direct upload is refused by Storage after the metadata row already exists, leaving a
-- pending entry, so the two limits must be changed together.
update storage.buckets set file_size_limit=50000000 where id='medical-originals';

-- The bucket stays private and keeps accepting only the opaque upload content type; the
-- real format is checked from the file's own first bytes by the application.
do $$
begin
 if not exists(select 1 from storage.buckets where id='medical-originals' and public=false) then
  raise exception 'medical-originals must remain private';
 end if;
end $$;

insert into public.schema_versions(version) values(4);

commit;
