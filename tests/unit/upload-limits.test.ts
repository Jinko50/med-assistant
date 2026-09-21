import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  documentType, uploadRejection, MAX_DOCUMENT_BYTES, MIN_DOCUMENT_BYTES, MAX_UPLOAD_REQUEST_BYTES,
} from '../../packages/domain/document.ts';
import { locales, translations } from '../../apps/web/lib/i18n.ts';

// The reported live failure: a real upload produced a full-page server error instead of a
// readable message. The submitted file was far larger than the supported maximum, and a
// body that large is rejected while the request is parsed — before the server action runs
// and outside its try/catch. Every case below uses synthetic sizes and synthetic bytes.
// The family's actual document is never read, stored or transmitted by these tests.

const REPORTED_FAILURE_BYTES = 40_844_643;

test('the reported oversized upload is refused, and refusal names the size limit', () => {
  assert.ok(REPORTED_FAILURE_BYTES > MAX_DOCUMENT_BYTES,
    'the reported file must exceed the cap; otherwise size was not the cause');
  assert.equal(uploadRejection(REPORTED_FAILURE_BYTES), 'tooLarge');
  // Refusing it is not the same as supporting it. 10 MiB remains the supported maximum.
  assert.equal(MAX_DOCUMENT_BYTES, 10 * 1024 * 1024);
});

test('exactly the supported size is accepted and reaches validation', () => {
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES), null, 'a maximum-size file must be allowed through');
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES - 1), null);
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES + 1), 'tooLarge');
  assert.equal(uploadRejection(MIN_DOCUMENT_BYTES), null);
  assert.equal(uploadRejection(MIN_DOCUMENT_BYTES - 1), 'chooseFile');
  assert.equal(uploadRejection(0), 'chooseFile');
  assert.equal(uploadRejection(Number.NaN), 'chooseFile');
});

// A maximum-size file is sent with multipart framing on top of it. If the framework's
// limits equal the cap, a legitimate maximum-size upload fails before any of our code runs.
test('framework request limits leave room above the supported document size', () => {
  assert.ok(MAX_UPLOAD_REQUEST_BYTES > MAX_DOCUMENT_BYTES,
    'the request limit must exceed the document cap to allow multipart overhead');
  const config = readFileSync('apps/web/next.config.ts', 'utf8');
  assert.match(config, /proxyClientMaxBodySize:\s*'12mb'/,
    'Next defaults proxyClientMaxBodySize to exactly 10 MiB and truncates larger bodies, '
    + 'which makes a maximum-size upload fail multipart parsing outside the action');
  assert.match(config, /bodySizeLimit:\s*'12mb'/);
  // '12mb' is 12 MiB, and must match MAX_UPLOAD_REQUEST_BYTES.
  assert.equal(MAX_UPLOAD_REQUEST_BYTES, 12 * 1024 * 1024);
});

test('an oversized synthetic PDF is rejected on size before its bytes are examined', () => {
  // Synthetic: a valid PDF header, declared at a size beyond the cap.
  const header = Buffer.from('%PDF-1.3\n');
  assert.equal(documentType(header), 'application/pdf', 'the synthetic sample is a valid PDF');
  assert.equal(uploadRejection(REPORTED_FAILURE_BYTES), 'tooLarge',
    'size alone must refuse it, without reading or buffering the content');
  // Content-based validation also refuses oversized buffers, as a second line of defence.
  assert.equal(documentType(Buffer.alloc(MAX_DOCUMENT_BYTES + 1)), null);
});

test('the browser refuses an oversized file without sending a request', () => {
  const source = readFileSync('apps/web/components/document-upload.tsx', 'utf8');
  assert.match(source, /uploadRejection/, 'the browser must apply the same size decision');
  // React does not run a form action when the submit event was default-prevented.
  assert.match(source, /onSubmit=\{event=>\{if\(refused\)event\.preventDefault\(\);\}\}/,
    'submission must be cancelled while a file is refused, so no upload request is made');
  assert.match(source, /disabled=\{pending\|\|refused!==''\}/, 'the button must be disabled while refused');
});

test('choosing a different file clears the refusal so the user can retry', () => {
  const source = readFileSync('apps/web/components/document-upload.tsx', 'utf8');
  assert.match(source, /onChange=\{event=>\{[^}]*setRefused\(/,
    'every new selection must re-decide, so a smaller file re-enables upload');
  // The decision is pure, so the retry sequence is verifiable directly.
  assert.equal(uploadRejection(REPORTED_FAILURE_BYTES), 'tooLarge');
  assert.equal(uploadRejection(2 * 1024 * 1024), null, 'a smaller file afterwards must be accepted');
});

test('the server repeats the size check and never trusts the browser', () => {
  const source = readFileSync('apps/web/app/document-actions.ts', 'utf8');
  assert.match(source, /const rejection=uploadRejection\(file\.size\);/);
  // Compare call sites, not the import statements at the top of the file.
  const guard = source.indexOf('uploadRejection(file.size)');
  const authorize = source.indexOf('await authorizedPatient(');
  const upload = source.indexOf('storage.from');
  assert.ok(guard > 0 && authorize > 0 && upload > 0, 'expected call sites were not found');
  assert.ok(guard < authorize && guard < upload,
    'size must be refused before any authorization, storage or network work happens');
});

test('the size refusal is translated into every language', () => {
  for (const locale of locales) {
    const message = translations[locale].documentMessages.tooLarge;
    assert.equal(typeof message, 'string');
    assert.ok(message.length > 0, `${locale} tooLarge is empty`);
    if (locale !== 'en') {
      assert.notEqual(message, translations.en.documentMessages.tooLarge, `${locale} tooLarge is still English`);
    }
  }
});

// Without a boundary, an unexpected failure renders the framework's untranslated
// full-page error, which is what the family saw.
test('a localized error boundary covers the document and record screens', () => {
  const boundary = readFileSync('apps/web/app/[locale]/error.tsx', 'utf8');
  assert.match(boundary, /'use client'/, 'an error boundary must be a client component');
  assert.match(boundary, /reset/, 'the user must be able to retry');
  assert.match(boundary, /direction\(locale\)/, 'the boundary must respect text direction');
  assert.ok(!/error\.message|error\.stack|digest\}/.test(boundary),
    'the boundary must not display internal failure details');
  for (const locale of locales) {
    for (const key of ['errorTitle', 'errorBody', 'retry'] as const) {
      const value = translations[locale][key];
      assert.equal(typeof value, 'string', `${locale}.${key} is missing`);
      if (locale !== 'en') assert.notEqual(value, translations.en[key], `${locale}.${key} is still English`);
    }
  }
});
