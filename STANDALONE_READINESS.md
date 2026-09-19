# Standalone readiness — 2026-09-19

**NOT READY for patient use or a controlled pilot.** A Next.js app now builds and runs locally. PASS applies only to the stated narrow requirement. Live Supabase accounts remain unconfigured; historical Project responses are not standalone model results. See docs/APP_MILESTONE_VERIFICATION.md and docs/COMPUTER_TRANSFER.md.

| Requirement | Implementation location | Verification / evidence | Status | Remaining issue |
|---|---|---|---|---|
| Takeover audit and milestone plan | docs/CODEX_TAKEOVER_AUDIT.md; docs/STANDALONE_IMPLEMENTATION_PLAN.md | Repository inventory, baseline utility outputs | PASS | Architectural choices need implementation |
| Preserve historical safety assets and scenario inventory | project, docs, tests, review_package | Static checks; unit inventory assertions for 79 parents / 34 gating inputs | PASS | Historical prose contradictions remain flagged |
| Pure patient/caregiver capability policy | packages/domain/access.ts | tests/unit/access.test.ts | PASS | Live provider integration remains to verify |
| Behavioral evidence rejection gate | packages/domain/behavioral-evidence.ts; tools/check-behavioral.ts | tests/unit/evidence.test.ts; CLI refuses missing evidence | PASS | Validates evidence structure, not capture authenticity or clinical correctness |
| Separate authenticated identities and sessions | apps/web/lib/supabase.ts; proxy.ts; actions | Build/typecheck; unconfigured path browser tests | PARTIAL | Live login/expiry/recovery/logout not tested; no Supabase instance |
| Server authorization, RLS and revocation | apps/web/lib/dal.ts; database migration | PGlite policy tests + unauthorized-page browser checks | PARTIAL | Verify real Supabase HTTP routes, expiry and storage access |
| Structured persistence, provenance, UNKNOWN, conflicts | packages/domain/record.ts; database/migrations/001_record_foundation.sql | Runtime validation + actual SQL constraints/transactions tested | PARTIAL | Generic record foundation; full clinical entities/reconciliation/candidates absent |
| Caregiver record/reconciliation UI | apps/web/components/record-form.tsx | Build and readonly preview browser tests | PARTIAL | Real provider form save and reconciliation UI unverified/incomplete |
| Patient mobile/accessible RU/HE/EN/RTL interface | apps/web/components; i18n; CSS | Desktop/mobile browser and RTL tests; screenshots inspected | PARTIAL | Real login, screen-reader/elderly usability, voice, final contrast review |
| Deterministic emergency / medication engine | Existing prose preserved | Static document checks only | FAIL | Recognition, localized fixed responses, clinical review, residual risks |
| AI provider orchestration and bounded retrieval | Planned | None | FAIL | Auth → safety → sources → provider → guards → audit |
| Secure documents and extraction/review | Planned | None | FAIL | Quarantine, original sources, candidate-only extraction, accept/reject/edit |
| Audit/version history/concurrent edits | SQL save_record/revisions/audit; history route | PGlite stale-version and audit-failure rollback tests | PARTIAL | Live multi-session test, history pagination and source-rich historical view |
| Executable clinical scenarios / actual outputs | Historical tests/EXECUTION_LOG.md; new inventory | No new model execution | PARTIAL | Full harness, trustworthy captures, 2 historical FAILs and 7 unrun parents |
| Integration / end-to-end tests | tests/integration; tests/e2e | SQL and browser tests run locally | PARTIAL | Full authenticated Supabase flow and model tests remain |
| Dependency and operational failure behavior | Implementation plan | No fault injection | FAIL | Provider, DB, storage, extraction, session, migration and edit failures |
| Secrets protection and security scanning | .gitignore; npm lock; transfer scanner | Dependency audit and narrow known-pattern scans | PARTIAL | Full secret/privacy review and deployed security hardening |
| Reproducible app build and checks | package/lock; setup scripts; CI | Local build, typecheck, unit, SQL, browser checks | PASS | Remote CI and destination setup still need execution |
| Source/history transfer archive integrity | tools/build_transfer.py; transfer; handoff docs | ZIP checks + 116 restored file hashes + original HEAD/history verified | PASS | This is a development transfer, not a patient deployment |
| Destination setup | scripts; docs/COMPUTER_TRANSFER.md | Scripts syntax-checked; source machine checks pass | PARTIAL | Dad's OS/account setup and tests must run there |
| Staging/production, HTTPS, monitoring | Planned | None | FAIL | Deployment, health/readiness, PHI-safe telemetry and operator ownership |
| Backup, restore, rollback | Planned | None | FAIL | DB plus object backups, restore drill and compatible rollback |
| Clinical/pharmacy/local-protocol approval | Existing review packet | No sign-offs | FAIL | B-01/B-02/B-05/B-06/B-07 |
| Privacy/compliance assessment | docs/PRIVACY.md; audit J | No formal assessment | FAIL | Consent, retention, region, processors, applicable law |

Verification for milestone 1 is recorded in docs/BASELINE_VERIFICATION.md. Readiness is never inferred from intention, source text, unit-test synthetic responses or a green developer CI run. Open issues remain in docs/OPEN_SAFETY_ISSUES.md.
