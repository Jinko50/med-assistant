# PATIENT PROFILE

> Maintained by family. Upload to the ChatGPT Shared Project as `PATIENT_PROFILE.md`.
> Keep field names exactly as written — the assistant looks for them.
> Everything below the `EXAMPLE` line is fictional and can be deleted.

## Identity

| Field | Value |
|---|---|
| Name (as addressed) | |
| Date of birth | |
| Age | |
| Sex | |
| Lives in (city, country) | |
| Lives with | |

## Communication

| Field | Value |
|---|---|
| Default language | |
| Other languages understood | |
| Preferred form of address | |
| Main input method | voice / photo / text |
| Hearing | |
| Vision | |
| Reading small print | |
| Smartphone confidence | |
| Notes on what upsets or tires them | |

## Emergency

> **The emergency number is mandatory.** Without it the assistant cannot give a usable emergency instruction. Confirm it locally — see `../docs/OPEN_SAFETY_ISSUES.md` B-05.

| Field | Value |
|---|---|
| **Emergency number** | |
| Primary contact — name, relation, phone | |
| Second contact | |
| Family doctor — name, clinic, phone | |
| Health fund / insurance | |
| Nearest hospital | |
| Lives alone at night? | |
| Who has a key | |

## Clinical baseline

| Field | Value |
|---|---|
| Allergies (drug, food, other) + reaction | |
| Blood type | |
| Usual blood pressure (mmHg) | |
| Usual resting pulse | |
| Usual blood sugar range (state units) | |
| Usual weight (state units) | |
| Kidney function (eGFR, date) | |
| Liver function | |
| Mobility | |
| Fall history | |
| Cognitive status | |
| Swallowing (can they take large tablets?) | |
| Devices at home (BP monitor, glucometer, scales) | |

### Units used by this patient's devices — mandatory

> A number without a unit is not a measurement. Record what **their own meters actually display**, not what is conventional elsewhere. See `../docs/SAFETY_RULES.md` §2.4.

| Measurement | Unit their device shows | Example reading |
|---|---|---|
| Blood glucose | mg/dL or mmol/L | |
| Blood pressure | mmHg | |
| Temperature | °C or °F | |
| Weight | kg or lb | |

### Rescue medicines and written plans

> The assistant routes emergencies to *the patient's own plan*. If no written plan exists, record that fact here — otherwise it routes to nothing.

| Item | Do they have one? | Where is it kept? | Who is trained to give it? |
|---|---|---|---|
| Adrenaline auto-injector | | | |
| Hypoglycaemia (hypo) plan | | | |
| Glucagon | | | |
| Anticoagulation clinic plan | | | |
| Other rescue medicine | | | |

## Daily life

| Field | Value |
|---|---|
| Typical wake / sleep time | |
| Meal times | |
| Who prepares food | |
| Alcohol | |
| Smoking | |
| Activity level | |
| Help at home (carer, hours) | |

## Care preferences

- What the patient wants to be told directly:
- What the patient prefers family to handle:
- Known worries:

---

## EXAMPLE (fictional — delete before use)

| Field | Value |
|---|---|
| Name (as addressed) | Мария Ивановна |
| Date of birth | 1942-03-14 |
| Age | 84 |
| Sex | Female |
| Lives in | Haifa, Israel |
| Lives with | Alone; daughter visits weekly |

| Field | Value |
|---|---|
| Default language | Russian |
| Other languages understood | Hebrew (spoken, basic); documents often in Hebrew or English |
| Preferred form of address | «вы», Мария Ивановна |
| Main input method | Voice, then photos |
| Hearing | Mild loss, left ear |
| Vision | Reading glasses; cannot read package inserts |
| Smartphone confidence | Can send voice messages and take photos; cannot type long text |
| Notes | Dislikes being asked to remember dates. Does not want to feel tested. |

| Field | Value |
|---|---|
| **Emergency number** | 101 (Magen David Adom, Israel) — *fictional example; confirm locally* |
| Primary contact | Елена, daughter, +972-5X-XXX-XXXX |
| Second contact | Дмитрий, grandson, +972-5X-XXX-XXXX |
| Family doctor | Dr. Levin, Clalit Neve Sha'anan, +972-4-XXX-XXXX |
| Nearest hospital | Rambam Health Care Campus |
| Lives alone at night? | Yes |
| Who has a key | Daughter; neighbour Rina, flat 4 |

| Field | Value |
|---|---|
| Allergies | Penicillin — rash (1998). Sulfa — unknown reaction, reported only. |
| Usual blood pressure | 135–145 / 80–85 |
| Usual resting pulse | 70–80 |
| Usual blood sugar | 120–150 mg/dL fasting *(her meter reads mg/dL)* |
| Usual weight | 68 kg |
| Kidney function | eGFR 52 (2026-06-02) — mild-moderate impairment |
| Mobility | Walks with a stick outdoors, unaided indoors |
| Fall history | One fall, April 2026, no injury |
| Cognitive status | Oriented; short-term memory for dates is unreliable |
| Devices at home | Upper-arm BP monitor (mmHg), glucometer (**mg/dL**), bathroom scales (kg) |

| Rescue item | Status |
|---|---|
| Adrenaline auto-injector | None prescribed |
| Hypo plan | **None written** — open item for Dr. Levin |
| Glucagon | None |
| Anticoagulation clinic plan | Yes — card in her handbag, Clalit nurse line |
