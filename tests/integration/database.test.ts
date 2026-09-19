import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const p1 = '10000000-0000-4000-8000-000000000001';
const p2 = '10000000-0000-4000-8000-000000000002';
const patient = '20000000-0000-4000-8000-000000000001';
const caregiver = '20000000-0000-4000-8000-000000000002';
const stranger = '20000000-0000-4000-8000-000000000003';
let recordId: string;
async function asUser(id: string) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec('set role authenticated');
}
async function save(overrides: Record<string,unknown> = {}) {
  const data = { patient: p1, record: null, version: 0, category: 'profile', label: 'Synthetic preference', value: 'Russian', unit: null,
    provenance: 'REPORTED', unknown: null, derivation: null, source: 'Synthetic caregiver statement', date: '2026-09', conflict: false, ...overrides };
  return db.query<{ id: string }>('select public.save_record($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) as id',Object.values(data));
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  await db.exec(readFileSync(new URL('../../database/migrations/001_record_foundation.sql',import.meta.url),'utf8'));
  await db.query('insert into auth.users values ($1),($2),($3)',[patient,caregiver,stranger]);
  await db.query("insert into public.patients(id,display_name) values ($1,'Synthetic Patient One'),($2,'Synthetic Patient Two')",[p1,p2]);
  await db.query("insert into public.patient_access(patient_id,user_id,role) values ($1,$2,'patient'),($1,$3,'caregiver'),($4,$5,'caregiver')",[p1,patient,caregiver,p2,stranger]);
});
after(async () => { await db.close(); });

test('migration applies and only authorized patient is visible', async () => {
  await asUser(patient);
  const result = await db.query<{id:string}>('select id from public.patients');
  assert.deepEqual(result.rows.map(r => r.id),[p1]);
});
test('caregiver save commits source, record, revision and audit together', async () => {
  await asUser(caregiver); const result = await save(); recordId = result.rows[0].id;
  const record = await db.query<{version:number;confirmed_by:string}>('select version,confirmed_by from public.medical_records');
  assert.equal(record.rows[0].version,1); assert.equal(record.rows[0].confirmed_by,caregiver);
  for (const table of ['record_sources','record_revisions','audit_events']) {
    assert.equal((await db.query(`select * from public.${table}`)).rows.length,1);
  }
});
test('patient can read saved fact and provenance but cannot create or update', async () => {
  await asUser(patient);
  assert.equal((await db.query('select * from public.medical_records')).rows.length,1);
  assert.equal((await db.query('select * from public.record_sources')).rows.length,1);
  await assert.rejects(save(), /Access denied/);
  await assert.rejects(save({record:recordId,version:1}), /Access denied/);
});
test('another caregiver cannot read or write another patient, even via RPC', async () => {
  await asUser(stranger);
  for (const table of ['medical_records','record_sources','record_revisions','audit_events'])
    assert.equal((await db.query(`select * from public.${table}`)).rows.length,0);
  await assert.rejects(save(),/Access denied/);
  await assert.rejects(save({ patient:p2,record:recordId,version:1 }),/Record not available/);
});
test('clients cannot bypass review service or grant themselves membership', async () => {
  await asUser(caregiver);
  for (const sql of ["update public.patient_access set can_manage_access=true", "delete from public.record_revisions", "update public.medical_records set value='tampered'", "delete from public.audit_events"])
    await assert.rejects(db.exec(sql),/permission denied/);
});
test('update preserves previous value and refuses stale version without orphan sources', async () => {
  await asUser(caregiver); await save({ record:recordId,version:1,value:'English' });
  const revisions = await db.query<{snapshot:{value:string}}>('select snapshot from public.record_revisions order by version');
  assert.deepEqual(revisions.rows.map(r => r.snapshot.value),['Russian','English']);
  await assert.rejects(save({record:recordId,version:1,value:'Hebrew'}),/Version conflict/);
  assert.equal((await db.query('select * from public.record_sources')).rows.length,2);
  assert.equal((await db.query('select * from public.audit_events')).rows.length,2);
});
test('unknowns cannot carry invented values; failed constraint rolls back source and audit', async () => {
  await asUser(caregiver);
  await assert.rejects(save({provenance:'UNKNOWN',value:'invented',unknown:'unreadable'}),/check constraint/);
  await assert.rejects(save({provenance:'UNKNOWN',value:null,unknown:null}),/check constraint/);
  assert.equal((await db.query('select * from public.record_sources')).rows.length,2);
  await save({provenance:'UNKNOWN',value:null,unknown:'Unreadable synthetic document',date:'UNKNOWN'});
  assert.equal((await db.query("select * from public.medical_records where provenance='UNKNOWN'")).rows.length,1);
});
test('clinical estimates and measurements without units are rejected', async () => {
  await asUser(caregiver);
  await assert.rejects(save({category:'lab',provenance:'ESTIMATED',derivation:'guessed',unit:'mg/dL'}),/check constraint/);
  await assert.rejects(save({category:'observation',unit:null}),/check constraint/);
  await assert.rejects(save({date:'2026-02-30'}),/check constraint/);
  await assert.rejects(save({label:' '}),/check constraint/);
});
test('audit storage failure rolls back record, source and revision together', async () => {
  await db.exec('reset role');
  await db.exec("create function private.fail_audit() returns trigger language plpgsql as $$begin raise exception 'Synthetic audit outage'; end;$$; create trigger fail_audit before insert on public.audit_events for each row execute function private.fail_audit();");
  await asUser(caregiver);
  const before = (await db.query('select * from public.record_sources')).rows.length;
  await assert.rejects(save({record:recordId,version:2,value:'should roll back'}),/Synthetic audit outage/);
  assert.equal((await db.query('select * from public.record_sources')).rows.length,before);
  assert.equal((await db.query<{value:string}>('select value from public.medical_records where id=$1',[recordId])).rows[0].value,'English');
  await db.exec('reset role; drop trigger fail_audit on public.audit_events; drop function private.fail_audit();');
});
test('revocation prevents subsequent reads and mutations without a new login', async () => {
  await db.exec('reset role');
  await db.query('update public.patient_access set revoked_at=now() where user_id=$1',[caregiver]);
  await asUser(caregiver);
  assert.equal((await db.query('select * from public.medical_records')).rows.length,0);
  assert.equal((await db.query('select * from public.patient_access')).rows.length,0);
  await assert.rejects(save(),/Access denied/);
  await asUser(patient);
  assert.equal((await db.query('select * from public.medical_records')).rows.length,2);
});
test('anonymous users cannot read records or invoke save', async () => {
  await db.exec('reset role; set role anon');
  await assert.rejects(db.exec('select * from public.medical_records'),/permission denied/);
  await assert.rejects(save(),/permission denied/);
});
