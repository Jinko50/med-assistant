# MED ASSISTANT v0.2 — PRODUCT SPECIFICATION

> **UNRESOLVED — the original specification was never supplied.** The "Med Assistant v0.1 Product & Technical Specification" referenced in the brief did not reach the implementer. This document is a **reconstruction** from the brief's bullet points and may contradict the real specification on scope, intent or safety posture. It is **not authoritative**. See `OPEN_SAFETY_ISSUES.md` B-04.
>
> **v0.2** incorporates a safety review. Nothing here has been reviewed by a clinician or pharmacist, and no part of the system has been executed or tested. No claim of clinical validation is made.

---

## 1. Purpose

Med Assistant is a health companion for a single elderly patient, operated through a **ChatGPT Shared Project** that the patient and their family both use.

Its job is to make the patient's accumulated medical reality *available and usable* — to the patient in the moment, and to the family at a distance.

It is **not** a diagnostic system, not a triage service, not an electronic health record, and not a medication management device.

## 2. Phase scope

**Phase 1 (this repository): ChatGPT-native pilot. No application is to be built.**

The purpose of Phase 1 is to find out whether the concept works with one real elderly user, before anyone spends money or engineering time on a product. Everything here is documents: a system prompt, patient-context templates, and test scenarios.

Out of scope for Phase 1: any web or mobile app, any backend, any database, any API integration, any paid service, any device integration, any automated reminders.

Phase 2 is sketched in `FUTURE_ARCHITECTURE.md` and must not be started without explicit instruction.

## 3. Users

### 3.1 Primary — the patient

- Approximately 84 years old.
- Default language **Russian**; may receive documents in **Hebrew** or **English**.
- Interacts mainly through **voice**, **photographs**, and **short typed messages**.
- Likely realities to design for: reduced vision, reduced fine motor control, variable energy, variable memory for dates and names, low tolerance for being questioned, and a strong aversion to feeling tested or managed.
- Has a life. Health is not their hobby.

### 3.2 Secondary — the family / caregivers

- Remote. Use the same Shared Project.
- May write in Russian, Hebrew or English.
- Maintain the patient-context files (the patient is not expected to).
- Want depth, reasoning, trends, and something they can take to a doctor.

### 3.3 Not a user

Clinicians. Output may be *shown* to a doctor, but the product is not designed for clinical workflow and must not present itself as clinically validated.

## 4. Interaction model

| Channel | Use | Notes |
|---|---|---|
| Voice | The primary patient channel | Answers must survive being read aloud: short, linear, no tables |
| Photo | Medication boxes, labs, documents, meals, wounds, monitors | Extraction must be conservative — see §7 |
| Short text | Quick questions | Often ambiguous, often untyped punctuation, often mixed language |
| Family text | Review requests, file maintenance, context | Depth allowed |

## 5. Core product principles

1. **Longitudinal, not transactional.** Every message is answered in the context of the whole patient record. Treating a message as isolated is a defect.
2. **Answer, don't interview.** Routine question budget is 0–1 (`QUESTION_ENGINE.md`).
3. **Short for the patient, deep for the caregiver.** Same knowledge, two registers.
4. **Honest uncertainty.** Five provenance levels, every fact dated; unknowns stay unknown and are never filled in.
5. **Safety without noise.** Real escalation when it matters; no reflexive "consult your doctor" on everything.
6. **Teach gently, rarely.** One tip at a time, only when it would have changed today's answer.
7. **Never feel like homework.**

## 6. Functional capabilities (Phase 1)

| # | Capability | Definition of done |
|---|---|---|
| F1 | Food and drink safety | Answers "can I eat this" against the actual medication list and conditions, with a practical portion |
| F2 | Medication information | Purpose and plain-language explanation of what is recorded; routing of anything dose-related to the product leaflet, the prescriber's plan, or a pharmacist. **No dosing instructions of any kind**, and no rules of its own for missed or extra doses |
| F3 | Symptom response | Explicit timing and a deterioration trigger given; emergencies escalated first and never delayed; no diagnosis stated as certain |
| F4 | Document understanding | Reads RU/HE/EN labs, prescriptions, discharge letters; extracts only what is legible, with units as printed; compares with history by date; surfaces conflicts without resolving them |
| F5 | Longitudinal recall | Connects today's message to prior events and readings **held in the project files**, with their dates. Not memory — the files are the record |
| F6 | Proactive gap detection | Notices useful missing information — and mostly surfaces it for the family rather than asking the patient |
| F7 | Caregiver briefing | On request, produces a structured summary suitable for an appointment |
| F8 | Write-back proposals | Emits copy-paste blocks, marked **PENDING**, for a person to paste in. The assistant cannot write to any file and never claims to have saved anything |

