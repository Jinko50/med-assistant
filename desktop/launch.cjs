// Uses only the runtime bundled with the portable Windows download.
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');
const root = __dirname;
const probe = net.createServer();
probe.on('error', fail);
probe.listen(0, '127.0.0.1', () => {
  const port = probe.address().port;
  probe.close(() => start(port));
});
function fail(error) {
  console.error('Med Assistant could not start:', error.message);
  process.exitCode = 1;
}
function start(port) {
  const serverPath = path.join(root, 'app', 'apps', 'web', 'server.js');
  if (!fs.existsSync(serverPath)) return fail(new Error('Extract the entire ZIP before opening Start Med Assistant.cmd.'));
  const env = { ...process.env, NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: String(port),
    MED_ASSISTANT_PREVIEW_ONLY: 'true', ENABLE_FICTIONAL_PREVIEW: 'true', NEXT_TELEMETRY_DISABLED: '1' };
  // Release is deliberately a fictional preview. Never inherit credentials.
  for (const key of Object.keys(env)) if (/SUPABASE|OPENAI|NODE_OPTIONS|NODE_PATH/.test(key)) delete env[key];
  const server = spawn(process.execPath, [serverPath], { env, windowsHide: true, stdio: 'inherit' });
  let stopping = false;
  const stop = () => { stopping = true; server.kill(); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('error', fail);
  server.on('exit', code => { if (!stopping && code !== 0) fail(new Error(`Server stopped (${code}).`)); });
  const base = `http://127.0.0.1:${port}`;
  console.log('Med Assistant — fictional preview / demonstration only.');
  console.log('Keep this window open. Press Ctrl+C to stop the app.');
  (async () => {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null || stopping) return;
      try {
        const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) });
        if (response.ok && (await response.json()).clinicalReady === false) {
          const url = `${base}/ru/preview/patient`;
          console.log(`APP_READY ${url}`);
          if (!process.argv.includes('--no-browser')) {
            const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
            const browser = spawn(ps, ['-NoProfile', '-NonInteractive', '-Command', `Start-Process '${url}'`], { windowsHide: true, stdio: 'ignore' });
            browser.on('error', () => console.log(`Open this address in your browser: ${url}`));
          }
          return;
        }
      } catch { /* The server is still starting. */ }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    stop();
    fail(new Error('Startup timed out. Please reopen the app.'));
  })().catch(error => { stop(); fail(error); });
}
