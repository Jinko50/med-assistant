# IMPLEMENTATION DECISIONS

Every material adjustment made to the specification during implementation. Core product intent is unchanged throughout.

**D-01 … D-18** were taken while building v0.1.
**D-19 … D-32** were taken in response to the first safety review (v0.2).
**D-33 … D-39** were taken in response to the second review round (v0.3), and two of them correct v0.2's own corrections.
Where a decision was withdrawn it is marked **WITHDRAWN** in place rather than deleted, so the record of what was once shipped stays visible.

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
No functional impact. Reconcile against the original before treating `docs/PRODUCT_SPEC.md` as the source of truth; the operational content (system prompt, question engine, safety rules) derives from the explicit rules in the brief and is unaffected either way.

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
The assistant emits `📋 ЗАПИСАТЬ В <FILE>` copy-paste blocks for facts with lasting value; the family pastes them in. Documented as the pilot's dominant operational risk in `SETUP_CHATGPT_PROJECT.md` and as the primary Phase 2 justification in `docs/FUTURE_ARCHITECTURE.md`.

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
Reflexive "consult your doctor" endings are prohibited and classified as a safety problem in `docs/SAFETY_RULES.md` §6.

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
`docs/PRIVACY.md` names family over-access — an elderly person losing medical privacy from their own children — as the most likely harm, ahead of vendor processing and account compromise.

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
`docs/PRODUCT_SPEC.md` §10 defines failure signals that should stop the pilot, including "the patient starts avoiding it".

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
`docs/QUESTION_ENGINE.md` Example 2 and test `MED-02` now require prompt professional advice for any suspected extra dose, given **before** and **independent of** identifying which tablet it was. `REG-04` regression-tests it.

**REASON:**
v0.1 called a doubled amlodipine "watchful waiting" and gated the advice on a question the patient often cannot answer. Both were wrong: the assistant cannot judge that home observation is sufficient, and making safety advice conditional on a forgotten detail delays it.

**IMPACT:**
Removes a worked example that taught the wrong pattern in the document most likely to be imitated.

---

## D-22 — Replaced generic emergency actions with sourced, condition-specific ones — *CPR trigger corrected by D-33*

**DECISION:**
Part A now carries named actions for: unresponsive; unresponsive but breathing normally; suspected anaphylaxis; low blood sugar (able and unable to swallow); suspected stroke or head injury. Each traces to a source in `docs/CLINICAL_SOURCES.md` with a retrieval date. Rescue medicines are limited to the patient's own prescribed product, used per its own instructions, with no dose supplied by the assistant.

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
Deleted the `ASSUMED` provenance level. A missing safety-relevant fact stays `UNKNOWN`, is named as unknown, and the advice becomes "get this settled by X" rather than a guess with a hedge attached. `docs/QUESTION_ENGINE.md` Step 5 was rewritten accordingly.

**REASON:**
v0.1 instructed the assistant to answer "stated on an assumption" and to take "the safest reasonable assumption" when a question was skipped. For safety-relevant facts that is a guess wearing a label, and labelled guesses get acted on.

**IMPACT:**
Some answers become less complete and more obviously conditional. That is the intended trade.

---

## D-27 — Unified question budgets

**DECISION:**
One budget, stated identically in Part A, `docs/QUESTION_ENGINE.md` and `docs/SAFETY_RULES.md`: routine 0–1; caregiver review up to 3, batched and optional; a clarification genuinely needed for safety overrides the routine limit but never delays emergency action; emergencies allow none.

**REASON:**
v0.1's three documents disagreed — the prompt said 0–1 routinely, the question engine had a five-row table with tier-specific allowances, and the safety rules implied more. Divergent copies of a rule mean the rule is unenforceable.

**IMPACT:**
The safety override is explicit rather than implied, with a stated anti-loophole test: if the safe action is the same either way, it is not a safety clarification.

---

## D-28 — Removed capability claims the platform does not support

