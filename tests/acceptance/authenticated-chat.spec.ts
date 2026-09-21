import { test, expect, type Page } from '@playwright/test';

// The signed-in acceptance run: send, confirm, correct, attach, interrupt, retry, and
// retrieval by the second family account. This is the run nobody has performed yet, and it
// cannot be performed by a developer session, because it needs the account holders' own
// passwords and those must never be typed into a chat window.
//
// HOW TO RUN IT  (see docs/APPLY_PENDING_MIGRATIONS.md for the full script)
//
//   1. Apply migrations 006 and 007 in the Supabase SQL editor.
//   2. Set these in YOUR OWN shell, not in any file that is committed:
//        MED_ASSISTANT_TEST_PATIENT_ID        the record to write into
//        MED_ASSISTANT_TEST_PATIENT_EMAIL     / _PASSWORD   the read-only account
//        MED_ASSISTANT_TEST_CAREGIVER_EMAIL   / _PASSWORD   the editor account
//   3. npm run test:acceptance
//
// Use a SYNTHETIC patient record if you have one. This test writes conversation lines into
// whatever record you point it at, and a conversation line cannot be deleted by the
// application - that is deliberate, and it is why the record you choose matters.
//
// With any variable missing every case is SKIPPED, never passed. A skipped acceptance test
// is evidence of nothing, and must be reported as not run.

const config = {
  patientId: process.env.MED_ASSISTANT_TEST_PATIENT_ID ?? '',
  patient: {
    email: process.env.MED_ASSISTANT_TEST_PATIENT_EMAIL ?? '',
    password: process.env.MED_ASSISTANT_TEST_PATIENT_PASSWORD ?? '',
  },
  caregiver: {
    email: process.env.MED_ASSISTANT_TEST_CAREGIVER_EMAIL ?? '',
    password: process.env.MED_ASSISTANT_TEST_CAREGIVER_PASSWORD ?? '',
  },
};
const configured = Boolean(config.patientId && config.patient.email && config.patient.password
  && config.caregiver.email && config.caregiver.password);

test.skip(!configured, 'Signed-in acceptance needs test credentials in the environment; see the header of this file.');

// Every run writes a distinct marker so its rows can be found afterwards and so two runs
// never read each other's readings.
const run = Date.now().toString(36).slice(-5);
const chat = (locale: string) => `/${locale}/records/${config.patientId}/chat`;

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto('/en/login');
  await page.getByLabel(/Email address/i).fill(who.email);
  await page.getByLabel(/^Password/i).fill(who.password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/records\/.+\/chat/, { timeout: 30000 });
}

async function signOut(page: Page) {
  await page.getByRole('group').getByText('Menu').click().catch(() => page.getByText('Menu').click());
  await page.getByRole('button', { name: /Sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 30000 });
}

