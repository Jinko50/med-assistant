# Med Assistant — standalone development

## Windows download — no developer tools required

Get the ZIP from [Releases](https://github.com/Jinko50/med-assistant/releases), extract it,
and open **Start Med Assistant.cmd**. [Windows instructions](docs/WINDOWS_DOWNLOAD.md).
The original download is a fictional, read-only preview. The connected account-testing
release adds registration, shared records and an admin portal with approved email roles.
Follow [installation and administration](docs/INSTALL_AND_ADMIN.md). Account setup and
live acceptance tests remain required; medical chat is unavailable.

**Current status (2026-09-19): not ready for patient use.** The deliverable is now a standalone application. The ChatGPT Project material below is a preserved prototype and requirements source; its Phase 1 scope and zero-execution statements are historical, not current status.

Start with [the takeover audit](docs/CODEX_TAKEOVER_AUDIT.md), [implementation plan](docs/STANDALONE_IMPLEMENTATION_PLAN.md), [readiness matrix](STANDALONE_READINESS.md) and [local development](docs/LOCAL_DEVELOPMENT.md). A Next.js app now runs locally with patient/caregiver fictional previews, three languages, server auth wiring and SQL record/access policies. Live Supabase authentication is not yet configured or verified. Medical chat remains disabled.

To move development to Dad's computer, use [the transfer guide](docs/COMPUTER_TRANSFER.md) and [next-developer handoff](docs/NEXT_DEVELOPER_HANDOFF.md). Recommended development model: **GPT-6 Astra / High**, Extra High for safety/security reviews; [model guidance](docs/MODEL_GUIDANCE.md).

79 parent scenarios exist. The historical run's final table has 20 passing, 2 failing and 7 unrun gating parent IDs; its original aggregate summary is inconsistent. No standalone model scenarios have run. See the audit for details.

## Preserved prototype README (v0.3)

A longitudinal health companion for one elderly patient and their family, running inside a **ChatGPT Shared Project**.

> ## ⚠ Not ready for patient use
>
> v0.3 incorporates a second review round; v0.2 incorporated the first. Both found real defects, and both sets are fixed in the documents — but:
>
> - **No clinician has reviewed this.** No pharmacist has reviewed this.
> - **Nothing has been executed.** All 79 test scenarios are written, none has been run against a model.
> - **No clinical validation is claimed**, and none exists.
> - The original product specification referenced in the brief was never supplied, so `docs/PRODUCT_SPEC.md` is a reconstruction and is not authoritative.
>
> Blockers are tracked in [`docs/OPEN_SAFETY_ISSUES.md`](docs/OPEN_SAFETY_ISSUES.md). **Do not use this with a patient while any §1 blocker is open.**

**Phase 1 is documents, not software.** No web app, no mobile app, no backend, no paid services.

---

## What this is

A system prompt, seven patient-context templates, and a 79-scenario test suite.

The assistant it is intended to produce:

- answers in the context of the patient's recorded history, with **dates and sources**, rather than generically;
- **asks almost nothing** — 0–1 follow-up questions routinely, always skippable;
- works in Russian, Hebrew and English, and reads documents in all three;
- keeps patient answers short enough to work over voice, and gives family the depth they need;
- **gives no medication instructions at all** — not doses, not schedules, not missed-dose rules — and routes those to the product's leaflet, the prescriber's plan, or a pharmacist;
- escalates emergencies in the first sentence, with sourced, condition-specific holding actions, and never delays that for a question;
- says plainly what it does not know, what it could not check, and what it cannot do.

## What it cannot do

Stated here because earlier drafts implied otherwise:

| It cannot | Consequence |
|---|---|
| Save or change anything | Every record update is manual; the family maintains the files |
| Notify anyone | An emergency exchange at 3am reaches nobody but the patient |
| Monitor the patient | It does not run between messages |
| Reliably recall past chats | The files are the record, not the model |
| Check every interaction | It says what it checked |
| Verify anything in the files | Garbage in, confident garbage out |
| Guarantee privacy | See [`docs/PRIVACY.md`](docs/PRIVACY.md) §11 |

## Repository layout

```
med-assistant/
├── README.md
├── SETUP_CHATGPT_PROJECT.md       ← start here
├── IMPLEMENTATION_DECISIONS.md    ← what changed from the brief and from v0.1, and why
│
├── docs/                          ← for the family and the builder. Do NOT upload.
│   ├── OPEN_SAFETY_ISSUES.md      ★ blockers. Read before anything else
│   ├── EMERGENCY_FALLBACKS.md     draft pathways awaiting clinician sign-off
│   ├── SAFETY_RULES.md            normative safety behaviour
│   ├── CLINICAL_SOURCES.md        every clinical instruction, with its source and date
│   ├── QUESTION_ENGINE.md         how it decides to ask almost nothing
│   ├── PRODUCT_SPEC.md            reconstruction — not authoritative
│   ├── PRIVACY.md                 what is really happening to the data
│   └── FUTURE_ARCHITECTURE.md     Phase 2 sketch — not to be built
│
├── tools/
│   └── measure_prompt.py          prints Part A / Part B sizes
│
├── project/
│   ├── MED_ASSISTANT_SYSTEM_PROMPT.md   ★ Part A → Instructions; Part B → upload
│   └── *.template.md                    seven context templates
│
├── tests/                         ← 79 scenarios, none executed. Do NOT upload.
│   ├── README.md                  ★ execution status: nothing has been run
│   ├── EXECUTION_LOG.md          ★ actual runs. Currently empty
│   ├── regression_cases.md        19 — one per defect found in review. Run first
│   ├── safety_cases.md            10
│   ├── medication_cases.md        10
│   ├── symptom_cases.md            8
│   ├── document_cases.md           8
│   ├── food_cases.md              10
│   ├── multilingual_cases.md       6
│   └── question_fatigue_cases.md   8
│
└── review_package/                copies of the four files sent for external review
```

## Quick start

1. Read [`docs/OPEN_SAFETY_ISSUES.md`](docs/OPEN_SAFETY_ISSUES.md). If a §1 blocker is open, the answer is not yet.
2. Read [`docs/PRIVACY.md`](docs/PRIVACY.md) §3 and §11, and get the patient's informed agreement.
3. Follow [`SETUP_CHATGPT_PROJECT.md`](SETUP_CHATGPT_PROJECT.md).
4. Paste **Part A** of the system prompt into the project Instructions; upload **Part B** as a file.
5. Fill the seven templates, **delete the fictional EXAMPLE sections**, upload them.
6. Run `tests/regression_cases.md` and `tests/safety_cases.md` yourself and record the results.
7. Only then consider showing it to the patient.

## The three things most likely to break this

1. **It has never been run.** Every expected behaviour is a hypothesis.
2. **The files stop being updated.** The model cannot write to them; ~5 minutes a week of family effort is the whole record-keeping mechanism.
3. **The prompt does not fit.** The project Instructions field's capacity is **not published** and must be measured, not inferred from the account-level Custom Instructions limits — they are different fields. Run `python tools/measure_prompt.py` for Part A's current size, then measure the field itself (`SETUP_CHATGPT_PROJECT.md` Step 2). Only the `LANGUAGE & SHAPE` paragraph may be dropped; timing guidance may not.

## Safety boundaries

No diagnosis. No medication instructions of any kind. Not an emergency service — it tells a human to act. Full behaviour in [`docs/SAFETY_RULES.md`](docs/SAFETY_RULES.md); every clinical instruction traces to [`docs/CLINICAL_SOURCES.md`](docs/CLINICAL_SOURCES.md). It runs on a consumer ChatGPT account and is **not** HIPAA- or GDPR-compliant.

## All patient data here is fictional

Мария Ивановна and everything about her were invented for the test suite. Delete every `## EXAMPLE` section before real patient information goes anywhere near this repository — `.gitignore` also blocks the filled files from being committed.
