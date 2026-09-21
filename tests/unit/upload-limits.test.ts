import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  documentType, uploadRejection, storagePath,
  MAX_DOCUMENT_BYTES, MIN_DOCUMENT_BYTES, MAX_UPLOAD_REQUEST_BYTES, HEADER_SAMPLE_BYTES,
} from '../../packages/domain/document.ts';
import { locales, translations } from '../../apps/web/lib/i18n.ts';

// The reported live failure: a real upload produced a full-page server error instead of a
// readable message. The submitted file was far larger than the then-supported maximum, and
// a body that large is TRUNCATED while the request is parsed — before the server action
// runs and outside its try/catch.
//
// The cap has since been raised to 50 MB at the owner's request, and documents now go from
// the browser straight to Storage instead of through this server. Every case below uses
// synthetic sizes and synthetic bytes. The family's actual document is never read, stored
// or transmitted by these tests.

const REPORTED_FAILURE_BYTES = 40_844_643;
const DOCUMENT_ACTIONS = readFileSync('apps/web/app/document-actions.ts', 'utf8');
const UPLOAD_COMPONENT = readFileSync('apps/web/components/document-upload.tsx', 'utf8');

test('the size that previously failed is now supported, unchanged', () => {
  assert.equal(MAX_DOCUMENT_BYTES, 50_000_000, 'the supported maximum is 50 MB');
  assert.ok(REPORTED_FAILURE_BYTES < MAX_DOCUMENT_BYTES,
    'the reported original must now fit, or the owner still cannot upload it');
  assert.equal(uploadRejection(REPORTED_FAILURE_BYTES), null);
  // Headroom is real, not marginal: the file is about 8 MB below the cap.
  assert.ok(MAX_DOCUMENT_BYTES - REPORTED_FAILURE_BYTES > 8_000_000);
});

test('boundary sizes are decided exactly', () => {
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES), null, 'a maximum-size file must be allowed');
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES - 1), null);
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES + 1), 'tooLarge');
  assert.equal(uploadRejection(MIN_DOCUMENT_BYTES), null);
  assert.equal(uploadRejection(MIN_DOCUMENT_BYTES - 1), 'chooseFile');
  assert.equal(uploadRejection(0), 'chooseFile');
  assert.equal(uploadRejection(Number.NaN), 'chooseFile');
  assert.equal(uploadRejection(Number.POSITIVE_INFINITY), 'chooseFile');
});

test('the database ceiling and the application cap are the same number', () => {
  const migration = readFileSync('database/migrations/004_large_documents.sql', 'utf8');
  assert.match(migration, new RegExp(`check\\(bytes between 1 and ${MAX_DOCUMENT_BYTES}\\)`),
    'the metadata constraint must equal MAX_DOCUMENT_BYTES');
  assert.match(migration, new RegExp(`file_size_limit=${MAX_DOCUMENT_BYTES}`),
    'the bucket ceiling must equal MAX_DOCUMENT_BYTES, or Storage refuses files the app accepted');
  // Compare statements, not the prose explaining what the migration avoids.
  const statements = migration.replace(/^\s*--.*$/gm, '');
  assert.ok(!/drop\s+table|truncate|delete\s+from|drop\s+policy|drop\s+schema/i.test(statements),
    'the migration must be additive only');
  assert.match(migration, /public=false/, 'the bucket must be asserted private');
});

// A 50 MB body cannot be sent through a server action, which is why the transfer is direct.
test('large documents do not travel through the framework request path', () => {
  assert.ok(MAX_DOCUMENT_BYTES > MAX_UPLOAD_REQUEST_BYTES,
    'a document larger than the request limit proves the upload cannot be proxied');
  const config = readFileSync('apps/web/next.config.ts', 'utf8');
  // Still above Next's 10 MiB default, because a body over it is truncated rather than
  // refused, which is what produced the original full-page error.
  assert.match(config, /proxyClientMaxBodySize:\s*'12mb'/);
  assert.match(config, /bodySizeLimit:\s*'12mb'/);
  assert.equal(MAX_UPLOAD_REQUEST_BYTES, 12 * 1024 * 1024);
  // The action must never receive the file itself.
  assert.ok(!/form\.get\('file'\)/.test(DOCUMENT_ACTIONS),
    'the server action must not accept the file; only metadata crosses this boundary');
  assert.match(DOCUMENT_ACTIONS, /createSignedUploadUrl/, 'the browser must upload with a signed URL');
});