**DECISION:**
Removed every implication of memory, saving, logging, monitoring, family notification or exhaustive interaction checking, and added an explicit capability table to `docs/SAFETY_RULES.md` §6 plus a "What it cannot do" section in the README. Regression case `REG-09`, plus `SAFE-10`.

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

---

# v0.3 — SECOND REVIEW ROUND

---

## D-33 — CPR trigger corrected to unresponsive AND abnormal breathing

**DECISION:**
"Not breathing normally" is no longer a standalone trigger for chest compressions. The criterion is **unresponsive AND breathing absent or abnormal**, with agonal gasping, panting and slow or laboured breathing named explicitly as signs of arrest. Call first, assess breathing while the call connects, phone on speaker, dispatcher gives CPR instructions and helps decide whether breathing is normal. Regression `REG-13`, two inputs.

**REASON:**
RCUK 2025 states *"If any person is unresponsive with abnormal breathing, cardiac arrest should be assumed"* — both conditions. v0.2's wording would have supported telling a bystander to start compressions on a conscious person with laboured breathing, which is a serious harm. v0.2 also omitted the dispatcher, who is the actual source of CPR instruction in a real call.

**IMPACT:**
Corrects the most dangerous single line in v0.2. Part A grew; see D-38.

---

## D-34 — Rescue-treatment carve-out stated explicitly

**DECISION:**
A named carve-out in Part A and `docs/SAFETY_RULES.md` §3.2a: in an acute emergency only, the assistant may say to use the patient's **own prescribed** rescue product exactly as its label and their own written plan direct. Never a dose figure, never a choice between products, never a repeat decision, never someone else's device, never outside an emergency.

**REASON:**
v0.2 held an absolute prohibition on medication instructions alongside instructions to use an auto-injector. Both were right; the relationship between them was never written down, leaving a reader — or the model — to resolve an apparent contradiction on its own.

**IMPACT:**
The boundary is now inspectable and reviewable. Justification recorded: the prescriber already made this decision in advance and in writing; the assistant points at it rather than authoring it.

---

## D-35 — Fallback pathways for missing plans and thresholds

**DECISION:**
A conservative fallback is in force now (`docs/SAFETY_RULES.md` §2.6): say nothing is recorded, invent nothing, route to the dispatcher in an emergency or to the clinic for a reading, and ask for a threshold to be written down. Longer draft pathways — anaphylaxis with no device, hypoglycaemia with no plan, a reading with no threshold, out-of-hours, and a medication question with no pharmacy open — are written in `docs/EMERGENCY_FALLBACKS.md`, explicitly **not approved and not in force**, with a sign-off sheet.

**REASON:**
v0.2 routed emergencies to "their own plan" and readings to a recorded threshold. Most elderly patients have neither, so the assistant routed to nothing at exactly the moment a usable instruction was needed.

**IMPACT:**
Closes the gap without the assistant inventing clinical content. §4.5 of the fallback document carries the open question the reviewer raised about the blanket missed-dose prohibition out of hours.

---

## D-36 — Head-injury routing reconciled, and deliberately broader than NG232

**DECISION:**
One rule in both documents: any head injury on **any** anticoagulant or antiplatelet, **aspirin included**, means emergency services. `docs/SAFETY_RULES.md` §2.5 now explains why this is broader than NG232 and flags it as blocker **B-07** for a clinician to confirm or narrow. Regression `REG-19`.

**REASON:**
v0.2's resident prompt included aspirin; §2.5 reproduced NG232's aspirin-monotherapy exclusion. Two instructions for the same event. Reconciled toward the broader rule because NG232 governs the imaging decision rather than the attendance decision, and because the assistant cannot establish monotherapy from a record whose accuracy §3.6 exists to doubt.

**IMPACT:**
Over-escalates some aspirin-only patients. Stated openly as a non-clinician's conservative choice, and put in front of a clinician rather than settled quietly.

---

## D-37 — Question rules: reconfirmation allowed, routine-only stop, PENDING open items

