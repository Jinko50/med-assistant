const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { chromium } = require('@playwright/test');
const root = path.resolve(process.argv[2]);
const connected = require('node:fs').existsSync(path.join(root,'app-config.json'));
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
  const match = output.match(/APP_READY (http:\/\/127\.0\.0\.1:\d+)\/ru\/(?:preview\/patient|login)/);
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
    if(connected) {
      await page.goto(base+'/ru/login');
      assert.equal(await page.locator('input[name=email]').isEnabled(),true);
      await page.goto(base+'/en/register');
      assert.equal(await page.getByRole('button',{name:'Create my account'}).isEnabled(),true);
      assert.equal(await page.locator('input[name=password]').getAttribute('minlength'),'6');
      await page.goto(base+'/en/admin');
      assert.equal(await page.getByRole('heading',{name:'Account administration'}).count(),0);
      assert.equal(await page.getByRole('button',{name:'Approve email address'}).count(),0);
      const documents='/en/records/40000000-0000-4000-8000-000000000001/documents';
      await page.goto(base+documents);
      assert.equal(await page.getByRole('button',{name:'Upload document',exact:true}).count(),0);
      const download=await fetch(base+documents+'/40000000-0000-4000-8000-000000000002',{redirect:'manual'});
      assert.equal(download.status,403);
      assert.equal((await page.goto(base+'/en/preview/patient')).status(),404);
      // The reported defect: /ru/ served English with no way to change language.
      await page.goto(base+'/ru/register');
      assert.equal(await page.locator('html').getAttribute('lang'),'ru');
      assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
      assert.equal(await page.getByRole('heading',{name:'Set up your account'}).count(),0,'/ru/register must not be English');
      assert.equal(await page.getByRole('heading',{name:'Создание аккаунта'}).count(),1);
      assert.ok(await page.locator('nav.languages a[hreflang=he]').count()>0,'language selection must be visible');
      await page.goto(base+'/he/register');
      assert.equal(await page.locator('html').getAttribute('lang'),'he');
      assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
      assert.equal(await page.getByRole('heading',{name:'הקמת חשבון'}).count(),1);
      assert.equal(await page.locator('input[name=email]').getAttribute('dir'),'ltr','email stays left-to-right in Hebrew');
      // A visible build identifier, readable before signing in.
      await page.goto(base+'/en/login');
      assert.ok(await page.locator('[data-app-version]').count()>0,'login must show the build version');
      const shown=await page.locator('[data-app-version]').getAttribute('data-app-version');
      assert.ok(shown && shown.length>0 && shown!=='0.4.0-dev','packaged build must carry a stamped version, got '+shown);
      assert.deepEqual(failures,[]);
      console.log('PASS: connected extracted app, enabled login, six-character registration minimum, anonymous admin/document denial, preview disabled, RU/HE localization with correct lang/dir and visible language selection, LTR email field in Hebrew, stamped build version, assets and blocked clinical readiness. Live authenticated acceptance still required.');
      return;
    }
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
