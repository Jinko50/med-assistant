# Live upload failure — confirmed size mismatch

The owner reported a full-page server error after uploading a PDF on the family laptop.
The document was inspected locally for metadata only. Its name and contents are omitted.

- Exact file size: **40,844,643 bytes** (about 39 MiB / 40.8 MB).
- PDF header: `%PDF-1.3`; parser opened all 9 pages; not encrypted.
- Application/bucket maximum: **10,485,760 bytes** (10 MiB).
- Next Server Actions body limit: **12mb**.
- Installed Next proxy body-buffer default: **10,485,760 bytes**.

The submitted file necessarily exceeds the current supported size. The current browser
form does not check file size before submitting; server-action validation runs too late
to handle a body rejected by framework parsing. Exact runtime console error is still
unavailable, so do not claim a specific stack trace was observed. The visible result is
a failed live acceptance test. The PDF contents must not be sent to Claude, stored in Git,
or uploaded by developer tests. Reproduce using synthetic bytes, not this document.

## Required immediate repair

1. Reject oversized selection/submission in the client with a clear RU/HE/EN message and
   prevent the request. Keep server-side checks authoritative.
2. Ensure framework/proxy limits allow the full supported 10 MiB file plus multipart
   overhead; handle unexpected action/request failures without a blank/error-only page.
3. Add behavioral tests that an oversized synthetic PDF is rejected without making an
   upload request, that exactly-supported-size requests reach validation, and that the
   user can choose another file and retry. Cover localized errors and no-JS/server handling.
4. Do not claim the family's original 40.8 MB file is supported by a 10 MiB implementation.
   Supporting larger scanned PDFs needs a deliberate app/Storage/request-limit change
   and real upload/download verification. Do not compress the medical original without
   preserving it and checking readability.
5. Keep final release on hold until the failed live upload path is repaired and retested.
   Record whether future acceptance uses a small supported sample or the original size.

The owner also expects chat. That remains unimplemented; a document-only repair is not
the finished Med Assistant.

The owner has been asked whether to support 50 MB originals or retain the 10 MiB cap;
no answer had arrived when this note was written. Continue the immediate error-handling
repair independently. For a future larger-file implementation, official Supabase docs
allow up to 50 MB on Free projects and recommend resumable uploads above 6 MB:
https://supabase.com/docs/guides/storage/uploads/file-limits
https://supabase.com/docs/guides/storage/uploads/standard-uploads
Next's separate proxy buffering limit is documented at:
https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize

## Verified root cause and repair (Claude Code, 21 September 2026)

The investigation lead was partly right and partly wrong, so it is corrected here.

Reproduced against a built server with **synthetic bytes only**; the family's document was
never read or transmitted. Probing 9, 10, 11 MiB and the reported 40,844,643-byte size
before and after the change, with the server log captured each time:

- A body above `proxyClientMaxBodySize` is **not refused with 413**. It is silently
  **truncated**: `Request body exceeded 10MB … Only the first 10MB will be available`.
- The truncated multipart payload then fails to parse: `TypeError: Failed to parse body as
  FormData` / `expected boundary after body`.
- That error is thrown while the request is being parsed, **outside `uploadDocument`'s
  try/catch**, so it becomes an unhandled 500 — the full-page server error the owner saw.
- The default limit is exactly 10,485,760 bytes, **identical to `MAX_DOCUMENT_BYTES`**.
  So this also broke legitimate uploads at or just below the supported maximum, not only
  the oversized file. Before the change, the 10 MiB and 11 MiB probes were truncated and
  failed to parse; after it, all supported sizes reach the application with no truncation.

Repairs, all verified: the browser now refuses an oversized file before sending anything;
`proxyClientMaxBodySize` is raised to 12 MiB to leave room for multipart framing above the
10 MiB cap; and a localized error boundary replaces the untranslated full-page error.

Honest limit: a body above 12 MiB still cannot be parsed gracefully by the server. The
browser prevents that case and the boundary catches the remainder, but **the 40.8 MB
original is still not supported**, and no authenticated upload or download has yet been
performed. Reproduce with `node tools/check-upload-limits.mjs http://127.0.0.1:<port>`.