**DECISION:**
Three corrections. (a) Safety-critical **reconfirmation** of a stale, disputed or otherwise uncertain recorded fact is permitted, with a three-part test. (b) The "stop after three ignored questions" rule now governs **routine** questions only; safety-critical questions continue, with their reason given. (c) Open items are **PENDING** until a person saves them, and family availability is never assumed — where something is safety-critical the assistant routes to a service that answers, not to an absent relative. Regressions `REG-15`, `REG-16`, `REG-17`.

**REASON:**
v0.2's anti-nagging rules were written against the wrong failure mode. Forbidding reconfirmation treats the file as current by definition — the opposite of D-25's own freshness rule. Stopping all questions after three non-answers lets a patient's disengagement silence a safety check. And "open items are recorded in `CARE_PLAN.md`" was a capability claim of exactly the kind D-28 removed everywhere else.

**IMPACT:**
Restores necessary questioning without reopening the intake-form failure mode: the exception requires the fact to be load-bearing *today*.

---

## D-38 — Timing is no longer droppable; the field must be measured

**DECISION:**
`TIMING, NOT TIERS` is reclassified as safety content and may never be dropped. The only permitted reduction is the `LANGUAGE & SHAPE` paragraph; if Part A still does not fit, the pilot does not run on that plan. Added `tools/measure_prompt.py`. The setup guide now requires **empirical measurement** of the project Instructions field — paste, save, reopen, confirm the last line survives — and states that the account-level Custom Instructions limits must not be used to infer it.

**REASON:**
D-24 listed timing as the second thing to drop. That was wrong: without it the assistant says what is wrong but not how soon to act, which is the part the reader acts on. Separately, v0.2 treated 5,000 characters as a working assumption derived from a different field; that inference was never sound in either direction.

**IMPACT:**
Part A grew in v0.3 and has less headroom. That tension is real and is resolved in favour of keeping safety content, with "do not run on that plan" as the honest outcome if it does not fit.

---

## D-39 — Retrieval and memory limitations cannot be closed by testing; voice is a prerequisite

**DECISION:**
`P-02` (file retrieval) and `P-03` (project memory) are marked **permanently open** — a passing test shows a behaviour is possible, not reliable. Voice transcription was promoted from an accepted limitation to blocker **B-08**, conditional on voice being used at all.

**REASON:**
v0.2 gave both P-02 and P-03 a "to close: test it" line, which would have let a single successful trial retire a limitation the platform does not guarantee. And voice is the intended primary channel for this patient: an untested transcription path for drug names and numbers is not an accepted limitation, it is an untested safety surface on the main route in.

**IMPACT:**
The design keeps assuming retrieval and recall may fail on any turn. If voice is not tested, voice is not used.

---

# v0.4 — FOUND BY EXECUTION

---

## D-40 — Emergency number moved into the resident prompt

**DECISION:**
Part A now carries `**EMERGENCY NUMBER: <<EMERGENCY_NUMBER>>**`, substituted with the real number when the prompt is pasted at setup. It no longer points at `PATIENT_PROFILE.md` for it.

**REASON:**
Found by running REG-05a against the real configuration. Part A said the emergency number lives in `PATIENT_PROFILE.md` while simultaneously forbidding the assistant to read a file during an emergency. The model obeyed the stronger rule and fell back to "your local emergency number" — with 101 sitting in the uploaded profile, unread. Two of my own rules contradicted each other, and the contradiction only surfaced under execution.

**IMPACT:**
The single most time-critical fact no longer depends on file retrieval, which execution then showed to be unreliable anyway (`B-09`). Re-run of REG-05a produced "Call 101 (Magen David Adom) now". Setup must now substitute the placeholder; an unsubstituted prompt degrades to the generic phrasing rather than failing silently.

---

## D-41 — REG-17 failure deliberately NOT fixed

**DECISION:**
REG-17 failed: asked about tablets she could not remember taking, the assistant opened with «Не принимайте дополнительную таблетку "на всякий случай"» — its own medication rule, which Part A bans ("not 'never take two'"). Left unchanged.

