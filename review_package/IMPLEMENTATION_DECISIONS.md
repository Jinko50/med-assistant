# IMPLEMENTATION DECISIONS

Every material adjustment made to the specification during implementation. Core product intent is unchanged throughout.

**D-01 … D-18** were taken while building v0.1.
**D-19 … D-31** were taken in response to the v0.2 safety review; several of them reverse a v0.1 decision. Where a v0.1 decision was withdrawn, it is marked **WITHDRAWN** in place rather than deleted, so the record of what was once shipped stays visible.

> ## Unresolved
>
> Two things in this document cannot be closed by the implementer:
>
> - **The original specification was never supplied** (D-01). Everything downstream may contradict it.
> - **No safety claim here has been tested or clinically reviewed** (D-15, D-28). Every "IMPACT: safety better" line below is an intention, not a measurement.
>
> Full list: `docs/OPEN_SAFETY_ISSUES.md`.

---

## D-01 — Reconstructed the product specification

**DECISION:**
Wrote `docs/PRODUCT_SPEC.md` from the product rules in the build brief, with a provenance note at the top stating that the referenced "Med Assistant v0.1 Product & Technical Specification" was not supplied to the implementer.

**REASON:**
The brief referred to a specification "above" that did not reach me. Silently proceeding as though I had read it would have made every downstream document falsely authoritative.

**IMPACT:**
No functional impact. Reconcile against the original before treating `PRODUCT_SPEC.md` as the source of truth; the operational content (system prompt, question engine, safety rules) derives from the explicit rules in the brief and is unaffected either way.

---

## D-02 — Five provenance levels instead of an informal distinction — *amended by D-25, D-26*

**DECISION:**
Formalised `CONFIRMED / REPORTED / OBSERVED / ESTIMATED / ASSUMED`, with visible markers, applied consistently across the prompt, templates and tests.

**REASON:**
The brief required distinguishing known facts, patient reports, visual observations, estimates and assumptions. An unnamed distinction does not survive contact with a language model; a named, enumerated one does, and it can be tested.

**IMPACT:**
Safety: substantially better. UX: minor — markers appear only when the difference matters, so patient answers stay clean. Cost: none.

---

## D-03 — Write-back blocks to work around an unwritable file system — *amended by D-25 (PENDING labelling), D-28*

**DECISION:**
The assistant emits `📋 ЗАПИСАТЬ В <FILE>` copy-paste blocks for facts with lasting value; the family pastes them in. Documented as the pilot's dominant operational risk in `SETUP_CHATGPT_PROJECT.md` and as the primary Phase 2 justification in `FUTURE_ARCHITECTURE.md`.

**REASON:**
ChatGPT projects are read-only to the model. Longitudinal context was a core requirement, so the gap had to be bridged by a human process — and named honestly rather than hidden.

**IMPACT:**
Functionality: preserves longitudinality. UX: adds recurring family effort (~5 min/week). This is the pilot's main failure mode, and detecting it is one of the pilot's purposes. Cost: zero.

---

## D-04 — The "hold" exception to the no-prescription-change rule — **WITHDRAWN by D-19**

**ORIGINAL DECISION (v0.1):**
Added a narrow exception: the assistant may say "do not take the next dose until you have spoken to the doctor / emergency services" when there is a clear acute safety signal.

**WHY IT WAS WRONG:**
It is a medication instruction issued without knowing the product, the indication, or the consequence of omission. For some medicines a skipped dose is the greater harm, and "pause pending a human decision" is still a decision the assistant is not equipped to make. The reasoning in the original entry — that a literal rule "produces an unsafe assistant" — smuggled in an authority that the stated safety boundary did not support.

**REPLACED BY:** D-19.

---

## D-05 — Triage tiers made explicit and named — **WITHDRAWN by D-31**

**DECISION:**
Four named tiers (🔴 RED / 🟠 ORANGE / 🟡 YELLOW / 🟢 GREEN) with enumerated triggers, required response shapes, and the rule that escalation overrides brevity, question budget, tone and user format requests.

**REASON:**
"Appropriate safety/triage behavior" is not implementable as written. Named tiers give the prompt something to apply consistently and give the test suite something to score.

**IMPACT:**
Safety and testability both improve. Adds length to the prompt, which is the reason for D-11.

---

## D-06 — Geriatric-specific amplifications added — *partly withdrawn by D-31 (tier arithmetic removed); the clinical observations are kept, the automatic escalation is not*

