# FUTURE ARCHITECTURE

**Nothing in this document is to be built.** It exists so the pilot can be evaluated against a realistic idea of what "next" would cost, and so Phase 1 decisions do not quietly foreclose Phase 2.

---

## 1. What the pilot is really testing

The pilot is not testing whether an LLM can answer medical questions. It obviously can. It is testing three things a standalone app cannot fix:

1. **Will an 84-year-old actually initiate contact with it, unprompted, repeatedly?**
2. **Does longitudinal context produce answers visibly better than a generic chatbot's?**
3. **Does the low-question discipline survive contact with real, messy, incomplete input?**

If the answer to (1) is no, no amount of engineering helps and Phase 2 should not happen. If (2) is no, the context-file model needs redesign before any code is written. If (3) is no, the question engine is the thing to fix, not the platform.

## 2. Limits of the ChatGPT-native approach

These are the constraints that would eventually justify building something:

| Limit | Impact | Severity |
|---|---|---|
| **The model cannot write to project files** | Every durable fact requires a human to copy-paste. The record decays the moment the family gets busy | **The dominant limitation** |
| No reliable structured memory | Recall across chats within a project is helpful but not guaranteed or inspectable | High |
| No proactive messaging | The assistant can never check in, remind, or follow up. It only reacts | High |
| No alerting | A red-flag exchange at 3am reaches nobody but the patient | High |
| Voice is generic | No control over speech rate, repetition, or confirmation for a hard-of-hearing user | Medium |
| No structured data | Trends over blood pressure or labs are reconstructed from prose each time | Medium |
| Instruction length limits | The prompt must stay compact; nuance gets pushed into uploaded files | Medium |
| Shared-project access is all-or-nothing | No separation between what the patient sees and what family discusses | Medium |
| Not a compliant record | Blocks any use beyond one consenting family | High, for scale only |

## 3. Trigger conditions for Phase 2

Build only if, after the pilot:

- The patient used it voluntarily and would object to it being taken away; **and**
- The family found the write-back burden to be the main friction — meaning the problem is now an engineering problem; **and**
- At least one clinically useful catch occurred that would otherwise have been missed; **and**
- No unsafe outputs occurred in real use.

If the patient did not use it, the correct Phase 2 is a different product, not a bigger one.

## 4. Target architecture sketch (Phase 2)

```
   Patient                         Family
  (voice, photo)                 (web / mobile)
        │                               │
        ▼                               ▼
  ┌───────────────────────────────────────────┐
  │              Conversation layer            │
  │  intake · language detect · mode detect    │
  └───────────────┬───────────────────────────┘
                  │
     ┌────────────┴─────────────┐
     ▼                          ▼
┌──────────────┐        ┌───────────────────┐
│ Safety/triage │◀──────│  Reasoning core   │
│   screener    │       │  (LLM + context)  │
└──────┬────────┘       └─────────┬─────────┘
       │                          │
       │                 ┌────────▼──────────┐
       │                 │  Patient record    │
       │                 │  structured store  │
       │                 │  meds · labs ·     │
       │                 │  timeline · plan   │
       │                 └────────┬──────────┘
       │                          │
       ▼                          ▼
┌──────────────┐        ┌───────────────────┐
│  Escalation  │        │  Write-back agent  │
│  notify family│       │ (auto record keep) │
└──────────────┘        └───────────────────┘
```

**The two components that actually change the product** are the structured patient record and the automatic write-back agent. Everything else is convenience. If Phase 2 delivers only those two, it is already worth building.

## 5. Component notes

**Structured record.** Medications, labs, vitals and events as typed rows, not prose. Enables trends, interaction checking against a real list, and "this is the third time this month" without re-reading everything.

**Write-back agent.** Extracts durable facts from each exchange, proposes a structured update, applies it after family approval. Removes the pilot's dominant friction.

**Triage screener as a separate pass.** Red-flag screening should not depend on the same generation that is trying to be brief and warm. A dedicated, cheap, deterministic-ish screen runs first and can force escalation.

**Escalation channel.** A red-flag exchange notifies the family immediately, out of band. This is the single largest safety upgrade over Phase 1.

**Proactive layer.** Gentle, rare check-ins, driven by the care plan rather than by a schedule. Must inherit the anti-nagging rules or it will destroy the product.

**Ingestion.** Photograph → document classifier → conservative extraction → human confirmation for anything that will be stored as `CONFIRMED`.

## 6. Cost reality (for planning only — do not spend)

| Item | Rough monthly order of magnitude, one patient |
|---|---|
| LLM inference | Low tens of dollars at realistic volumes, with image input the main driver |
| Hosting + database | Single-digit dollars at this scale |
| Notification delivery | Negligible |
| Compliance, if ever multi-family | Dominates everything above, by a wide margin |

The technology is cheap. Compliance, liability and support are the real costs, and they arrive the moment there is a second family.

## 7. What Phase 1 must not foreclose

Decisions taken now that keep Phase 2 cheap:

- Context files are **structured Markdown with stable field names**, so they can be parsed into a database later rather than re-entered.
- Provenance levels are defined now, so history imported later carries its certainty with it.
- The timeline is **append-only with explicit dates**, which is exactly what a structured store wants.
- Triage tiers are named and stable, so a future screener can be evaluated against the same test suite.
- The test suite in `/tests` is written as behaviour, not as prompt text, so it survives a platform change unchanged.

## 8. Alternatives worth considering before building anything

- **Stay on ChatGPT, fix the friction with process.** One family member does a five-minute file update every Sunday. Costs nothing, solves 70% of the write-back problem.
- **A thin write-back helper only.** A tiny local script that appends to the Markdown files from pasted blocks. Days of work, no hosting, no compliance surface.
- **Do nothing further.** If the pilot shows the patient does not want this, that is a successful outcome — it cost documents, not a product.
