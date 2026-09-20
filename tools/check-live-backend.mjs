// Read-only verification. Run with node --env-file=apps/web/.env.local tools/check-live-backend.mjs.
import assert from 'node:assert/strict';
const base = new URL(process.env.SUPABASE_URL);
assert.equal(base.protocol, 'https:', 'The hosted backend must use HTTPS');
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith('sb_publishable_'), 'Use a publishable key, never an admin key');
const request = async path => {
  const response = await fetch(new URL(path, base), {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, data: await response.json() };
};
const auth = await request('/auth/v1/settings');
assert.equal(auth.status, 200, 'Auth endpoint unavailable or project/key mismatch');
assert.equal(auth.data.external.email, true, 'Email authentication must be enabled');
console.log('PASS: Supabase Auth reachable; publishable key accepted; email authentication enabled.');
for (const table of ['patients', 'patient_access', 'record_sources', 'medical_records', 'record_revisions', 'audit_events', 'schema_versions', 'app_admins', 'managed_accounts', 'access_audit', 'patient_documents']) {
  const result = await request(`/rest/v1/${table}?select=*&limit=0`);
  assert.ok([401, 403].includes(result.status), `${table}: expected denied anonymous access, got ${result.status}`);
  assert.equal(result.data.code, '42501', `${table}: expected permission denial, not a missing-table error`);
  console.log(`PASS: ${table} exists and denies anonymous reads.`);
}
console.log('This does not establish authenticated access, write policies, or clinical readiness.');