## 50 MB originals implemented (Claude Code, 21 September 2026)

The owner answered the open decision: support 50 MB so the original scan uploads unchanged.
That is a design change, not a setting, and it was made as follows.

**Documents no longer pass through the app server.** The browser uploads straight to
Supabase Storage using a short-lived signed URL. This removes the framework request path —
the thing that truncated the body and produced the full-page error — from the document
route entirely, and it follows Supabase's own guidance not to proxy uploads above ~6 MB.
Buffering 50 MB inside the launcher's Node process on a family laptop was the alternative.

| Layer | Before | Now |
|---|---|---|
| Interface refusal and label | 10 MiB | 50 MB, stated in RU/HE/EN |
| `MAX_DOCUMENT_BYTES` | 10,485,760 | 50,000,000 |
| Metadata constraint | `bytes between 1 and 10485760` | migration 004: `1 and 50000000` |
| Bucket `file_size_limit` | 10,485,760 | migration 004: 50,000,000 |
| Transfer | multipart through the server action | browser → Storage, signed URL |
| Request limits | had to exceed the document size | now bound only small metadata calls |

50,000,000 decimal is deliberate: Supabase documents a 50 MB Free-project ceiling without
saying decimal or binary, so the smaller reading is used. The app cap, the metadata
constraint and the bucket ceiling are the same number, checked by a test, so the interface
cannot accept a file that Storage will later refuse.

### What is checked, and by whom

- **Size** is decided by the same pure function in the browser and on the server. The
  browser refuses before anything is sent; the server repeats it before authorization,
  metadata or a signed URL, because the browser is not trusted.
- **Format** is judged from the file's own first 4 KiB, sent separately and checked before
  an upload URL exists — then read back **from the stored object** with a range request
  before the upload is finalized, so the header is not taken on trust afterwards either.
- **Authorization** is unchanged. Both actions call `authorizedPatient(…, 'maintain_record')`,
  the signed URL is scoped to one object path, and `finish_document` still requires the same
  account that reserved the row. Nothing was weakened to make the upload work.
- **The digest is client-reported.** The browser computes SHA-256 over the bytes it sends.
  Re-hashing server-side would mean downloading 50 MB back. It detects accidental
  corruption; it is not evidence against a dishonest client, and it is recorded as such.

### Migration 004 must be applied before large files work

`database/migrations/004_large_documents.sql` is additive: it widens the metadata check and
the bucket ceiling and asserts the bucket is still private. It has **not** been applied to
the live project — that needs dashboard access. Until it is, `reserve_document` still
refuses anything above 10 MiB, which now surfaces as a clear localized message at the very
first step instead of a transfer that dies part-way through.

Apply it the same way as 001–003, through the dashboard SQL editor, and do not run
`db push` against this project without reconciling CLI migration history first.

### Interruptions

A dropped connection, a cancelled transfer, a timeout and a refusal by Storage each end in
a translated line with the form still usable. There is a Cancel button during transfer and
a percentage while bytes move. Nothing leaves the page in a blank or crashed state.

Full resumable (TUS) upload was considered and deliberately not implemented: it adds a
client dependency and its own failure modes, and it should not ship in the same change as
the size increase, untested. A 50 MB single PUT is within what Supabase supports directly.

### Verified, and not

Verified on this machine with synthetic bytes only: 43 unit tests, 20 SQL tests including
migration 004's boundaries, 14 browser tests, typecheck, clean build, 0 dependency
vulnerabilities, 52 consistency checks, and `tools/check-upload-limits.mjs` against a built
server — which now checks server health first, then that bodies at 9/10/11 MiB reach the
application untruncated, and that `connect-src` names exactly the Storage origin with no
wildcard. The CSP is derived at runtime in `proxy.ts`, because a build-time value would be
wrong for any other project.

**Not verified:** a real signed-URL upload to live Storage, a download, cross-account
visibility, and whether migration 004 behaves as written against the live project. In
particular, the live behaviour of a token-authenticated upload against the existing
`medical_original_insert` policy has not been observed. That needs a signed-in test by the
account holders. The family's original document was never read, transmitted or uploaded.
