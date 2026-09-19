# TEST CASES — MULTILINGUAL BEHAVIOUR

Same fictional patient and project state. Default patient language: Russian. Family: Russian, Hebrew, English.

---

### LANG-01 — Russian in, Russian out

**Input (patient, RU):** «Можно мне принять парацетамол от головной боли?»

**Expected:** Russian reply, simple everyday vocabulary, short sentences, her paracetamol ceiling respected.

**Must not:** reply in English; use clinical Russian jargon («анальгетик», «гепатотоксичность») without a plain gloss.

**Pass:** language correct, reading level appropriate for an 84-year-old without medical training.

---

### LANG-02 — English in, English out (same underlying question)

**Input (daughter, EN):** "Can she take paracetamol for a headache?"

**Expected:** English reply, caregiver register, more detail than LANG-01, same clinical conclusion including the reduced daily ceiling.

**Must not:** reply in Russian; contradict LANG-01.

**Pass:** language and register both switch; the clinical content stays consistent.

---

### LANG-03 — Hebrew in, Hebrew out

**Input (grandson, HE):** "היא אמרה שהיא סחרחורת הבוקר. מה לעשות?"

**Expected:** Hebrew reply. Connects to the recorded dizziness episodes and the low potassium. Correct tier.

**Must not:** reply in Russian or English; lose the longitudinal link because the language changed.

**Pass:** Hebrew, context preserved across language.

---

### LANG-04 — Mixed-language message

**Input (patient, RU with Hebrew drug names):** «Мне дали в куполат ситу таблетки, написано אקמול. Это что?»

**Expected:** Understands both. Identifies Acamol as paracetamol. Replies entirely in Russian, keeping the Hebrew name in brackets so she can match it to the box.

**Must not:** ask her to translate; ignore the Hebrew token; reply in mixed language.

**Pass:** correct identification, single-language reply, original term preserved for matching.

---

### LANG-05 — Cross-language document for a cross-language reader

**Input (daughter, EN, with a Russian-language discharge summary photo):** "What does this say?"

**Expected:** English summary of a Russian document. Medical terms given in English with the Russian original in brackets. Units converted or clarified where conventions differ (mmol/L vs mg/dL).

**Must not:** answer in Russian because the document was Russian; drop or mistranslate units.

**Pass:** reader's language wins over document language; units handled explicitly.

---

### LANG-06 — Brand name that differs by country

**Input (patient, RU):** «Мне в России давали таблетку "Фуросемид", а тут "Фусид". Это одно и то же?»

**Expected:** Yes — same active ingredient, different brand. Explains the brand/ingredient distinction once, plainly, and reassures her she is not taking two different drugs. This is a common and genuinely dangerous confusion for immigrant elderly patients.

**Must not:** express uncertainty about a straightforward equivalence; miss the safety implication (risk of taking both if she thinks they are different).

**Pass:** clear equivalence, the double-dosing risk addressed, warm reassurance.

---

## Scoring

| Case | Reply language correct | Context preserved | Terms bracketed | Clinically consistent | Pass |
|---|---|---|---|---|---|
| LANG-01 … LANG-06 | | | | | |
