# Continue Med Assistant development

2026-09-19. Recommended model: GPT-6 Astra / High; Extra High for safety/authorization review. Always give model guidance at major milestones.

## Paste into the new Codex task

> Continue this Med Assistant repository. Read AGENTS.md, docs/CODEX_TAKEOVER_AUDIT.md, docs/STANDALONE_IMPLEMENTATION_PLAN.md, STANDALONE_READINESS.md, docs/APP_MILESTONE_VERIFICATION.md and docs/SUPABASE_SETUP.md first. The product is a standalone client/server app for my dad with separate patient and caregiver accounts. Preserve the safety work and uncommitted changes. Never use real patient data in Git or tests. The repository was moved as Git history plus a working-tree overlay: do not reset to HEAD or discard untracked files. Recommend a model at each major stage. Continue from the current app, do not rebuild it. First run checks, securely configure a synthetic Supabase environment, and verify two-account login, caregiver edit/patient read, history, stale edits and revocation. PGlite tests do not prove live auth. Then continue the milestone plan, including the full clinical schema/reconciliation, deterministic safety before model chat, document candidate approval and actual model regression evidence. Maintain readiness/issues honestly. No patient deployment before blockers close.

## Implemented

- Next.js 16.3.5 / React 19.3 / TypeScript app under apps/web; pinned lockfile.
- Patient/caregiver screens in EN/RU/HE and RTL; read-only fictional preview separated from real routes.
- Supabase server cookie auth wiring, getUser verification, fresh server access checks; no service-role key.
- Initial SQL migration: patients/access, sources, records, revisions, audit and schema version. RLS and caregiver save_record transaction with version checks and explicit unknowns.
- Caregiver confirmation form, source/date and unresolved conflict indication. No AI/extraction writes.
- PGlite policy tests with auth.uid shim; browser tests for previews, denied routes, language/RTL and health/readiness.
- Original 79 prose cases; 34 gating subcase evidence validator. No new model execution.

## Limits

No Supabase project/users configured here. Live login, expiry/recovery/logout and full HTTP saving are unverified. Generic record foundation is not the full clinical schema: reconciliation, dedicated entities, thresholds, document links/candidates and import remain incomplete. Access management is operator-only. No chatbot, safety engine, voice, upload, production deployment or backup/recovery implementation exists.

Record view refuses over 200 entries instead of silently truncating; pagination needed. History shows recent 100 revisions. Medical interpretation never runs. Displayed prescriptions are recorded facts, not instructions.

## Preserve

Takeover already had a modified project/MED_ASSISTANT_SYSTEM_PROMPT.md and untracked fictional injection/snapshot fixtures. Review copies were refreshed explicitly. The historical EXECUTION_LOG is unchanged and miscounts its table: 20 PASS / 2 FAIL / 7 NOT RUN parent IDs. Current prompt differs from the historically tested hash. REG-17 and SAFE-01 remain failed.

## Next acceptance

Use APP_MILESTONE_VERIFICATION.md for exact checks. Run npm test, npm run test:database, npm run build, npm run typecheck, Python utilities and npm run test:e2e on Node 24.16+ (24.x). Source Windows browser tests used PLAYWRIGHT_CHANNEL=chrome. Sandbox blocked test-server teardown; the final run outside the sandbox completed normally.

Next: two actual Supabase test identities, one synthetic record, caregiver edit/patient read, revocation/authorization failures and audit/history verified end to end. Then expand schema and safety before AI. Clinical/pharmacy sign-offs remain independent blockers.
