# Pending upload verification repair — 2026-09-21

The user reported that v0.5.0 transferred a split PDF and then displayed `verifyFailed`.
Source inspection found that finishUpload calls Storage createSignedUrl before calling
finish_document, while migration 003 allowed SELECT only after state became uploaded.
That creates a circular dependency: verification cannot read the pending original.

Live dashboard inspection confirmed schema version 3, private bucket with a 10 MiB limit,
two pending metadata rows and two corresponding objects. Migration 004 had not been applied,
so the interface's advertised 50 MB ceiling also disagreed with the deployed backend.

Applied migration 004 and new migration 005 through the signed-in SQL dashboard in one
transaction. Verification returned schema version 5, file_size_limit=50000000, public=false.
Migration 005 permits only the original uploader, with current caregiver membership,
to read their pending original for verification. Other editors cannot read pending objects;
completed objects retain the existing shared-editor access. No overwrite/delete policy,
account role, or public bucket was introduced. Existing pending objects were preserved.

All 20 SQL integration tests passed, including the regression: pending original readable
by its uploader, denied to another editor, denied finalization by that editor, then readable
by the other editor after the uploader finalizes. Revocation/write protection tests pass.
These are PGlite tests; the dashboard checks prove deployment, not full Storage HTTP flow.

An attempted UI retry of the first user-selected split file could not be performed because
the browser file chooser rejected setFiles with `Not allowed`. No successful retry or download
is claimed. Ask the user to select Part 01 and upload once in their current v0.5.0 app;
no reinstall is required for these backend changes. Verify the resulting stored entry and
download link. Do not delete old pending transfers without an agreed cleanup procedure.

Do not reapply migrations 001–005: dashboard deployment is not recorded in CLI history.
Follow-up work: pending-upload retry/recovery UI, refresh the document list on a failed
verification, consistent 50 MB validation copy, and actual server-side content-size/digest
validation. Current finish_document checks object existence but does not compare size/digest;
do not describe client-reported hashes as verified integrity evidence.
