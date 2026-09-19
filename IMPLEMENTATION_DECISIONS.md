# IMPLEMENTATION DECISIONS

Every material adjustment made to the specification during implementation. Core product intent is unchanged throughout.

---

## D-01 — Reconstructed the product specification

**DECISION:**
Wrote `docs/PRODUCT_SPEC.md` from the product rules in the build brief, with a provenance note at the top stating that the referenced "Med Assistant v0.1 Product & Technical Specification" was not supplied to the implementer.

**REASON:**
The brief referred to a specification "above" that did not reach me. Silently proceeding as though I had read it would have made every downstream document falsely authoritative.

**IMPACT:**
No functional impact. Reconcile against the original before treating `PRODUCT_SPEC.md` as the source of truth; the operational content (system prompt, question engine, safety rules) derives from the explicit rules in the brief and is unaffected either way.

---

## D-02 — Five provenance levels instead of an informal distinction

**DECISION:**
Formalised `CONFIRMED / REPORTED / OBSERVED / ESTIMATED / ASSUMED`, with visible markers, applied consistently across the prompt, templates and tests.

**REASON:**
The brief required distinguishing known facts, patient reports, visual observations, estimates and assumptions. An unnamed distinction does not survive contact with a language model; a named, enumerated one does, and it can be tested.

**IMPACT:**
Safety: substantially better. UX: minor — markers appear only when the difference matters, so patient answers stay clean. Cost: none.

---

## D-03 — Write-back blocks to work around an unwritable file system

**DECISION:**
The assistant emits `📋 ЗАПИСАТЬ В <FILE>` copy-paste blocks for facts with lasting value; the family pastes them in. Documented as the pilot's dominant operational risk in `SETUP_CHATGPT_PROJECT.md` and as the primary Phase 2 justification in `FUTURE_ARCHITECTURE.md`.

**REASON:**
ChatGPT projects are read-only to the model. Longitudinal context was a core requirement, so the gap had to be bridged by a human process — and named honestly rather than hidden.

**IMPACT:**
Functionality: preserves longitudinality. UX: adds recurring family effort (~5 min/week). This is the pilot's main failure mode, and detecting it is one of the pilot's purposes. Cost: zero.

---

## D-04 — The "hold" exception to the no-prescription-change rule

**DECISION:**
Added a narrow, explicit exception: the assistant may say "do not take the next dose until you have spoken to the doctor / emergency services" when there is a clear acute safety signal, always paired with contacting a named human.

**REASON:**
A literal "never influence medication taking" rule produces an unsafe assistant. If someone is actively bleeding on warfarin or has just double-dosed insulin, "keep taking it as prescribed" is the wrong answer. A time-bounded pause pending a human decision is categorically different from a dose change.

**IMPACT:**
Safety: significantly better in exactly the situations that matter most. Intent: unchanged — the assistant still never re-doses, substitutes or discontinues anything.

---

## D-05 — Triage tiers made explicit and named

**DECISION:**
Four named tiers (🔴 RED / 🟠 ORANGE / 🟡 YELLOW / 🟢 GREEN) with enumerated triggers, required response shapes, and the rule that escalation overrides brevity, question budget, tone and user format requests.

**REASON:**
"Appropriate safety/triage behavior" is not implementable as written. Named tiers give the prompt something to apply consistently and give the test suite something to score.

**IMPACT:**
Safety and testability both improve. Adds length to the prompt, which is the reason for D-11.

---

## D-06 — Geriatric-specific amplifications added

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

## D-11 — Prompt compaction with a documented fallback

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

## D-15 — Test suite written as behaviour, with named gate cases

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
