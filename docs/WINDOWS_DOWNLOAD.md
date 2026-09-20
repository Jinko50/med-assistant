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
