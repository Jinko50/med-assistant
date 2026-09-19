# HEALTH TIMELINE

> Append-only dated log. This is the file that makes the assistant longitudinal rather than transactional.
> Maintained by family, by pasting in the **PENDING** blocks the assistant produces.
>
> **Nothing the assistant suggests is saved until a person pastes it here.** It cannot write to this file and must never say it has recorded, logged or remembered anything.
>
> Upload as `HEALTH_TIMELINE.md`. Everything below the `EXAMPLE` line is fictional and can be deleted.

**Last updated:** YYYY-MM-DD by ______

## Format

One line per event. Newest **last** (append at the bottom), so the order matches how it happened.

```
YYYY-MM-DD [HH:MM] | what happened | provenance | notes
```

**Provenance** — one of:
`документ / documented` · `со слов / reported` · `на фото / seen in photo` · `примерно / estimated` · `неизвестно / unknown`

There is no "assumption" label. An unknown safety-relevant fact is recorded as unknown, never as a guess. `документ / documented` means a dated document in this project said so — not that it is still true today.

**Measurements carry their units:** `АД 158/92 mmHg`, `сахар 140 mg/dL`, `вес 66.4 kg`, `температура 38.1 °C`.

**Do not edit or delete past lines.** If something turns out to be wrong, add a new line correcting it.

## What is worth logging

- Symptoms, and when they started and stopped
- Measurements, always with units: blood pressure, pulse, blood sugar, weight, temperature
- Reported medication intake, missed doses, extra doses — and what a pharmacist or clinic advised
- Falls, near-falls, dizziness
- Appointments and what was decided
- New medications, changed doses, stopped medications
- Notable meals only when they matter clinically (a large vitamin-K meal on warfarin, for example)
- Mood, sleep, appetite, energy — these matter at 84
- Anything the family noticed on a visit

## What is not worth logging

Small talk, reassurance, normal days without anything to record.

## Entries

```
```

---

## EXAMPLE (fictional — delete before use)

```
2026-07-14 09:00 | Admitted to hospital, breathless, legs swollen | документ | Rambam, 5 days
2026-07-19 14:00 | Discharged. Furosemide 20 mg started, hydrochlorothiazide stopped | документ | discharge letter (Hebrew), uploaded
2026-07-22 08:30 | АД 138/84 mmHg, пульс 74 | со слов | first home reading after discharge
2026-07-28 | Weight 66.4 kg, down from 68 kg | со слов | fluid coming off, as expected
2026-08-02 | Prescription photographed; medication list reconciled | на фото | all six products checked line by line
2026-08-11 19:00 | Forgot evening warfarin, remembered next morning | со слов | called the anticoagulation clinic line; followed their instruction
2026-08-19 | Complained of leg cramps at night, twice this week | со слов | possible low potassium — noted for GP
2026-09-02 | Labs: INR 2.4, Hb 11.2 g/dL ↓, K 3.4 mmol/L ↓, eGFR 50 ↓ | документ | lab report photographed
2026-09-03 11:00 | Knee pain, took paracetamol 500 mg | со слов | asked about ibuprofen; NSAIDs are a standing contraindication, referred to the pharmacy
2026-09-07 08:00 | АД 158/92 mmHg, пульс 78 | со слов | higher than usual; repeat tomorrow
2026-09-08 08:15 | АД 141/86 mmHg, пульс 76 | со слов | back near baseline; single high reading, not a trend
2026-09-08 09:00 | Furosemide box reads 40 mg; discharge letter says 20 mg | на фото | CONFLICT, unresolved — see CURRENT_MEDICATIONS.md
2026-09-12 | Dizzy on standing, twice, in the morning | со слов | new; furosemide + low potassium both relevant
2026-09-15 10:00 | GP appointment. Potassium to be rechecked in 2 weeks. No medication change. | документ | daughter attended; clinic note photographed
```
