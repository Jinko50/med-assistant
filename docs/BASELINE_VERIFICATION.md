# Baseline and milestone 1 verification

Date: 2026-09-19. Git baseline 43de4c7. Existing changes preserved: working prompt modification, fictional injection letter and pasted snapshot. No real patient data used in new tests. No model API called.

Before changes: bundled Python static consistency tool returned 51 passing checks / 1 failing check (review prompt drift). Prompt measurement returned Part A 6,737, Part B 4,179 characters. Node version 24.16.0; npm 11.13.0. Python was unavailable by its short command name; bundled interpreter used.

After changes, executed locally:

| Check | Observed result |
|---|---|
| npm test | 12 passed, 0 failed: access-policy adversarial cases, inventory and evidence validation |
| Python tools/check_consistency.py | 52 passed, 0 failed; review copies match current sources |
| npm run check:behavioral (without evidence) | Exit 1, BLOCKED as intended; no model call |
| git diff --check | Exit 0; no whitespace errors; Git emitted Windows line-ending warnings |
| Narrow credential-pattern scan of all 50 tracked working files | 0 matching files for private-key headers, AWS access-key IDs, GitHub tokens and long sk-prefixed keys; no values printed |

The credential scan does not cover arbitrary passwords, every provider, untracked files or historical Git objects. It is not a formal security assessment. Source inventory contains explicitly fictional medical records; no new patient data was added. CI configuration was created but not run remotely. There is no application build, static TypeScript check, database integration test or model behavioral run to report.

The review copies are refreshed explicitly from the working sources, preserving prior versions in Git. Refresh does not imply medical approval or re-execution of the changed prompt. Historical execution log remains unchanged; its arithmetic discrepancy is documented in the audit and current test index. No commits were created; changes remain reviewable in the working tree alongside the preserved pre-existing edits.