**REASON:**
The fix is a clinical judgement, not a wording choice. A blanket prohibition on "do not take an extra dose" may well be wrong: it is the safest direction for most products, and forbidding it may leave a patient with less protection than a plain warning would give. That is exactly the question in `docs/EMERGENCY_FALLBACKS.md` §4.5 and Item 4 of the review packet.

**IMPACT:**
One gating case stays red until a pharmacist rules. Recorded as failing rather than quietly re-scoped.

---

## D-42 — Test fixtures committed

**DECISION:**
`tests/fixtures/` holds the seven fictional context files plus the extracted Part B, exactly as uploaded to the test project.

**REASON:**
Every scenario depends on specific recorded state — the reconciliation date, the furosemide 20/40 mg conflict, the absent hypo plan, the missing pulse threshold, the unreadable B12. Without the fixtures in the repository the run is not reproducible and a later reader cannot tell whether a failure was the prompt or the fixture.

**IMPACT:**
Reproducibility. All data fictional; `.gitignore` continues to block real filled files at `project/`.

---

## D-43 — One conversation replaces the daily screens, but the forms are kept behind a menu

**DECISION:**
`/[locale]/records/[patientId]/chat` is the landing screen and shows only the conversation, one text box, one attachment button, Send and the RU/HE/EN links. The daily home screen built one commit earlier now redirects to it. The record, documents, change history, the wellbeing check-in form and user administration moved into a `<details>` Menu; none of them was deleted.

**REASON:**
The owner asked for the separate daily-use screens and structured entry forms to be replaced by one familiar conversation. Deleting the check-in page as well would have destroyed the only way to read check-ins already stored by `wellbeing_reports`, and would have removed working, tested functionality to satisfy the letter of a request about the *main* path. Keeping it one level down satisfies both: nobody meets a form on the way in, and nothing that worked stopped working.

**IMPACT:**
The main screen is one surface. `/home` is a redirect, so existing bookmarks and earlier release notes still land somewhere useful. A browser test asserts the redirect; a structural test asserts the main screen has exactly one textarea, one file input and one submit button.

---

## D-44 — A unit is written, fixed by notation, or absent — never inferred from the value

**DECISION:**
`packages/domain/measurements.ts` records `unit` together with `unitStated`. A unit is only marked as stated when the person actually wrote it. `135/80` yields `mmHg` and a pulse yields `/min` because the notation fixes them, recorded as *not* stated. "температура 37.8" yields an empty unit and `needsUnit: true`. No unit is ever derived from the magnitude of the number.

**REASON:**
"Never invent units, dates or medical facts" cannot be a convention; it has to be a property of the data structure, or it erodes the first time a screen needs something to display. 37.8 is overwhelmingly likely to be Celsius and 98.6 Fahrenheit — which is exactly why guessing is tempting and exactly why it must not happen in a record a clinician may later read.

**IMPACT:**
A missing unit becomes the one short clarification the reply is permitted to ask, so the gap is visible rather than papered over. The confirmation card states who supplied the unit.

**SUPERSEDED IN PART, 2026-09-21, by D-48.** This entry originally ended by saying that a bare "degrees"/"градусов"/"מעלות" is filled in as °C and marked as supplied by the app. The independent review rejected that, correctly: it is an inference about which scale the writer meant, which is the exact thing the rest of this decision forbids. The scale now stays unknown.

---

## D-45 — Readings are proposals; only a person's review makes them memory

**DECISION:**
Migration 007 stores conversation lines in `conversation_messages` and what the reader saw in `conversation_facts`, always in state `proposed`. The row-level policy refuses an insert that arrives already reviewed. The only transition is `review_conversation_fact`, which works once, requires current access, and records who reviewed it and when. Neither table has an update or delete grant, and nothing in the conversation path writes `medical_records`.

**REASON:**
The owner required that routine conversational use must not silently alter confirmed medical history, and that document-derived diagnoses, medications and restrictions stay proposed until reviewed. Enforcing that in the application alone would leave it true only for as long as every future caller remembers.

**IMPACT:**
Ordinary talk produces no confirmation card at all — only a recognised measurement does — so the conversation does not become a form. A change of mind after a review is a new message rather than an overwrite, so the earlier decision stays visible. 14 SQL tests cover this, including the full journey across two accounts.

