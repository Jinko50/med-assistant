# Med Assistant — handoff to Claude Code

Prepared 20 September 2026. Source baseline: `0899b95` on `main`.

## Start here — instructions from the owner

Continue this existing application; do not rebuild it from scratch. My dad has installed
the Windows download on his own laptop and can reach account administration after signing
in. The screen is English-only although its URL contains `/ru/`, and he cannot find document
uploads. Fix these usability problems first, then continue toward a usable family app.

Both existing family accounts must remain application administrators AND editors of the
same patient record. Both must be able to add/edit records and upload documents. Do not
change the dad's account to read-only based on older requirements. I want fixed users
managed by administrators, separate logins, and shared records between computers.

Dad must not install Node, Git, Python, Claude Code or Codex to USE the app. Ship an updated
Windows 10/11 x64 download through the existing public GitHub repository. Developer tools
are only for the development computer. Preserve all existing accounts and data.

Give model guidance at major development stages. The previous Codex recommendation was
GPT-6 Astra with High reasoning, Extra High for safety/security reviews. This is not a
Claude model identifier. In Claude Code, recommend an available coding model based on the
actual account's model selection; do not claim to have changed it or invent a model name.

## Repository and downloads

- Repository: https://github.com/Jinko50/med-assistant
- Branch: `main`; baseline code commit: `0899b95`.
- Latest release at handoff: https://github.com/Jinko50/med-assistant/releases/tag/v0.3.0-connected-test.1
- Asset: `Med-Assistant-Windows-x64.zip`, 40,830,625 bytes.
- SHA256: `a42f624468f197922468ac72402cc3d81075d818ab7b0ac3c9e44c0ccb842b68`.
- Original development checkout: `C:\Users\Admin\Desktop\Med_Assistant\med-assistant`.
- Working tree was clean before this handoff document was added.

The user's screenshot is FROM DAD'S LAPTOP at `http://127.0.0.1:63164/ru/admin`.
It is not a screenshot of the developer computer. Do not try to inspect that address on
another computer: loopback is local, and the launcher chooses a new port each time.
The screenshot alone does not identify the installed release version. Verify that first.

The portable ZIP is an application build, not a source checkout. For development elsewhere,
clone the repository; the GitHub source already contains the application and safety history.
Do not transfer browser profiles, developer account credentials or Supabase admin secrets.

## First tasks, in order

1. Read `AGENTS.md`, this file, `docs/LIVE_BACKEND_VERIFICATION.md`,
   `docs/INSTALL_AND_ADMIN.md`, `STANDALONE_READINESS.md` and
   `docs/STANDALONE_IMPLEMENTATION_PLAN.md`. Inspect Git status before editing.
   Older `NEXT_DEVELOPER_HANDOFF.md`, `COMPUTER_TRANSFER.md` and readiness rows contain
   superseded statements such as "no backend", "no users" and "no uploads". Use the
   dated updates and actual code; preserve historical safety evidence without rewriting it.
2. Reproduce the admin-to-record-to-documents journey using synthetic data. Do not ask
   the owner to paste passwords into chat. Let account holders enter them privately.
3. Fully localize administration, registration, document pages, forms, validation and
   server-action messages in Russian, Hebrew and English. Add visible language selection
   to these screens. Preserve the current page, record and login while switching languages.
   Use correct root `lang`/`dir`, RTL layout for Hebrew, and explicit LTR for email fields.
4. Make the medical record and uploads prominent after login. Admins currently land in
   access-management forms; this should not obscure daily record use. Provide clear
   localized buttons such as Open record and Upload documents, while retaining an obvious
   route to Manage users. Respect record membership; admin status alone must not expose
   every patient's files. Do not resolve navigation defects by weakening authorization.
5. Verify uploads and downloads end to end against Supabase with a harmless sample file,
   then verify visibility from the other approved account/device. Fix any actual failures.
   Do not describe the upload feature as verified merely because its form exists.
6. Add a visible app version/build identifier and simple update instructions. Publish a
   new tested ZIP without overwriting the previous release, and ask the family to verify
   that exact version on dad's laptop. Close the old app before launching the new folder.
7. Continue remaining product work from the implementation plan with honest readiness.

## Verified causes of the reported interface problems

`apps/web/app/[locale]/admin/page.tsx` explicitly renders `lang="en" dir="ltr"`,
English text and no language selector. The `/ru/` segment is accepted but does not translate
the page. The shared `LanguageLinks` component exists in `components/shell.tsx`; admin
does not use that shell. Registration/admin forms also have English strings.