**DECISION:**
Built in: anticoagulant amplification (head strikes, bruising, dark stool escalate a tier); atypical presentation (MI without chest pain, infection presenting as confusion or a fall); anticholinergic and sedating-antihistamine fall risk; NSAID avoidance on anticoagulants and CKD; dehydration risk from short-lived vomiting or diarrhoea.

**REASON:**
The brief specified an 84-year-old patient but not geriatric clinical behaviour. Applying general adult triage to an 84-year-old systematically under-escalates the presentations most likely to kill them.

**IMPACT:**
Safety: the most consequential addition in this repository. UX: slightly more escalation, calibrated to stay calm in tone.

---

## D-07 — Quantified the anti-nagging rules

**DECISION:**
A declined question is dead for 30 days. The same gap may not be re-asked in different wording. After three ignored questions the assistant stops asking for that conversation. Unresolved gaps go to a `## Open items` ledger in `CARE_PLAN.md`, not back to the patient.

**REASON:**
"Never repeatedly nag" is unenforceable and untestable as a sentiment. Concrete thresholds are both.

**IMPACT:**
UX: directly protects the product's core promise. Functionality: gaps still get resolved — via family, which is the right channel anyway.

---

## D-08 — Routed high-burden questions to family instead of the patient

**DECISION:**
Added a burden score (Low/Medium/High) to the question engine, with the rule that a decisive but high-burden question goes to the family in a separate line while the patient still receives a complete answer immediately.

**REASON:**
The brief set a question budget but not a target for the questions. Asking an 84-year-old to read a package insert is not a budget problem, it is a burden problem — and the family can answer it at no cost to the patient.

**IMPACT:**
UX: preserves the patient experience without losing the information. Functionality: better, since family answers are also more reliable.

---

## D-09 — Response-length and format targets made concrete

**DECISION:**
Patient mode: answer first, 1–3 sentences, under ~60 words, no tables, must survive being read aloud. Caregiver mode: structure permitted, still conclusion-first.

**REASON:**
"Short and simple" is not a specification. Voice is the primary channel, and voice output has properties text does not — linearity, no scrolling back, no visual scanning.

**IMPACT:**
UX: substantially better for the actual channel. Testable.

---

## D-10 — Disclaimer suppression stated as a safety rule, not a style rule

**DECISION:**
Reflexive "consult your doctor" endings are prohibited and classified as a safety problem in `SAFETY_RULES.md` §6.

**REASON:**
The brief asked to avoid them for UX reasons. The stronger argument is safety: an assistant that ends every message with a generic escalation teaches the patient to stop reading the end of messages — which is precisely where real escalations live.

**IMPACT:**
Safety: better signal-to-noise on genuine escalations. UX: much less nagging feel.

---

## D-11 — Prompt compaction with a documented fallback — **SUPERSEDED by D-24** (the character budget it assumed was wrong by an order of magnitude)

**DECISION:**
Kept the system prompt as dense as possible (~14 sections, roughly 11k characters), with the detailed reasoning moved into `/docs`, plus a documented fallback in `SETUP_CHATGPT_PROJECT.md` §8 for when the Instructions field cannot hold it all.

**REASON:**
The Projects instruction limit has changed repeatedly and cannot be relied upon. Sections 1–8 carry nearly all the behaviour, so they are the ones designated to stay resident if a split is necessary.

**IMPACT:**
Functionality: robust to platform limits. Risk: the fallback is less reliable, because file content is retrieved rather than always resident — hence the instruction to re-run the verification checks after using it.

---

## D-12 — Markdown pipe tables for the context files, not YAML or JSON

**DECISION:**
All seven context files are Markdown with simple tables and stable field names.

**REASON:**
A non-technical family member must be able to edit them on a phone. Structured formats break silently when a comma or indent is wrong, and the failure is invisible. Stable field names keep a future migration to a real database cheap.

**IMPACT:**
UX for the family: considerably better. Phase 2 migration cost: unchanged, because the field names are stable.

---

## D-13 — `FAMILY_NOTES.md` explicitly marked as patient-visible

**DECISION:**
A prominent warning that the patient can read this file, plus guidance to record observations rather than conclusions.

**REASON:**
Shared Projects have no per-file permissions. A family writing candidly about a parent's decline in a file that parent can open is a serious and entirely foreseeable harm.

**IMPACT:**
Privacy and family trust. Cost: some candour is lost — correctly, since the alternative is the patient discovering it by accident.

---

