# Windows installation and fixed-account administration

## Release status

The connected test release supports account registration, an administrator portal,
approved email roles, and shared record storage. It is not yet a patient-ready medical
assistant. Live registration/email delivery and two-account acceptance tests remain
required, along with the safety, clinical and operational gates in STANDALONE_READINESS.md.
Private PDF/JPEG/PNG original uploads are implemented (10 MB per file). Medical AI and
document extraction are not implemented. Use fictional records for acceptance testing.

## 1. Download on each Windows laptop

1. Open https://github.com/Jinko50/med-assistant/releases and choose the connected test release.
2. Under Assets, download `Med-Assistant-Windows-x64.zip`. Do not choose Source code.
3. Right-click the ZIP and choose **Extract All**. Keep all extracted files together.
4. Open the extracted folder and double-click **Start Med Assistant.cmd**.
5. The app opens in your browser. Keep its console window open; close it to stop the app.
6. Internet is required for login and shared records. No Node, Python, Git or Codex installation is needed.

The connected ZIP contains the project URL and publishable key, which are public app
configuration. It does not contain any database password or privileged key. Never copy
`.env.local`, passwords or administrator credentials into the public repository.

## 2. Establish your administrator account once

1. In the app, choose **First time? Set up your approved account**.
2. Use your own email and choose a unique password of at least 6 characters. Supabase does not support a four-character minimum.
3. Confirm your email. Then return to the app and sign in. You initially have no patient access.
4. As project owner, open Supabase **Authentication → Users**. Confirm your exact email is verified.
5. Open `database/bootstrap-admin.sql` from this repository. Replace only
   `REPLACE_WITH_YOUR_VERIFIED_ADMIN_EMAIL` with your email.
6. Run that script once in the project's **SQL Editor**. It grants administration only
   to an existing verified account, and refuses to run if an active administrator already exists.
7. Return to the app and sign in again. You should arrive at **Account administration**.

Do not give your dad or caregivers Supabase project-owner access. They need only app accounts.
If the project owner has already assigned your administrator account, skip the bootstrap
steps and sign in with your existing password. Do not register the same address again.
Do not approve an email unless you know who controls it. The administration portal is
currently in English; patient/caregiver record views support Russian, Hebrew and English.

## 3. Define the patient and caregivers

1. In **Account administration**, create a patient record using a display name.
2. Under that patient, enter the patient's exact email and choose **Patient — read only**.
3. Leave Access as **Enabled** and click **Approve email address**.
4. Add each caregiver's email separately and choose **Caregiver — maintain records**.
5. If you will also edit the record, add your own admin email as a caregiver. Administrator
   status alone does not grant access to medical record contents.
   A patient who should edit and upload documents must also use the **Caregiver — maintain records**
   role. This describes editing permissions; the shared record can still be that person's record.
6. Each approved person opens the app, sets up their account, confirms their email, and signs in.
7. An account awaiting email confirmation is shown as pending. After verified sign-in,
   its approved role is linked to its identity. Registration alone never grants access.

There can be one enabled patient email for a record and multiple caregivers. Other email
addresses can create Auth accounts while public signup is enabled, but cannot access any
patient. If you also need to block creation of unapproved Auth identities entirely, configure
and test a Supabase before-user-created allowlist hook; that additional control is not enabled.

## 4. Change or revoke access

1. Open Account administration (replace `/ru/login` in the app address with `/ru/admin` if needed).
2. Find the email under the relevant patient.
3. Change Role, or change Access to **Revoked**, and click **Save account access**.
4. Changes apply on the next server request, including to existing signed-in sessions.
   Content already visible in someone's browser cannot be remotely erased.
5. Recent access changes appear in the audit list. Refresh before retrying a stale-change error.

Revocation retains the record/history and prevents future access; it does not delete the Auth account.
Administrator additions, recovery and revocation remain project-owner operations in Supabase.

## 5. Email delivery setup (required before family signup)

Supabase's default email sender only delivers to project team members. Configure your own
SMTP sender under **Authentication → Emails** before asking your dad or caregivers to register.
Keep email confirmation enabled. Do not add family members as project administrators to
bypass this limitation. Follow https://supabase.com/docs/guides/auth/auth-smtp and test delivery
with a real non-team mailbox. This sender has not been configured by this repository.

The configured confirmation landing page is https://jinko50.github.io/med-assistant/confirmed.html.
After confirming, reopen the installed app and sign in. The public landing page does not log
you in or store authentication tokens. Older messages may retain a localhost redirect: if
Supabase shows the address as confirmed, simply sign in. Password recovery remains unfinished.

## Documents

From Account administration choose the record link, then **Documents / Документы / מסמכים**.
Choose a PDF, JPEG or PNG (up to 10 MB) and click **Upload document**. Both assigned editors
can upload and download originals. Files are private in Supabase, never uploaded to GitHub.
Uploads do not extract or confirm medical facts. File signatures are checked, but malware
scanning is not provided. Originals cannot be overwritten/deleted through this release.
A pending entry indicates an incomplete transfer or finalization; ask the project owner to
inspect it. Downloads use links valid for 60 seconds; an already issued link can remain valid
for that period after revocation. Previously downloaded copies cannot be revoked.

## 6. Acceptance check before entering real records

Using fictional information, verify admin approval, caregiver login/save, patient login/read,
history, stale edits, role change and revocation across two separate browsers/computers.
Verify email delivery, recovery, backups and restoration. The checked-in SQL tests verify
policy behavior; they do not replace live Auth testing or the medical release review.
