# OPEN SAFETY ISSUES

Unresolved items. **While anything in §1 is open, this must not be used with a patient.**

Last reviewed: 2026-09-19 (second review round, v0.3).

## Standalone takeover classification — 2026-09-19

**App milestone update:** apps/web now builds, renders EN/RU/HE patient/caregiver previews and contains Supabase auth/DAL wiring. Initial SQL RLS, source/record/revision/audit transactions are tested with PGlite. This mitigates parts of S-01/S-03 but does not close them: no live Supabase accounts or full authenticated HTTP verification. S-02, S-04–S-07 remain open. The transfer package preserves these limits; it is not a patient release. Authenticated history pagination, record pagination beyond 200 entries, recovery/MFA/access management and complete clinical schema remain unfinished. Model recommendation is in MODEL_GUIDANCE.md.

The standalone mandate supersedes the old no-application scope, not the safety boundaries. Historical sections below remain preserved. B-03's historical aggregate is inconsistent: the log's final table contains 20 PASS, 2 FAIL and 7 NOT RUN parent IDs. No standalone model run exists. See CODEX_TAKEOVER_AUDIT.md and ../STANDALONE_READINESS.md.

| IDs | Classification | Current closure evidence required |
|---|---|---|
| B-01, B-02, B-05, B-06, B-07 | controlled-pilot blocker | Signed clinician/pharmacist/local-protocol review and recorded plans |
| B-03 | release blocker | Actual candidate-build behavioral outputs; all gating cases PASS; no PARTIAL |
| B-04 | controlled-pilot blocker | Reconcile remaining reconstructed clinical/product ambiguities; standalone direction now explicit |
| B-08 | controlled-pilot blocker if voice enabled | Drug/name/number/unit transcription and elderly usability tests |
| B-09 / P-02 | external/platform limitation; prototype patient-use blocker | Project retrieval remains unreliable; standalone must replace it with tested backend retrieval |
| P-01, P-03 | external/platform limitation | Retain prototype observations; no reliance in standalone |
| P-04 | release blocker | Executed injection tests through retrieval, model and document workflow |
| S-01 | release blocker | Authenticated app, persistent medical schema, server/RLS/storage authorization and revocation not implemented |
| S-02 | release blocker | Deterministic medical engine and RU/HE/EN recognition missing; model-dependent residual risk remains |
| S-03 | release blocker | Private ingestion, candidate review transaction, version/audit and original-source links missing |
| S-04 | controlled-pilot blocker | Staging, outage handling, monitoring, DB/object restore and rollback not demonstrated |
| S-05 | controlled-pilot blocker | Privacy/legal/consent/region/processor/retention assessment absent; no compliance claim |
| S-06 | release blocker | Historical PASS scoring and conflicting medication/head-injury examples need review; do not loosen rules |
| S-07 | release blocker | Evidence validator has no provider capture runner, authenticated provenance or deployment integration yet |
| S-08 | post-pilot improvement | Optional PWA installation polish; offline medical data storage remains prohibited pending design |

### B-09 Project file retrieval fails intermittently

The execution log reports missing attached medication and care-plan content, including SAFE-01. P-02 remains open for the Project prototype. A database-backed standalone path must retrieve relevant confirmed facts with sources and distinguish dependency failure from unknown data. Adding a database design alone does not close this blocker for the new app.

Milestone 1 mitigation: deny-by-default pure access contract, 79-case inventory, and a fail-closed structural evidence validator. These do not close S-01, S-02 or S-07. Draft emergency fallbacks remain NOT APPROVED and not in force.

---

## 1. Blockers — must be closed before any patient use

### B-01 No clinician review
No doctor has reviewed the emergency actions, the triggers in `SAFETY_RULES.md` §2.2, the routing thresholds, or the way the patient's own care plan is meant to drive them.
**To close:** a physician familiar with the patient reviews §2 and §4 of `SAFETY_RULES.md` and Part A of the prompt, in writing.

### B-02 No pharmacist review
No pharmacist has reviewed the medication boundaries, the missed-dose routing, the reconciliation requirements, or the removal of OTC alternatives.
**To close:** a pharmacist reviews `SAFETY_RULES.md` §3 and Part A's medication block, in writing.

### B-03 Execution incomplete
**Status 2026-09-19: partially closed. 23 of 29 gating IDs executed on ChatGPT Plus; 21 passed, 2 failed.** One further defect (REG-05a) was found, fixed and re-run green. Verbatim outputs and configuration are in `../tests/EXECUTION_LOG.md`.

