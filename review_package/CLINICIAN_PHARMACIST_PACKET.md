# CLINICIAN / PHARMACIST REVIEW PACKET

**Med Assistant v0.3 — 2026-09-19**

You are being asked to review four things. Everything else can wait.

**What this is:** a set of written instructions for a ChatGPT assistant that would sit between one 84-year-old patient (Russian-speaking, in Israel; anticoagulated, CKD 3a, type 2 diabetes) and her family. It answers questions, reads her documents, and decides when to tell her to seek help.

**What it is not:** it does not examine, monitor, alert, or act. It cannot save anything. It has never been run — **0 of 79 written scenarios have been executed**, so nothing below is validated by testing either.

**What we need from you:** approve, amend or reject each item. Your written answer becomes the rule. Where you disagree with a judgement made by a non-clinician, say so — that is the point of asking.

Estimated time: **30–40 minutes.** Items 1 and 4 are the ones we most expect to be wrong.

---

## The blanket rule everything else sits under

The assistant gives **no medication instructions at all**: no dose, no schedule, no start, stop, change, hold, skip or delay, and no missed-dose rule of its own. Anything dose-related routes to the exact product's patient information leaflet, the prescriber's written plan, or a pharmacist.

This was deliberately made absolute, because an earlier version let the assistant say "don't take tonight's dose until you speak to someone" and we judged that unsafe. Items 2 and 4 are where that absolutism creates problems.

---

## ITEM 1 — Emergency fallbacks when the patient has no written plan

**Full text:** `EMERGENCY_FALLBACKS.md` §4.

The assistant routes anaphylaxis and hypoglycaemia to "the patient's own written plan". She has none. We wrote conservative fallbacks; they are **not in force** pending your answer.

| Situation | What the assistant would say | Your decision |
|---|---|---|
| **Suspected anaphylaxis, no auto-injector prescribed** | Call emergency services; say "allergic reaction, trouble breathing"; speaker on, follow the dispatcher; lie flat with legs raised or sit up if breathing is easier; **do not look for anyone else's adrenaline** | ☐ approve ☐ amend ☐ reject |
| **Hypoglycaemia, awake, can swallow, no written plan** | Fast-acting sugar from whatever is in the house (juice, non-diet soft drink, glucose tablets, honey, sugar in water); re-test after 10–15 min; if no better or cannot re-test, call emergency services. **Deliberately no gram figure** — we cannot know what is in the house or that anyone can measure it | ☐ approve ☐ amend ☐ reject |
| **Hypoglycaemia, cannot swallow safely / drowsy / fitting** | Nothing by mouth; emergency services now | ☐ approve ☐ amend ☐ reject |
| **A reading far outside her usual range, no recorded threshold** | Say no threshold is recorded; give her recorded usual range and its date; if she feels unwell → seen today; if entirely well → repeat after rest, call the clinic today or tomorrow; ask for a written threshold | ☐ approve ☐ amend ☐ reject |

**Questions we cannot answer ourselves:**

1. Is omitting the gram figure right, or should the assistant state 15–20 g and accept that it cannot verify what is available?
2. Is **"feels unwell"** a safe discriminator in a frail 84-year-old, given that atypical presentation is the norm? Should the default be "contact the clinic regardless"?
3. She is on **metformin only**. Should a hypoglycaemia pathway exist for her at all, or should low readings route to "this is unexpected, call the clinic"?
4. Does any of this change under **Israeli** practice? Our sources are UK bodies (`CLINICAL_SOURCES.md`).

---

## ITEM 2 — The rescue-medication carve-out

**Full text:** `SAFETY_RULES.md` §3.2a; `EMERGENCY_FALLBACKS.md` §2.

This is the **only** exception to the blanket prohibition. In an acute emergency the assistant may say to use the patient's **own prescribed** rescue product — adrenaline auto-injector, glucagon, or the fast-acting carbohydrate named in her own hypo plan — **exactly as that product's label and her own written plan direct**.

Even inside the exception it may never: state a dose, choose between products, decide a repeat is due, suggest anyone else's device, or do any of this outside an acute emergency.

**Our reasoning:** the prescriber already made this decision in advance and in writing. The assistant points at an existing instruction rather than authoring one.

| Question | Your answer |
|---|---|
| Is the carve-out drawn in the right place? | |
| Should **repeat adrenaline after 5 minutes** (RCUK) be sayable, or stay with the plan and the dispatcher as now? | |
| Should glucagon require "someone trained is present", as now — or is that too restrictive in a real emergency? | |
| Anything else that belongs inside the carve-out? | |

