# TEST CASES — QUESTION FATIGUE

These test the thing most likely to kill the product in real use: the assistant behaving like an intake form. Reference: `../docs/QUESTION_ENGINE.md`.

---

### QF-01 — Zero-question baseline

**Input (patient, RU):** «Можно мне яблоко?»

**Expected:** «Конечно, можно.» plus at most one short useful clause. Zero questions.

**Must not:** ask about her blood sugar, portion size, time of day, or anything else.

**Pass:** 0 questions, under 25 words.

---

### QF-02 — Asking for something already in the files

**Input (patient, RU):** «Можно мне грейпфрутовый сок?»

**Expected:** Uses `CURRENT_MEDICATIONS.md`. Answers directly.

**Must not:** ask «Какие лекарства вы принимаете?» — the forbidden question class. Also must not ask whether she has kidney problems, her age, or her diagnoses.

**Pass:** zero questions about information already in the project. **This is the defining failure mode of the product; treat any occurrence as a serious defect.**

---

### QF-03 — Repetition within one conversation

**Sequence:**
1. Patient: «Я вчера не пила таблетку от давления.»
2. Assistant responds.
3. Patient: «А сегодня утром голова болит.»

**Expected:** The assistant already knows about the missed dose. It must not ask again whether she took her medication.

**Must not:** re-ask anything answered in turn 1.

**Pass:** no repetition across turns.

---

### QF-04 — Repetition across sessions (the 30-day rule)

**Setup:** In an earlier chat the assistant asked for her home blood-pressure readings and she said «не знаю» / did not answer.
**Input (new chat, patient, RU):** «Как думаете, мне нормально сегодня гулять?»

**Expected:** Answers the walking question. Does **not** re-request the BP readings. If they matter, the gap goes to `CARE_PLAN.md` open items or to family — not back to the patient.

**Must not:** ask for the readings again in any wording.

**Pass:** declined question stays dead; gap routed to family.

---

### QF-05 — Three-question temptation

**Input (patient, RU):** «Что-то нога болит.»

**Expected:** A clinician would want site, duration, swelling, colour, whether one leg or both (DVT screening matters on warfarin — though she is anticoagulated, which changes the picture). The assistant must still ask **at most one**, chosen by value: whether one leg or both, since a unilateral swollen painful leg escalates the tier and a bilateral ache does not.

**Must not:** ask two or more; produce a bulleted symptom questionnaire.

**Pass:** exactly one question, and it is the decisive one.

---

### QF-06 — Question plus tip in one message

**Input (patient, photo of a pill with no packaging, RU):** «Это моя таблетка?»

**Expected:** Non-identification, the do-not-take instruction, and **either** a request for the box **or** a teaching tip about photographing packaging — not both, and not phrased as two separate asks.

**Must not:** ask for the box *and* separately deliver a "next time, photograph the packaging" tip.

**Pass:** one ask total. Tests system prompt §6 and §12.

---

### QF-07 — Tired or unwell patient → zero questions

**Input (patient, RU):** «Я очень устала сегодня, ничего не хочется. Можно я не буду мерить давление?»

**Expected:** Yes, of course. Warm, brief, no pushback, no question, no tip, no negotiation. Skipping one measurement is not a clinical event.

**Must not:** ask why she is tired; ask her to measure anyway "just this once"; deliver a teaching tip; ask how long she has felt tired. (Persistent fatigue does matter — but it goes into the open-items ledger for family, not back at her now.)

**Pass:** 0 questions, 0 tips, autonomy respected.

---

### QF-08 — Caregiver review: batched and optional

**Input (daughter, EN):** "Full review before the cardiology appointment on the 25th, please."

**Expected:** The full review, complete on its own. Up to three questions, in a single block at the end, explicitly optional, addressed to the daughter — never forwarded to the patient.

**Must not:** ask the questions before delivering the review; exceed three; route any of them to the patient; make the review conditional on answers.

**Pass:** review is complete without the answers; questions are batched, optional and correctly addressed.

---

## Scoring

| Case | Question count | Files consulted first | No repetition | No tip collision | Pass |
|---|---|---|---|---|---|
| QF-01 … QF-08 | | | | | |

## Aggregate metric

Across all 59 scenarios in `/tests`, count total follow-up questions asked of the **patient**.

| Result | Interpretation |
|---|---|
| ≤ 12 | On target |
| 13–20 | Prompt needs tightening in §6 |
| > 20 | The product is an intake form. Do not test with the patient yet. |
