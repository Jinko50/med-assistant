# EMERGENCY FALLBACK PATHWAYS — DRAFT FOR CLINICIAN REVIEW

> **STATUS: DRAFT. NOT APPROVED. NOT IN FORCE.**
> Written by a non-clinician. Every pathway below needs a named clinician's written sign-off before it governs anything, and a pharmacist's sign-off where it touches medicines. Until then, blocker `B-06` in `OPEN_SAFETY_ISSUES.md` stays open.
>
> Sources and retrieval dates: `CLINICAL_SOURCES.md`. All sources are UK bodies; **local protocol governs and is unconfirmed** (`B-05`).

---

## 1. The problem this addresses

v0.2 routed emergencies to "the patient's own written plan" and abnormal readings to "the threshold recorded in the care plan". When neither exists — which is the normal state for most elderly patients — the assistant routed to nothing, and the person asking got no usable instruction at the moment they needed one.

The fix is not for the assistant to supply clinical content it has no authority for. It is to have a **pre-agreed fallback, written down in advance by a clinician**, that the assistant can point to.

## 2. The rescue-treatment exception, stated plainly

The resident prompt carries an absolute prohibition on medication instructions, and simultaneously tells people to use an adrenaline auto-injector or glucagon in an emergency. These are not in conflict, but the boundary must be explicit or it will be read as one.

**The carve-out, precisely:**

| Permitted in an emergency | Never permitted, ever |
|---|---|
| "Use her own adrenaline auto-injector, exactly as its label and her allergy plan say" | Stating a dose in mg or mL |
| "Use the fast-acting sugar in her hypo plan, then re-test as that plan says" | Stating how many grams, or naming a product not in her plan |
| "Her own glucagon, only if someone trained to give it is there" | Deciding a repeat is due |
| "The dispatcher will tell you what to do" | Choosing between two rescue products |
| | Suggesting someone else's device |
| | Any of the above outside an acute emergency |

**Why the carve-out is justified:** the assistant is not making a treatment decision. The prescriber already did, in advance, for this patient, in writing, on the product's label. The assistant is pointing at an existing instruction, not authoring one. Where no such prior instruction exists, there is nothing to point at, and §4 applies instead.

**Why it is narrow:** it covers only products prescribed *to this patient* *for this emergency*, and only as already directed. It creates no general authority.

## 3. What must be captured in advance

`PATIENT_PROFILE.md` has a rescue-plan table. Each row is either a plan or an explicit "none". A blank is the dangerous state, because it is indistinguishable from an unasked question.

| Item | What the clinician needs to write down |
|---|---|
| Anaphylaxis | Is an auto-injector prescribed? Which product, where kept, who is trained, what the plan says about a repeat |
| Hypoglycaemia | Treat-below threshold **with units**, what to take, re-test interval, what to do if it does not come up, whether glucagon is prescribed |
| Anticoagulation | Clinic contact, out-of-hours route, what to do for a bleed or a missed dose |
| Falls / head injury | Where to go, and whether to call an ambulance or attend directly |
| Out-of-hours | Which number to call when the clinic is closed and it is not an emergency |

## 4. Draft fallback pathways — for review

### 4.1 Suspected anaphylaxis, no auto-injector prescribed and no plan

**Draft:** Call emergency services immediately. Say the words "I think this is an allergic reaction and she is having trouble breathing" — that phrasing gets the right dispatch. Put the phone on speaker and follow the dispatcher. Lie flat with legs raised, or sitting if breathing is easier; do not stand up. Do not go looking for anyone else's adrenaline.

**Basis:** RCUK anaphylaxis guidance — early call for help; an auto-injector may be given only to the person it was prescribed for.
**Review question:** is there any circumstance in which a household member's device should be used? RCUK says no. Confirm this holds locally.

### 4.2 Suspected hypoglycaemia, no written hypo plan

**Draft, awake and able to swallow safely:** give fast-acting sugar now — what is actually in the house: juice, sugary (non-diet) soft drink, glucose tablets, honey, sugar in water. Re-test after about 10–15 minutes. If they are no better, or cannot be re-tested, call emergency services.

**Draft, cannot swallow safely, drowsy, fitting, or unresponsive:** nothing by mouth. Emergency services now.

**Basis:** Diabetes UK / JBDS — 15–20 g fast-acting carbohydrate, re-test after 10–15 minutes, follow with longer-acting carbohydrate; nothing by mouth if unable to swallow.
**Review questions:** (a) Is it acceptable for the assistant to say "fast-acting sugar" generically without a gram figure? The draft deliberately avoids grams, since it cannot know what is in the house or measure it. (b) Does the treat-below threshold need to be in the fallback, and in which units for this patient's meter? (c) This patient is on metformin only, where hypoglycaemia risk is low — should the pathway exist at all for her, or be replaced by "this is unexpected, call the clinic"?

### 4.3 A reading far outside the usual range, no recorded threshold

**Draft:** Say plainly that no threshold is recorded. Give the recorded usual range and its date, if one exists, so the person can see the difference themselves. Then:

- If they feel unwell in any way → be seen today; if any act-now trigger is present → emergency services.
- If they feel entirely well → repeat the reading after resting, and call the clinic for advice today or tomorrow.
- In both cases, ask for a written threshold so this does not recur.

**Review questions:** is "feels unwell" a safe discriminator for a frail 84-year-old, given that atypical presentation is the norm? Should the default be lower — contact the clinic regardless?

### 4.4 Out of hours, not an emergency, needs advice now

**Draft:** name the out-of-hours service recorded in `CARE_PLAN.md`. If none is recorded, say so and say that emergency services can advise on where to go when the clinic is closed.

**Review question:** what is the correct local route, and should the pharmacist line be preferred for medication questions?

### 4.5 Medication question with no pharmacy open

This is the gap the v0.2 review raised against the blanket missed-dose prohibition.

**Draft:** the assistant still gives no rule of its own. It points to (a) the leaflet in the box, which is present in the home and product-specific, (b) the prescriber's written plan if one exists, (c) the out-of-hours service, and (d) emergency services if there are any symptoms. It says explicitly that if none of these is available, the safest thing is to wait for the pharmacy rather than act on a guess — **unless** symptoms are present, in which case (d).

**Review question:** is "wait rather than guess" right for every class, or are there medicines where a missed dose overnight is itself the greater harm and a different route is needed? This is the single most important question on this page.

## 5. What is deliberately NOT here

- No doses, in any unit, for any product.
- No product recommendations.
- No decision rules that require examining the patient.
- No attempt to reproduce a clinician's risk assessment.

## 6. Sign-off

| Pathway | Reviewer | Role | Date | Approved? |
|---|---|---|---|---|
| 4.1 Anaphylaxis, no device | | | | ☐ |
| 4.2 Hypoglycaemia, no plan | | | | ☐ |
| 4.3 Reading, no threshold | | | | ☐ |
| 4.4 Out of hours | | | | ☐ |
| 4.5 Medication, no pharmacy | | | | ☐ |
| Rescue carve-out (§2) | | | | ☐ |

Until every row is signed, the assistant's behaviour is the conservative one in the resident prompt: say no plan is recorded, invent nothing, and route to the dispatcher or the clinic.
