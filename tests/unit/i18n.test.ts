import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { locales, translations, direction } from '../../apps/web/lib/i18n.ts';

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
] as const;

const messageMaps = ['adminMessages', 'registerMessages', 'documentMessages'] as const;

test('administration, registration and document screens are not hard-coded to English', () => {
  for (const file of screens) {
    const source = readFileSync(file, 'utf8');
    assert.ok(!/lang="en"/.test(source), `${file} still hard-codes lang="en"`);
    assert.ok(!/dir="ltr"(?![^>]*type="email")/.test(source.replace(/<span dir="ltr">/g, '')),
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
