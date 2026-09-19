# Configure the synthetic app backend

This enables real login and record persistence for development. No Supabase instance or accounts were created on the source computer. Database policies were exercised with PGlite PostgreSQL and an auth.uid test shim; actual Supabase Auth and HTTP integration still need verification.

1. Create a separate Supabase development project containing fictional data only. Choose the region deliberately. Keep database/admin credentials in your password manager.
2. In the SQL editor apply database/migrations/001_record_foundation.sql in full. It is an initial transactional migration for a new project. It must fail on an already migrated schema; do not delete tables to make it run again. Inspect schema_versions for version 1.
3. In Supabase Auth create two different confirmed test users, one patient and one caregiver. Use different passwords and controlled email addresses. Never share credentials. Do not enable anonymous self-enrollment into a patient record.
4. Copy database/provision-synthetic.sql into the SQL editor, replace PATIENT_AUTH_UUID and CAREGIVER_AUTH_UUID with the Auth user IDs, and execute it. Keep filled provisioning scripts outside Git. This links both users to one fictional patient.
5. Copy apps/web/.env.example to apps/web/.env.local. Set SUPABASE_URL to the HTTPS project URL and SUPABASE_PUBLISHABLE_KEY to its publishable key. Do not use a service-role or secret key. Set ENABLE_FICTIONAL_PREVIEW=false when testing live login.
6. Run `npm run dev` and open http://127.0.0.1:3000/ru/login. The app uses server-side cookie sessions. Configure provider auth rate limits and password/recovery policy before wider testing.

## Required destination verification

Use separate browser profiles or normal/private windows:

- Caregiver logs in, adds a profile fact with source/date and confirms the form. Success appears only after the database transaction succeeds.
- Patient logs in separately and reads the same fact, with no edit controls.
- Caregiver edits; patient reloads and sees the change; history retains both versions and actors.
- Open the same edit in two caregiver windows. Save one, then submit the stale form: it must show a conflict.
- Revoke the exact caregiver membership in the SQL editor by setting revoked_at=now(). Reload and try to save: access must be denied without needing logout.
- Log out; revisit protected URLs and use browser Back. Test expiry, disabled accounts, recovery and provider outage before marking auth PASS.

Do not bypass RLS. There are no direct authenticated table writes; save_record is the authorized transaction. Access provisioning/revocation is operator-only at this milestone. No AI chat or document upload is implemented.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Recheck current provider setup when provisioning.

## Moving computers

The cloud database remains in Supabase. If later reconnecting from another development computer, transfer configuration securely and recreate local files; never send keys in Git or the ZIP. No database or document store exists to migrate today. Once they exist, back up database and objects separately and rehearse restoration. The source ZIP is not a medical-data backup.
