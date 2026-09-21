import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

// Migration 006. Check-ins are reports, stored apart from the approved record, readable by
// everyone with current access and writable only in the writer's own name.
const db=new PGlite();
const care='50000000-0000-4000-8000-000000000001';
const patient='50000000-0000-4000-8000-000000000002';
const outsider='50000000-0000-4000-8000-000000000003';
let pid:string;
async function asUser(id:string){
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 await db.exec('set role authenticated');
}
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;`);
 await db.exec(readFileSync(new URL('../../database/migrations/001_record_foundation.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('../../database/migrations/006_wellbeing_checkins.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3)',[care,patient,outsider]);
 pid=(await db.query<{id:string}>("insert into public.patients(display_name,preferred_language) values('Synthetic wellbeing','en') returning id")).rows[0].id;
 await db.query("insert into public.patient_access(patient_id,user_id,role) values($1,$2,'caregiver'),($1,$3,'patient')",[pid,care,patient]);
});
after(()=>db.close());

test('a read-only patient can report on themselves without being an editor',async()=>{
 await asUser(patient);
 const inserted=await db.query<{id:string}>(
  "insert into public.wellbeing_reports(patient_id,reported_by,feeling,note) values($1,$2,'ok','slept well') returning id",[pid,patient]);
 assert.ok(inserted.rows[0].id,'the patient must be able to record their own day');
 // The same account still cannot write medical facts.
 await assert.rejects(db.query(
  "insert into public.medical_records(patient_id,category,label,provenance,source_id,created_by,updated_by) values($1,'condition','x','REPORTED',gen_random_uuid(),$2,$2)",[pid,patient]));
});

test('a caregiver may record what they were told, attributed to themselves',async()=>{
 await asUser(care);
 await db.query("insert into public.wellbeing_reports(patient_id,reported_by,feeling) values($1,$2,'poor')",[pid,care]);
 const rows=await db.query<{reported_by:string}>('select reported_by from public.wellbeing_reports order by created_at');
 assert.equal(rows.rows.length,2);
 assert.deepEqual(new Set(rows.rows.map(r=>r.reported_by)),new Set([patient,care]),
  'who wrote each report must stay distinguishable');
});

test('nobody can file a report in someone else’s name',async()=>{
 await asUser(care);
 await assert.rejects(db.query(
  "insert into public.wellbeing_reports(patient_id,reported_by,feeling) values($1,$2,'good')",[pid,patient]),
  /row-level security/,'attribution must match the writer');
});

test('an unrelated account can neither read nor write check-ins',async()=>{
 await asUser(outsider);
 const rows=await db.query('select * from public.wellbeing_reports');
 assert.equal(rows.rows.length,0,'no cross-patient leakage');
 await assert.rejects(db.query(
  "insert into public.wellbeing_reports(patient_id,reported_by,feeling) values($1,$2,'good')",[pid,outsider]),
  /row-level security/);
});

test('revoking access stops reading check-ins immediately',async()=>{
 await db.exec('reset role');
 await db.query('update public.patient_access set revoked_at=now() where patient_id=$1 and user_id=$2',[pid,care]);
 await asUser(care);
 const rows=await db.query('select * from public.wellbeing_reports');
 assert.equal(rows.rows.length,0,'revocation applies per statement, not per session');
 await db.exec('reset role');
 await db.query('update public.patient_access set revoked_at=null where patient_id=$1 and user_id=$2',[pid,care]);
});

test('an entirely empty check-in is refused, and reports are immutable',async()=>{
 await asUser(patient);
 await assert.rejects(db.query(
  'insert into public.wellbeing_reports(patient_id,reported_by) values($1,$2)',[pid,patient]),
  /wellbeing_reports_not_empty/,'an empty form is not a report');
 // Neither update nor delete is granted at all, so a report cannot be rewritten or erased
 // by the application: a correction is a new, later report.
 await assert.rejects(db.query("update public.wellbeing_reports set feeling='good'"),
  /permission denied/,'reports must not be editable');
 await assert.rejects(db.query('delete from public.wellbeing_reports'),
  /permission denied/,'reports must not be deletable');
});

test('only the documented vocabularies and the audit level are accepted',async()=>{
 await asUser(patient);
 await assert.rejects(db.query(
  "insert into public.wellbeing_reports(patient_id,reported_by,feeling) values($1,$2,'excellent')",[pid,patient]),
  /violates check constraint/);
 await assert.rejects(db.query(
  "insert into public.wellbeing_reports(patient_id,reported_by,feeling,safety_level) values($1,$2,'ok','critical')",[pid,patient]),
  /violates check constraint/);
 // The screen's decision is stored for audit, including that nothing matched.
 await db.query("insert into public.wellbeing_reports(patient_id,reported_by,note,safety_level) values($1,$2,'chest pain','emergency')",[pid,patient]);
 const rows=await db.query<{safety_level:string}>("select safety_level from public.wellbeing_reports where note='chest pain'");
 assert.equal(rows.rows[0].safety_level,'emergency');
});

test('check-ins are kept out of the approved medical record',async()=>{
 await db.exec('reset role');
 const facts=await db.query<{count:number|string}>('select count(*) count from public.medical_records');
 assert.equal(Number(facts.rows[0].count),0,
  'no check-in may become a confirmed medical fact without review');
 const version=await db.query<{version:number}>('select max(version) version from public.schema_versions');
 assert.equal(Number(version.rows[0].version),6);
});
