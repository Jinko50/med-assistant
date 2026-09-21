# Final release outcome — Claude Code takeover

20 September 2026. Written after taking over from `docs/CLAUDE_RELEASE_REVIEW.md`
(independent Codex verification) and `AGENTS.md`.

**Outcome in one line: the candidate is built and independently checked, but the release
is NOT published, because the blocking acceptance evidence has not arrived.**

Model actually used for this work: **Claude Opus 5** (`claude-opus-5`), the model configured
in this session. I did not change the owner's model. Codex's recommendation of GPT-6 Astra /
High is not a Claude model name and was not used here.

## Release scope, stated explicitly

If and when this candidate is published, its honest scope is:

> A **limited record and source-document management application** for one patient record and
> separately authenticated caregivers, in Russian, Hebrew and English. It stores what a person
> types and the original files they upload. It does not interpret documents, does not give
> medical advice, and contains no medical AI.

It is **not** a finished Med Assistant. Two things in particular:

- **There is no chat.** The owner expects a place to have a conversation with the assistant.
  No build contains one. This is missing product functionality, not an installation problem.
  See "Chat" below.
- Recovery, backup/restore, operational, clinical and privacy gates remain open in
  `STANDALONE_READINESS.md`. Medical AI stays off.

## Candidate

| Item | Value |
|---|---|
| Version | `0.4.1-localized-test.1` |
| Local artifact | `dist/windows-0.4.1-candidate/Med-Assistant-Windows-x64.zip` |
| Size | 41,127,082 bytes |
| SHA256 | `b2a714c0568fd1af8d941c08577e3c3a0f102d1a11dcb4123cbec8e8b7902654` |
| Manifest | connected, `clinicalReady=false`, 1,360 files, all hashes re-verified after extraction |
| Published | **No.** No release page, tag or download link exists for this version |
| Previous releases | Untouched; `v0.4.0-localized-test.1` and earlier remain downloadable |

## Findings from the review, and what I did

| Review finding | Resolution |
|---|---|
| Packaging accepts `-Version` while the interface version is compiled from `NEXT_PUBLIC_APP_VERSION`; no exact agreement check | `tools/package-windows.ps1` now refuses to package a build whose compiled output does not carry the requested version, before creating any output. `tools/test-portable.cjs` asserts exact equality between the interface stamp, `VERSION.txt` and `MANIFEST.json`, checks the stamp again on the RU and HE sign-in screens, and accepts an expected release version as argument 2 or `EXPECTED_APP_VERSION`. Both directions were exercised: a deliberately wrong version was refused, the correct one passed |
| Admin audit list shows raw action codes and raw timestamps | `auditLabel()` and `formatTimestamp()` in `apps/web/lib/i18n.ts`; the admin list now renders translated labels and locale-formatted times in a `<time>` element that stays left-to-right inside Hebrew. A unit test extracts every action code the SQL migration can write and requires a translation for it in all three languages, so a future migration that adds a code fails the build rather than leaking it |
| Unknown message keys render blank, hiding a failed operation | Shared `actionMessage()` resolver used by the administration, registration and upload forms. An unrecognised key now renders a localized notice ("this version could not display the result… nothing was assumed") instead of an empty line. An empty key still renders nothing |
| Static checker's inherited `TOTAL EXECUTED` figure of 28 is confusable with the gating subset | The checker now prints it as `HISTORICAL EXECUTED … (historical Project transcripts only … not executed by this application and not the gating subset)`. `tests/EXECUTION_LOG.md` and all historical safety evidence were left untouched |

## Verification I actually ran, on this working tree

| Check | Result |
|---|---|
| `npm test` | PASS, 28 tests (22 before; 6 added for the fixes above) |
| `npm run test:database` | PASS, 19 tests |
| `npm audit --audit-level=high` | PASS, 0 vulnerabilities |
| `npm run build` (stamped `NEXT_PUBLIC_APP_VERSION=0.4.1-localized-test.1`) | PASS; version confirmed compiled into the server output |
| `npm run typecheck` | PASS |
| `npm run test:e2e` | PASS, 10/10 desktop and mobile, with `PLAYWRIGHT_CHANNEL=chrome` |
| `python tools/check_consistency.py` | PASS, 52 checks |
| Packaging version guard, negative case | PASS — refused `9.9.9-not-built` and created no output directory |
| `tools/package-windows.ps1 -Connected -Version 0.4.1-localized-test.1` | PASS |
| Extracted-package smoke test with expected version | PASS, including the new stamp/VERSION.txt/MANIFEST agreement |
| Manifest re-verification after extraction | PASS, 1,360/1,360 file hashes match |
| Package secret scan | PASS — no `.env`, `.pem` or `.key` files; the only `sb_secret_`/`service_role` hits are prefix checks inside the bundled Supabase library, not credentials. `app-config.json` contains only the project URL and the publishable key |
| `tools/check-live-backend.mjs` (read-only, anonymous) | PASS — Auth reachable, email authentication enabled, all 11 application tables deny anonymous reads |
| `npm run check:behavioral` | BLOCKED, exit 1, as designed — no release configuration or behavioral evidence was supplied, and no model tests were run |

Note on the e2e suite: the first run failed 8/10 purely because the bundled Chromium is not
installed on this machine. Re-run against installed Chrome, all 10 passed. No application
code was involved in that failure.

Nothing below was done: no live family grant was modified, no password was requested or
handled, no session was created by bypassing email verification or by impersonation, no
authenticated upload result was invented, no historical safety evidence was edited, and no
permission prompt or verification step was bypassed.

## Blockers preventing honest publication

