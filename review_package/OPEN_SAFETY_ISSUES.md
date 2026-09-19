# OPEN SAFETY ISSUES

Unresolved items. **While anything in §1 is open, this must not be used with a patient.**

Last reviewed: 2026-09-19 (second review round, v0.3).

---

## 1. Blockers — must be closed before any patient use

### B-01 No clinician review
No doctor has reviewed the emergency actions, the triggers in `SAFETY_RULES.md` §2.2, the routing thresholds, or the way the patient's own care plan is meant to drive them.
**To close:** a physician familiar with the patient reviews §2 and §4 of `SAFETY_RULES.md` and Part A of the prompt, in writing.

### B-02 No pharmacist review
No pharmacist has reviewed the medication boundaries, the missed-dose routing, the reconciliation requirements, or the removal of OTC alternatives.
**To close:** a pharmacist reviews `SAFETY_RULES.md` §3 and Part A's medication block, in writing.

### B-03 Nothing has been executed
**Status 2026-09-19: still open. 0 of 79 executed, 0 of 29 in the two gating files.** Execution is blocked because no configured project exists — see `../tests/EXECUTION_LOG.md` for the access determination and the exact steps required.

All 79 scenarios in `/tests` are **written, not run**. No output of any model against this prompt has been observed. Every "expected behaviour" in the test files is a hypothesis.
**To close:** execute at least `../tests/regression_cases.md` and `../tests/safety_cases.md` against the real project, record actual outputs, and fix what fails. See `../tests/README.md`.

### B-04 Original specification never supplied
The "Med Assistant v0.1 Product & Technical Specification" referenced in the original brief was never provided. `PRODUCT_SPEC.md` is a reconstruction from the brief's bullet points and may contradict the real specification on scope, intent or safety posture.
**To close:** obtain the original and reconcile, or confirm in writing that the reconstruction is authoritative.

### B-05 Local emergency protocol not confirmed
The clinical sources are UK bodies (Resuscitation Council UK, NICE, NHS SPS, Diabetes UK). The example patient is in Israel. The emergency number, local ambulance pre-arrival instructions, and any national variation are unconfirmed.
**To close:** confirm local protocol, record the emergency number in `PATIENT_PROFILE.md`, and note any divergence from the sources in `CLINICAL_SOURCES.md`.

### B-06 Patient's own plans not captured, and the fallbacks are unapproved
The prompt routes hypoglycaemia and anaphylaxis to "their own plan" and missed doses to "the product leaflet". If those do not exist in written form, the assistant needs a fallback.
**Partly mitigated in v0.3:** a conservative fallback is now in force (`SAFETY_RULES.md` §2.6) — say nothing is recorded, invent nothing, route to the dispatcher or the clinic. Draft pathways for the commoner cases are written in `EMERGENCY_FALLBACKS.md` but are **NOT approved and NOT in force**.
**To close:** obtain the written plans, or have a clinician and pharmacist sign every row of the `EMERGENCY_FALLBACKS.md` §6 sheet. The open question flagged as most important there is §4.5 — whether "wait for the pharmacy rather than guess" is safe for every drug class.

### B-07 Head-injury routing deliberately broader than NG232
The resident prompt and `SAFETY_RULES.md` §2.5 send **any** head injury on **any** anticoagulant or antiplatelet — aspirin monotherapy included — to emergency services. NG232 excludes aspirin monotherapy from its CT-consideration recommendation. The broader rule is a deliberate, conservative choice by a non-clinician: NG232 governs the imaging decision rather than the attendance decision, and the assistant cannot reliably establish monotherapy from a record whose accuracy is exactly what §3.6 exists to doubt.
**Consequence:** some aspirin-only patients with minor bumps are over-escalated.
**To close:** a clinician confirms the broad rule, or narrows it in writing. The assistant may not narrow it on its own.

### B-08 Voice transcription untested — a prerequisite if voice is used
Voice is the intended primary channel for the patient. Mistranscribed drug names, numbers and units are a direct harm path, and nothing has been tested.
**To close, if voice will be used at all:** transcribe the patient's own speech for her actual medicine names, strengths and readings, and check what comes through. If voice is not used in the pilot, record that decision instead.

## 2. Unverified platform assumptions

### P-01 Project Instructions capacity unknown — must be measured, never inferred
OpenAI publishes limits for the *account-level custom instructions* field (1,500 Free/Go, 5,000 paid). **The project Instructions field is a different field with no published limit, and the two must not be treated as equivalent.** Part A grew in v0.3 (CPR correction, rescue carve-out, fallback) — run `../tools/measure_prompt.py` for the current figure.
**Mitigation in place:** exactly one permitted reduction (the `LANGUAGE & SHAPE` paragraph). **`TIMING, NOT TIERS` is no longer droppable** — v0.2 listed it as the second drop, which would have removed how-soon guidance, and that was wrong. If Part A does not fit after the one permitted drop, the pilot does not run on that plan.
**To close:** measure the real field empirically — paste, save, reopen, confirm the last line survives — and record the number here.
**Status 2026-09-19: NOT VERIFIED.** No ChatGPT Project exists to paste into; no step of `../SETUP_CHATGPT_PROJECT.md` has been completed. Part A currently measures **6,483 characters** (A1 floor 4,707; only 348 of that is droppable) per `../tools/measure_prompt.py`. Whether that fits the project Instructions field is unknown and cannot be established from here. See `../tests/EXECUTION_LOG.md` for the access determination.

