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