// A minimal, valid, synthetic PDF. Nothing in it resembles a medical document.
function syntheticPdf() {
  const body = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF
`;
  return Buffer.from(body, 'latin1');
}

test.describe.configure({ mode: 'serial' });

test('the patient signs in and lands on the conversation, in their own language', async ({ page }) => {
  await signIn(page, config.patient);
  await page.goto(chat('ru'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByPlaceholder(/Напишите/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
  // The conversation must be set up: this message means migrations 006/007 are missing.
  await expect(page.getByText(/не настроен|not set up|לא מוגדרת/)).toHaveCount(0);
});

test('a written measurement is read back, and each number keeps its own label', async ({ page }) => {
  await signIn(page, config.patient);
  await page.goto(chat('ru'));
  await page.getByPlaceholder(/Напишите/).fill(`Тест ${run}: сегодня утром давление 128/76, пульс 68, вес 80 кг`);
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('Вот что я прочитал в вашем сообщении:')).toBeVisible({ timeout: 30000 });
  const cards = page.locator('.fact-card');
  await expect(cards).toHaveCount(3);
  // The defect the independent review found: the weight's 80 was recorded as the pulse.
  await expect(cards.filter({ hasText: 'Давление' })).toContainText('128/76');
  await expect(cards.filter({ hasText: 'Пульс' })).toContainText('68');
  await expect(cards.filter({ hasText: 'Вес' })).toContainText('80');
  // The person's own words about when, and no invented date.
  await expect(cards.first()).toContainText('сегодня утром');
});

test('Confirm and Correct both work, and a declined reading is removed', async ({ page }) => {
  await signIn(page, config.patient);
  await page.goto(chat('ru'));
  const cards = page.locator('.fact-card');
  await expect(cards.first()).toBeVisible({ timeout: 30000 });

  const pressure = cards.filter({ hasText: 'Давление' }).last();
  await pressure.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(pressure).toContainText('Подтверждено');

  const pulse = cards.filter({ hasText: 'Пульс' }).last();
  await pulse.getByRole('button', { name: 'Исправить' }).click();
  await pulse.getByLabel('Значение').fill('70');
  await pulse.getByRole('button', { name: 'Сохранить' }).click();
  await expect(pulse).toContainText('Исправлено');
  await expect(pulse).toContainText('70');

  const weight = cards.filter({ hasText: 'Вес' }).last();
  await weight.getByRole('button', { name: 'Исправить' }).click();
  await weight.getByRole('button', { name: 'Это не измерение' }).click();
  await expect(weight).toContainText('Убрано');

  // A review happens once. The controls are gone, so a second opinion is a new message.
  await expect(pressure.getByRole('button', { name: 'Подтвердить' })).toHaveCount(0);
});

test('an attached file is reported as uploaded and explicitly NOT read', async ({ page }) => {
  await signIn(page, config.caregiver);
  await page.goto(chat('en'));
  await page.setInputFiles('input[type=file]',
    { name: `synthetic-${run}.pdf`, mimeType: 'application/pdf', buffer: syntheticPdf() });
  await expect(page.getByText(`synthetic-${run}.pdf`)).toBeVisible();
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText('Your file was uploaded and stored privately.')).toBeVisible({ timeout: 60000 });
  // The claim that must never appear while no document reader exists.
  await expect(page.getByText('I have not read what is inside it.')).toBeVisible();
  await expect(page.getByText(/I am reading it now/)).toHaveCount(0);
});

test('a dropped connection keeps the message, and Retry sends it once', async ({ page }) => {
  await signIn(page, config.patient);
  await page.goto(chat('en'));
  const message = `Test ${run}: interrupted send, pulse 66`;

  // Fault injection: the server action POST for this page is aborted.
  await page.route(/\/records\/.+\/chat/, async route => {
    if (route.request().method() === 'POST') await route.abort('connectionfailed');
    else await route.fallback();
  });
  await page.getByPlaceholder(/Write how you feel/).fill(message);
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Your message and the file are still here.')).toBeVisible();
  // The composer still holds what was typed, and Send is usable again.
  await expect(page.getByPlaceholder(/Write how you feel/)).toHaveValue(message);
  await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();

  await page.unroute(/\/records\/.+\/chat/);
  await page.getByRole('alert').getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 30000 });

  // Exactly one copy of the message, not two: the retry carried the same turn token.
  await page.reload();
  await expect(page.getByText(message, { exact: false })).toHaveCount(1);
});

test('the second account retrieves exactly what was reviewed, and nothing else', async ({ page }) => {
  await signIn(page, config.caregiver);
  await page.goto(chat('en'));
  await page.getByText('Menu').click();

  const memory = page.locator('.chat-memory');
  await expect(memory).toBeVisible();
  // Confirmed and corrected readings are retrieved, with their units and the person's words.
  await expect(memory).toContainText('128/76');
  await expect(memory).toContainText('mmHg');
  await expect(memory).toContainText('70');
  await expect(memory).toContainText('сегодня утром');
  // The declined weight must not be there.
  const weightLines = memory.locator('li', { hasText: 'Weight' });
  await expect(weightLines).toHaveCount(0);
});

test('the conversation says where it is stored, separately from whether AI is on', async ({ page }) => {
  await signIn(page, config.patient);
  await page.goto(chat('en'));
  await page.getByText('Menu').click();
  // Storage is disclosed whatever the AI setting is: messages and files go to the hosted
  // private record. Saying "nothing leaves this computer" here would be false.
  await expect(page.getByText(/kept in the family.s private online record/)).toBeVisible();
  await expect(page.getByText(/leaves this computer/)).toHaveCount(0);
});
