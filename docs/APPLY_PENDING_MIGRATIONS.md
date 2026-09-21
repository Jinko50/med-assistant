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

## After applying, the journey that still needs a signed-in person

This is the one acceptance test nobody has run against the live project, because it needs the
account holders' own passwords. Do not put a password in a chat message; type it into the
sign-in screen yourself.

1. Sign in and land on the conversation.
2. Type, in Russian: `Сегодня утром давление 135/80, пульс 72`.
   The reply should say what it read, and show two small confirmations.
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
