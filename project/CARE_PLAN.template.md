# CARE PLAN

> What the doctors have decided, what is being monitored, and what is still open.
> Maintained by family. Upload as `CARE_PLAN.md`.
> This is the file the assistant uses to know what "normal for this patient" means, and what it should quietly keep an eye on.
> Everything below the `EXAMPLE` line is fictional and can be deleted.

**Last updated:** YYYY-MM-DD by ______

## Care team

| Role | Name | Contact | Sees the patient |
|---|---|---|---|
| Family doctor | | | |
| Cardiology | | | |
| Other specialists | | | |
| Nurse / clinic line | | | |
| Pharmacy | | | |

## Treatment goals

| Goal | Target **with units** | Set by | Date set | Notes |
|---|---|---|---|---|

> Targets for an 84-year-old are often deliberately looser than the population guideline. **Record the target the clinician actually set, with its units and the date it was set** — not the textbook one. The assistant uses only what is recorded here; where a threshold is missing it says so rather than supplying one from general guidance.

## Monitoring schedule

| What | How often | Who does it | Last done | Next due |
|---|---|---|---|---|

## Standing instructions from doctors

- 

## Deterioration triggers

> The specific things that should prompt a further call, and **how soon**. The assistant quotes these rather than improvising urgency, so every row needs a timing, not just a description.

| Sign (threshold + units where relevant) | Act by when | Who to contact |
|---|---|---|
| | | |

## Warning signs specific to this patient

> What this patient's clinicians have said to watch for. These sit alongside the general act-now list in `../docs/SAFETY_RULES.md` §2.2 — they never replace or downgrade it.

| Sign | What it may mean | What to do | Set by + date |
|---|---|---|---|

## Upcoming appointments

| Date | Who | Purpose | Prepare |
|---|---|---|---|

## Open items

> Unresolved questions, including gaps the assistant noticed but did not ask the patient about.

| Item | Why it matters | Who resolves it | Raised |
|---|---|---|---|

## Decisions explicitly made by the family / patient

- 

---

## EXAMPLE (fictional — delete before use)

**Last updated:** 2026-09-15 by Елена

### Care team

| Role | Name | Contact | Sees the patient |
|---|---|---|---|
| Family doctor | Dr. Levin | Clalit Neve Sha'anan, +972-4-XXX-XXXX | Every 2–3 months |
| Cardiology | Dr. Kaplan | Rambam outpatient | Every 6 months |
| Anticoagulation clinic | Clalit nurse line | +972-4-XXX-XXXX | Monthly INR |
| Pharmacy | Clalit Neve Sha'anan | | Monthly collection |

### Treatment goals

| Goal | Target **with units** | Set by | Date set | Notes |
|---|---|---|---|---|
| Blood pressure | Below 150/90 mmHg — deliberately relaxed for age and fall risk | Dr. Levin | 2026-05-12 | Do not chase lower; dizziness is the bigger danger |
| INR | 2.0–3.0 | Dr. Kaplan | 2019-11 | |
| HbA1c | Below 7.5% — relaxed for age | Dr. Levin | 2026-06-10 | Avoiding hypoglycaemia matters more than tight control |
| Weight | 65–67 kg | Dr. Kaplan | 2026-07-19 | |
| Potassium | 3.5–5.1 mmol/L | Dr. Levin | 2026-09-15 | Low since furosemide started |
| Temperature | Contact the clinic same day at 38.0 °C or above | Dr. Levin | 2026-05-12 | |

### Monitoring schedule

| What | How often | Who does it | Last done | Next due |
|---|---|---|---|---|
| INR | Monthly | Clinic | 2026-09-02 | 2026-10-02 |
| Blood pressure at home | 2–3 times a week, morning | Patient | 2026-09-08 | ongoing |
| Weight | Weekly, same day | Patient | 2026-09-14 | weekly |
| Potassium + creatinine | 2 weeks after 2026-09-15 | Clinic | 2026-09-02 | ~2026-09-29 |
| Blood sugar | Twice weekly, fasting | Patient | 2026-09-13 | ongoing |

### Standing instructions from doctors

- No NSAIDs at all (warfarin + CKD). Paracetamol only, maximum 3 g per day.
- Any fall with a head strike → emergency department, same day, even if she feels fine.
- Weight up 2 kg in a week → call Dr. Kaplan, do not wait for the appointment.
- Do not adjust warfarin without the anticoagulation clinic.

### Deterioration triggers

| Sign (threshold + units) | Act by when | Who to contact |
|---|---|---|
| Weight up 2 kg in a week | Same day | Dr. Kaplan |
| Temperature 38.0 °C or above | Same day | Dr. Levin / clinic |
| Blood pressure above 180/110 mmHg, or below 100/60 mmHg with symptoms | Same day | Dr. Levin |
| Dizziness on standing more than twice in a week, no fall | Within 3 days | Clinic nurse line |
| Any fall, or any head injury | **Emergency services, even if she feels fine** | 101 |
| Breathlessness at rest | **Emergency services** | 101 |
| Dark stool, unusual bruising, bleeding that will not stop | **Emergency services** | 101 |
| New confusion | **Emergency services** | 101 |

### Warning signs specific to this patient

| Sign | What it may mean | What to do | Set by + date |
|---|---|---|---|
| Both legs swelling + breathlessness | Fluid returning, as in July | Dr. Kaplan same day; emergency services if breathless at rest | Dr. Kaplan, 2026-07-19 |
| Dizziness on standing | Low potassium, over-diuresis, or BP too low | Sit down, report, mention at clinic | Dr. Levin, 2026-09-15 |
| Night leg cramps | Possible low potassium | Report; recheck already due | Dr. Levin, 2026-09-15 |

### Upcoming appointments

| Date | Who | Purpose | Prepare |
|---|---|---|---|
| 2026-09-25 | Dr. Kaplan | 6-month cardiology review | BP log, weight log, the Hb trend, the furosemide question |

### Open items

| Item | Why it matters | Who resolves it | Raised |
|---|---|---|---|
| **Furosemide strength conflict — discharge letter 20 mg vs box 40 mg** | Unresolved; everything downstream depends on it | Елена → Dr. Kaplan, urgently | 2026-09-08 |
| **No written hypoglycaemia plan** | Emergency guidance routes to "her own plan"; there is none | Елена → Dr. Levin | 2026-09-19 |
| Is furosemide long-term or temporary? | Affects potassium and dizziness | Елена → Dr. Kaplan on 09-25 | 2026-08-20 |
| Haemoglobin falling, 11.9 → 11.2, on warfarin | Possible slow bleeding | Dr. Levin | 2026-09-05 |
| Sulfa allergy never verified | Limits antibiotic choices unnecessarily | Dr. Levin | 2026-08-20 |
| Home BP readings not recorded consistently | Weakens the cardiology review | Family, gently | 2026-09-08 |

### Decisions explicitly made by the family / patient

- The patient does not want to be phoned daily about medication. Weekly pill organiser instead.
- The patient wants to be told her lab results directly, not "protected" from them.
- The family agreed: no new supplements without checking against warfarin first.