---

## D-46 — The model service needs configuration AND consent, and there is none

**DECISION:**
`apps/web/lib/assistant.ts` is the only place that may reach an external provider. It requires `MED_ASSISTANT_AI_PROVIDER`, `MED_ASSISTANT_AI_MODEL` and `MED_ASSISTANT_AI_KEY`, and separately `MED_ASSISTANT_AI_CONSENT` naming the same provider. All four are read from the server environment at run time; none is bundled into the Windows download or committed. With any of them missing the conversation answers free questions with "I cannot answer questions yet", and an uploaded file is described as stored but explicitly **not** read.

**REASON:**
The owner required that external recipients of document, photo or conversation data be named and consented to before real patient information is transmitted, and that secrets never ship in the download or the public repository. A single key check would turn a configuration accident into a disclosure. The alternative to an honest refusal — canned sympathetic text that reads like an answer — is worse than saying nothing, because it implies a capability that does not exist.

**IMPACT:**
No model has been called and no generated answer has been observed, so nothing about model behaviour is claimed. The screen names the recipient when the gates are open and says "nothing leaves this computer" when they are not. The typed path is nevertheless fully real end to end: reading, proposing, reviewing and later retrieval all work with no provider at all.

---

## D-47 — "Uploaded" and "read" are different words in every language

**DECISION:**
The conversation reports an attachment as `chatUploadSending` → `chatUploadStored`, and the reply says `replyAttachmentStored` followed by `replyAttachmentNotRead` while no reader exists. The server re-reads the document row and treats a file as stored only when its own `state` is `uploaded`; the browser's claim is never sufficient. A failure keeps both the text and the file, and Retry resumes from the already-uploaded object rather than sending the bytes again.

**REASON:**
"Do not imply the app has read an attachment until processing succeeds." A 50 MB scan takes long enough that a progress line is the only thing the reader has to go on, and a single word covering both states would be a false claim at exactly the moment someone is trusting it.

**IMPACT:**
A test asserts the two strings differ in all three languages and that the failure path returns before the draft is cleared. Re-uploading 40 MB after a failed send cannot happen.

---

## D-48 — "Degrees" does not mean Celsius

**DECISION:**
The IMPLIED table is deleted. `температура 37.8 градусов`, `חום 37.8 מעלות` and `temperature 98.6 degrees` all produce a temperature with **no** unit and `needsUnit: true`. Only a named scale — `°C`, `C`, `celsius`, `цельси…`, `по цельсию`, `צלזיוס`, or the Fahrenheit equivalents — sets one. This partly supersedes D-44.

**REASON:**
The independent review of 2026-09-21 called this what it is: a guess. My reasoning had been that Celsius is the scale on every document this family owns, and that filling it in while marking it as app-supplied was honest enough. That is an argument about likelihood, and the rule is not about likelihood — a number written into a medical record with a unit nobody wrote is a fabricated unit however it is labelled. It also fails on its own terms: `98.6 градусов` was recorded as `98.6 °C`, a temperature incompatible with life.

**IMPACT:**
An unscaled temperature now spends the turn's single clarification on the question "what unit was that?", which is exactly what that budget is for. The unit test that asserted the old behaviour was corrected rather than cited: a test that encodes a defect is evidence of the defect, not of safety.

---

## D-49 — Every number binds to its own label, and a tie reads nothing

**DECISION:**
`extractMeasurements` finds all measurement words, then binds each number to the **nearest** one. When the nearest distance is shared by words of two different kinds the number is ambiguous and is discarded. A blood-pressure word may claim only a `n/m` pair, never a lone number. Measurement words are matched as whole written forms from an explicit list, not as stems.

