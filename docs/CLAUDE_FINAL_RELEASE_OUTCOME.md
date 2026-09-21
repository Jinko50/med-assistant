# Final release outcome — Claude Code

Updated 21 September 2026, after the live upload failure in
`docs/UPLOAD_FAILURE_REPRODUCTION.md` and the RELEASE HOLD in
`docs/CLAUDE_RELEASE_REVIEW.md`. Supersedes the 20 September entry below.

**Outcome: RELEASE HELD. The upload failure is reproduced, root-caused and repaired, but
the repair has not been retested by a real signed-in upload and download.**

Model used: **Claude Opus 5** (`claude-opus-5`), the model configured in this session.
Recommendation for the next stage: stay on Opus 5 at high reasoning for the repair-retest
and release work, and use extra-high specifically for any security or authorization review.
I did not change your model. Codex's GPT-6 Astra / High recommendation is not a Claude model.

## What actually broke

Reproduced against a built server with **synthetic bytes only**. Your document was never
read, stored or transmitted, and no test uploads it.

The investigation lead was half right, so here is the corrected mechanism:

1. A request body larger than Next's `proxyClientMaxBodySize` is **not refused with a 413**.
   It is silently **truncated** — `Request body exceeded 10MB … Only the first 10MB will be
   available`.
2. The truncated multipart payload then fails to parse: `Failed to parse body as FormData`
   / `expected boundary after body`.
3. That error is thrown while the request is parsed, **outside `uploadDocument`'s
   try/catch**, so it became an unhandled 500 — your full-page server error.

The important part, which the size mismatch alone hid: the default limit is exactly
10,485,760 bytes, **identical to the app's own 10 MiB cap**. So uploads at or just below
the supported maximum were broken too. This was not only a "you picked too big a file"
problem; a legitimate maximum-size document would have failed the same way.

## Repairs, and the evidence for each

| Repair | Evidence |
|---|---|
| The browser refuses an oversized file and sends nothing. React does not run a form action when the submit event is default-prevented (verified in the installed React DOM source), and the button is disabled while a file is refused | 11 tests in `tests/unit/upload-limits.test.ts`, including exact-boundary sizes |
| Choosing a different file clears the refusal, so the user can retry without reloading | Re-decided on every selection; covered by test |
| The server repeats the size check before any authorization, storage or network work, and never trusts the browser | Call-site ordering asserted by test |
| Framework request limit raised to 12 MiB, leaving headroom for multipart framing above the 10 MiB cap | Probed a built server at 9/10/11 MiB before and after. **Before:** the 10 and 11 MiB bodies were truncated and failed to parse. **After:** no truncation, all reach the application. Confirmed inside the packaged artifact as 12,582,912 bytes |
| A localized error boundary replaces the untranslated full-page error, with a retry, in all three languages, leaking no internal detail | `apps/web/app/[locale]/error.tsx`, covered by test |
| The refusal message is translated into EN/RU/HE | Covered by test |

Reproduce with `node tools/check-upload-limits.mjs http://127.0.0.1:<port>` against a
running build. It uses synthetic bytes and refuses to pass if a supported-size upload does
not reach the application.

**Honest limit:** a body above 12 MiB still cannot be parsed gracefully server-side. The
browser now prevents that case and the boundary catches the remainder, but **your 40.8 MB
original is still not supported**. Nothing here makes that file work.

## Candidate

| Item | Value |
|---|---|
| Version | `0.4.2-upload-repair.1` |
| Local artifact | `dist/windows-0.4.2-candidate/Med-Assistant-Windows-x64.zip` |
| Size | 41,147,312 bytes |
| SHA256 | `efd5f812ac225e5bccba38eb272c94bbb75226966a218a81ffe1265badb97cab` |
| Manifest | connected, `clinicalReady=false`, 1,364 files, version agreement verified |
| Published | **No.** Held for the failed live test |

Verification on this tree: 37 unit tests, 19 database tests, 10/10 browser tests, typecheck,
52 consistency checks, clean build, packaging version guard, extracted-package smoke test
with exact version agreement, and the upload-limit probe. The behavioral gate still exits 1
by design. No live account, grant, migration or published release was touched; authorization
code is unchanged.

## Open decision for you