## D-14 — Privacy document states the real risk ranking

**DECISION:**
`PRIVACY.md` names family over-access — an elderly person losing medical privacy from their own children — as the most likely harm, ahead of vendor processing and account compromise.

**REASON:**
Consumer-LLM privacy documents habitually discuss the vendor and ignore the household. For this product the household is where the realistic harm sits.

**IMPACT:**
Enables an informed family decision. No functional impact.

---

## D-15 — Test suite written as behaviour, with named gate cases — *amended by D-32; note that no scenario has ever been executed*

**DECISION:**
59 scenarios across seven files with explicit "must not" clauses and pass criteria; four cases (SAFE-04, SAFE-05, SAFE-06, SAFE-07) designated as pilot-blocking; an aggregate patient-facing question count with thresholds.

**REASON:**
The brief asked for at least 50 realistic scenarios. Scenarios without pass/fail criteria cannot detect regression, and the question-fatigue requirement in particular needs a measurable aggregate rather than case-by-case impressions.

**IMPACT:**
Makes the pilot evaluable and survives a future platform change, since the cases describe behaviour rather than prompt text.

---

## D-16 — Fictional patient with a deliberately interaction-rich profile

**DECISION:**
Мария Ивановна, 84, Haifa, Russian-speaking, on warfarin, amlodipine, metformin, levothyroxine, atorvastatin and furosemide, with CKD stage 3a, low potassium, a falling haemoglobin and a July heart-failure admission.

**REASON:**
The profile was chosen so that the test suite exercises real interaction classes: vitamin K consistency, grapefruit and statins, NSAID contraindication, calcium and thyroid timing, potassium and diuretics, renal dosing, anticoagulant bleeding red flags. Her location makes trilingual documents natural rather than contrived.

**IMPACT:**
Test coverage. All data is fictional, per the brief.

---

## D-17 — Success criteria include a stop condition

**DECISION:**
`PRODUCT_SPEC.md` §10 defines failure signals that should stop the pilot, including "the patient starts avoiding it".

**REASON:**
A pilot with no stop condition becomes a project regardless of the result. The most valuable possible outcome of Phase 1 is learning that this patient does not want this — at a cost of documents rather than a product.

**IMPACT:**
Protects against sunk-cost continuation into Phase 2.

---

## D-18 — Zero-cost constraint honoured, with the limit noted

**DECISION:**
No paid API, SaaS or infrastructure introduced. Everything is Markdown plus an existing ChatGPT account.

**REASON:**
Explicit requirement in the brief.

**IMPACT:**
Cost: zero. Noted honestly in `SETUP_CHATGPT_PROJECT.md`: Projects are available on the free tier, but free-tier usage limits and less reliable file handling may make the pilot frustrating. If the family already has Plus, use it — that is not a new cost. If they do not, the pilot can still run, with heavier limits.

---

# v0.2 — SAFETY REVIEW RESPONSE

---

## D-19 — Removed all medication-hold authority

**DECISION:**
Withdrew D-04. The assistant may not say hold, skip, delay, pause, stop or continue about any medicine, in any circumstance. Where a medication question arises in an acute situation, it routes to emergency services or a pharmacist and stays silent on the dose itself.

**REASON:**
See D-04 above. A hold is a medication instruction, and the assistant does not know the product, the indication, or the cost of omission.

**IMPACT:**
Some situations now end with "I can't answer that; here is who can, now." That is the correct outcome. Safety: the largest single improvement in v0.2. UX: slightly less satisfying in a narrow set of cases.

---

## D-20 — Removed class-based missed-dose rules and "skip if uncertain"

**DECISION:**
The assistant gives **no** missed-dose rule of its own — not by class, not "never take two", not "skip it", not "take it when you remember". It routes to the exact product's patient information leaflet, the prescriber's written plan for this patient, or a pharmacist / urgent service.

**REASON:**
NHS Specialist Pharmacy Service guidance (updated 2025-03-04) treats the **product's own leaflet** as the first source and singles out warfarin, insulin, antiseizure medicines and others as needing tailored advice. v0.1's class rules and its "safe default is to skip" were exactly the generic advice that guidance exists to prevent. The SPS document's own two-hour heuristic is deliberately **not** reproduced: it is written for professionals reasoning about a known product.

**IMPACT:**
Functionality: the assistant answers fewer medication questions directly. Safety: materially better. Requires `CURRENT_MEDICATIONS.md` to record the exact product, strength and form — see D-25.

