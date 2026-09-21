# Standalone readiness — 2026-09-19

Update 2026-09-20 (Claude Code, after independent Codex verification): a release
**candidate** `0.4.1-localized-test.1` is built and smoke-tested locally but is **NOT
published**. It resolves the secondary findings in docs/CLAUDE_RELEASE_REVIEW.md: the
packaging script now refuses a build whose compiled `NEXT_PUBLIC_APP_VERSION` does not
match `-Version`, the extracted-package smoke test asserts exact agreement between the
interface stamp, VERSION.txt and MANIFEST.json, administration audit rows are shown with
translated action labels and locale-formatted timestamps, and an unrecognised action
message now renders a localized notice instead of a blank line. No database, account,
grant, migration or published release was changed.

**There is no chat or assistant conversation in any build.** The owner expects one; it does
not exist. This is missing product functionality, not an installation fault. A
record/document-management candidate is not the finished Med Assistant. Authenticated
upload/download against Storage and cross-device visibility remain **UNVERIFIED** and are
the blocking acceptance gate; see docs/CLAUDE_FINAL_RELEASE_OUTCOME.md for the exact
remaining steps.

Update 2026-09-20 (Claude Code): administration, registration and document screens are
fully localized in RU/HE/EN with visible language selection and correct lang/dir; Hebrew is
right-to-left with LTR email fields. Record and upload navigation is prominent after login,
gated on actual record membership rather than administrator status. Release
v0.4.0-localized-test.1 is published and its extracted ZIP passes an automated smoke test of
those behaviours. Authenticated upload/download against Storage and cross-device visibility
are STILL UNVERIFIED: they need the account holders' own passwords, which were not requested
or handled. No database, account, grant or migration was changed.

Update 2026-09-20: two confirmed accounts have app-admin and shared editor access. Migration
003 adds private original PDF/JPEG/PNG storage (10 MiB); 19 SQL and 16 unit tests pass.
Email confirmation now has a reachable landing page. Full authenticated cross-computer
acceptance, document extraction/scanning, recovery and the clinical gates remain unfinished.
The historical rows below do not constitute patient-use approval.

**NOT READY for patient use or a controlled pilot.** A Next.js app now builds and runs locally. PASS applies only to the stated narrow requirement. The hosted Supabase schema is deployed and anonymous read denial passes; patient/caregiver accounts and live authenticated testing remain pending. Historical Project responses are not standalone model results. See docs/LIVE_BACKEND_VERIFICATION.md, docs/APP_MILESTONE_VERIFICATION.md and docs/COMPUTER_TRANSFER.md.

| Requirement | Implementation location | Verification / evidence | Status | Remaining issue |
|---|---|---|---|---|
| Fixed-user administration | migration 002; admin page/actions; register page | 5 SQL tests for admin-only changes, verified claims, shared access, stale writes and revocation; live anonymous denial | PARTIAL | Bootstrap admin identity, configure email delivery, authenticated end-to-end tests, recovery flow, localized registration/admin UI |
| Takeover audit and milestone plan | docs/CODEX_TAKEOVER_AUDIT.md; docs/STANDALONE_IMPLEMENTATION_PLAN.md | Repository inventory, baseline utility outputs | PASS | Architectural choices need implementation |
| Preserve historical safety assets and scenario inventory | project, docs, tests, review_package | Static checks; unit inventory assertions for 79 parents / 34 gating inputs | PASS | Historical prose contradictions remain flagged |
| Pure patient/caregiver capability policy | packages/domain/access.ts | tests/unit/access.test.ts | PASS | Live provider integration remains to verify |
| Behavioral evidence rejection gate | packages/domain/behavioral-evidence.ts; tools/check-behavioral.ts | tests/unit/evidence.test.ts; CLI refuses missing evidence | PASS | Validates evidence structure, not capture authenticity or clinical correctness |
| Separate authenticated identities and sessions | apps/web/lib/supabase.ts; proxy.ts; actions | Build/typecheck; unconfigured path browser tests | PARTIAL | Live login/expiry/recovery/logout not tested; no Supabase instance |
| Server authorization, RLS and revocation | apps/web/lib/dal.ts; database migration | PGlite policy tests + unauthorized-page browser checks | PARTIAL | Verify real Supabase HTTP routes, expiry and storage access |
| Structured persistence, provenance, UNKNOWN, conflicts | packages/domain/record.ts; database/migrations/001_record_foundation.sql | Runtime validation + actual SQL constraints/transactions tested | PARTIAL | Generic record foundation; full clinical entities/reconciliation/candidates absent |
| Caregiver record/reconciliation UI | apps/web/components/record-form.tsx | Build and readonly preview browser tests | PARTIAL | Real provider form save and reconciliation UI unverified/incomplete |
| Patient mobile/accessible RU/HE/EN/RTL interface | apps/web/components; i18n; CSS; admin/register/document pages | Desktop/mobile browser and RTL tests; tests/unit/i18n.test.ts; packaged-ZIP smoke test asserts RU/HE rendering, lang/dir, language links and LTR email fields | PARTIAL | Real login, screen-reader/elderly usability, voice, final contrast review |
| Deterministic emergency / medication engine | Existing prose preserved | Static document checks only | FAIL | Recognition, localized fixed responses, clinical review, residual risks |
| AI provider orchestration and bounded retrieval | Planned | None | FAIL | No patient-facing chat exists in any build, though the owner expects one. Auth → safety → sources → provider → guards → audit must come first |
| Secure documents and extraction/review | migration 003; documents pages/actions | Signature unit test and 3 SQL storage-policy tests; live private bucket verified; upload route now localized and reachable in two clicks from the record | PARTIAL | **Live Storage upload/download acceptance still unverified — needs the account holders' own sign-in.** Malware scanning, candidate-only extraction and review |
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