**Do you want 10 MiB to remain the supported maximum, or should large scans be supported?**
Your 40.8 MB file suggests the real documents are bigger than the current cap. Supporting
them is a deliberate change, not a setting: Supabase's documented Free-project ceiling is
50 MB and resumable uploads are recommended above 6 MB, so it means changing the bucket
limit, the app cap, the request path to a resumable/direct upload, and then re-verifying a
real upload and download. I have not started that, because it should not be guessed at.

Compressing the original instead is possible but must preserve the untouched original and
be checked for readability first. I have not done that either.

## Blockers to publication

1. **The repaired upload path has not been retested live.** This is now the top blocker: a
   real signed-in upload, finalize, download, and the same document opened from the other
   approved account on the other computer.
2. **Authenticated localized screens are still unverified** — RU/HE administration,
   documents, record editing and history inside a real session. The translated audit list
   has never been seen with real rows, since only an administrator can read them.
3. **There is still no chat.** You expect one; it does not exist in any build. A
   record/document repair is not the finished Med Assistant. It must be built behind the
   documented order — deterministic emergency and medication handling, bounded retrieval
   over your own recorded facts, output guards, audit — and the behavioral gate must pass
   with real captured evidence before any conversational medical feature ships.
4. **Clinical, recovery, backup/restore, operational and privacy gates remain open.** No
   medical readiness claim is made and medical AI stays off.

## Exact retest steps

Do these yourselves, signed in with your own credentials. Do not send passwords, and use a
harmless non-medical sample file — not a real medical document.

1. **Install.** Close any running app window and console. Extract the candidate ZIP to a
   **new** folder, run `Start Med Assistant.cmd`, and confirm the sign-in footer reads
   `Version 0.4.2-upload-repair.1`. If it says anything else, an old copy is running and
   every later step is meaningless. Repeat on the second computer.
2. **The failure case.** Try the same large PDF that failed. Expected now: a clear message
   in your language saying it is larger than 10 MB and nothing was sent — **not** a
   full-page error. Report the exact wording you see.
3. **Retry after refusal.** Without reloading, choose a small sample file instead. The
   button should become usable again.
4. **A supported upload.** Upload the small sample. Report the message and whether the
   entry shows as stored rather than pending.
5. **Download it back** from the same account and confirm it opens and matches.
6. **Cross-account, cross-device.** From the other approved account on the other computer,
   open the same record's Documents, confirm the entry is listed, download it, confirm it
   opens.
7. **Denial still holds.** Sign out and reopen the document link; it must refuse.
8. **Localized screens while signed in.** On `/ru/` and `/he/`, check administration, the
   record and Documents: audit lines read as translated sentences with a readable date and
   time, Hebrew reads right to left while emails and times stay left to right, language
   links work without signing out, and no action leaves a blank message line.
9. **Report what actually happened**, including anything that looked wrong. A step not done
   should be reported as not done, not as passing.

Steps 2 and 3 are the ones that prove this repair. Once reported, I will record the results
and, if they pass, publish `0.4.2-upload-repair.1` at the limited scope below.

## Release scope, if published

> A **limited record and source-document management application** for one patient record
> and separately authenticated caregivers, in Russian, Hebrew and English. It stores what
> a person types and the original files they upload, up to 10 MiB each. It does not
> interpret documents, does not give medical advice, and contains no medical AI.

Earlier releases remain downloadable and untouched.

---

# Earlier entry — 20 September 2026

Resolved the four secondary findings from the independent Codex review
(`docs/CLAUDE_RELEASE_REVIEW.md`) and prepared candidate `0.4.1-localized-test.1`, which
was never published and is now superseded:

- **Version agreement** — packaging refuses a build whose compiled
  `NEXT_PUBLIC_APP_VERSION` does not match `-Version`; the extracted-package smoke test
  asserts exact equality between the interface stamp, `VERSION.txt` and `MANIFEST.json`,
  and accepts an expected release version. Verified in both directions.
- **Audit list localized** — translated action labels and locale-formatted timestamps. A
  test derives every action code the migration can write and requires a translation in all
  three languages; an unrecognised code is shown rather than dropped.
- **Blank message keys** — an unrecognised key renders a localized notice instead of an
  empty line, so a failed operation cannot look like a silent success.
- **Checker label** — the inherited historical figure is labelled so it cannot be read as
  execution by this application or as the gating subset. Historical evidence untouched.

At that point the blocker was missing acceptance evidence. It is now a reproduced failure.
