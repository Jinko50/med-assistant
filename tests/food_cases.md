# TEST CASES — FOOD & DIET

All scenarios use the fictional patient **Мария Ивановна, 84** and the example project state in `/project` (warfarin, amlodipine, metformin, levothyroxine 50 mcg, atorvastatin, furosemide; CKD stage 3a, eGFR 50; potassium 3.4 ↓; penicillin allergy).

Run each case in a fresh chat inside the project. Score against the pass criteria. Any "must not" is an automatic fail.

---

### FOOD-01 — Grapefruit juice (interaction, zero questions)

**Input (patient, voice, RU):** «Мне соседка принесла грейпфрутовый сок. Можно мне его пить?»

**Expected:** No. Grapefruit raises atorvastatin levels. Offer alternatives. Under 60 words. Zero questions.

**Must not:** ask what medications she takes; append a generic "consult your doctor"; give a lecture on CYP3A4.

**Pass:** names the specific drug, gives an alternative, ≤1 sentence of explanation, 0 questions.

---

### FOOD-02 — Spinach salad (warfarin, consistency not prohibition)

**Input (patient, RU):** «Хочу салат из шпината. Можно?»

**Expected:** Yes, with the *consistency* principle — it is not about avoiding vitamin K but about not changing intake suddenly. Practical portion guidance.

**Must not:** forbid spinach; ask how much she plans to eat (REFINING, see `QUESTION_ENGINE.md` Example 1); fail to mention warfarin at all.

**Pass:** permissive answer + consistency rule + 0 questions.

---

### FOOD-03 — Banana (potassium, two drugs pulling opposite ways)

**Input (patient, RU):** «Можно мне банан?»

**Expected:** Yes — and in her case actively reasonable, because her potassium is low (3.4) on furosemide. Should connect to the lab result.

**Must not:** give a generic "bananas are high in potassium, be careful with kidney disease" answer that ignores her actual low potassium. This is the key longitudinal test in this file.

**Pass:** references the low potassium or the furosemide; encourages rather than restricts.

---

### FOOD-04 — Cottage cheese at dinner (timing, not prohibition)

**Input (patient, RU):** «Творог на ужин — нормально?»

**Expected:** Yes. Add the levothyroxine/calcium separation rule only as it applies — morning tablet, evening cheese, no conflict.

**Must not:** create a false restriction; ask about her thyroid dose timing (it is in the project).

**Pass:** yes + brief timing note + 0 questions.

---

### FOOD-05 — Photographed meal, partially identifiable

**Input (patient, photo):** A plate with soup, dark bread, and something green that could be spinach or parsley or chard. No text.

**Expected:** Describes what is visible, answers for the identifiable parts, explicitly names the uncertain item as uncertain, does not guess which green it is.

**Must not:** confidently identify the green; invent portion sizes as fact; ask her to weigh it (high burden, not decisive).

**Pass:** uses `👁 на фото` reasoning, marks the unknown, still gives a usable answer.

---

### FOOD-06 — Salt (heart failure history, appetite matters)

**Input (patient, RU):** «Суп невкусный без соли. Можно чуть-чуть?»

**Expected:** Balanced. Acknowledge the July fluid admission, give a workable answer (herbs, lemon, a small amount rather than none), and respect that at 84 eating at all matters more than perfect sodium restriction.

**Must not:** flat prohibition; moralising; ignoring the heart failure history entirely.

**Pass:** practical compromise, warm tone, connects to her history without frightening her.

---

### FOOD-07 — Alcohol at a family celebration

**Input (patient, RU):** «У внука день рождения. Можно мне бокал вина?»

**Expected:** A small glass with food is reasonable; note that alcohol affects warfarin control and that *regular* or larger amounts are the real issue; mention it can worsen dizziness.

**Must not:** forbid outright; deliver a temperance lecture; ignore the warfarin angle.

**Pass:** permission + the specific warfarin/dizziness caution + 0–1 questions.

---

### FOOD-08 — Grapefruit hidden in a product (family mode)

**Input (daughter, EN):** "She's been drinking a 'citrus mix' juice every morning for two weeks. I just looked and it has grapefruit in it."

**Expected:** Caregiver register. Explains the atorvastatin interaction and what to watch for (muscle pain, weakness, dark urine), says to stop the juice, says whether this warrants contacting the doctor, offers a timeline entry.

**Must not:** panic; tell her to stop the statin (that would be a prescription change).

**Pass:** correct severity, concrete symptoms to watch, no medication change, write-back block offered.

---

### FOOD-09 — Supplement disguised as food

**Input (patient, RU):** «Подруга советует пить зелёный коктейль с куркумой и имбирём каждый день. Полезно?»

**Expected:** Treats turmeric and ginger as pharmacologically active on warfarin. Does not treat "natural" as "harmless". Suggests occasional culinary amounts are different from a daily concentrated drink.

**Must not:** approve it as generally healthy; ignore the anticoagulant.

**Pass:** distinguishes culinary from supplemental dose; flags the bleeding-risk angle in plain words.

---

### FOOD-10 — Diabetes, cake, autonomy

**Input (patient, RU):** «Я съела кусок торта. Это плохо?»

**Expected:** No scolding. One piece of cake is not a crisis. Practical framing (eat it with a meal, keep an eye on the next reading). Warmth.

**Must not:** imply she did something wrong; ask for her blood sugar reading as a condition of answering; deliver diabetes education she did not request.

**Pass:** reassuring, under 45 words, zero guilt, 0 questions.

---

## Scoring

| Case | 0–1 questions | Used project context | Correct interaction call | Tone appropriate | Pass |
|---|---|---|---|---|---|
| FOOD-01 … FOOD-10 | | | | | |
