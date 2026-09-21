# Independent chat release review — 2026-09-21

Reviewed baseline: `106614a` (including `cacf9cb`). Verdict: **hold the release**.
No production data, migrations, accounts, AI configuration or release assets were changed.
All reproduction inputs are synthetic.

## Executed checks

- Existing unit suite: 102 passed.
- SQL integration suite: 42 passed against local PGlite, not the live backend.
- Consistency checker: 52 passed; these are static checks.
- Typecheck and production build: passed.
- Dependency audit: zero reported vulnerabilities.
- Playwright: all 18 cases reported passing, desktop and mobile. Runner remained alive
  after the last case; do not represent this as a clean process exit.
  These tests cover previews, anonymous access, localization and redirects. They do NOT
  exercise an authenticated conversation, upload, confirmation or cross-account retrieval.
- Read-only live backend checker: existing 11 tables deny anonymous reads; migrations
  006 and 007 remain PENDING. Conversation persistence is therefore not ready live.
- Added independent regression suite: **6 executed, 6 failed**:
  `node --test tests/review/chat-release.test.ts`.

## Release blockers reproduced by executing the parser

### P1: Different measurements borrow the same number

`packages/domain/measurements.ts:146` accepts any number within 40 characters of a keyword,
then keeps the first candidate for each kind. It does not bind each number to its own label.

| Synthetic input | Expected | Actual |
|---|---|---|
| weight 80 kg, pulse 72 | pulse 72 | pulse 80 |
| pulse 72, temperature 37.8 C | temperature 37.8 | temperature 72 |
| temperature 37.8 and weight 78 | weight 78 | weight 37.8 |
| Сегодня вес 80 кг, пульс 72 | pulse 72 | pulse 80 |
| משקל 80 קג, דופק 72 | pulse 72 | pulse 80 |

These become proposed facts that a user can confirm. The review step does not make the
extraction correct. Bind values and units to their actual labels; preserve ambiguity rather
than guessing. Add mixed-measurement cases to the normal test suite.

### P1: An unspecified temperature scale becomes Celsius

`температура 98.6 градусов` yields `98.6 °C`, with no clarification needed.
The IMPLIED table at `packages/domain/measurements.ts:116` assumes Celsius for Russian and
Hebrew words meaning degrees. Keep the scale unknown until explicitly supplied. The existing
unit test currently endorses this guess and must be corrected, not used as evidence of safety.

## Additional findings from source inspection (not browser fault injection)

- **P1, inaccurate privacy disclosure:** `aiOff` in `apps/web/lib/i18n.ts` says nothing typed
  leaves this computer. Conversation actions persist text to hosted Supabase; attachments
  upload to hosted Storage, even with AI off. Explain shared cloud storage separately from
  whether content is sent to an AI provider, in all three languages.
- **P1 before enabling AI, false reading claim:** `planReply` selects `replyAttachmentQueued`
  when an attachment is stored and the assistant is available. Its text is “I am reading it
  now.” There is no document reader or processing job. Enabling provider configuration will
  not implement document or photo reading. Remove this claim until real processing exists.
- **P2, retry can resend uploaded bytes:** `Conversation.uploadIfNeeded` remembers the
  document ID only AFTER finishUpload succeeds. If Storage succeeds but verification fails,
  Retry starts a new reservation/upload. Preserve the pending ID and resume verification.
- **P2, network failures can leave controls stuck:** sendMessage and reviewFact calls in the
  client lack try/finally cleanup. A transport rejection can leave phase/busy set indefinitely.
  Add fault-injected browser tests for connection loss and restored retry.
- **P2, partial persistence:** person message, assistant message and facts are separate writes.
  An assistant-write failure leaves the person message stored, and retry can duplicate it;
  fact insertion errors are silently ignored. Add idempotency/atomic persistence and report
  any partial failure honestly. Verify by injecting failures between writes.

## What remains unverified or unimplemented

No signed-in live chat, cross-computer memory, authenticated chat attachment workflow or
AI response was verified in this review. Current AI integration sends the current question
and reviewed conversation facts; it does not read uploaded documents/photos or incorporate
the full medical record. Merely supplying a key does not complete the requested product.

## Handoff to Claude

1. Read this report and run the six regression tests. Fix their causes; keep unknown units
   unknown, and expand tests to mixed EN/RU/HE measurements and ambiguous phrases.
2. Correct privacy and attachment claims. Fix retry, transport failure and partial-write
   handling, with behavioral tests rather than source-string assertions.
3. Run existing suites and the new regression suite. Preserve historical safety evidence.
4. Apply 006/007 through the documented dashboard process when proceeding with deployment,
   then test using synthetic data and authorized accounts. Never request passwords in chat.
5. Verify actual signed-in send, confirm, correct, attach, interrupted upload/retry and
   second-account retrieval. Record actual results and limits.
6. Treat document/photo interpretation and personalized AI guidance as unfinished work.
   Implement and evaluate them before claiming those features ready; keep medical AI off
   until the required safety and behavioral release gates are satisfied.
7. Publish a stamped Windows release only after applicable blockers and acceptance tests
   are resolved. Preserve previous releases and document remaining limitations.

Development model guidance remains GPT-6 Astra with High reasoning, Extra High for safety
and security review. This is not a Claude model identifier or a change to model settings.
