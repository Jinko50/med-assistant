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
