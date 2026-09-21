# Standalone readiness — 2026-09-19

Update 2026-09-21 (Claude Code, after the independent review in
docs/CHAT_INDEPENDENT_REVIEW.md): **the release stays held.** The review's two P1 parser
defects were real, reproduced, and are fixed; so are the two P1 honesty defects and the
three P2 robustness defects. Its six regression tests now pass, and its findings have been
turned into tests of their own so they cannot come back.

| Review finding | Severity | State |
|---|---|---|
| Different measurements borrow the same number | P1 | **Fixed.** Each number now binds to its own nearest measurement word; a tie between two different words is ambiguous and nothing is read. |
| An unspecified temperature scale becomes Celsius | P1 | **Fixed.** "градусов" / "מעלות" / "degrees" leave the scale unknown and raise the one clarification. My own test that endorsed the guess was corrected, not cited. |
| `aiOff` claims nothing leaves this computer | P1 | **Fixed.** Storage and AI transmission are now two separate sentences in all three languages; the conversation always says it is kept in the family's private online record. |
| "I am reading it now" with a provider configured | P1 | **Fixed.** The claim is deleted. An attachment is described as stored and explicitly not read, whatever is configured, until a reader exists. |
| Retry can resend uploaded bytes | P2 | **Fixed.** The document id is recorded when the bytes arrive, not after verification, so a retry resumes at verification. |
| Network failure can leave controls stuck | P2 | **Fixed.** The composer is a pure state machine (`packages/domain/turn.ts`); every terminal event returns it to idle, and both network calls have `try`/`catch`. |
| Partial persistence and duplicate retries | P2 | **Fixed.** One turn is one transaction: `post_conversation_turn` writes the message, the reply and the readings together, keyed by a browser token so a retry completes the turn instead of duplicating it. A reading that cannot be stored now aborts the turn instead of vanishing. |

Two of those fixes changed behaviour that earlier tests asserted. Both tests were wrong and
were corrected rather than cited as evidence: the Celsius assumption, and the claim that a
configured provider implies an attachment is being read.

Migration 007 was **revised before ever being applied** — a read-only check confirmed the
live project does not have its tables — to add `client_token` and `post_conversation_turn`.
Discard any copy taken before today.

Checks executed for this change: **123 unit** (including 14 new behavioural tests of the
retry/failure state machine and 6 new measurement-binding tests), **47 SQL** (including 5 new
atomicity and idempotency tests), the review's **6 regression tests**, **18 browser**, 52
consistency checks, typecheck, clean build, 0 dependency vulnerabilities.

**Windows candidate `0.6.0-chat-candidate.1` is built and smoke-tested, and is NOT
published.** The extracted ZIP passes the portable test — connected login, RU/HE
localization with correct lang/dir, anonymous admin/document denial, agreement between the
interface stamp, VERSION.txt and MANIFEST.json, and a new check that no model-provider
credential is in the package (`app-config.json` carries only `supabaseUrl` and
`publishableKey`). It stays unpublished on purpose: the independent review's instruction is
to publish only after the acceptance tests are resolved, and they have not been run. Earlier
releases up to v0.5.0-large-uploads.1 are untouched.

**Still not run, and not claimed:** the signed-in acceptance run. It is now written and
executable — `tests/acceptance/authenticated-chat.spec.ts`, `npm run test:acceptance` —
covering sign-in, a Russian measurement message, Confirm, Correct, decline, attachment,
fault-injected connection loss with Retry, and retrieval by the second account. With no
credentials in the environment all seven cases **skip**, which is what they do today: a
skipped acceptance test is evidence of nothing. It needs migrations 006/007 applied and the
account holders' own passwords, typed by them into their own shell.

Also still unimplemented, and not to be described otherwise: document and photo reading,
output checking on generated answers, and personalized AI guidance. Configuring a provider
key does not create any of them.