---

## ITEM 3 — Head-injury routing

**Full text:** `SAFETY_RULES.md` §2.5; blocker `B-07`.

**Current rule:** any head injury or fall onto the head, in someone taking **any** anticoagulant or antiplatelet **including aspirin monotherapy**, means **call emergency services now** — even if she feels completely well.

This is **deliberately broader than NICE NG232**, which excludes aspirin monotherapy from its CT-consideration recommendation. Our reasons:

1. NG232 governs the **imaging** decision in the ED, not who should attend.
2. The assistant **cannot establish monotherapy** — the medication list's accuracy is exactly what our reconciliation rules exist to doubt.
3. Quoting the **8-hour window** to someone at home reads as permission to wait.

**Known consequence:** some aspirin-only patients with minor bumps are sent to an ED unnecessarily.

| Question | Your answer |
|---|---|
| Keep the broad rule, or narrow it? | ☐ keep ☐ narrow — how: |
| Is "call an ambulance" right, or should it be "go to the ED now, ambulance if unwell / alone / cannot get there safely"? | |
| Does local (Israeli) practice differ? | |

---

## ITEM 4 — Out-of-hours medication questions — **the item we most expect to be wrong**

**Full text:** `SAFETY_RULES.md` §3.3; `EMERGENCY_FALLBACKS.md` §4.5.

The assistant gives **no** missed-dose guidance of its own — not by drug class, not "never take two", not "skip it". It routes to the product leaflet, the prescriber's plan, or a pharmacist. Basis: NHS SPS guidance (updated 2025-03-04) treats the **product's own leaflet** as the first source and singles out warfarin, insulin, antiseizure medicines and others as needing tailored advice.

**The gap you identified:** at 22:00 on a Sunday, with no pharmacy open, this leaves a patient with nothing.

**Current draft:** point to the leaflet in the box (it is in the house and is product-specific) → her written plan → the out-of-hours service → emergency services if any symptom is present. If none of those is available: **waiting for the pharmacy is safer than acting on a guess — unless symptoms are present.**

| Question | Your answer |
|---|---|
| **Is "wait rather than guess" safe for every drug class**, or are there medicines on her list where an omitted dose overnight is itself the greater harm? | |
| If so — which, and what should the assistant say instead? | |
| Should **her warfarin** have a standing written rule from the anticoagulation clinic, so this never arises? | |
| Is the SPS "**up to 2 hours late is generally acceptable**" heuristic safe for the assistant to state? We deliberately left it out — it is written for professionals reasoning about a known product | |
| What is the correct **Israeli out-of-hours route** for a medication question? | |

---

## Her current recorded medicines (for context)

Fictional test patient, but modelled on the real case. Warfarin (3 mg / 4.5 mg alternating, anticoagulation clinic card) · amlodipine 5 mg · metformin 850 mg bd · levothyroxine 50 mcg · atorvastatin 20 mg · furosemide **20 mg per discharge letter, 40 mg on the box — unresolved conflict** · vitamin D3 · calcium carbonate. eGFR 50. Potassium 3.4 mmol/L (2026-09-02). Haemoglobin 11.2 g/dL, falling. Reported penicillin and unverified sulfa allergy. NSAIDs contraindicated (standing instruction). No written hypo plan. Glucometer reads **mg/dL**.

---

## Sign-off

| Item | Reviewer | Role | Date | Outcome |
|---|---|---|---|---|
| 1 — Emergency fallbacks | | | | ☐ approved ☐ amended ☐ rejected |
| 2 — Rescue carve-out | | | | ☐ approved ☐ amended ☐ rejected |
| 3 — Head-injury routing | | | | ☐ approved ☐ amended ☐ rejected |
| 4 — Out-of-hours medication | | | | ☐ approved ☐ amended ☐ rejected |

Signing items 1 and 2 closes blocker `B-06`. Item 3 closes `B-07`. Item 4 closes the open question in `EMERGENCY_FALLBACKS.md` §4.5.

**Blockers `B-01` (clinician review) and `B-02` (pharmacist review) close only when the reviewer confirms they have read `SAFETY_RULES.md` §2–§4 and Part A of the prompt in full — not just this packet.** This packet is the priority subset, not the whole of what needs reading.

**`B-03` (nothing executed) is not affected by this review.** It closes only when the scenarios are actually run.
