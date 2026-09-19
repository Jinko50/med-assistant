# Connected Windows account-testing build

Download **Med-Assistant-Windows-x64.zip**, choose **Extract All**, and double-click
**Start Med Assistant.cmd**. Windows 10/11 x64; no Node, Python, Git or Codex installation.

This build connects to the configured Supabase project. It includes account registration,
an admin portal to approve emails and assign patient/caregiver roles, access revocation,
shared records and history. Admins must be bootstrapped by the Supabase project owner.

Follow [installation and account administration](https://github.com/Jinko50/med-assistant/blob/main/docs/INSTALL_AND_ADMIN.md).
Email delivery configuration and live two-account tests remain pending. Only use fictional
records. Medical AI, document upload/extraction, recovery and production release gates are
unfinished; this is a prerelease, not a patient-ready medical assistant.

The ZIP contains public app connection settings and a bundled runtime, but no database
password or privileged keys. It listens only on this computer. The app is unsigned.
Keep the console open while testing. Close it to stop the app.
