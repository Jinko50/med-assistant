const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { chromium } = require('@playwright/test');
const root = path.resolve(process.argv[2]);
const child = spawn(path.join(root, 'runtime/node.exe'), [path.join(root, 'launch.cjs'), '--no-browser'], {
  cwd: root, windowsHide: true, env: { ...process.env, PATH: process.env.SystemRoot + '\\System32' },
});
let browser;
const timeout = setTimeout(() => { console.error('Portable startup timed out'); cleanup(); process.exitCode = 1; }, 45000);
function cleanup() {
  clearTimeout(timeout);
  try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
}
let output = '';
child.stderr.on('data', data => process.stderr.write(data));
child.stdout.on('data', async data => {
  output += data;
  const match = output.match(/APP_READY (http:\/\/127\.0\.0\.1:\d+)\/ru\/preview\/patient/);
  if (!match || browser) return;
  browser = true;
  try {
    const base = match[1];
    const health = await (await fetch(base + '/api/health')).json();
    assert.equal(health.clinicalReady, false);
    assert.equal((await fetch(base + '/api/readiness')).status, 503);
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.url().includes('/_next/static/') && !response.ok()) failures.push(response.url()); });
    for (const locale of ['ru', 'en', 'he']) {
      await page.goto(base + '/' + locale + '/preview/patient');
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.ok((await page.locator('h1').innerText()).length > 5);
      const styled = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
      assert.ok(!styled.includes('Times New Roman'), 'CSS must load in the extracted package');
    }
    await page.goto(base + '/en/preview/caregiver');
    assert.match(await page.locator('h1').innerText(), /Care/);
    await page.goto(base + '/en/login');
    assert.equal(await page.getByRole('button', {name:'Sign in', exact:true}).isDisabled(), true);
    assert.deepEqual(failures, []);
    console.log('PASS: extracted portable app, bundled runtime, three locales, assets, caregiver preview, disabled login and readiness.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { if (browser && browser !== true) await browser.close(); cleanup(); }
});
child.on('error', error => { console.error(error); cleanup(); process.exitCode = 1; });
child.on('exit', code => { if (!browser) { clearTimeout(timeout); console.error(`Launcher exited before readiness (${code}).`); process.exitCode = 1; } });