**B1 — Authenticated Storage acceptance is unverified.** A real upload → finalize → download
through Supabase Storage, then the same document opened from the *other* approved account on
the *other* computer, has never been performed. This is the one test that proves the product's
core promise, and no automated check in this repository can substitute for it: the anonymous
smoke test verifies only that a signed-out visitor is *denied*. The owner was asked for this
result. **It has not arrived.** I will not fabricate it.

**B2 — Authenticated localized screens are unverified.** RU/HE administration, documents,
record editing, history and language switching have been verified by source inspection,
unit tests and anonymous browser checks. No one has confirmed how they render inside a real
signed-in session. The new translated audit list in particular has never been seen with real
rows in it, because audit rows are only readable by an administrator.

**B3 — There is no chat.** The owner expects one and it does not exist.

**B4 — Clinical, recovery, backup/restore, operational and privacy gates remain open.** No
clinical, pharmacy or local-protocol sign-off exists; the behavioral gate correctly refuses.
No claim of medical readiness can be made, and this candidate must not be presented as one.

**B5 — Publication is an outward-facing action I have not taken.** Creating the release and
telling the family to download it should follow the evidence in B1, not precede it.

## Exact remaining acceptance steps

Each step is something the account holders do themselves, signed in with their own
credentials. Do not send passwords, and do not send the contents of any real medical
document — use a harmless non-medical sample file.

1. **Install the candidate.** Close any running app window and console. Extract
   `Med-Assistant-Windows-x64.zip` to a **new** folder. Run `Start Med Assistant.cmd` from
   that folder. On the sign-in page, confirm the footer reads `Version 0.4.1-localized-test.1`.
   If it reads anything else, an older copy is running and every later step is meaningless.
   Repeat on the second computer.
2. **Upload (caregiver account, computer 1).** Sign in. Open the record, then Documents.
   Upload a harmless one-page sample PDF or photo. Report the exact message shown and whether
   the entry appears as stored rather than pending.
3. **Download it back (same account).** Use "Download original". Report whether the file opens
   and is the same file that was uploaded.
4. **Cross-account, cross-device (the other approved account, computer 2).** Sign in as the
   second approved account, open the same record's Documents, confirm the entry from step 2 is
   listed, download it and confirm it opens. Report exactly what was and was not visible.
5. **Denial still holds.** Sign out, then reopen the document link. Confirm it refuses access.
6. **Localized screens while signed in.** On `/ru/` and `/he/`, open administration, the record
   and Documents. Confirm: recent access changes read as translated sentences with a readable
   date and time, not as codes like `account.enabled.caregiver` or a raw UTC string; Hebrew
   reads right to left while email addresses and times stay left to right; the language links
   switch language without signing out; and no action leaves a blank message line.
7. **Record edit and history.** Make one trivial entry with a source and save it. Confirm the
   saved message appears, the history page shows a new version, and administration shows a
   corresponding localized audit line.
8. **Report the actual results**, including anything that looked wrong. A step that was not
   done should be reported as not done, not as passing.

Once steps 1–8 are reported, publication is a short step: record the results in
`docs/LIVE_BACKEND_VERIFICATION.md` and `STANDALONE_READINESS.md`, then publish the existing
artifact — its SHA256 is already recorded above and must not change.

## Chat, and how it should be built

Chat is the owner's expectation and the largest remaining gap. It must not be satisfied by
pointing a general chatbot at a medical record. The order in
`docs/STANDALONE_IMPLEMENTATION_PLAN.md` and `STANDALONE_READINESS.md` still applies:
authentication → deterministic emergency and medication recognition with fixed localized
responses → bounded retrieval restricted to the person's own recorded facts and sources →
provider call → output guards → audit. The deterministic emergency and medication engine is
currently FAIL with static document checks only; it is the prerequisite, not an afterthought.
Until the behavioral gate in `tools/check-behavioral.ts` is given real captured evidence and
passes, no conversational medical feature ships.

A defensible interim step, if the owner wants something visible sooner, is a non-medical
scoped assistant that can only read back and search the family's own recorded entries and
say "not recorded" otherwise — with no advice, no inference and no external sources. That is
a product decision for the owner, not something I should assume.

## Files changed in this takeover

- `apps/web/lib/i18n.ts` — `messageUnknown` and `auditActions` in EN/RU/HE; `actionMessage()`,
  `auditLabel()`, `formatTimestamp()` helpers.
- `apps/web/app/[locale]/admin/page.tsx` — translated, locale-formatted audit list.
- `apps/web/components/admin-forms.tsx`, `register-form.tsx`, `document-upload.tsx` — shared
  message resolver with a visible fallback.
- `tools/package-windows.ps1` — build/stamp version agreement guard.
- `tools/test-portable.cjs` — exact version agreement assertions and optional expected version.
- `tools/check_consistency.py` — unambiguous label for the inherited historical figure.
- `tests/unit/i18n.test.ts` — six added tests; inline left-to-right isolation is now allowed
  for `<time>`/`<bdi>` as it already was for `<span>`, while a hard-coded page direction
  still fails.
- `STANDALONE_READINESS.md`, `docs/WINDOWS_DOWNLOAD.md`, this file.

Authorization code was not touched: `apps/web/lib/dal.ts`, `apps/web/lib/admin.ts`,
`packages/domain/access.ts` and everything under `database/` are unchanged.

## How to resume

Reply with the step 1–8 results from the two accounts. With them I will record the evidence
honestly and finish publication of `0.4.1-localized-test.1` at the limited scope stated above.
If a step fails, say what actually happened and I will fix the cause before anything is
published. If the results cannot be produced, the candidate stays unpublished and
`v0.4.0-localized-test.1` remains the latest available download.
