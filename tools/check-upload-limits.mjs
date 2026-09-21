// Behavioral probe of the request path that broke the family's document upload.
//
// Synthetic bytes only. This tool never reads, stores or transmits a real document.
//
// History: a body larger than Next's proxyClientMaxBodySize is not refused, it is silently
// TRUNCATED. The truncated multipart payload then fails to parse ("expected boundary after
// body"), and that error is thrown while the request is parsed — outside any action's
// try/catch — so the family saw a full-page server error. The default limit was exactly
// 10 MiB, identical to the old document cap, so legitimate maximum-size uploads broke too.
//
// Since the 50 MB change, documents no longer use this path at all: the browser uploads
// straight to Supabase Storage with a signed URL, and only small metadata crosses the
// server. This probe therefore checks three things:
//   1. the server is actually running and answering (a previous comparison accidentally
//      measured a stopped server, so nothing else here is trusted until this passes);
//   2. a body at and just above the old 10 MiB boundary still reaches the application
//      rather than being truncated, so the small metadata calls cannot regress;
//   3. the Content-Security-Policy names the Storage origin, because a direct browser
//      upload is silently blocked by connect-src without it.
//
// Usage: start a built server, then
//   node tools/check-upload-limits.mjs http://127.0.0.1:<port>
import { MAX_DOCUMENT_BYTES, MAX_UPLOAD_REQUEST_BYTES } from '../packages/domain/document.ts';

const base = process.argv[2];
if (!base) { console.error('Usage: node tools/check-upload-limits.mjs http://127.0.0.1:<port>'); process.exit(2); }
const uuid = '40000000-0000-4000-8000-000000000001';
const target = `${base}/en/records/${uuid}/documents`;
let failed = false;
const fail = message => { failed = true; console.error(`FAIL: ${message}`); };

// 1. Health first. Without this, every result below could be describing a dead server.
let health;
try {
  const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10000) });
  health = await response.json();
  if (!response.ok) throw new Error(`status ${response.status}`);
  console.log(`PASS: server is answering. clinicalReady=${health.clinicalReady}`);
} catch (error) {
  console.error(`FAIL: no healthy server at ${base} — ${error.message}. Start the build first; do not interpret anything below.`);
  process.exit(1);
}
if (health.clinicalReady !== false) fail('health must report clinicalReady=false');

// 2. Request-size behaviour around the old boundary.
async function probe(label, bytes) {
  const form = new FormData();
  form.set('patient', uuid);
  form.set('locale', 'en');
  form.set('filler', new Blob([new Uint8Array(bytes)]), 'synthetic.bin');
  try {
    const response = await fetch(target, {
      method: 'POST', body: form,
      headers: { 'Next-Action': '00000000000000000000000000000000000000000' },
      signal: AbortSignal.timeout(120000),
    });
    const text = await response.text();
    // A synthetic probe cannot present a valid server-action id, so reaching the
    // application shows up as Next's own "Failed to find Server Action" response. What
    // matters is that the body was neither truncated nor left unparseable.
    const truncated = /Request body exceeded|Failed to parse body as FormData|expected boundary/i.test(text);
    console.log(`${truncated ? 'FAIL' : 'PASS'}: ${label} (${bytes} bytes) -> HTTP ${response.status}${truncated ? ' — body truncated or unparseable' : ' — reached the application'}`);
    if (truncated) failed = true;
    return !truncated;
  } catch (error) {
    fail(`${label} (${bytes} bytes) -> ${error.message}`);
    return false;
  }
}

await probe('just below the old default limit', 9 * 1024 * 1024);
await probe('exactly the old default limit', 10 * 1024 * 1024);
await probe('above the old default limit', 11 * 1024 * 1024);

// 3. Documents are larger than this path can carry. That is the point of the direct upload.
if (MAX_DOCUMENT_BYTES <= MAX_UPLOAD_REQUEST_BYTES) {
  fail('a document is expected to be larger than the request limit; the direct upload is what makes 50 MB possible');
} else {
  console.log(`PASS: the supported document size (${MAX_DOCUMENT_BYTES}) exceeds the request limit (${MAX_UPLOAD_REQUEST_BYTES}), so documents must bypass this path.`);
}

// 4. Content-Security-Policy must allow the browser to reach Storage.
try {
  const response = await fetch(`${base}/en/login`, { signal: AbortSignal.timeout(15000) });
  const policy = response.headers.get('content-security-policy') ?? '';
  const connect = /connect-src ([^;]*)/.exec(policy)?.[1]?.trim() ?? '';
  if (!policy) fail('no Content-Security-Policy header was sent');
  else if (/\*/.test(connect)) fail(`connect-src must not contain a wildcard: ${connect}`);
  else if (process.env.SUPABASE_URL) {
    const origin = new URL(process.env.SUPABASE_URL).origin;
    if (connect.includes(origin)) console.log(`PASS: connect-src allows exactly the Storage origin (${connect}).`);
    else fail(`connect-src does not allow ${origin}; a direct upload would be blocked silently. Got: ${connect}`);
  } else {
    console.log(`PASS: connect-src is ${connect} (no SUPABASE_URL set, so no Storage origin is expected).`);
  }
} catch (error) {
  fail(`could not read the security policy — ${error.message}`);
}

console.log('This probe uses synthetic bytes. It does not establish an authenticated upload, a download, or clinical readiness.');
process.exit(failed ? 1 : 0);
