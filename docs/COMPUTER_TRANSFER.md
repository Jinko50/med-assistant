# Move development to Dad's computer

Prepared 2026-09-19. Default target is Windows, matching the source machine; destination OS is not yet confirmed. macOS/Linux commands are included as an unexecuted fallback.

## What to copy

Copy Med-Assistant-Transfer.zip and its SHA256 file from transfer-dist using your chosen private transfer method, such as a USB drive. It contains current source including uncommitted work, Git history, a source hash manifest, restore/setup scripts and a next-developer prompt. Dependencies, builds, browser traces, credentials, local environment files, uploaded documents and Codex account data are excluded.

Historical explicitly fictional patient materials remain included. They are for development, not Dad's medical record. The clinical packet says its example is modelled on a real case; keep the package private rather than treating it as a published anonymized dataset.

## Install on the destination

| Item | Purpose | Source |
|---|---|---|
| Node.js 24.16+ in the 24.x line | App/tests | [Node.js](https://nodejs.org/en/download) |
| Git | Restore history/development | [Git](https://git-scm.com/downloads/) |
| Python 3.12+ | Preserved safety checks | [Python](https://www.python.org/downloads/) |
| Current browser | Preview | Existing Chrome or Edge works |
| Codex desktop and developer account | Continue coding | Use normal installation/sign-in; do not copy auth files |
| Internet | Dependencies and later backend services | Preview makes no model calls |

Run the top-level RESTORE_WINDOWS.ps1 from the extracted ZIP into a new destination. START_HERE in the ZIP contains exact commands. The script refuses existing directories, verifies hashes, clones bundled history, overlays current source and removes the temporary bundle remote. Current development changes remain uncommitted. Remote credentials are not copied.

Run scripts/setup-windows.ps1 from the restored repo. It installs lockfile dependencies with lifecycle scripts disabled, scans dependencies, runs unit/database/static checks, builds/type-checks, installs Playwright Chromium and runs browser tests. It stops on failure. SkipBrowserTests is only for troubleshooting and means browser checks remain unverified.

Run scripts/start-preview.ps1 and open its printed URL. This launcher disables the live backend and enables the fictional preview. It binds only to 127.0.0.1; the terminal must stay open. No automatic startup or Windows service is installed.

## Continue in Codex

Open the med-assistant repository folder, not its parent or the ZIP. Choose GPT-6 Astra / High; use Extra High for safety/security review. Paste the prompt in NEXT_DEVELOPER_HANDOFF.md. That file carries context because the ZIP does not carry this conversation. AGENTS.md preserves the user's preference for model recommendations.

Follow SUPABASE_SETUP.md to configure and verify a synthetic backend and two separate accounts. No OpenAI API key is needed yet. When AI is implemented, configure credentials securely, never in the patient interface or development chat.

## Dad's eventual use

The finished app should normally live at an HTTPS address. Dad opens it in a browser with his patient account; you use a separate caregiver account against the same backend. He should not need Node, Git, Python, Codex or a terminal for everyday use.

Moving development does not require hosting production on his computer. Localhost stops when the computer sleeps and is unreachable to remote caregivers. Do not expose the development port publicly. Production hosting, HTTPS, monitoring, recovery and pilot approval remain unfinished. This package does not release the app for patient use.

## Troubleshooting

- Node/Git not found: reopen the terminal after installation and check PATH/version.
- PowerShell blocks npm.ps1: setup uses npm.cmd. Use the documented per-invocation script policy if allowed by device policy.
- Port 3000 busy: use start-preview.ps1 -Port 3001 and the matching URL.
- Login disabled: expected until Supabase is configured.
- Browser download fails: check network, rerun installation; never mark skipped checks passed.
- Installed Chrome: PLAYWRIGHT_CHANNEL=chrome can be used for tests instead of bundled Chromium.
- Source changed: rebuild before the production preview launcher, or use npm run dev while coding.
- Preview data differs from Dad's data: it is deliberately isolated fictional content. Do not put real data into the fixture.

Keep the ZIP/checksum until destination checks pass. Restore into a new folder so source rollback never requires deleting the original. Future database rollback is separate; never drop/reset a live medical database to roll back code. Real documents outside this repository have not been inventoried or moved.
