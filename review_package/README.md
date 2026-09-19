# REVIEW PACKAGE — Med Assistant v0.2

Refreshed **2026-09-19** after acting on the safety review. Files are byte-identical copies of their sources in the repository.

| File in this folder | Source | What changed in v0.2 |
|---|---|---|
| `MED_ASSISTANT_SYSTEM_PROMPT.md` | `project/` | Restructured into a **resident Part A** (safety floor + operating rules) and an uploaded Part B. All medication-hold authority and class-based missed-dose rules removed. Condition-specific, sourced emergency actions added. |
| `SAFETY_RULES.md` | `docs/` | Rewritten. Hold exception withdrawn; tier arithmetic and "worst plausible explanation" removed; timing and deterioration triggers added; units mandated; honest capability table added. |
| `QUESTION_ENGINE.md` | `docs/` | Budgets unified; safety-clarification override made explicit; unknowns may no longer become assumptions; the doubled-amlodipine example corrected. |
| `IMPLEMENTATION_DECISIONS.md` | repo root | D-19 … D-32 added; D-04, D-05, D-11 marked withdrawn or superseded in place. |
| `CLINICAL_SOURCES.md` | `docs/` | **New.** Every clinical instruction with its source and retrieval date, plus what was deliberately not used. |
| `OPEN_SAFETY_ISSUES.md` | `docs/` | **New.** Six blockers, four unverified platform assumptions. |

Two files were added to this package beyond the four originally requested, because the first four cannot be assessed without them: the clinical instructions are only reviewable against their sources, and the claims are only reviewable against the list of what remains unproven.

## What a reviewer should know before reading

- **Nothing has been executed.** All 72 test scenarios are written; none has been run against a model. Every expected behaviour is a hypothesis.
- **No clinician or pharmacist has reviewed any of this.** That review is blocker `B-01` / `B-02`.
- **No clinical validation is claimed.**
- The original product specification referenced in the brief was never supplied (`B-04`).
- Clinical sources are UK bodies; the example patient is in Israel, and local protocol is unconfirmed (`B-05`).

## Where review is most needed

1. `SAFETY_RULES.md` §2.3 — the condition-specific emergency actions, and whether routing rescue medication to "the patient's own plan" is sound when no such plan may exist.
2. `SAFETY_RULES.md` §3.3 — whether routing every missed, late, extra or uncertain dose away from the assistant is the right boundary, or whether it fails a patient with no pharmacy access out of hours.
3. Part A of the prompt — whether the safety floor survives compression at ~3,650 characters, and what was lost in making it fit.
4. `OPEN_SAFETY_ISSUES.md` §1 — whether the blocker list is complete.

Cross-references in these files point at repository paths (`../docs/…`, `tests/…`) that do not resolve inside this folder. The full repository is the authoritative copy.