Independent review 2026-09-21 of `106614a`: **release held**. Existing suites pass, but six
new behavioral regressions fail: mixed measurements borrow the wrong numbers and an
unstated temperature scale is assumed. Migrations 006/007 are still pending live.
See `docs/CHAT_INDEPENDENT_REVIEW.md` for results, coverage limits and additional findings.
Run `node --test tests/review/chat-release.test.ts` alongside the existing suites.

Update 2026-09-21 (Claude Code, milestone 10): **the conversation is now the product.** The
separate daily home screen and the structured check-in form are no longer the main path;
`/[locale]/records/[patientId]/chat` is where signing in lands, and it shows only the
conversation, one text box, one attachment button, Send and the RU/HE/EN links. The record,
documents, change history, the check-in form and user administration moved into a Menu.

What is real, not cosmetic:

* **Measurement reading.** `packages/domain/measurements.ts` reads blood pressure, pulse,
  temperature, weight, blood sugar and oxygen saturation out of free text in all three
  languages, deterministically and offline. A number without a keyword is never a reading; a
  unit is either written by the person, fixed by the notation, or reported as ABSENT and
  turned into the single clarification the reply is allowed to ask. No unit is inferred from
  magnitude and no calendar date is ever produced — "this morning" stays the person's words.
  30 unit tests.
* **Reviewed memory.** Migration 007 stores conversation lines and, separately, what the
  reader believed it saw, as `proposed` facts. A proposal becomes `confirmed`, `corrected`
  or `declined` only through `review_conversation_fact`, once, by a named person. Neither
  table has an update or delete grant, and nothing in this path writes `medical_records`, so
  ordinary conversation cannot alter confirmed medical history. 14 SQL tests, including the
  journey: write → propose → confirm → retrieve in a later session, by a different account.
* **Attachments.** The composer reuses the existing direct-to-Storage upload, so a 50 MB
  original still never passes through the app server. The conversation shows "sending", then
  "file uploaded" — and says explicitly that the contents have **not** been read. A failure
  keeps both the text and the file, and Retry resumes rather than re-sending bytes that
  already arrived.
* **Ordering.** Authorize → deterministic safety screen → deterministic reading →
  deterministic reply plan → attachment state re-read from the database → model. A safety
  match replaces the reply entirely and never also asks a question.

What is honestly not real: **there is no model service and no document reader.** So a free
question is answered with "I cannot answer questions yet", and an uploaded file is described
as stored, never as read. `apps/web/lib/assistant.ts` is the complete, gated integration —
it needs `MED_ASSISTANT_AI_PROVIDER`, `MED_ASSISTANT_AI_MODEL`, `MED_ASSISTANT_AI_KEY` and a
separate `MED_ASSISTANT_AI_CONSENT` naming the same provider before one byte leaves the
machine, and it reads them from the server environment so nothing is ever bundled into the
Windows ZIP or the public repository. The screen names the recipient when it is on and says
"nothing leaves this computer" when it is off.

**Migrations 006 and 007 are NOT applied to the live project** — verified read-only today by
`node --env-file=apps/web/.env.local tools/check-live-backend.mjs`, which now reports them as
PENDING by name. Until they are applied in the Supabase SQL editor the conversation stores
nothing and says so on screen instead of failing. The live signed-in journey therefore
remains **UNVERIFIED**; that is the one blocking step, and it needs database access this
session does not have.

Checks run for this change: 102 unit, 41 SQL, 18 browser (desktop and mobile), 52 consistency
checks, typecheck and a clean build.

Update 2026-09-21 later (Claude Code): the owner asked for 50 MB originals, so the cap was
raised from 10 MiB to 50,000,000 bytes and the transfer was moved off the app server — the
browser now uploads straight to Storage with a short-lived signed URL, which removes the
request path that truncated the body and produced the full-page error. Migration 004 widens
the metadata constraint and the bucket ceiling to the same number and is covered by SQL
tests, but it is **not yet applied to the live project**, so files above 10 MiB are still
refused there, now with a clear localized message at the first step. Published
v0.5.0-large-uploads.1. Authorization is unchanged. Authenticated upload, download and
cross-computer visibility remain UNVERIFIED and need the account holders' own sign-in.
Chat still does not exist.

