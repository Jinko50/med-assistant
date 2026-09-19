# Hosted backend setup — 2026-09-19

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
