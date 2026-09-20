# Connected Windows account-testing build

Download **Med-Assistant-Windows-x64.zip**, choose **Extract All**, and double-click
**Start Med Assistant.cmd**. Windows 10/11 x64; no Node, Python, Git or Codex installation.

This build connects to the configured Supabase project. It includes account registration,
an admin portal to approve emails and assign patient/caregiver roles, access revocation,
shared records and history, plus private PDF/JPEG/PNG uploads up to 10 MB. Admins must be
assigned by the Supabase project owner; each editor also needs caregiver access to the record.
Confirmation now returns to a reachable public landing page. New passwords require at least
6 characters, the hosted provider minimum. Existing passwords are unchanged.

Follow [installation and account administration](https://github.com/Jinko50/med-assistant/blob/main/docs/INSTALL_AND_ADMIN.md).
Live two-account login/save/upload tests remain pending. Only use fictional
records for acceptance testing. Medical AI, document extraction, recovery and production release gates are
unfinished; this is a prerelease, not a patient-ready medical assistant.

The ZIP contains public app connection settings and a bundled runtime, but no database
password or privileged keys. It listens only on this computer. The app is unsigned.
Keep the console open while testing. Close it to stop the app.

Open the record, then Documents to upload or download. Originals are private and immutable
through the app; uploads are not interpreted or promoted to medical facts. Malware scanning
is not implemented. Signed download links expire after 60 seconds.