Update 2026-09-21 (Claude Code): **RELEASE HELD.** A live document upload failed with a
full-page server error. Root cause reproduced with synthetic bytes and repaired: a request
body above the framework limit is silently truncated, the multipart payload then fails to
parse, and that error is thrown outside the upload action's try/catch. Because the default
limit equalled MAX_DOCUMENT_BYTES exactly, uploads at or near the supported 10 MiB maximum
were broken too, not only the owner's oversized file. The browser now refuses an oversized
file before sending anything, the framework limit has headroom for multipart framing, and
a localized error boundary replaces the untranslated error page. Candidate
`0.4.2-upload-repair.1` is built and smoke-tested but **NOT published**: the repair has not
been retested by a real signed-in upload and download. The owner's 40.8 MB original remains
**unsupported**; whether to raise the cap is an open decision.

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
| Patient mobile/accessible RU/HE/EN/RTL interface | apps/web/components (conversation, composer, confirmation cards); i18n; CSS; admin/register/document pages | Desktop/mobile browser and RTL tests; tests/unit/i18n.test.ts; packaged-ZIP smoke test asserts RU/HE rendering, lang/dir, language links and LTR email fields | PARTIAL | Real login, screen-reader/elderly usability, voice, final contrast review |
| Deterministic emergency / medication engine | packages/domain/safety.ts; packages/domain/reply.ts; conversation and check-in actions | 30 adversarial unit tests across RU/HE/EN (negation, history, Hebrew prefixes, truncation); 15 reply-ordering tests; the screen's decision is stored per message for audit | PARTIAL | Recognition remains a residual risk — `none` means nothing matched, never "safe". Phrase catalogue and escalation wording are still **unreviewed by a clinician or pharmacist** (B-01/B-02) |
| AI provider orchestration and bounded retrieval | apps/web/lib/assistant.ts; apps/web/app/conversation-actions.ts | 15 structural tests assert the order (authorize → screen → read → plan → store → model) against the stripped source, that only `confirmed`/`corrected` facts are sent as grounding, that context is labelled as data not instructions, and that both the configuration and consent gates are required | FAIL | **No provider is configured, so no model has ever been called and no generated answer has been observed.** Document and photo reading do not exist and configuring a key does not create them; output guards, per-patient consent capture and provider fault injection are unwritten |
| Secure documents and extraction/review | migrations 003-004; documents pages/actions; direct signed-URL upload | 43 unit tests incl. exact size boundaries, retry and interruption handling; 4 SQL storage/size tests; request and CSP probe against both the built and the packaged app; live private bucket verified | FAIL | **The repaired path has still not been retested by a signed-in upload/download.** Migration 004 is not yet applied to the live project, so >10 MiB is still refused there. Supported cap is now 50 MB once it is applied. Malware scanning, resumable transfer, candidate-only extraction and review |
| Audit/version history/concurrent edits | SQL save_record/revisions/audit; history route | PGlite stale-version and audit-failure rollback tests | PARTIAL | Live multi-session test, history pagination and source-rich historical view |
| Executable clinical scenarios / actual outputs | Historical tests/EXECUTION_LOG.md; new inventory | No new model execution | PARTIAL | Full harness, trustworthy captures, 2 historical FAILs and 7 unrun parents |
| Integration / end-to-end tests | tests/integration; tests/e2e; tests/acceptance; tests/review | 123 unit, 47 SQL, 18 browser and the independent reviewer's 6 regression tests run locally; the conversation journey (propose → review → retrieve later, across accounts) runs against the real migration SQL in PGlite | PARTIAL | The 7-case signed-in acceptance suite exists and is runnable (`npm run test:acceptance`) but **skips today**: migrations 006/007 are unapplied and signing in needs the account holders' own passwords |
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
