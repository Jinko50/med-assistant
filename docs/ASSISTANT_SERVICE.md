# The assistant service — what it would send, to whom, and why it is off

**Status: not configured.** No model provider has ever been called by this application. No
generated answer has ever been observed, so nothing in this repository claims anything about
how a model behaves here.

## What works with no provider at all

The conversation is not a shell around a model. With nothing configured it still:

* reads blood pressure, pulse, temperature, weight, blood sugar and oxygen saturation out of
  free text in Russian, Hebrew and English (`packages/domain/measurements.ts`);
* runs the deterministic safety screen before anything else and escalates on its own
  (`packages/domain/safety.ts`);
* uploads and stores a document up to 50 MB, straight from the browser to private Storage;
* proposes what it read, lets a person confirm or correct it, and retrieves exactly that in a
  later conversation on another computer.

What it cannot do without a provider is answer a free question and read the contents of a
document or a photograph. It says so, in those words, rather than producing sympathetic text
that reads like an answer.

## The two gates

`apps/web/lib/assistant.ts` is the only file permitted to contact an external provider. Both
gates must be open:

| Variable | Meaning |
|---|---|
| `MED_ASSISTANT_AI_PROVIDER` | `anthropic` — the only implemented provider |
| `MED_ASSISTANT_AI_MODEL` | the model identifier to call |
| `MED_ASSISTANT_AI_KEY` | the API key |
| `MED_ASSISTANT_AI_CONSENT` | must equal the provider name, e.g. `anthropic` |

Configuration alone is deliberately not enough. A key that happens to be present in an
environment must not silently begin transmitting an 84-year-old's symptoms; the consent
variable is a second, explicit act by whoever operates the installation, and because it names
the provider, changing provider revokes it.

All four are read from the **server** environment at run time. None is compiled into the
build, bundled into the Windows ZIP, or committed. A downloaded release with no environment
simply reports the service as unavailable.

## Who would receive what

With the gates open, and only when a person asks a free question:

* **Recipient:** Anthropic PBC, `https://api.anthropic.com/v1/messages`.
* **Sent:** the question as typed, plus the measurements that a person has already
  **confirmed or corrected** — formatted as short lines such as
  `Blood pressure: 135/80 mmHg (this morning) — 2026-09-21`.
* **Not sent:** proposed-but-unreviewed readings, the medical record, uploaded documents or
  photographs, file names, email addresses, account identifiers, or any patient name.

The system prompt states that the context is data and never instructions, that answers must
come only from the context, that no diagnosis or medication change may be given, and that no
measurement, unit, date, threshold or medical fact may be invented. That is a constraint on
the request, not a guarantee about the response — output checking is unwritten and is listed
as unfinished in `STANDALONE_READINESS.md`.

The conversation screen shows which company receives the text whenever the gates are open,
and says "nothing you write here leaves this computer" when they are not, so the question is
answerable from the screen rather than from this file.

## Before switching it on

1. Obtain the patient's agreement, in their own language, to their health questions being
   sent to a named company outside the household.
2. Decide and record how long the provider retains request data, under which account.
3. Only then set the four variables, on the machine that runs the launcher.

Switching this on does not close any clinical blocker. `docs/OPEN_SAFETY_ISSUES.md` still
applies, and B-01 and B-02 — clinician and pharmacist review — remain open.