**REASON:**
The previous rule — accept any number within 40 characters of a keyword, then keep the first per kind — let two measurements claim the same number. "weight 80 kg, pulse 72" recorded a pulse of 80 and lost the 72 entirely. A confirmation card cannot repair this: it shows "Pulse: 80 /min", which is a plausible pulse, so a person confirms it. The review step protects against a reading the person can *see* is wrong, not against one that looks right.
Stem matching had the same shape of flaw: Russian "вес" (weight) opens "весь" (whole), so "весь день" was a weight.

**IMPACT:**
Nine mixed EN/RU/HE sentences are now asserted in the normal suite, alongside the reviewer's five. An ambiguous sentence yields nothing, which is a silence the person can correct by rewriting — unlike a confident wrong label, which they cannot.

---

## D-50 — One turn is one transaction, keyed by a token the browser keeps

**DECISION:**
`post_conversation_turn` writes the person's message, the assistant's reply and the proposed readings in a single transaction. The browser mints a uuid per turn and keeps it across retries; a repeated token returns the existing rows, and completes anything missing, instead of inserting again. A reading that violates a constraint aborts the whole turn.

**REASON:**
Three separate writes can half-succeed. The observed failure modes were: a question stored with no answer beside it, a retry storing the question a second time, and a failed fact insert being swallowed so the reply said "this is what I read" with nothing to confirm. The last is the worst of the three, because it is invisible.

**IMPACT:**
There is no partial state left to report, so the honest report is simply success or failure. Five SQL tests cover it, including one that reconstructs the half-written turn directly and checks that the retry completes rather than duplicates it. Migration 007 was revised in place, having never been applied anywhere — verified read-only against the live project first.

---

## D-51 — The composer's rules live in a state machine, not in component state

**DECISION:**
`packages/domain/turn.ts` is a pure reducer holding the draft, the attachment's two-stage upload state, the turn's token, the phase and the failure. The React component performs network steps and reports outcomes to it. The upload's document id is recorded when the **bytes arrive**, not after verification.

**REASON:**
The independent review found three defects here that no source-string assertion could have caught: a verification failure restarted a 40 MB upload from zero, a transport rejection could leave the controls disabled forever, and the rules were spread across six pieces of component state. Behaviour that matters this much has to be testable as behaviour.

**IMPACT:**
Fourteen behavioural tests, each phrased as the thing that must not happen to a person: the message must survive, the file must not be sent twice, Send must come back. The structural test that previously asserted on these strings now only checks that the component uses the machine rather than keeping a second copy of the rules.

---

## D-52 — Where it is stored and whether AI sees it are two different sentences

**DECISION:**
`privacyStorage` is shown always: messages and attachments are kept in the family's private online record, on the service that already holds the medical record, readable by the family accounts. `aiOff` now says only that nothing is sent to an outside assistant company. `aiOn` says what is additionally sent, and to whom. The "I am reading it now" line is deleted outright.

**REASON:**
`aiOff` said "nothing you write here leaves this computer". That was false the moment it was written — every message is persisted to hosted Supabase and every attachment to hosted Storage — and it was false in the direction that matters, because it invited someone to type something they would not have typed into a cloud service. The attachment line was false in the same direction: configuring an API key does not implement reading a PDF, and there is no reader and no processing job anywhere in this application.

**IMPACT:**
Both corrections are in all three languages. The acceptance suite asserts that the storage sentence is present and that "leaves this computer" appears nowhere.

---

## D-53 — The signed-in acceptance run is written, and reports itself as not run

**DECISION:**
`tests/acceptance/authenticated-chat.spec.ts` with `npm run test:acceptance` covers sign-in, a Russian measurement message, Confirm, Correct, decline, an attachment, fault-injected connection loss with Retry, and retrieval by the second account. Credentials come from environment variables the operator sets in their own shell. Without them every case **skips**.

**REASON:**
The owner asked for these tests and they are the last acceptance gate, but they cannot be executed here: they need migrations 006/007 applied and the account holders' own passwords, which must never be typed into a chat window. Writing them so they skip rather than pass means the suite can never be mistaken for evidence it has run.

**IMPACT:**
Seven cases, currently seven skips. A separate Playwright config is needed because the existing one deliberately starts the app with no backend in order to test the anonymous and unconfigured paths.

