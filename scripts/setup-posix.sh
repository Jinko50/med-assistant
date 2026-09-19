#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
node -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major!==24||minor<16)process.exit(1)'
export NEXT_TELEMETRY_DISABLED=1
npm ci --ignore-scripts
npm audit --audit-level=high
npm test
npm run test:database
python3 tools/check_consistency.py
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
printf '%s\n' 'Checks complete. This remains a development app. See docs/COMPUTER_TRANSFER.md.'
