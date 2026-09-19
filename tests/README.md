# TEST SUITE — STATUS

## Execution status: NOTHING HAS BEEN RUN

**Every file in this directory contains written scenarios, not test results.**

| | Count | Status |
|---|---|---|
| Scenarios written | 72 | — |
| Scenarios executed against a model | **0** | Never run |
| Outputs observed | **0** | — |
| Failures found | unknown | Cannot be known until executed |
| Clinical review of expectations | **none** | Blocker `B-01` / `B-02` |

Every "Expected" line in these files is a **hypothesis about what the prompt should produce**. None has been confirmed. Some are probably wrong, and the ones that are wrong will not be visible until the scenarios are run.

**No claim of clinical validation is made or may be made on the basis of this directory.** These are design fixtures written by a non-clinician.

## What "pass" means here

A pass criterion describes what a reviewer should look for. It does not mean anything passed. Until a scenario has been executed and its actual output recorded, its status is `NOT RUN`.

When you execute a scenario, record it here:

| ID | Date run | Model / plan | Actual behaviour | Verdict |
|---|---|---|---|---|
| | | | | |

Keep the actual output, not a summary of it. A scenario whose output was not preserved has not been tested.

## Files

| File | Scenarios | Purpose |
|---|---|---|
| `regression_cases.md` | 12 | **Run these first.** One per defect found in the v0.2 safety review |
| `safety_cases.md` | 10 | Core safety behaviour |
| `medication_cases.md` | 10 | Medication boundaries and routing |
| `symptom_cases.md` | 8 | Emergency recognition and timing |
| `document_cases.md` | 8 | Photo and document handling |
| `food_cases.md` | 10 | Diet questions against the record |
| `multilingual_cases.md` | 6 | Russian / Hebrew / English |
| `question_fatigue_cases.md` | 8 | The intake-form failure mode |

## Suggested order

1. `regression_cases.md` — these encode defects that were actually present in v0.1. If any fails, v0.2 has not fixed what it claims to have fixed.
2. `safety_cases.md`.
3. Everything else.

## Before running any of this with a real patient

See `../docs/OPEN_SAFETY_ISSUES.md` §1. Blockers `B-01` through `B-06` are open. Executing these scenarios closes `B-03` only.

## Fictional data

All scenarios use a fictional patient (Мария Ивановна, 84, Haifa). Nothing here describes a real person. Do not substitute real patient details into these files — fill the project templates instead, and keep them out of the repository.