test('only a small header sample is sent for format checking', () => {
  assert.equal(HEADER_SAMPLE_BYTES, 4096);
  assert.ok(HEADER_SAMPLE_BYTES * 2 < MAX_UPLOAD_REQUEST_BYTES,
    'the base64 header must stay far below the request limit');
  assert.match(UPLOAD_COMPONENT, /subarray\(0,HEADER_SAMPLE_BYTES\)/, 'only the first bytes are sent');
});

test('format is judged from the file header, not its name or declared type', () => {
  assert.equal(documentType(Buffer.from('%PDF-1.3\n')), 'application/pdf');
  assert.equal(documentType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])), 'image/jpeg');
  assert.equal(documentType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  // A renamed executable and an empty buffer are both refused.
  assert.equal(documentType(Buffer.from('MZ\x90\x00\x03\x00\x00\x00')), null);
  assert.equal(documentType(Buffer.alloc(HEADER_SAMPLE_BYTES)), null);
  assert.equal(documentType(Buffer.from('%PDF')), null, 'too short to identify');
  // It is given a header sample, so it must not judge total length.
  const bigHeader = Buffer.concat([Buffer.from('%PDF-1.3\n'), Buffer.alloc(HEADER_SAMPLE_BYTES)]);
  assert.equal(documentType(bigHeader), 'application/pdf');
});

