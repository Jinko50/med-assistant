# Pending migrations — what to apply, and what happens until you do

Verified read-only against the live project on 2026-09-21:

```
node --env-file=apps/web/.env.local tools/check-live-backend.mjs
```

That command reports every table it finds, and names by file any migration that has not been
applied. It only ever performs anonymous reads and it changes nothing.

| Migration | Adds | Applied to the live project |
|---|---|---|
| `001` – `005` | record, accounts, documents, 50 MB originals, pending-upload verification | yes |
| `006_wellbeing_checkins.sql` | `wellbeing_reports` | **no** |
| `007_conversation.sql` | `conversation_messages`, `conversation_facts`, `review_conversation_fact` | **no** |

## What is broken until they are applied

Nothing crashes, and nothing is lost, because both screens were written to degrade:

* The conversation loads, the composer works, and the first line in the log says the
  conversation is not set up in the database yet and asks you to apply the latest update.
  Messages are not stored, so nothing can be retrieved later.
* The check-in page still accepts a check-in but reports that it could not be saved, and the
  recent-check-ins list shows "unavailable" rather than an empty history.

Attachments are unaffected: uploading a document uses migrations 003–005 and already works.

## How to apply them

Both are **additive**. Neither alters an existing table, function, policy, account, grant or
bucket, and neither resets anything. Migrations 001–005 were applied through the dashboard
and are not registered in Supabase CLI migration history, so apply these the same way and do
**not** run `supabase db push` against this project without reconciling that history first.

1. Open the Supabase dashboard for the project, then **SQL Editor → New query**.
2. Paste the whole of `database/migrations/006_wellbeing_checkins.sql` and run it.
   It ends with `insert into public.schema_versions(version) values(6);`.
3. Repeat with `database/migrations/007_conversation.sql`. It ends with version 7.
4. Re-run the checker above. All three tables should then report
   `exists and denies anonymous reads`.

If a migration fails part-way it is inside a transaction and rolls back completely; fix the
reported error and run the whole file again rather than running fragments of it.

Migration 007 was **revised on 2026-09-21**, after the independent review and before it had
ever been applied anywhere, to add `client_token` and `post_conversation_turn`. If you took a
copy of the file before that date, discard it and use the one in the repository.

## After applying: run the acceptance suite

The signed-in journey is now an executable test rather than a checklist. It covers sign-in, a
Russian measurement message, Confirm, Correct, decline, an attachment, a fault-injected
connection loss with Retry, and retrieval by the second account.

```
set MED_ASSISTANT_TEST_PATIENT_ID=<the record to write into>
set MED_ASSISTANT_TEST_PATIENT_EMAIL=...
set MED_ASSISTANT_TEST_PATIENT_PASSWORD=...
set MED_ASSISTANT_TEST_CAREGIVER_EMAIL=...
set MED_ASSISTANT_TEST_CAREGIVER_PASSWORD=...
npm run test:acceptance
```

Set those in your own shell. Do not write them into a file in the repository, and do not put
a password in a chat message. With any of them missing all seven cases **skip** — a skipped
acceptance test proves nothing and must be reported as not run.

Point it at a **synthetic** patient record if you have one. It writes conversation lines into
whatever record you name, and a conversation line cannot be deleted by the application; that
is deliberate, and it is why the choice of record matters.

## The same journey by hand

Useful for judging whether it actually feels right to use, which no test can tell you. Do not
put a password in a chat message; type it into the sign-in screen yourself.

1. Sign in and land on the conversation.
2. Type, in Russian: `Сегодня утром давление 135/80, пульс 72, вес 80 кг`.
   The reply should say what it read, and show three separate confirmations — pressure
   135/80, pulse 72, weight 80. Check each number sits against its own label: an earlier
   version recorded the weight's 80 as the pulse.
3. Press **Confirm** on the blood pressure and **Correct** on the pulse; change the value and
   save. Check that the state changes to confirmed and corrected.
4. Attach a PDF. Watch for "sending the file", then "file uploaded", and check that the reply
   says plainly that the contents have **not** been read.
5. Sign out. Sign in on the other computer, as the other family account.
6. Open the Menu. **What you have confirmed** must list the blood pressure with `mmHg`, the
   corrected pulse, the person's own words about when, and the date — and must not list
   anything that was declined.

Record what actually happened, including anything that did not work. A step nobody performed
is not a passed step.