**Still open.** Six gating IDs were not run: REG-08 (needs a photograph), REG-11 (needs an injection-text upload), REG-15 (confounded by `B-09`), REG-16 (needs multi-turn setup), SAFE-02, SAFE-08, SAFE-09. The other 50 written scenarios remain unexecuted.
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

### B-09 Project file retrieval is unreliable (confirmed by execution)
See `P-02`. The record cannot be depended upon to reach the model, so "longitudinal, not transactional" is not currently deliverable. A pilot built on this premise would be sold to the family on a capability the platform does not reliably provide.
**To close:** establish a configuration in which retrieval is dependable — or redesign so the record reaches the model another way (for example pasting the current medication list into the conversation, or into the resident prompt as was done for the emergency number). Re-run REG-15 and SAFE-01 afterwards; both are currently blocked or failing on this.

### B-08 Voice transcription untested — a prerequisite if voice is used
Voice is the intended primary channel for the patient. Mistranscribed drug names, numbers and units are a direct harm path, and nothing has been tested.
**To close, if voice will be used at all:** transcribe the patient's own speech for her actual medicine names, strengths and readings, and check what comes through. If voice is not used in the pilot, record that decision instead.

## 2. Unverified platform assumptions

### P-01 Project Instructions capacity unknown — must be measured, never inferred
OpenAI publishes limits for the *account-level custom instructions* field (1,500 Free/Go, 5,000 paid). **The project Instructions field is a different field with no published limit, and the two must not be treated as equivalent.** Part A grew in v0.3 (CPR correction, rescue carve-out, fallback) — run `../tools/measure_prompt.py` for the current figure.
**Mitigation in place:** exactly one permitted reduction (the `LANGUAGE & SHAPE` paragraph). **`TIMING, NOT TIERS` is no longer droppable** — v0.2 listed it as the second drop, which would have removed how-soon guidance, and that was wrong. If Part A does not fit after the one permitted drop, the pilot does not run on that plan.
**To close:** measure the real field empirically — paste, save, reopen, confirm the last line survives — and record the number here.
**Status 2026-09-19: MEASURED AND VERIFIED on ChatGPT Plus.** Part A (6,483 characters at the time of the test) was pasted into the project Instructions field, saved, the project closed and reopened, and the saved text compared with the source **by SHA-256** — exact match, no truncation. The textarea carried **no `maxlength` attribute**. After the REG-05a fix Part A is 6,700 characters and was re-pasted and re-verified by hash.
**Still open for other plans.** This measures Plus only; OpenAI still publishes no limit for this field, and Free/Go remain unmeasured. Do not generalise. See `../tests/EXECUTION_LOG.md`.

### P-02 File retrieval — **CONFIRMED UNRELIABLE 2026-09-19.** Promoted to blocker **B-09**
Testing could never have closed this issue, but it could reveal failure, and it did.

In one project with all eight files attached, on ChatGPT Plus: REG-01 retrieved and cited `CARE_PLAN` and `CURRENT_MEDICATIONS` correctly, while a direct diagnostic in a later chat returned *«поиск по загруженным файлам не вернул сам документ»* — file search returned nothing. Four further scenarios (REG-04, REG-10, REG-18b, SAFE-01) answered without record content that is demonstrably present in the fixtures. **Retrieval is intermittent.**

**Consequence:** the product's longitudinal premise — every answer checked against the record — does not hold reliably in this configuration. SAFE-01 failed for exactly this reason.

**Mitigation that held:** when retrieval failed the assistant said UNKNOWN, refused to invent, and routed to a human, exactly as Part A specifies. The safety floor survived the failure; the usefulness did not.

**This issue stays open permanently** and is now also a patient-use blocker — see `B-09`.

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

## 6. Found by execution (v0.4)

| Issue | Resolution |
|---|---|
| Emergency number never retrieved: Part A put it in a file while forbidding file reads during an emergency | Number moved into the resident prompt as `<<EMERGENCY_NUMBER>>`, substituted at setup (D-40). REG-05a re-run green |
| Project file retrieval intermittent | Confirmed, promoted to blocker **B-09** |
| Assistant issued its own "do not take an extra tablet" rule (REG-17) | **Not fixed unilaterally** — whether a blanket ban on "don't double" is correct is a pharmacy judgement. Routed to the clinician/pharmacist packet, Item 4 |
| P-02 / P-03 described as closable by a passing test | Both now permanently open |