Admin currently exposes a small text link:
`Open record (caregiver or patient access required)`.
Only the record page adds `Documents / Документы / מסמכים`, and only for a caregiver.
The documents page also hard-codes English and LTR. There is no direct upload button on
the admin page shown in the screenshot. This is a discoverability/localization defect;
it does NOT prove that storage is missing or that a document upload succeeded.

Relevant files:

- `apps/web/app/[locale]/admin/page.tsx`, `components/admin-forms.tsx`, `app/admin-actions.ts`
- `apps/web/app/[locale]/register/page.tsx`, `components/register-form.tsx`, `app/register-actions.ts`
- `apps/web/app/[locale]/records/[patientId]/page.tsx`
- `apps/web/app/[locale]/records/[patientId]/documents/page.tsx`
- `apps/web/app/[locale]/records/[patientId]/documents/[documentId]/route.ts`
- `apps/web/components/document-upload.tsx`, `app/document-actions.ts`
- `apps/web/lib/i18n.ts`, `components/shell.tsx`, `lib/admin.ts`, `lib/dal.ts`

## Implemented architecture and behavior

Next.js 16.3.5, React 19.3.0, TypeScript 7.0.2; Node 24.16.0, lockfile-pinned dependencies.
Next standalone output is bundled with Node in the Windows ZIP. A CMD launcher starts a
server bound only to `127.0.0.1`, chooses an available port and opens the user's browser.
Keep its console open. Shared data lives in hosted Supabase, not in the installation folder.
There is no auto-updater, signed installer, desktop service or offline data synchronization.

Auth uses server cookies and verified `getUser()` calls. Data access checks fresh membership
and database RLS. `app_admins` grants access management; `patient_access` with role
`caregiver` grants medical-record editing and documents. These are separate permissions.
Both family accounts have both permissions for the shared record. Email identities and
membership provisioning were verified in the dashboard; actual credentials were never read.
The latest user screenshot demonstrates remote installation and authenticated admin access.
It does not establish cross-device editing/upload acceptance.

The admin portal approves email addresses, assigns patient/read-only or caregiver/editor
roles, and revokes record access. Other addresses can still register Auth identities while
public signup is enabled, but receive no record access. A strict Auth signup allowlist hook
is not implemented. Adding/removing application administrators remains an operator task.

Record writes use `save_record`, optimistic versions, source/provenance, revisions and audit
events in one transaction. Unknown values remain explicit. No AI or document extraction
writes medical facts. Record lists currently fail visibly above 200 rows; document lists
above 100, admin lists above 100 patients/500 accounts. Pagination needs product work.

## Supabase — preserve the live project

Project ref: `ccfthguykzkmcosvyege`; URL: https://ccfthguykzkmcosvyege.supabase.co.
Retrieve public connection configuration from the existing installed `app-config.json` or
the owner's project settings. Local development uses ignored `apps/web/.env.local` with
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `ENABLE_FICTIONAL_PREVIEW=false`.
No service-role key or database password is necessary for ordinary app operation.
Never put personal emails, passwords, real documents or privileged keys into public Git.

Migrations 001, 002 and 003 have ALREADY been applied through the dashboard SQL editor.
They are NOT registered in Supabase CLI migration history. Do not blindly run `db push`,
reapply them, reset/drop the database, or bootstrap duplicate patients/admins. Inspect and
reconcile migration history before using CLI migrations; make subsequent changes additive.

- 001: patients, memberships, records, sources, revisions, audit and RLS.
- 002: app admins, approved accounts, access audit, admin RPCs and verified-email claims.
- 003: private document metadata, reserve/finalize RPCs and Storage policies.

Both owner-designated identities were confirmed and provisioned as admins/editors in the
live database on 20 September. Inspect the existing project to identify them; private emails
are deliberately omitted here. Preserve those grants unless the owner requests changes.

Email confirmation previously redirected to unreachable `localhost:3000`. The saved Site URL
is now https://jinko50.github.io/med-assistant/confirmed.html, deployed using GitHub Pages.
It is a static informational landing page, strips callback parameters, does not store tokens
or establish a login, and tells people to reopen the app and sign in. Old emails may still
contain old redirects. Both current accounts are already confirmed: do not register again.
Password recovery is unfinished. App registration minimum was reduced from 12 to 6;
Supabase's dashboard requires at least 6. The request for 4 was not implemented, and
existing passwords were not changed. Do not pad/hash short passwords to bypass the minimum.