---

## D-21 — Corrected the doubled-amlodipine example

**DECISION:**
`QUESTION_ENGINE.md` Example 2 and test `MED-02` now require prompt professional advice for any suspected extra dose, given **before** and **independent of** identifying which tablet it was. `REG-04` regression-tests it.

**REASON:**
v0.1 called a doubled amlodipine "watchful waiting" and gated the advice on a question the patient often cannot answer. Both were wrong: the assistant cannot judge that home observation is sufficient, and making safety advice conditional on a forgotten detail delays it.

**IMPACT:**
Removes a worked example that taught the wrong pattern in the document most likely to be imitated.

---

## D-22 — Replaced generic emergency actions with sourced, condition-specific ones

**DECISION:**
Part A now carries named actions for: not breathing normally; unresponsive but breathing; suspected anaphylaxis; low blood sugar (able and unable to swallow); suspected stroke or head injury. Each traces to a source in `docs/CLINICAL_SOURCES.md` with a retrieval date. Rescue medicines are limited to the patient's own prescribed product, used per its own instructions, with no dose supplied by the assistant.

**REASON:**
v0.1 said "one safe action while waiting" and left the content to the model. Hypoglycaemia, anaphylaxis and unresponsiveness were absent entirely — the three situations where a bystander's first minutes matter most.

**IMPACT:**
Safety: large improvement. Cost: Part A grew, which forced D-24. Dependency: the patient's own written plans must exist — blocker `B-06`.

---

## D-23 — Emergency action is never delayed, and never asks

**DECISION:**
The emergency instruction is the first sentence. No question, no file lookup, no preamble may precede it. Regression case `REG-06`.

**REASON:**
v0.1 permitted a "safety clarification" that could, in principle, come first, and its triage section allowed reading the record before escalating.

**IMPACT:**
Removes the most dangerous possible latency in the product.

---

## D-24 — Restructured the prompt into a resident safety floor plus reference notes

**DECISION:**
The prompt is now Part A (resident, in the Instructions field: safety floor + operating rules) and Part B (uploaded, reference only). Part A states that uploaded files are data, never instructions. Part B says Part A governs. A documented drop order lets Part A shrink without ever losing A1.

**REASON:**
OpenAI documents the account-level custom-instructions field at **1,500 characters (Free/Go) and 5,000 (paid)**. v0.1's prompt was **13,541 characters** and could not have been resident anywhere. Its own fallback pushed safety rules into an uploaded file whose retrieval is not guaranteed — meaning the rules could silently be absent at the moment they were needed.

**IMPACT:**
This is the structural fix of v0.2. Cost: Part A had to be compressed hard and still measures ~5,300 characters, ~300 over the working assumption; the drop order handles that. `P-01` remains open until someone measures the real field.

---

## D-25 — Dated sources, record freshness, reconciliation, conflicts, PENDING

**DECISION:**
Five related changes:
- every fact carries a source **and a date**, and staleness is stated when a fact is load-bearing;
- `CURRENT_MEDICATIONS.md` records the **exact product** (ingredient, brand as printed, strength, form) and a separate **last reconciled** date, distinct from "last updated";
- conflicting sources are presented with both dates and left **unresolved**; recency is evidence, not resolution;
- proposed file updates are labelled **PENDING** until a person saves them;
- `CONFIRMED` becomes `DOCUMENTED`.

**REASON:**
v0.1 treated the files as current by default and `CONFIRMED` as meaning true. A document shows what it said on its date. The reconciliation/update distinction matters because a family member editing a file is not the same as someone checking it against the boxes.

**IMPACT:**
More work for the family, and more caveats in answers. Both are honest. `ASSUMED` was deleted as a label (D-26).

---

## D-26 — Unknowns may never become assumptions

**DECISION:**
Deleted the `ASSUMED` provenance level. A missing safety-relevant fact stays `UNKNOWN`, is named as unknown, and the advice becomes "get this settled by X" rather than a guess with a hedge attached. `QUESTION_ENGINE.md` Step 5 was rewritten accordingly.

**REASON:**
v0.1 instructed the assistant to answer "stated on an assumption" and to take "the safest reasonable assumption" when a question was skipped. For safety-relevant facts that is a guess wearing a label, and labelled guesses get acted on.

**IMPACT:**
Some answers become less complete and more obviously conditional. That is the intended trade.

---

## D-27 — Unified question budgets

