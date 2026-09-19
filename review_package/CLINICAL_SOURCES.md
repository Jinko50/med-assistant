# CLINICAL SOURCES

Every clinical instruction that appears in `SAFETY_RULES.md` or in Part A of the system prompt traces to a source here. Anything without a source here should not be in those documents.

**All retrieved 2026-09-19.** Guidance changes; re-check before the pilot starts and at least every six months during it.

> **These sources were read by the implementer, not by a clinician.** Their selection, interpretation and application to this patient have not been reviewed by any qualified person. That review is a blocker — see `OPEN_SAFETY_ISSUES.md`.

---

## Resuscitation and unresponsiveness

**Resuscitation Council UK — Adult Basic Life Support, 2025 Guidelines**
https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines

Used for: the unresponsive and cardiac-arrest actions.

Key points relied on, quoted from the guideline:

- **"If any person is unresponsive with abnormal breathing, cardiac arrest should be assumed."** Both conditions are required. "Not breathing normally" on its own is **not** the criterion.
- **"Slow, laboured breathing, as well as other abnormal patterns such as agonal gasping or panting, must be recognised as signs of cardiac arrest."**
- Call first, then assess: **"Call 999 without delay. Assess breathing while you wait for the call to be answered."** And: **"If you have a mobile phone, activate the speaker function and call 999 without delay."**
- The dispatcher is part of the pathway: call handlers **"provide CPR instructions to all callers"**, assume the caller cannot perform CPR, and give chest-compression-only instructions; **"the ambulance service call handler will assist you"** if the caller is unsure whether breathing is normal.
- Untrained rescuers give continuous chest compressions; trained rescuers alternate 30 compressions with 2 rescue breaths. Anyone may use an AED; no training is needed.
- Became the UK first-aid training standard in January 2026.

**Not covered by this guideline:** management of a person who is unresponsive but breathing normally. The 2025 BLS document addresses cardiac-arrest recognition and response. The side-positioning instruction used in `SAFETY_RULES.md` is general first-aid practice, not a quotation from this source, and is flagged for clinician confirmation.

**Note on jurisdiction:** UK guidance. The pilot patient in the test material is in Israel. Resuscitation guidance is broadly harmonised through ILCOR, but the **emergency number, the local ambulance service's own pre-arrival instructions, and any national variation must be confirmed locally** and recorded in `PATIENT_PROFILE.md`. Emergency dispatchers give live instructions; those override anything written here.

## Anaphylaxis

**Resuscitation Council UK — Guidance: Anaphylaxis**
https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis

Used for: the anaphylaxis holding actions and the auto-injector rule.

Key points relied on: recognition via an ABCDE approach with early call for help; intramuscular adrenaline is the first-line treatment; repeat IM doses after 5 minutes if symptoms do not resolve; an auto-injector prescribed for a named person may be administered by anyone competent to do so, **but only to the person it was prescribed for**.

**What the assistant is NOT permitted to do with this:** supply a dose, choose a device, decide on a repeat, or advise use of a device belonging to someone else. Repeat dosing follows the patient's own plan and the device's own instructions.

## Hypoglycaemia

**Diabetes UK — Hypos (signs, symptoms and treatment)**
https://www.diabetes.org.uk/about-diabetes/looking-after-diabetes/complications/hypos

**Joint British Diabetes Societies — Algorithm for the Management of Hypoglycaemia in Adults** (March 2022)
https://www.diabetes.org.uk/sites/default/files/2022-03/JBDS_Hypo_Algorithm%20March%202022.pdf

Used for: the conscious and unconscious hypoglycaemia actions.

Key points relied on: treat with 15–20 g of fast-acting carbohydrate; wait 10–15 minutes and re-test, aiming above 4 mmol/L; repeat if still low; follow with 15–20 g of longer-acting carbohydrate or the next meal. If unconscious, having a seizure, or unable to swallow: nothing by mouth, call an ambulance, glucagon only from someone able to give it; call an ambulance if there is no glucagon or no recovery ~10 minutes after it.

