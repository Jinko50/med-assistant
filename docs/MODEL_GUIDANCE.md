# Model recommendation — checked 2026-09-19

User preference: always advise which model to use as development progresses.

**Development in Codex:** GPT-6 Astra, High reasoning for implementation. Extra High for architecture, server authorization, database policy and safety review. These effort choices are engineering recommendations, not evidence of medical correctness. The current task's model settings were not changed by code.

**Inside the future app:** start evaluation with the OpenAI API model gpt-6-astra using the Responses API. Establish quality on the full fictional suite, then measure latency/cost and compare alternatives before choosing production configuration. The app currently makes no model API calls, so no API key or AI charges are required to run the current preview.

OpenAI describes Astra as its most capable model for complex reasoning and coding, supports configurable reasoning effort, text/image inputs and structured outputs. Source: [official model page](https://developers.openai.com/api/docs/models/gpt-6-astra). This is a capability recommendation, not a medical validation claim. API account availability remains unverified. Use the API for app integration; a ChatGPT/Codex model selection does not configure the application backend.

For every future release bind actual model identifier, reasoning configuration, system policy hash, build and fictional dataset to observed outputs. Changing model, effort or policy requires regression testing. Emergency handling must precede the provider call. No smaller/faster model is automatically safe enough simply because the UI works.
