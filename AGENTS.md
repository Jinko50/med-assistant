# Development continuity

- Preserve the safety documents, historical model outputs and fictional fixtures. Follow docs/STANDALONE_IMPLEMENTATION_PLAN.md and maintain STANDALONE_READINESS.md honestly.
- The user asks for a model recommendation at each major development stage. Recommend a model and reasoning level briefly; verify current official guidance when the recommendation changes. Current recommendation is GPT-6 Astra with High reasoning, Extra High for safety/security reviews. Do not claim to have switched the user's model.
- The final product is a standalone app for the patient and separately authenticated caregivers. A fictional preview is not a working patient deployment.
- Never commit secrets or real patient data. No model-generated medical advice before deterministic safety controls and actual behavioral tests. UNKNOWN must not be replaced by a guess.
- Read docs/COMPUTER_TRANSFER.md and docs/NEXT_DEVELOPER_HANDOFF.md when continuing on another computer. Preserve uncommitted source changes transferred alongside Git history.
