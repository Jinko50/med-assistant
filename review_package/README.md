# REVIEW PACKAGE — Med Assistant v0.3

Refreshed **2026-09-19** after the second review round. All files are byte-identical copies of their sources in the repository.

## Contents

| File | Source | State |
|---|---|---|
| `MED_ASSISTANT_SYSTEM_PROMPT.md` | `project/` | v0.3 — CPR trigger corrected, rescue carve-out, missing-plan fallback, aspirin included in head-injury routing |
| `SAFETY_RULES.md` | `docs/` | v0.3 — §2.3 CPR criteria, §2.5 head injury reconciled, §2.6 fallback, §3.2a carve-out |
| `QUESTION_ENGINE.md` | `docs/` | v0.3 — reconfirmation permitted, routine-only stop rule, PENDING open items, Russian capability claims removed |
| `IMPLEMENTATION_DECISIONS.md` | repo root | D-33 … D-39 added; D-22, D-24 corrected in place |
| `CLINICAL_SOURCES.md` | `docs/` | RCUK 2025 now quoted directly on the arrest criteria |
| `OPEN_SAFETY_ISSUES.md` | `docs/` | 8 blockers; P-02 and P-03 now permanently open |
| `EMERGENCY_FALLBACKS.md` | `docs/` | **NEW — the document most needing review.** Draft pathways, not approved, not in force, with a sign-off sheet |
| `EXECUTION_LOG.md` | `tests/` | **NEW — empty.** Actual runs are recorded here; there are none |

## What changed since the v0.2 package

| Defect found in v0.2 | Fix |
|---|---|
| CPR triggered by "not breathing normally" alone | Now **unresponsive AND absent/abnormal breathing**; agonal gasping named as a sign of arrest, not of breathing; call first, speaker on, dispatcher gives instructions |
| Russian Example 3 promised «я запишу» / «я всё проверю» | Removed; the reply now states it can neither save nor check everything |
| Reconfirming anything recorded was forbidden | Safety-critical reconfirmation of stale or disputed facts permitted, with a three-part test |
| All questions stopped after three ignored | Routine questions only; safety-critical questions continue |
| Open items described as filed automatically | PENDING until a person saves them; family availability never assumed |
| No fallback when a plan or threshold is missing | Conservative fallback in force; draft pathways here for sign-off |
| Rescue treatment vs the blanket medication ban | Carve-out written out explicitly (§3.2a) |
| Head-injury routing inconsistent between documents | Reconciled to the broader rule; explained and flagged as **B-07** |
| Timing listed as droppable to fit the prompt | No longer droppable; only `LANGUAGE & SHAPE` may go |
| Field limit inferred from Custom Instructions | Must now be measured empirically; `tools/measure_prompt.py` added |
| P-02/P-03 marked closable by a passing test | Both permanently open |
| Voice transcription an accepted limitation | Promoted to blocker **B-08** where voice is used |

## Before reading

- **79 scenarios written. 0 executed.** `EXECUTION_LOG.md` is the only place actual runs count, and it is empty. Never read a scenario count as evidence of testing.
- **No clinician or pharmacist has reviewed any of this** (`B-01`, `B-02`).
- **No clinical validation is claimed.**
- The original product specification was never supplied (`B-04`).
- Sources are UK bodies; the patient is in Israel; local protocol unconfirmed (`B-05`).

## Where review is most needed, in order

1. **`EMERGENCY_FALLBACKS.md` §4.5** — whether "wait for the pharmacy rather than guess" is safe for every drug class when nothing is open. The reviewer's own question, still open.
2. **`EMERGENCY_FALLBACKS.md` §4.1–4.3** — the anaphylaxis, hypoglycaemia and no-threshold pathways, and whether "feels unwell" is a safe discriminator in a frail 84-year-old given atypical presentation.
3. **`SAFETY_RULES.md` §2.3** — the corrected arrest criteria, and the side-positioning instruction, which is general first-aid practice rather than a quotation from the 2025 BLS guideline.
4. **`SAFETY_RULES.md` §2.5 / B-07** — whether including aspirin monotherapy in universal ambulance routing is right, or should be narrowed.
5. **`SAFETY_RULES.md` §3.2a** — whether the rescue carve-out is drawn in the right place.
6. **Part A as a whole** — it measures 6,483 characters (A1 floor 4,707) and may not fit the project Instructions field, whose capacity is unpublished. If it does not fit after dropping the one permitted paragraph, the pilot does not run.

Cross-references point at repository paths that do not resolve inside this folder. The repository is the authoritative copy.