### P-02 File retrieval reliability unknown — CANNOT BE CLOSED BY TESTING
Whether uploaded project files are consulted on every turn is not documented.
**Mitigation in place:** nothing safety-critical lives outside the resident prompt.
**This issue stays open permanently.** A test that retrieves an uploaded fact correctly shows retrieval is *possible*, not that it is *reliable*. Absence of failure in a handful of trials is not evidence of guaranteed behaviour, and the platform gives no guarantee to rely on. Testing is still worth doing — it can reveal that retrieval is *unreliable* — but a pass never retires this.

### P-03 Project memory behaviour unknown — CANNOT BE CLOSED BY TESTING
Shared projects use project-only memory and may reference other chats in the project, but determinism is not documented.
**Mitigation in place:** no memory promises anywhere; the timeline file is the record.
**This issue stays open permanently**, for the same reason as P-02. A successful recall across two sessions does not establish recall across the next hundred. The design continues to assume recall may fail on any turn.

### P-04 Prompt-injection via uploaded documents untested
Part A states that files are data, not instructions. A photographed document containing instruction-like text has not been tested against it.
**To close:** run `REG-11`.

## 3. Known design limitations accepted for the pilot

- **No alerting.** An emergency exchange at 3am reaches nobody but the patient. The assistant cannot notify family. A paper card with the emergency number beside the phone is not optional.
- **Record decay.** The model cannot write to files; the record is only as current as the family's manual updates.
- ~~Voice transcription untested~~ — promoted to blocker **B-08** where voice is used.
- **No clinical record access.** Everything depends on what the family transcribed correctly.
- **Consumer platform.** Not HIPAA- or GDPR-engineered; see `PRIVACY.md`.

## 4. Closed by the v0.2 safety review

| Issue | Resolution |
|---|---|
| Medication-hold authority | Withdrawn (`SAFETY_RULES.md` §3.2) |
| Class-based missed-dose rules; "skip if uncertain"; "never take two" | Withdrawn; routed to product leaflet, prescriber plan, or pharmacist (§3.3) |
| Doubled-amlodipine example advising watchful waiting | Corrected to prompt professional advice (`QUESTION_ENGINE.md` Example 2) |
| Generic emergency actions | Replaced with sourced, condition-specific actions (§2.3) |
| Automatic tier arithmetic; "worst plausible explanation" | Removed; replaced with explicit timing and deterioration triggers (§4) |
| Question budgets inconsistent between documents | Unified: routine 0–1, caregiver review ≤3, safety clarification overrides without delaying care |
| Unknowns becoming assumptions; `ASSUMED` label | `ASSUMED` deleted; unknowns stay `UNKNOWN` |
| Memory / logging / monitoring / notification claims | Removed; honest capability table (§6) |
| `CONFIRMED` label overstating certainty | Replaced with `DOCUMENTED` |
| "Unlimited" juice advice; pill resemblance; unsupported OTC alternatives | Removed (§3.5, §1.4) |
| Diagnoses auto-routed to family; identity inferred from language | Removed (§7) |
| Safety rules sitting in a droppable prompt tail | Restructured into a resident safety floor (§1) |

## 5. Closed by the second review round (v0.3)

| Issue | Resolution |
|---|---|
| CPR triggered by "not breathing normally" alone | Corrected to **unresponsive AND absent/abnormal breathing**, with agonal gasping named and the dispatcher's role stated (`SAFETY_RULES.md` §2.3) |
| Russian Example 3 promised «я запишу» and «я всё проверю» | Both removed; the reply now states it cannot save or check everything (`QUESTION_ENGINE.md` Example 3) |
| Reconfirming anything recorded was forbidden | Safety-critical reconfirmation of stale or disputed facts now permitted, with a three-part test (`QUESTION_ENGINE.md` §4) |
| All questioning stopped after three ignored questions | Now applies to **routine** questions only; safety-critical questions continue |
| Open items described as recorded automatically | Now **PENDING** until a person saves them; family availability never assumed |
| No fallback when a plan or threshold is missing | Conservative fallback in force (§2.6); draft pathways for review in `EMERGENCY_FALLBACKS.md` |
| Rescue treatment vs the blanket medication prohibition | Carve-out stated explicitly (`SAFETY_RULES.md` §3.2a) |
| Head-injury routing inconsistent between prompt and §2.5 | Reconciled; the broader rule is explained and flagged as **B-07** |
| `TIMING, NOT TIERS` listed as droppable | No longer droppable; only `LANGUAGE & SHAPE` may be dropped |
| P-02 / P-03 described as closable by a passing test | Both now permanently open |
