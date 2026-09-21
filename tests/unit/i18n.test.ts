import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { locales, translations, direction, actionMessage, auditLabel, formatTimestamp } from '../../apps/web/lib/i18n.ts';

// The reported defect: administration rendered English with lang="en" dir="ltr"
// even at /ru/admin, and had no language selector. These tests fail if that
// returns, in any of the three screens the owner uses.

const screens = [
  'apps/web/app/[locale]/admin/page.tsx',
  'apps/web/app/[locale]/register/page.tsx',
  'apps/web/app/[locale]/records/[patientId]/documents/page.tsx',
];

// Keys added for administration, registration and documents. Each must be
// genuinely translated, not silently inherited from the English base object.
const screenKeys = [
  'adminTitle', 'adminIntro', 'adminDevNote', 'adminSelfNote', 'accessNote', 'dailyUse',
  'manageUsers', 'openRecord', 'openDocuments', 'uploadDocuments', 'createPatientTitle',
  'patientName', 'createPatientButton', 'accountsNote', 'addApprovedAccount', 'roleLabel',
  'rolePatient', 'roleCaregiver', 'accessLabel', 'accessEnabled', 'accessRevoked',
  'accountLinked', 'accountWaiting', 'saveAccount', 'approveEmail', 'recentChanges',
  'patientRecordLabel', 'registerTitle', 'registerIntro', 'registerEmailLabel',
  'registerPasswordLabel', 'registerConfirmLabel', 'registerButton', 'backToSignIn',
  'documentsTitle', 'documentsIntro', 'uploadLabel', 'uploadButton', 'uploading',
  'downloadOriginal', 'noDocuments', 'stateUploaded', 'statePending', 'versionLabel', 'updateHelp',
  'messageUnknown',
] as const;

const messageMaps = ['adminMessages', 'registerMessages', 'documentMessages'] as const;

test('administration, registration and document screens are not hard-coded to English', () => {
  for (const file of screens) {
    const source = readFileSync(file, 'utf8');
    assert.ok(!/lang="en"/.test(source), `${file} still hard-codes lang="en"`);
    // Inline isolation of an email address, a timestamp or an identifier is
    // legitimate inside a right-to-left page; a hard-coded page direction is not.
    const withoutInlineIsolation = source.replace(/<(?:span|time|bdi) [^>]*dir="ltr"[^>]*>/g, '');
    assert.ok(!/dir="ltr"(?![^>]*type="email")/.test(withoutInlineIsolation),
      `${file} still hard-codes a left-to-right page direction`);
    assert.match(source, /direction\(locale\)/, `${file} must derive direction from the locale`);
    assert.match(source, /LanguageLinks/, `${file} must offer visible language selection`);
    assert.match(source, /translations\[locale\]|const t\s*=/, `${file} must read translated text`);
  }
});

test('every screen string is translated into Russian and Hebrew', () => {
  for (const locale of locales) {
    const t = translations[locale] as unknown as Record<string, unknown>;
    for (const key of screenKeys) {
      assert.equal(typeof t[key], 'string', `${locale}.${key} is missing`);
      assert.ok((t[key] as string).length > 0, `${locale}.${key} is empty`);
      if (locale !== 'en') {
        assert.notEqual(t[key], (translations.en as unknown as Record<string, unknown>)[key],
          `${locale}.${key} is still the English string`);
      }
    }
  }
});

test('server-action message keys resolve in every language', () => {
  for (const map of messageMaps) {
    const english = (translations.en as unknown as Record<string, Record<string, string>>)[map];
    const keys = Object.keys(english);
    assert.ok(keys.length > 0, `${map} has no keys`);
    for (const locale of locales) {
      const localized = (translations[locale] as unknown as Record<string, Record<string, string>>)[map];
      for (const key of keys) {
        assert.equal(typeof localized[key], 'string', `${locale}.${map}.${key} is missing`);
        if (locale !== 'en') {
          assert.notEqual(localized[key], english[key], `${locale}.${map}.${key} is still English`);
        }
      }
    }
  }
});

test('server actions return keys, never display text', () => {
  for (const file of ['apps/web/app/admin-actions.ts', 'apps/web/app/register-actions.ts', 'apps/web/app/document-actions.ts']) {
    const source = readFileSync(file, 'utf8');
    const returned = [...source.matchAll(/message:\s*'([^']+)'/g)].map(match => match[1]);
    assert.ok(returned.length > 0, `${file} returns no messages`);
    for (const value of returned) {
      assert.match(value, /^[a-zA-Z]+$/, `${file} returns display text "${value}" instead of a translation key`);
    }
  }
});