test('the server refuses the size before any authorization or storage work', () => {
  const guard = DOCUMENT_ACTIONS.indexOf('uploadRejection(size)');
  const authorize = DOCUMENT_ACTIONS.indexOf('await authorizedPatient(');
  const reserve = DOCUMENT_ACTIONS.indexOf('reserve_document');
  const sign = DOCUMENT_ACTIONS.indexOf('createSignedUploadUrl');
  assert.ok(guard > 0 && authorize > 0 && reserve > 0 && sign > 0, 'expected call sites were not found');
  assert.ok(guard < authorize && guard < reserve && guard < sign,
    'size must be refused before authorization, metadata or a signed URL');
  // Both actions authorize; neither trusts an earlier step.
  assert.equal(DOCUMENT_ACTIONS.match(/await authorizedPatient\(/g)?.length, 2,
    'begin and finish must each re-check caregiver access');
});

test('the stored object is re-read before the upload is finalized', () => {
  const probe = DOCUMENT_ACTIONS.indexOf('Range:');
  const finish = DOCUMENT_ACTIONS.indexOf('finish_document');
  assert.ok(probe > 0 && finish > 0 && probe < finish,
    'the header must be read back from Storage before finalizing, not taken from the browser');
  assert.match(DOCUMENT_ACTIONS, /content-range/, 'the stored size must be read from Storage');
});

test('the browser refuses an oversized file without sending anything', () => {
  assert.match(UPLOAD_COMPONENT, /uploadRejection/, 'the browser applies the same size decision');
  assert.match(UPLOAD_COMPONENT, /event\.preventDefault\(\)/, 'no native submission may occur');
  assert.match(UPLOAD_COMPONENT, /if\(!file\|\|rejection\)\{setRefused\(rejection\?\?''\);return;\}/,
    'a refused file must return before any network call');
  assert.match(UPLOAD_COMPONENT, /disabled=\{busy\|\|refused!==''\}/, 'the button is disabled while refused');
  // The refusal is decided before begin/PUT/finish are reached.
  const decide = UPLOAD_COMPONENT.indexOf('const rejection=file?uploadRejection(file.size)');
  const begin = UPLOAD_COMPONENT.indexOf('beginUpload(');
  assert.ok(decide > 0 && begin > 0 && decide < begin);
});

test('choosing a different file clears the refusal so the user can retry', () => {
  assert.match(UPLOAD_COMPONENT, /onChange=\{event=>choose\(/, 'every selection re-decides');
  assert.match(UPLOAD_COMPONENT, /setRefused\(file\?uploadRejection\(file\.size\)\?\?'':''\)/);
  assert.equal(uploadRejection(MAX_DOCUMENT_BYTES + 1), 'tooLarge');
  assert.equal(uploadRejection(2 * 1024 * 1024), null, 'a smaller file afterwards is accepted');
});

test('an interrupted or refused transfer is reported and leaves the form usable', () => {
  for (const handler of ['xhr.onerror', 'xhr.onabort', 'xhr.ontimeout']) {
    assert.ok(UPLOAD_COMPONENT.includes(handler), `${handler} must be handled`);
  }
  assert.match(UPLOAD_COMPONENT, /status===413\?'storageRejected':'interrupted'/,
    'a size refusal by Storage and a dropped connection must be distinguished');
  assert.match(UPLOAD_COMPONENT, /finally\{[^}]*setBusy\(false\)/,
    'the form must be re-enabled whatever happened');
  assert.match(UPLOAD_COMPONENT, /request\.current\?\.abort\(\)/, 'a long transfer must be cancellable');
});

test('every upload outcome is translated into every language', () => {
  const keys = ['tooLarge', 'chooseFile', 'unsupported', 'notStarted', 'uploadFailed',
    'finalizeFailed', 'stored', 'unavailable', 'interrupted', 'storageRejected', 'verifyFailed'] as const;
  for (const locale of locales) {
    for (const key of keys) {
      const message = translations[locale].documentMessages[key];
      assert.equal(typeof message, 'string', `${locale}.${key} is missing`);
      assert.ok(message.length > 0, `${locale}.${key} is empty`);
      if (locale !== 'en') {
        assert.notEqual(message, translations.en.documentMessages[key], `${locale}.${key} is still English`);
      }
    }
    // The stated maximum must match the implemented one, in every language.
    assert.match(translations[locale].uploadLabel, /50/, `${locale} upload label must state 50 MB`);
    assert.match(translations[locale].documentMessages.tooLarge, /50/, `${locale} refusal must name the limit`);
    assert.ok(translations[locale].uploadNeedsJs.length > 0, `${locale} needs a no-JavaScript notice`);
  }
});

test('one place decides the storage object path', () => {
  assert.equal(storagePath('p', 'd'), 'p/d');
  const migration = readFileSync('database/migrations/003_private_documents.sql', 'utf8');
  assert.match(migration, /d\.patient_id::text\|\|'\/'\|\|d\.id::text/,
    'the storage policy must expect the same layout that storagePath produces');
  assert.match(DOCUMENT_ACTIONS, /storagePath\(/, 'the server must use the shared helper');
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

// A direct browser upload is blocked by the default policy unless Storage is allowed.
test('the content security policy allows Storage at runtime and nothing wider', () => {
  const proxy = readFileSync('apps/web/proxy.ts', 'utf8');
  assert.match(proxy, /connect-src 'self'/, "connect-src must start from 'self'");
  assert.match(proxy, /new URL\(process\.env\.SUPABASE_URL\)\.origin/,
    'the allowed origin must be derived at runtime, not baked in at build time');
  assert.ok(!/connect-src[^;"]*\*/.test(proxy), 'no wildcard origin may be allowed');
  const config = readFileSync('apps/web/next.config.ts', 'utf8');
  assert.ok(!/key:\s*'Content-Security-Policy'/.test(config),
    'a second, build-time policy header would override the runtime one');
});
