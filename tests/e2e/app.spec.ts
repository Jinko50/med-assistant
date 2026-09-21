import { test, expect } from '@playwright/test';
test('sign-in fails closed when backend is unconfigured; preview is explicit',async ({page}, testInfo) => {
  await page.goto('/en/login');
  await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();
  await page.getByRole('link',{name:'Explore patient view',exact:true}).click();
  await expect(page.getByText('Fictional patient · Read-only preview · Not for patient use')).toBeVisible();
  await expect(page.getByRole('heading',{name:'A clearer picture of your health.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Save to record'})).toHaveCount(0);
  await expect(page.getByText('Coming after safety review')).toBeVisible();
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({ path: testInfo.outputPath('patient.png'), fullPage: true });
});
test('caregiver preview has sources and unresolved facts with no write controls',async ({page}) => {
  await page.goto('/en/preview/caregiver');
  await expect(page.getByRole('heading',{name:'Care, with the full picture.'})).toBeVisible();
  await expect(page.getByText('Discharge letter says 20 mg; box says 40 mg. Unresolved.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Save to record'})).toHaveCount(0);
  await expect(page.getByText('The value on the fictional report could not be read.')).toBeVisible();
});
test('language switch applies Hebrew document direction without horizontal overflow',async ({page}, testInfo) => {
  await page.goto('/en/preview/patient');
  await page.getByRole('link',{name:'עב',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','he');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.getByRole('heading',{name:'תמונה ברורה יותר של הבריאות.'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({ path: testInfo.outputPath('hebrew.png'), fullPage: true });
  await page.getByRole('link',{name:'RU',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','ru');
  await expect(page.getByRole('heading',{name:'Ваше здоровье — понятнее.'})).toBeVisible();
});
test('protected record and history never fall back to fictional data',async ({page}) => {
  for (const path of ['/en/workspace','/en/records/10000000-0000-4000-8000-000000000001','/en/records/10000000-0000-4000-8000-000000000001/history']) {
    await page.goto(path);
    await expect(page.getByText('Furosemide strength')).toHaveCount(0);
    await expect(page.getByText('Maria · fictional patient')).toHaveCount(0);
    await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();
  }
});
test('health distinguishes running process from clinical readiness',async ({request}) => {
  expect((await request.get('/api/health')).status()).toBe(200);
  expect((await request.get('/api/readiness')).status()).toBe(503);
  const response = await request.get('/en/preview/patient');
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['x-frame-options']).toBe('DENY');
});

// The upload path changed: the browser now sends the file straight to Supabase Storage,
// so the security policy has to permit that connection and nothing wider. This instance
// runs without a backend, so no Storage origin is expected here — only the shape.
test('the security policy is served on every page and allows no wildcard origin',async ({request}) => {
  for (const path of ['/en/login','/ru/register','/he/login']) {
    const policy = (await request.get(path)).headers()['content-security-policy'];
    expect(policy, `${path} must carry a policy`).toBeTruthy();
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    const connect = /connect-src ([^;]*)/.exec(policy)![1];
    expect(connect).toContain("'self'");
    expect(connect).not.toContain('*');
  }
});

// A document link must refuse an unauthenticated visitor whatever the language, and must
// not fall back to a blank or untranslated framework page.
test('documents refuse an anonymous visitor in every language',async ({page}) => {
  const record='40000000-0000-4000-8000-000000000001';
  for (const locale of ['en','ru','he']) {
    await page.goto(`/${locale}/records/${record}/documents`);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('html')).toHaveAttribute('dir',locale==='he'?'rtl':'ltr');
    // No upload control, and no untranslated server-error page.
    await expect(page.getByRole('button',{name:'Upload document'})).toHaveCount(0);
    await expect(page.getByText('A server error occurred')).toHaveCount(0);
    await expect(page.locator('body')).not.toBeEmpty();
  }
});

// The conversation and the check-in page must refuse an anonymous visitor in every
// language, stay translated, and never fall back to an untranslated framework error.
test('daily screens are localized and refuse anonymous visitors',async ({page}) => {
  const record='40000000-0000-4000-8000-000000000001';
  for (const locale of ['en','ru','he']) {
    for (const path of [`/${locale}/records/${record}/chat`,`/${locale}/records/${record}/checkin`]) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang',locale);
      await expect(page.locator('html')).toHaveAttribute('dir',locale==='he'?'rtl':'ltr');
      await expect(page.getByText('A server error occurred')).toHaveCount(0);
      // Neither the check-in control nor the composer may render without access.
      await expect(page.getByRole('button',{name:/Save|Сохранить|שמירה/})).toHaveCount(0);
      await expect(page.getByRole('button',{name:/Send|Отправить|שליחה/})).toHaveCount(0);
      await expect(page.locator('textarea')).toHaveCount(0);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  }
});

// The old daily home screen is gone; its address must still land on the conversation
// rather than on a 404, so an existing bookmark keeps working.
test('the retired home screen redirects to the conversation',async ({page}) => {
  const record='40000000-0000-4000-8000-000000000001';
  await page.goto(`/ru/records/${record}/home`);
  await expect(page).toHaveURL(new RegExp(`/ru/records/${record}/chat$`));
});
