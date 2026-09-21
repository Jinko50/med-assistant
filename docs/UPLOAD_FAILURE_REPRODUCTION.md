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
