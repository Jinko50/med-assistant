# Hosted backend setup — 2026-09-19

## 2026-09-20 update

Both user-requested accounts now have confirmed email identities, application administrator
roles and caregiver/editor memberships in one shared record. Their personal identifiers
are kept out of Git. Passwords were not changed. The app registration minimum is six,
matching the hosted provider minimum. The saved Site URL points to the deployed GitHub
Pages confirmation landing page; HTTP 200 and persistence after dashboard reload were verified.

Migration 003 was applied through the dashboard. Verification returned schema version 3,
private bucket `medical-originals`, 10 MiB limit and two storage policies. The app supports
private original uploads/downloads; no extraction or medical interpretation. Three PGlite
document tests cover unauthorized reservation, storage path restrictions, pending files,
idempotent finalization, overwrite/delete denial and revocation. Total: 19 SQL tests and
16 unit tests passed. PGlite uses a simulated Storage schema and does not replace a live
Storage API upload test. Live two-account login/save/upload and recovery tests remain pending.
The production build, TypeScript check, 10 desktop/mobile browser tests and 52 static checks
passed. The new connected ZIP was extracted and passed its bundled-runtime smoke test,
including the six-character form minimum and anonymous document/admin denial. The live
API denies anonymous reads of all 11 application tables, including document metadata.

The sections below are historical milestone evidence; initial empty-account requirements
have been superseded by this update. Migrations 001–003 are not registered in CLI history.

## Fixed-account milestone

Migration 002 is now deployed. The three added tables (`app_admins`, `managed_accounts`,
`access_audit`) have RLS and deny anonymous reads, verified against the live API.
Only an operator can bootstrap the first administrator. Admin functions manage approved
email roles and revocation with audit events and optimistic version checks. Verified
users claim only pre-approved access; claiming again never restores a revoked membership.
Five additional PGlite tests pass, bringing database integration coverage to 16 tests.
The production build and TypeScript checking pass. Authenticated live user testing is
still pending because an admin identity and email delivery have not been configured.
The installer guide explicitly documents these requirements and the unfinished medical features.
The final connected ZIP was extracted into a path containing spaces and passed the bundled
runtime test: login enabled, registration available, anonymous admin denied, fictional preview
disabled, assets loaded, and clinical readiness still blocked. The test exited 0 with cleanup.
All 10 existing desktop/mobile browser regressions also passed. These checks did not create
or log into real Auth identities and must not be described as full account acceptance.

The user-provided Supabase project was connected through an ignored local environment
file. No backend configuration or credentials were committed or included in a release.
The signed-in dashboard showed a healthy new project with zero public tables.

The initial transaction from `database/migrations/001_record_foundation.sql` was applied
through the SQL editor, preserving its schema, functions, constraints, grants and policies.
Verification returned schema version **1**, **7** tables with row-level security and **7**
read policies. The database had **0** Auth users and **0** patients after migration.
The live API check passed: Auth accepted the publishable key, email login was enabled,
and all seven table endpoints returned permission denial for anonymous reads.
There is no clinical data. This migration was applied through the dashboard, so it is
not yet registered in the Supabase CLI migration-history table; do not push it again.

The next required step is creation of separate patient and caregiver Auth accounts,
followed by explicit membership provisioning. Email addresses and passwords must stay
out of Git. Live two-account login, caregiver save, patient read, history, stale writes,
revocation and session tests remain pending. Clinical readiness remains false.

Run `node --env-file=apps/web/.env.local tools/check-live-backend.mjs` to check Auth
availability and anonymous read denial without exposing keys or reading record data.