test('Hebrew is right-to-left and the other languages are left-to-right', () => {
  assert.equal(direction('he'), 'rtl');
  assert.equal(direction('ru'), 'ltr');
  assert.equal(direction('en'), 'ltr');
});

test('email fields stay left-to-right inside right-to-left pages', () => {
  for (const file of ['apps/web/components/admin-forms.tsx', 'apps/web/components/register-form.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /type="email"[^>]*dir="ltr"/, `${file} must force LTR on the email input`);
  }
});

// A message key this build does not know must not render as an empty line: a failed
// operation would then look identical to a silent success.
test('an unknown action message falls back to a localized notice, never to blank', () => {
  for (const locale of locales) {
    for (const map of messageMaps) {
      const fallback = actionMessage(locale, map, 'aKeyThisBuildDoesNotKnow');
      assert.equal(fallback, translations[locale].messageUnknown);
      assert.ok(fallback.length > 0, `${locale}.${map} fallback is empty`);
      if (locale !== 'en') {
        assert.notEqual(fallback, translations.en.messageUnknown, `${locale} fallback is still English`);
      }
      // No message at all still renders nothing.
      assert.equal(actionMessage(locale, map, ''), '');
      // Known keys are unaffected.
      const known = Object.keys(translations[locale][map])[0];
      assert.equal(actionMessage(locale, map, known),
        (translations[locale][map] as Record<string, string>)[known]);
    }
  }
});

test('the screens resolve action messages through the shared resolver', () => {
  for (const file of ['apps/web/components/admin-forms.tsx', 'apps/web/components/register-form.tsx',
    'apps/web/components/document-upload.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /actionMessage\(locale,/, `${file} must use the shared message resolver`);
    assert.ok(!/messages\[state\.message\]\s*\?\?\s*''/.test(source),
      `${file} still hides an unknown message key`);
  }
});

// The administration audit list showed raw database codes and raw UTC timestamps,
// which contradicts the promise of a fully localized flow.
test('every audit action code written by the database has a translation', () => {
  const migration = readFileSync('database/migrations/002_fixed_accounts.sql', 'utf8');
  const codes = new Set<string>();
  for (const literal of migration.match(/'[a-z_]+\.[a-z_.]*'/g) ?? []) {
    const value = literal.slice(1, -1);
    // 'account.enabled.' is completed at runtime with the role column.
    if (value.endsWith('.')) { for (const role of ['patient', 'caregiver']) codes.add(value + role); }
    else codes.add(value);
  }
  assert.ok(codes.size >= 4, 'no audit action codes were found in the migration');
  for (const locale of locales) {
    const labels = translations[locale].auditActions as Record<string, string>;
    for (const code of codes) {
      assert.equal(typeof labels[code], 'string', `${locale}.auditActions['${code}'] is missing`);
      assert.notEqual(auditLabel(locale, code), code, `${locale} still shows the raw code ${code}`);
      if (locale !== 'en') {
        assert.notEqual(labels[code], (translations.en.auditActions as Record<string, string>)[code],
          `${locale}.auditActions['${code}'] is still English`);
      }
    }
  }
});

// A code added by a future migration must stay visible rather than vanish.
test('an unrecognised audit code is shown, not dropped', () => {
  for (const locale of locales) assert.equal(auditLabel(locale, 'account.future'), 'account.future');
});

test('audit timestamps are formatted per locale and invalid values are kept', () => {
  const iso = '2026-09-20T21:26:29Z';
  const formatted = locales.map(locale => formatTimestamp(locale, iso));
  for (const value of formatted) {
    assert.ok(value.length > 0);
    assert.notEqual(value, iso, 'the raw timestamp must not be shown unchanged');
  }
  assert.equal(new Set(formatted).size, locales.length, 'each language must format its own way');
  assert.equal(formatTimestamp('en', 'not a date'), 'not a date');
});

test('the administration audit list renders translated codes and formatted times', () => {
  const source = readFileSync('apps/web/app/[locale]/admin/page.tsx', 'utf8');
  assert.match(source, /auditLabel\(locale,event\.action\)/, 'audit actions must be translated');
  assert.match(source, /formatTimestamp\(locale,event\.created_at\)/, 'audit times must be formatted');
  assert.ok(!/\{event\.created_at\}\s*·/.test(source), 'the raw timestamp is still rendered');
  assert.ok(!/·\s*\{event\.action\}/.test(source), 'the raw action code is still rendered');
});
