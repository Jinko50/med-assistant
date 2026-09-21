// Behavioral probe of the request-size layer that broke the family's document upload.
//
// Synthetic bytes only. This tool never reads, stores or transmits a real document.
//
// The failure: a body larger than Next's proxyClientMaxBodySize is not refused, it is
// silently TRUNCATED. The truncated multipart payload then fails to parse ("expected
// boundary after body"), and that error is thrown while the request is being parsed —
// outside uploadDocument's try/catch — so the family saw a full-page server error.
// The default limit is exactly 10 MiB, identical to MAX_DOCUMENT_BYTES, so this also
// broke legitimate uploads at or near the supported maximum.
//
// Usage: start a built server, then
//   node tools/check-upload-limits.mjs http://127.0.0.1:<port>
// Expected after the repair: no "Request body exceeded" or "Failed to parse body as
// FormData" in the server log for any size at or below the supported maximum.
//
// A synthetic probe cannot present a valid server-action id, so reaching the application
// is reported as an HTTP status (Next answers 500 "Failed to find Server Action"). What
// matters is the distinction between reaching the application at all and being dropped
// or truncated beforehand.
import { MAX_DOCUMENT_BYTES } from '../packages/domain/document.ts';

const base = process.argv[2];
if (!base) { console.error('Usage: node tools/check-upload-limits.mjs http://127.0.0.1:<port>'); process.exit(2); }
const uuid = '40000000-0000-4000-8000-000000000001';
const target = `${base}/en/records/${uuid}/documents`;

async function probe(label, bytes) {
  const form = new FormData();
  form.set('patient', uuid);
  form.set('locale', 'en');
  // A valid PDF header followed by filler. Synthetic, never a real document.
  const body = Buffer.concat([Buffer.from('%PDF-1.3\n'), Buffer.alloc(bytes - 9, 0x20)]);
  form.set('file', new Blob([body], { type: 'application/pdf' }), 'synthetic.pdf');
  try {
    const response = await fetch(target, { method: 'POST', body: form, redirect: 'manual' });
    console.log(`${label.padEnd(32)} bytes=${String(bytes).padStart(9)} status=${response.status}`);
    return response.status;
  } catch (error) {
    console.log(`${label.padEnd(32)} bytes=${String(bytes).padStart(9)} CONNECTION FAILED (${error.cause?.code ?? error.message})`);
    return 0;
  }
}

// A dropped connection (0) or a 413 both mean the body never reached the application.
const reached = status => status !== 0 && status !== 413;

const belowCap = await probe('below the cap', MAX_DOCUMENT_BYTES - 1024 * 1024);
const atCap = await probe('exactly at the cap', MAX_DOCUMENT_BYTES);
const overCap = await probe('over the cap', MAX_DOCUMENT_BYTES + 1024 * 1024);
// The size the family's upload actually was. It must remain unsupported: the browser
// refuses it before sending, and this only confirms the server does not accept it either.
await probe('reported failure size', 40_844_643);

console.log('\nCheck the server log for "Request body exceeded" or "Failed to parse body as FormData".');
console.log(`below the cap reached the application: ${reached(belowCap)}`);
console.log(`at the cap reached the application:    ${reached(atCap)}`);
console.log(`over the cap reached the application:  ${reached(overCap)} (headroom for multipart framing)`);
if (!reached(belowCap) || !reached(atCap)) {
  console.error('\nFAIL: a supported-size upload does not reach the application.');
  process.exit(1);
}
console.log('\nPASS: supported sizes reach the application. This does not prove an authenticated');
console.log('upload succeeds; only a real signed-in upload and download can show that.');
