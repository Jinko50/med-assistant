# PRIVACY

Phase 1 is a pilot running inside a consumer ChatGPT account. That has real privacy consequences, and the family should make the decision with those consequences visible rather than assumed.

---

## 1. What is actually happening

The patient's medical information is:

- typed, spoken or photographed into ChatGPT;
- stored as files inside a **Shared Project** in a consumer ChatGPT account;
- transmitted to and processed on OpenAI's servers;
- visible to **every person who has access to that Shared Project**.

There is no separate database, no encryption controlled by the family, and no audit log beyond ChatGPT's own chat history.

## 2. What this is not

- **Not HIPAA-covered.** A consumer ChatGPT account is not a covered entity or business associate arrangement. Do not treat this pilot as a compliant system for anyone else's data.
- **Not GDPR-engineered.** There is no data processing agreement, no defined retention policy, no data subject access mechanism beyond the account owner's own controls.
- **Not a medical record.** It has no legal standing and should never be the only copy of anything.

For a pilot involving one consenting family and one patient, this is a reasonable trade-off. For anything wider, it is not — see `FUTURE_ARCHITECTURE.md`.

## 3. Consent

Before the pilot starts:

1. The patient is told, in Russian, in plain words: what is being stored, that family members can see everything in it, that the information goes to a company's servers outside the family, and that they can stop at any time.
2. The patient agrees. If the patient's capacity to consent is in question, the family member with legal authority decides, and the patient is still told.
3. The patient is told **who** has access — by name — and is told again whenever that changes.

A patient who does not know the family is reading everything has not consented.

## 4. Access control

| Decision | Recommendation |
|---|---|
| Who is in the Shared Project | The smallest possible set: the patient's primary caregiver, plus at most one or two others |
| Adding someone | Requires the patient's knowledge |
| Removing someone | Remove immediately when a person's role ends; they retain nothing further, but may have seen everything up to that point |
| Account ownership | One family member owns it. Write down the recovery path — losing access to the account loses the record |

There is no per-file permission inside a Shared Project. Everyone sees everything. Design the file contents accordingly.

## 5. Data minimisation

Put in the project only what the assistant needs to give better answers.

**Include:** diagnoses, medications, allergies, relevant labs, symptoms and events, care plan, practical context.

**Consider excluding, or reducing:** full national ID numbers, insurance numbers, full home address, financial information, and any historic diagnosis with no bearing on current care — particularly sensitive categories (psychiatric history, reproductive history, HIV status, addiction history) unless they genuinely affect current treatment.

**Never include:** other people's medical information. Family history should be written as "mother had X", never as a named third party's record.

## 6. Photographs

Photos of documents frequently carry more than the family intends — ID numbers, addresses, insurance identifiers, other patients' names on a shared clinic printout, and in some cases the full name and licence number of the physician.

Practical guidance:
- Crop or cover ID numbers before uploading where it is easy to do so; do not make this a burden on the patient.
- The assistant must not transcribe an ID number, passport number or insurance number into its reply or into a write-back block. It has no clinical use.

## 7. The patient's own controls

- The patient may ask for anything to be deleted. The family deletes it from the file and, where possible, from chat history.
- The patient may stop the pilot at any time, without justification.
- The patient may ask what is stored about them, and is entitled to a plain-language answer.

## 8. Account hygiene

- Turn on two-factor authentication on the account.
- Use a strong, unique password. Do not share a login where a proper project invitation will do.
- Review ChatGPT's data controls, including whether chats may be used to improve models, and set them deliberately rather than by default.
- Keep an offline backup of the seven context files. They represent real work by the family, and losing the account should not lose them.
- Periodically check who still has access.

## 9. Assistant-side rules

These are carried in the system prompt and `SAFETY_RULES.md`:

- Patient data is not disclosed outside the project.
- An unidentified person in the chat gets no patient information.
- Identifiers with no clinical value are not echoed back.
- Sensitive history is not restated in summaries unless clinically necessary for the recipient.

## 10. Honest residual risk

The realistic risks in this pilot, ranked:

1. **Family over-access.** The most likely harm is not a breach — it is an elderly person losing medical privacy from their own children, quietly and permanently. Discuss it explicitly.
2. **Account compromise.** A weak password on the owning account exposes the whole record.
3. **Vendor-side processing.** The data is on a third party's infrastructure under consumer terms that can change.
4. **Accidental disclosure in photos.** Third-party names and identifiers travelling along with a document.
5. **Loss.** No backup means the record disappears with the account.

None of these is a reason not to run the pilot. All of them are reasons to run it consciously, with one patient, for a limited time, and to build something properly scoped if it works.
