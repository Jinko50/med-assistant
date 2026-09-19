# Med Assistant — move to another computer

This package contains the current app source, the earlier safety work, Git history, and setup/handoff instructions. It does **not** contain credentials, installed dependencies, real patient data, a configured database, or the Codex conversation.

The app has a working fictional patient/caregiver preview. Real sign-in and saving require a separately configured Supabase test project. Medical AI chat, document extraction and patient release checks are still unfinished. Do not treat this as a finished medical app.

## On Windows

1. Extract this ZIP into a normal folder, not inside the ZIP viewer.
2. Install Git, Node.js 24.16+ in the 24.x line, Python 3.12+, and Codex if continuing development. Close and reopen PowerShell after installation.
3. Open PowerShell in the extracted Med-Assistant-Transfer folder. Restore to a **new** destination:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\RESTORE_WINDOWS.ps1 -Destination "$env:USERPROFILE\Desktop\Med_Assistant\med-assistant"
```

This only bypasses script restrictions for this invocation; it does not change your computer's execution policy permanently. Review the script first. It checks file hashes, restores history and overlays current source; it refuses an existing destination. If managed-device policy blocks scripts, follow your administrator's policy.

4. In the restored repository, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-preview.ps1
```

5. Open the URL printed by the launcher. Leave that terminal open; Ctrl+C stops the app.
6. To continue development, open the **restored med-assistant folder** as a project in Codex, select **GPT-6 Astra / High**, and paste the starter prompt in docs/NEXT_DEVELOPER_HANDOFF.md.

Detailed instructions: source/med-assistant/docs/COMPUTER_TRANSFER.md. Backend setup: source/med-assistant/docs/SUPABASE_SETUP.md. Current status: source/med-assistant/STANDALONE_READINESS.md.

## On macOS/Linux

Install Git, Node 24.16+ (24.x), Python 3 and a supported browser. From this extracted folder:

```sh
git clone med-assistant-history.bundle ~/Med_Assistant
cp -R source/med-assistant/. ~/Med_Assistant/
cd ~/Med_Assistant
git remote remove origin
sh scripts/setup-posix.sh
ENABLE_FICTIONAL_PREVIEW=true MED_ASSISTANT_PREVIEW_ONLY=true npm run start
```

Open http://127.0.0.1:3000/ru/preview/patient. Windows was the source environment; macOS/Linux setup has not been executed here.