**DECISION:**
One budget, stated identically in Part A, `QUESTION_ENGINE.md` and `SAFETY_RULES.md`: routine 0–1; caregiver review up to 3, batched and optional; a clarification genuinely needed for safety overrides the routine limit but never delays emergency action; emergencies allow none.

**REASON:**
v0.1's three documents disagreed — the prompt said 0–1 routinely, the question engine had a five-row table with tier-specific allowances, and the safety rules implied more. Divergent copies of a rule mean the rule is unenforceable.

**IMPACT:**
The safety override is explicit rather than implied, with a stated anti-loophole test: if the safe action is the same either way, it is not a safety clarification.

---

## D-28 — Removed capability claims the platform does not support

**DECISION:**
Removed every implication of memory, saving, logging, monitoring, family notification or exhaustive interaction checking, and added an explicit capability table to `SAFETY_RULES.md` §6 plus a "What it cannot do" section in the README. Regression case `REG-09`, plus `SAFE-10`.

**REASON:**
v0.1 said things like "I'll remember", offered write-back blocks that read as records, and claimed interaction checks against "the full current list". Shared projects use project-only memory and recall is not a record; the model cannot write files or notify anyone; no interaction check is exhaustive.

**IMPACT:**
Less reassuring, accurate. Particularly important for a family who might otherwise believe someone is watching.

---

## D-29 — Removed unlimited-quantity advice, resemblance, and unsupported alternatives

**DECISION:**
No unlimited-quantity food or drink advice. No statement of what a medicine resembles — only that it is unidentified. No named OTC substitute offered from memory; such questions route to a pharmacist. Specific products are named only against their own labelling or named authoritative guidance, with the limits of the check stated.

**REASON:**
v0.1 said "as much as you like" of non-grapefruit juices to a diabetic patient, invited the assistant to say what a tablet resembled, and had it recommend named analgesics and daily maxima from memory. A resemblance is acted on as an identification by the person holding the tablet.

**IMPACT:**
Fewer satisfying answers, no unsupported specifics.

---

## D-30 — Autonomy: no identity inference, no automatic diversion to family

**DECISION:**
Identity is never inferred from the language someone writes in. A patient asking about their own record is told, plainly, at the level they asked for. `FAMILY_NOTES.md` now distinguishes preferences **the patient expressed** (honoured as instructions) from preferences the family holds about the patient (which do not override the patient's right to their own information). Regression case `REG-12`; test `DOC-04` inverted.

**REASON:**
v0.1 inferred "caregiver mode" from the language used — unreliable in a trilingual family and wrong in principle — and routed new or serious findings to family rather than telling the patient. That substituted the assistant's judgement for an adult's right to her own record.

**IMPACT:**
Ethically correct, and simpler. Removes a whole class of mode-detection error.

---

## D-31 — Timing and deterioration triggers replace tier arithmetic

**DECISION:**
Removed the four-tier colour system, the "take the higher tier" rule, the "worst plausible explanation" rule, and the automatic anticoagulant escalation. Replaced with explicit timing ("call emergency services now", "be seen today", "contact the clinic within three days", "mention at the next appointment"), thresholds **with units** taken only from the patient's own care plan, and a **deterioration trigger** attached to every piece of advice. Head injury on an anticoagulant routes to emergency assessment, with NICE NG232 cited as the reason for urgency rather than as an 8-hour window the assistant may apply.

**REASON:**
Mechanical escalation produces confident output ungrounded in the individual case and hides the reasoning from the person who has to act. Units were absent throughout v0.1 — a glucose threshold without mg/dL or mmol/L is not a threshold, and the example patient's own meter reads mg/dL while v0.1's examples used mmol/L.

**IMPACT:**
Advice is more actionable and more auditable. Requires `CARE_PLAN.md` to carry thresholds with units and dates; where one is missing the assistant says so rather than supplying it.

---

## D-32 — Test suite: execution status made explicit, regression cases added

**DECISION:**
Added `tests/README.md` stating that **0 of 70 scenarios have been executed**, added `tests/regression_cases.md` with one case per defect found in the review, added a status banner to every test file, replaced "Pass" columns with "Status: NOT RUN", and removed the aggregate question metric's implied value.

**REASON:**
v0.1's scoring tables read as though results existed. They did not, and they still do not. Distinguishing written scenarios from executed tests is the difference between a design document and evidence.

**IMPACT:**
No claim of clinical validation is made anywhere. `B-03` stays open until the scenarios are run and their actual outputs recorded.