**Units warning.** Diabetes UK uses **mmol/L** (treat below 4 mmol/L). US guidance uses **mg/dL** (treat below 70 mg/dL). Meters in Israel commonly read **mg/dL**. The assistant must use the units and thresholds recorded for this patient, not a remembered figure. See `SAFETY_RULES.md` §2.4.

## Head injury on anticoagulants

**NICE NG232 — Head injury: assessment and early management**
https://www.nice.org.uk/guidance/ng232/chapter/recommendations

Used for: head-injury routing in an anticoagulated patient.

Key point relied on: for people on anticoagulant treatment (vitamin K antagonists, DOACs, heparins) or antiplatelet treatment **excluding aspirin monotherapy**, with no other indication for a scan, **consider** CT head within 8 hours of injury — or within the hour if they present more than 8 hours after it.

**How it is used here:** as the reason emergency assessment is urgent. It is **not** a threshold the assistant applies, **not** permission to wait up to 8 hours, and **not** a risk assessment the assistant performs. The imaging decision belongs to the emergency department.

**Jurisdiction:** NICE is England/Wales guidance. Local protocol governs and must be confirmed.

## Missed and delayed doses

**NHS Specialist Pharmacy Service — Advising on missed or delayed doses of medicines** (last updated 4 March 2025)
https://sps.nhs.uk/articles/advising-on-missed-or-delayed-doses-of-medicines/

Used for: §3.3 of `SAFETY_RULES.md`, and for withdrawing v0.1's class-based rules.

Key points relied on: the **patient information leaflet for the specific product** is the first source for missed-dose advice, available via the product leaflet, the electronic Medicines Compendium, the MHRA site or the manufacturer; never take a double dose to make up for a missed one unless a prescriber says so; several classes — **antiseizure medicines, oral contraceptives, Parkinson's medicines, insulin, methotrexate, warfarin, immunosuppressants, cancer medicines** — need tailored advice; refer to a pharmacist, doctor, or specialist nurse or clinic when in doubt.

**How it is used here:** as authority for routing to the product leaflet, the prescriber's plan, or a pharmacist — **not** as a rule set for the assistant to apply itself. The document's general two-hour heuristic is deliberately **not** reproduced in the prompt: it is written for healthcare professionals exercising judgement about a known product, which is precisely the position the assistant is not in.

## OpenAI platform documentation

**ChatGPT Custom Instructions — OpenAI Help Center**
https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
Character limits: 1,500 (Free/Go), 5,000 (Plus/Pro/Business/Enterprise/Edu), as reported 2026-09-19.

**This is the account-level Custom Instructions field, NOT the project Instructions field.** These figures must not be used to infer the project field capacity; see the note below.

**Projects in ChatGPT — OpenAI Help Center**
https://help.openai.com/en/articles/10169521-projects-in-chatgpt
*(Direct fetch returned HTTP 403 on 2026-09-19; the points below come from the indexed summary of that page and should be re-verified in a browser.)*

Relied on for: projects hold chats, files and instructions together; **shared projects are automatically set to project-only memory and cannot be switched to default memory**; with project-only memory chats can reference other conversations in the same project but not outside it; sharing offers two access levels, **chat** (see and use chats, files, instructions) and **edit** (also update instructions, upload or remove files, invite others); availability is subject to plan and workspace settings.

**Not established from OpenAI documentation, and therefore treated as unknown:**
- the character limit of the **project Instructions** field specifically — it is a different field from account-level Custom Instructions, and its capacity must be measured empirically rather than inferred;
- whether uploaded project files are reliably retrieved on every turn;
- whether project memory recalls earlier chats deterministically.

All three are assumed unfavourably in the design: safety rules are resident, nothing safety-critical sits in an uploaded file, and no memory promise is made.

## Sources deliberately NOT used

- Commercial first-aid training blogs and SEO health sites that appeared in searches. They paraphrase the bodies above, sometimes inaccurately.
- The implementer's own recall of clinical content. Everything clinical in v0.2 either traces to a source above or has been removed.
