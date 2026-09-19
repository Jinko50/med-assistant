# OPEN SAFETY ISSUES

Unresolved items. **While anything in §1 is open, this must not be used with a patient.**

Last reviewed: 2026-09-19.

---

## 1. Blockers — must be closed before any patient use

### B-01 No clinician review
No doctor has reviewed the emergency actions, the triggers in `SAFETY_RULES.md` §2.2, the routing thresholds, or the way the patient's own care plan is meant to drive them.
**To close:** a physician familiar with the patient reviews §2 and §4 of `SAFETY_RULES.md` and Part A of the prompt, in writing.

### B-02 No pharmacist review
No pharmacist has reviewed the medication boundaries, the missed-dose routing, the reconciliation requirements, or the removal of OTC alternatives.
**To close:** a pharmacist reviews `SAFETY_RULES.md` §3 and Part A's medication block, in writing.

### B-03 Nothing has been executed
All 72 scenarios in `/tests` are **written, not run**. No output of any model against this prompt has been observed. Every "expected behaviour" in the test files is a hypothesis.
**To close:** execute at least `tests/regression_cases.md` and `tests/safety_cases.md` against the real project, record actual outputs, and fix what fails. See `tests/README.md`.

### B-04 Original specification never supplied
The "Med Assistant v0.1 Product & Technical Specification" referenced in the original brief was never provided. `PRODUCT_SPEC.md` is a reconstruction from the brief's bullet points and may contradict the real specification on scope, intent or safety posture.
**To close:** obtain the original and reconcile, or confirm in writing that the reconstruction is authoritative.

### B-05 Local emergency protocol not confirmed
The clinical sources are UK bodies (Resuscitation Council UK, NICE, NHS SPS, Diabetes UK). The example patient is in Israel. The emergency number, local ambulance pre-arrival instructions, and any national variation are unconfirmed.
**To close:** confirm local protocol, record the emergency number in `PATIENT_PROFILE.md`, and note any divergence from the sources in `CLINICAL_SOURCES.md`.

### B-06 Patient's own plans not captured
The prompt routes hypoglycaemia and anaphylaxis to "their own plan" and missed doses to "the product leaflet". If those do not exist in written form, the assistant routes to nothing.
**To close:** obtain written hypo and allergy plans from the prescriber where relevant, or record explicitly that none exists and what to do instead.

## 2. Unverified platform assumptions

### P-01 Project Instructions character limit unknown
OpenAI publishes limits for account-level custom instructions (1,500 Free / 5,000 paid) but not for the project Instructions field. Part A measures **5,296 characters** and may not fit.
**Mitigation in place:** a documented drop order in the prompt file. **To close:** measure the real field and record it.

### P-02 File retrieval reliability unknown
Whether uploaded project files are consulted on every turn is not documented.
**Mitigation in place:** nothing safety-critical lives outside the resident prompt. **To close:** test behaviour with a fact that exists only in an uploaded file.

### P-03 Project memory behaviour unknown
Shared projects use project-only memory and may reference other chats in the project, but determinism is not documented.
**Mitigation in place:** no memory promises; the timeline file is the record. **To close:** test recall across sessions.

### P-04 Prompt-injection via uploaded documents untested
Part A states that files are data, not instructions. A photographed document containing instruction-like text has not been tested against it.
**To close:** run `REG-11`.

## 3. Known design limitations accepted for the pilot

- **No alerting.** An emergency exchange at 3am reaches nobody but the patient. The assistant cannot notify family. A paper card with the emergency number beside the phone is not optional.
- **Record decay.** The model cannot write to files; the record is only as current as the family's manual updates.
- **Voice transcription is an untested safety surface.** Mistranscribed drug names, numbers and units are a plausible harm path and have not been tested.
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
