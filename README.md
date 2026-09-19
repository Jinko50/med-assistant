# Med Assistant v0.1

A longitudinal health companion for one elderly patient and their family, running entirely inside a **ChatGPT Shared Project**.

**Phase 1 is documents, not software.** No web app, no mobile app, no backend, no paid services. The point is to find out whether an 84-year-old will actually use this, before anyone builds anything.

---

## What this is

A system prompt, seven patient-context templates, and a 59-scenario test suite — enough to run a real pilot with a real patient this week, at zero additional cost.

The assistant it produces:

- remembers the patient's whole medical picture and answers in its context, not generically;
- **asks almost nothing** — 0–1 follow-up questions in a routine exchange, always skippable;
- speaks Russian, Hebrew and English, and reads documents in all three;
- keeps patient answers short enough to work over voice, and gives family the depth they need;
- never changes a prescription, never invents a value, never identifies a pill from a photo alone;
- escalates real red flags clearly, and does not pad everything else with "consult your doctor".

---

## Repository layout

```
med-assistant/
├── README.md                      ← you are here
├── SETUP_CHATGPT_PROJECT.md       ← start here to run the pilot
├── IMPLEMENTATION_DECISIONS.md    ← what was changed from the brief, and why
│
├── docs/                          ← for the family and the builder. Do NOT upload.
│   ├── PRODUCT_SPEC.md            what this is and how success is judged
│   ├── SAFETY_RULES.md            normative safety behaviour; the test suite scores against it
│   ├── QUESTION_ENGINE.md         the five-step method for asking almost nothing
│   ├── PRIVACY.md                 what is really happening to the data, and who can see it
│   └── FUTURE_ARCHITECTURE.md     Phase 2 sketch — not to be built
│
├── project/                       ← goes into the ChatGPT project
│   ├── MED_ASSISTANT_SYSTEM_PROMPT.md   ★ paste into Project Instructions
│   ├── PATIENT_PROFILE.template.md
│   ├── CURRENT_MEDICATIONS.template.md
│   ├── MEDICAL_HISTORY.template.md
│   ├── LAB_RESULTS.template.md
│   ├── HEALTH_TIMELINE.template.md
│   ├── CARE_PLAN.template.md
│   └── FAMILY_NOTES.template.md
│
└── tests/                         ← 59 scenarios. Do NOT upload.
    ├── food_cases.md              10
    ├── medication_cases.md        10
    ├── symptom_cases.md            8
    ├── document_cases.md           8
    ├── multilingual_cases.md       6
    ├── safety_cases.md             9   ← four of these are pilot-blocking
    └── question_fatigue_cases.md   8
```

---

## Quick start

1. Read `docs/PRIVACY.md` §3 and get the patient's agreement.
2. Follow `SETUP_CHATGPT_PROJECT.md`.
3. Paste `project/MED_ASSISTANT_SYSTEM_PROMPT.md` (everything below the horizontal rule) into the project's Instructions.
4. Fill the seven templates with the patient's real details, **delete the fictional EXAMPLE sections**, and upload them.
5. Run the five verification checks in Setup Step 5 before the patient ever sees it.
6. Show the patient the voice button. Nothing else.

---

## The two things most likely to break this

**1. The files stop being updated.** The model cannot write to project files, so the family maintains them by hand — about five minutes a week. If that stops, the assistant degrades to a generic chatbot within a month. This is the pilot's dominant risk and the main reason Phase 2 would ever be justified (`docs/FUTURE_ARCHITECTURE.md`).

**2. It starts asking questions.** The moment it feels like a form, an 84-year-old stops using it. `docs/QUESTION_ENGINE.md` exists entirely to prevent this, and `tests/question_fatigue_cases.md` measures whether it worked.

---

## Safety boundaries

The assistant does not diagnose, does not change prescriptions, and is not an emergency service — it tells a human to act. Full behaviour in `docs/SAFETY_RULES.md`. It runs on a consumer ChatGPT account and is **not** a HIPAA- or GDPR-compliant system; it is appropriate for one consenting family and nothing wider (`docs/PRIVACY.md`).

---

## All patient data in this repository is fictional

Мария Ивановна and everything about her — medications, labs, admissions, family — were invented for the test suite. Delete every `## EXAMPLE` section before putting a real patient's information anywhere near this.