## Documents: implemented limits and unverified areas

Private bucket `medical-originals`: public=false, 10 MiB/file, binary upload MIME.
The app checks PDF/JPEG/PNG magic bytes and records SHA256. This is not malware scanning
or full format validation. A caregiver reserves metadata, uploads an immutable original,
then finalizes it with an audit event. No authenticated overwrite/delete policies exist.
Downloads require fresh authorized access and use signed attachment URLs lasting 60 seconds.
Issued URLs can outlive revocation by that interval; downloaded copies cannot be revoked.

No extraction, OCR, candidate review or automatic confirmation of medical facts exists.
Failed uploads may leave pending entries; cleanup/recovery UX is unfinished. PGlite tests
simulate Storage tables; they do not prove the real Storage HTTP transfer. Test upload,
finalization, download, unsupported files, size limits and network failure with synthetic
files. Never make the bucket public to fix a download problem.

## Validation and release procedure

Last completed checks at baseline: 16 unit tests, 19 SQL integration tests, 10 desktop/mobile
browser tests, 52 static consistency checks, production build, TypeScript, portable extracted
ZIP smoke test and GitHub CI. Live API denied anonymous reads on all 11 app tables.
Bucket privacy/policies/schema version 3 were verified in the dashboard. Cross-device record
save/upload/download, session expiry and recovery remain unverified.

Typical development commands (from repo root; review scripts first):

```powershell
npm ci --ignore-scripts
npm test
npm run test:database
npm run build
npm run typecheck
python tools/check_consistency.py
# Use an installed Chrome for browser testing, or install Playwright Chromium.
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
node --env-file=apps/web/.env.local tools/check-live-backend.mjs
```

Windows x64 packaging, after a successful build and correct ignored connection config:

```powershell
./tools/package-windows.ps1 -Connected -OutputDirectory './dist/choose-a-new-release-folder'
# Extract the resulting ZIP to a fresh path, including spaces, then:
node tools/test-portable.cjs 'ABSOLUTE_PATH_TO_EXTRACTED/Med-Assistant-Windows'
```

The packager refuses existing output folders. It excludes `.env` and includes only public
connection configuration in `app-config.json`. Inspect the ZIP for secrets and personal data.
Smoke tests use the bundled runtime with developer PATH removed; authenticated acceptance
still needs real sign-in. The existing Windows GitHub workflow builds a fictional preview
unless changed to provision appropriate public connected configuration: do not accidentally
publish that preview as the connected app. Publish release notes and SHA256 beside the ZIP.

Acceptance for the immediate fix: dad can choose RU/HE/EN without editing the URL, see a
translated daily-use page, locate uploads immediately, upload a harmless sample, and the
other editor can download it on a separate computer. Admin user management must still work.
Unapproved users must not see either the record or files. Report exactly what was tested.

## Safety and remaining product scope

This remains a development prerelease, not a completed medical assistant. Medical chat,
deterministic emergency/medication controls, clinician/pharmacist approval, document
interpretation, password recovery, backup/restore drills and production operations remain
unfinished. Do not turn on medical advice to make the app appear complete.

Preserve `project/`, `review_package/`, safety documents, fictional fixtures and historical
test outputs. There are 79 written parent scenarios and 34 gating subcases. Historical
results are not tests of this standalone app; the historical log also has known counting
inconsistencies. Keep UNKNOWN explicit and never fabricate successful clinical tests.
Follow the implementation plan after the immediate UX and live acceptance work.

## Suggested first Claude Code message

> Read docs/CLAUDE_CODE_HANDOFF.md and AGENTS.md, inspect the current checkout, and continue
> Med Assistant from the existing code. My dad already installed the Windows app and reached
> /ru/admin on his laptop, but that page is English-only and he cannot find document uploads.
> First fix complete RU/HE/EN localization and obvious record/upload navigation, then verify
> real shared editing and private uploads with synthetic data and publish an updated Windows
> ZIP. Preserve both existing accounts as admins AND editors of the same record. Do not
> recreate the backend, reset data, or require developer tools for dad's everyday use. Keep
> medical AI disabled until the documented safety gates are met. Give model guidance and
> report tested behavior honestly.