## 7. Information model

### 7.1 Provenance levels

`DOCUMENTED` (a dated document in this project said so) · `REPORTED` (someone said so) · `SEEN IN PHOTO` · `ESTIMATED` (derived, with the derivation stated) · `UNKNOWN`.

`DOCUMENTED` replaces v0.1's `CONFIRMED`: a document shows what it said on its date, which is not the same as being true now. `ASSUMED` has been **deleted** — an unknown safety-relevant fact stays UNKNOWN and is named as such. Estimates may never be rendered as fact, and unreadable values may never be invented.

Every fact carries a **source and a date**, and record freshness is stated whenever a fact is load-bearing.

### 7.2 Prescribed vs taken

`CURRENT_MEDICATIONS.md` is a record of **prescription**, not of **intake**. Intake is only established by an explicit statement and is logged to `HEALTH_TIMELINE.md`. The assistant must never silently conflate the two — a large share of real-world elderly medication harm lives in exactly that gap.

### 7.3 Medicine identification

Appearance is never identification, **and the assistant does not state a resemblance either** — a suggested resemblance is acted on as an identification by the person holding the tablet. It requests the packaging, advises against taking an unidentified medicine, and routes identification to a pharmacist.

### 7.4 Conflicts

Where two sources disagree, both are presented with their dates and the conflict is left **unresolved** for a person. Recency is evidence, not resolution.

## 8. Context files

Seven files, templated in `/project`, maintained by the family:

`PATIENT_PROFILE` · `CURRENT_MEDICATIONS` · `MEDICAL_HISTORY` · `LAB_RESULTS` · `HEALTH_TIMELINE` · `CARE_PLAN` · `FAMILY_NOTES`

Design constraint: they must be editable by a non-technical family member in a text box on a phone. Hence Markdown with simple pipe tables, not YAML or JSON.

## 9. Non-functional requirements

| Requirement | Target |
|---|---|
| Cost | **Zero additional cost.** No paid API, SaaS or infrastructure introduced for the pilot |
| Safety rules resident | All rules in `SAFETY_RULES.md` §1 live in the Instructions field, never in an uploaded file |
| Patient-facing response length | Under ~60 words, 1–3 sentences of answer |
| Questions per routine exchange | 0–1 |
| Languages | RU / HE / EN, input and output |
| Latency | Whatever ChatGPT gives; not engineered in Phase 1 |
| Data residency | The patient's data lives in the family's ChatGPT account — see `PRIVACY.md` |

## 10. Success criteria for the pilot

The pilot is judged on whether the patient keeps using it without being reminded to.

**Quantitative (over ~4 weeks)**
- Patient-initiated messages in at least 60% of days used.
- Median follow-up questions per routine exchange ≤ 0.3.
- Zero unsafe outputs on the `/tests` safety and regression sets — **which requires actually running them; none has been run.**
- Zero instances of the assistant asking for information already in the project files.

**Qualitative**
- The patient describes it in human terms ("он помнит"), not tool terms.
- The family reports less repetitive phone-based fact-gathering.
- At least one instance where the assistant surfaced something genuinely useful that would otherwise have been missed.

**Failure signals that should stop the pilot**
- The patient starts avoiding it, or asks the family to handle it instead.
- Any output that could have caused harm.
- The patient experiences it as a test of their memory.

## 10a. What this system cannot do

Stated here because the specification should not imply capabilities the platform lacks:

- It **cannot save or change anything**. Every record update is manual.
- It **cannot notify anyone**, ever, including in an emergency.
- It **does not monitor** the patient and does not run between messages.
- It **may not recall** earlier chats reliably. Shared projects use project-only memory; recall is not a record.
- It **cannot check every interaction**, and says what it did check.
- It **cannot verify** that anything in the files is correct.

## 11. Explicit non-goals

- No diagnosis.
- No prescription changes.
- No emergency response capability — the assistant directs to emergency services, it is not one.
- No adherence enforcement or nagging.
- No dashboards, scores, streaks, or gamification. This patient is not a user to be engaged; they are a person to be helped.
