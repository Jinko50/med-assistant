# App and transfer milestone verification — 2026-09-19

Scope: Next.js scaffold and initial database/auth/record workflow; development transfer preparation. No new model API calls, real patient data, Supabase project provisioning or production deployment.

| Check | Result / scope |
|---|---|
| Next.js production build | PASS, all app routes compiled; initial import/type/CSS errors fixed |
| TypeScript checking | PASS after fixes; no suppression of type errors |
| Unit tests | 15 PASS: access, record/date/unknown validation, inventory and behavioral-evidence structure |
| Database integration | 11 PASS: migration/policies, source/record/revision/audit atomicity, patient/cross-patient denial, stale versions, unknowns/units/dates, audit-outage rollback, revocation and anonymous denial in PGlite |
| Browser tests | 10 PASS across desktop/mobile Chrome: previews, protected unconfigured routes, EN/RU/HE document language/RTL, no horizontal overflow, health/readiness and no-store headers |
| Visual inspection | Desktop patient and mobile Hebrew full-page screenshots inspected; no overlap; patient record text enlarged for readability |
| Dependency audit at install | 0 reported vulnerabilities in installed locked dependency set; re-run on destination |
| Existing static safety checks | 52 PASS / 0 FAIL after source/review synchronization |
| PowerShell setup/launcher/restore scripts | Syntax parsing PASS; preview launcher executed; setup installs not rehearsed on Dad's machine |
| Transfer restore rehearsal | 116 source files match manifest hashes; five historical commits restored; base HEAD matches; temporary bundle remote removed |

The first browser run found persistent English document language after Hebrew client navigation. Language links now use full navigation so html lang/dir update. That regression passes. On this Windows sandbox the test worker completed assertions but could not stop its server; the final test run outside the sandbox exited 0 with all 10 tests passed. Do not report the interrupted runs as successful processes.

The integration database uses PostgreSQL through PGlite with a test-only auth.users/auth.uid shim. This verifies real SQL constraints, policies and transactions, not Supabase identity verification, cookie refresh, session expiry or PostgREST. The live two-account workflow still requires the destination checklist in SUPABASE_SETUP.md. Browser tests intentionally use an unconfigured backend and hard-coded fictional preview data; they do not establish a working production login.

Medical AI is visibly unavailable. No dose guidance, document extraction, rescue plan or emergency classifier has been implemented. The generic emergency notice is not the deterministic safety engine. Release readiness remains false (HTTP 503), while liveness is HTTP 200.

Transfer verification completed: ZIP CRC and per-file manifest hashes passed, and RESTORE_WINDOWS.ps1 restored into a fresh directory with all 116 source files and original history verified. Known-pattern scan covered the selected current source and 92 reachable historical blobs with zero credential-pattern hits. It is not a full privacy/secret audit. Package excludes dependencies, .next, credentials, patient uploads and Codex account state. Current changes remain uncommitted over the preserved historical commits. No original repository history was rewritten. The final archive is regenerated after documentation updates; destination setup and live backend verification remain required.

Recommendation for the next stage: GPT-6 Astra / High for implementation, Extra High for reviewing live auth and SQL isolation. App model selection remains an evaluation decision before AI integration.

## Windows download verification

The self-contained Windows x64 preview includes Node 24.16.0, the production server,
static assets and runtime license. An extracted ZIP in a path containing spaces passed
the portable smoke test with developer executables removed from the child PATH: Russian,
English and Hebrew patient pages, caregiver page, loaded CSS/static assets, disabled real
login, health 200 and readiness 503. The test discovered and fixed a CommonJS package
boundary defect before publication. The final unsandboxed smoke test exited 0, including
server cleanup; the sandbox run passed assertions but could not finish process cleanup.
Unit (15), SQL integration (11), TypeScript, production build and static checks (52) passed.
This verifies a fictional preview, not an authenticated patient deployment.

The user selected a public GitHub repository and Windows download, with the finished
product requiring shared records and separate logins. Supabase account/project setup is
still pending. The portable release intentionally ignores inherited backend credentials.
