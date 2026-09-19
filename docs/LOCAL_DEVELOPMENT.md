# Local development — initial foundation

## Current app milestone (supersedes the original foundation instructions below)

Use Node 24.16+ in the 24.x line, npm and Python 3.12+. From the Git root run npm ci --ignore-scripts, npm test, npm run test:database, npm run build and npm run typecheck. Run the Python consistency utility too. Browser tests use npm run test:e2e after npx playwright install chromium. Installed Chrome may be selected with PLAYWRIGHT_CHANNEL=chrome.

For development, npm run dev serves http://127.0.0.1:3000/en/login and enables the explicitly fictional preview by default. Live login requires the configuration in SUPABASE_SETUP.md. No model API or key is needed yet. Windows setup/preview scripts and the transfer package are described in COMPUTER_TRANSFER.md. The root lockfile pins all dependencies; the app uses apps/web/.env.local, which must remain untracked.

The production build is not patient-ready. The readiness endpoint intentionally returns 503. See APP_MILESTONE_VERIFICATION.md for measured tests and limitations.

## Historical milestone 1 instructions

Use Node 24.16 or newer in the 24.x line and Python 3. No third-party application dependencies are installed for this milestone. Run from the Git root (med-assistant):

```sh
npm test
npm run test:inventory
python tools/check_consistency.py
python tools/measure_prompt.py
```

Node executes the TypeScript unit tests through native type stripping. This is runtime testing, not static type checking; a pinned TypeScript compiler is part of the web scaffold milestone. Python may need its full executable path if it is not on PATH.

The domain access function consumes ONLY a server-verified user ID and freshly queried PatientAccess rows. Never supply client membership claims. It has no session, database or network integration yet. Multiple caregivers are separate relationships. Maintaining records does not implicitly grant permission to invite others. Revoked, missing, malformed or ambiguous relationships deny access.

Behavioral evidence validation:

```sh
npm run check:behavioral -- /private/path/expected-config.json /private/path/actual-run.json
```

Expected configuration has build, model and policyHash (SHA-256). The run has schemaVersion=1, syntheticDataOnly=true, runId, matching configuration, and results. Each result requires id, sourceHash (from inventory), verdict=PASS, actualInput, actualOutput, executedAt (ISO timestamp), reviewedBy, reviewNotes, captureKind=provider-response and providerRequestId. All 34 REG/SAFE subcases are required. Store full multi-turn transcripts and image fixture references in the capture system when it is implemented. A single actualInput string alone cannot establish that those setups ran correctly.

No real model run is created here. The validator rejects missing/failed/stale evidence; it cannot prove the truth of supplied captures, the quality of human scoring, or clinical correctness. Restrict evidence producers and require review. This gate is necessary but not sufficient for release, and is not yet connected to a deployment pipeline. Unit-test dummy responses are never model evidence.

No web server, secrets, database, production seed, deployment or backup exists at this milestone. The implementation plan specifies those dependencies. Do not enter real patient data in this repository. See STANDALONE_READINESS.md for exact limitations.
