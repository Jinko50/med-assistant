# Download and open on Windows

Download **Med-Assistant-Windows-x64.zip** from this repository's Releases page.
Use **Extract All**, open the extracted folder and double-click **Start Med Assistant.cmd**.
No developer tools or package installation are needed. Keep the console window open
while using the app; close it to stop. The Russian patient preview opens in your browser.
The app binds only to your own computer and selects a free port.

The first release is explicitly a **fictional, read-only test preview**, not the finished
patient application. It does not collect patient data, connect to a backend or call AI.
Shared records with separate patient/caregiver accounts remain the agreed product target.
See [readiness](../STANDALONE_READINESS.md) for the remaining implementation and release gates.

Windows 10/11 x64 only. The release is unsigned. Do not disable Windows security if it
blocks execution; report the message for diagnosis. Delete the extracted folder to remove
the preview. A newer release is extracted to a separate folder; there is no auto-updater.

For developers: run `npm ci --ignore-scripts`, `npm run build`, then
`./tools/package-windows.ps1` on Windows x64 with Node 24.16.0. The script includes the
standalone production server, its traced dependencies, static assets, runtime and licenses.
It refuses existing output directories and environment/key files in the package. Each
release includes a SHA-256 checksum and per-file manifest. Rehearse from an extracted ZIP
using `node tools/test-portable.cjs <extracted-folder>` before publishing.

## v0.4.2-upload-repair.1 — prepared candidate, NOT published

Supersedes the 0.4.1 candidate below. Still unpublished, and now for a stronger reason:
a real upload failed on the family laptop with a full-page server error. That path is
repaired but has not been retested by a signed-in upload and download.

- Local artifact: `dist/windows-0.4.2-candidate/Med-Assistant-Windows-x64.zip`
- Size: 41,147,312 bytes.
- SHA256: `efd5f812ac225e5bccba38eb272c94bbb75226966a218a81ffe1265badb97cab`
- Manifest: version `0.4.2-upload-repair.1`, connected, `clinicalReady=false`, 1,364 files.
- Packaged request limit confirmed inside the artifact: 12,582,912 bytes.

Changes since the 0.4.1 candidate: an oversized file is refused in the browser with a
localized message before anything is sent; the framework request limit has headroom above
the 10 MiB document cap, so a maximum-size upload is no longer truncated into an unparsable
request; and a localized error boundary replaces the untranslated full-page error.

**The supported maximum is still 10 MiB.** A larger original, including the 40.8 MB file
that triggered the failure, is refused with a clear message. It is not supported, and
nothing here should be described as making it work.

## v0.4.1-localized-test.1 — prepared candidate, NOT published

This build exists only on the development machine. There is no release page and no
download link for it yet, because the blocking acceptance test (a real authenticated
upload, finalize, download and cross-account view) has not been reported. Do not
describe it to the family as available.

- Local artifact: `dist/windows-0.4.1-candidate/Med-Assistant-Windows-x64.zip`
- Size: 41,127,082 bytes.
- SHA256: `b2a714c0568fd1af8d941c08577e3c3a0f102d1a11dcb4123cbec8e8b7902654`
- Manifest: version `0.4.1-localized-test.1`, connected, `clinicalReady=false`, 1,360 files,
  all hashes re-verified after extraction.
- Built from the working tree described in docs/CLAUDE_FINAL_RELEASE_OUTCOME.md.

Changes since v0.4.0-localized-test.1: administration audit rows show translated action
labels and locale-formatted times instead of raw database codes and UTC strings; an
unrecognised action message shows a localized notice instead of a blank line; packaging
refuses a build whose compiled version does not match `-Version`; the extracted-package
smoke test asserts exact agreement between the interface stamp, `VERSION.txt` and
`MANIFEST.json`, and accepts an expected release version as its second argument.

**This build still has no chat.** It manages records and source documents only.

## v0.4.0-localized-test.1 — 20 September 2026

- Release: https://github.com/Jinko50/med-assistant/releases/tag/v0.4.0-localized-test.1
- Asset: `Med-Assistant-Windows-x64.zip`, 40,036,105 bytes.
- SHA256: `bd967d1d40b2b22d6b76c1af31e4e9ce7f9b176e8273aa4f3cb2fb6b16e0b8d4`
- Source commit: `12779bb` on `main`. Stamped version visible on the sign-in screen.
- Previous release `v0.3.0-connected-test.1` is unchanged and still downloadable.

Fixes the reported problems: `/ru/admin` is now Russian, every screen offers EN/RU/עב,
Hebrew renders right-to-left, and uploads are reachable in two clicks from the record.

**Install:** close the running app first, extract to a NEW folder, run
`Start Med Assistant.cmd` there, and confirm the sign-in footer reads
`Version 0.4.0-localized-test.1`. Records and documents live in the hosted database,
not in the folder, so nothing is lost by deleting the old folder afterwards.

**Still unverified in this release:** authenticated upload and download against Storage,
and visibility of an uploaded file from the second account on the other computer. Those
require the account holders' own passwords and must be confirmed by the family.

## v0.5.0-large-uploads.1 — 21 September 2026

- Release: https://github.com/Jinko50/med-assistant/releases/tag/v0.5.0-large-uploads.1
- Asset: `Med-Assistant-Windows-x64.zip`, 40,061,739 bytes.
- SHA256: `efa61962f1c2926871aa2147cd37f3da4c60e97523959064650e1a69024b0b1c`
- Source commit: `3c3bfda` on `main`. Interface, `VERSION.txt` and `MANIFEST.json` all read
  `0.5.0-large-uploads.1`; verified on the extracted ZIP.
- Earlier releases are unchanged and still downloadable.

Raises supported originals to 50 MB and moves the transfer off the app server, so the
40.8 MB scan that produced a full-page error can be uploaded unchanged.

**Requires `database/migrations/004_large_documents.sql` to be applied from the Supabase
dashboard first.** Until then files above 10 MiB are refused with a clear localized message
at the first step rather than failing part-way through.

**Install:** close the running app, extract to a NEW folder, run `Start Med Assistant.cmd`,
and confirm the sign-in footer reads `Version 0.5.0-large-uploads.1`. Close any old browser
tab — it may still point at the previous app on a different port.

**Still unverified:** a real signed-in upload to live Storage, a download, and visibility
from the second account on the other computer.
