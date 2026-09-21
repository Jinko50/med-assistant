import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Migration 007, against the real SQL. The conversation is readable by everyone with
// current access, attributable to its writer, immutable, and structurally incapable of
// changing the approved medical record.
const db = new PGlite();
const care = '60000000-0000-4000-8000-000000000001';
const patient = '60000000-0000-4000-8000-000000000002';
const outsider = '60000000-0000-4000-8000-000000000003';
let pid: string;
let personMessage: string;

async function asUser(id: string) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
}
const sql = (name: string) => readFileSync(new URL(`../../database/migrations/${name}`, import.meta.url), 'utf8');

before(async () => {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
  alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;`);
  // 007 references patient_documents, so the document migrations come first, exactly as
  // they must on the live project.
  for (const name of ['001_record_foundation', '003_private_documents', '004_large_documents',
    '005_pending_document_verification', '007_conversation']) await db.exec(sql(`${name}.sql`));
  await db.query('insert into auth.users values($1),($2),($3)', [care, patient, outsider]);
  pid = (await db.query<{ id: string }>("insert into public.patients(display_name,preferred_language) values('Synthetic conversation','en') returning id")).rows[0].id;
  await db.query("insert into public.patient_access(patient_id,user_id,role) values($1,$2,'caregiver'),($1,$3,'patient')", [pid, care, patient]);
});
after(() => db.close());

test('a read-only patient can hold a conversation about themselves', async () => {
  await asUser(patient);
  const sent = await db.query<{ id: string }>(
    `insert into public.conversation_messages(patient_id,author_id,role,locale,body,safety_level)
     values($1,$2,'person','ru','Сегодня утром давление 135/80','none') returning id`, [pid, patient]);
  personMessage = sent.rows[0].id;
  assert.ok(personMessage);
  // The same account still cannot write a medical fact.
  await assert.rejects(db.query(
    "insert into public.medical_records(patient_id,category,label,provenance,source_id,confirmed_by) values($1,'observation','x','REPORTED',gen_random_uuid(),$2)", [pid, patient]));
});

test('a message with only a file is allowed; a message with neither is not', async () => {
  await asUser(patient);
  await assert.rejects(db.query(
    "insert into public.conversation_messages(patient_id,author_id,role,locale,body) values($1,$2,'person','en','')", [pid, patient]),
    /conversation_message_not_empty/, 'an empty message is not a message');
  await assert.rejects(db.query(
    "insert into public.conversation_messages(patient_id,author_id,role,locale,body) values($1,$2,'assistant','en','')", [pid, patient]),
    /conversation_message_not_empty/, 'the assistant always says something');
});

test('an assistant line carries no screening verdict of its own', async () => {
  await asUser(patient);
  await assert.rejects(db.query(
    `insert into public.conversation_messages(patient_id,author_id,role,locale,body,safety_level)
     values($1,$2,'assistant','en','hello','emergency')`, [pid, patient]),
    /conversation_assistant_unscreened/, 'the screen runs on what a person wrote, not on the reply');
});

test('nobody can write in someone else’s name, and an outsider sees nothing', async () => {
  await asUser(care);
  await assert.rejects(db.query(
    "insert into public.conversation_messages(patient_id,author_id,role,locale,body) values($1,$2,'person','en','hi')", [pid, patient]),
    /row-level security/, 'attribution must match the writer');
  await asUser(outsider);
  const rows = await db.query('select * from public.conversation_messages');
  assert.equal(rows.rows.length, 0, 'no cross-patient leakage');
  await assert.rejects(db.query(
    "insert into public.conversation_messages(patient_id,author_id,role,locale,body) values($1,$2,'person','en','hi')", [pid, outsider]),
    /row-level security/);
});

test('a caregiver reads what the patient said, and revocation stops it immediately', async () => {
  await asUser(care);
  assert.equal((await db.query('select * from public.conversation_messages')).rows.length, 1);
  await db.exec('reset role');
  await db.query('update public.patient_access set revoked_at=now() where patient_id=$1 and user_id=$2', [pid, care]);
  await asUser(care);
  assert.equal((await db.query('select * from public.conversation_messages')).rows.length, 0,
    'revocation applies per statement, not per session');
  await db.exec('reset role');
  await db.query('update public.patient_access set revoked_at=null where patient_id=$1 and user_id=$2', [pid, care]);
});

test('a conversation cannot be rewritten or erased by the application', async () => {
  await asUser(patient);
  await assert.rejects(db.query("update public.conversation_messages set body='something else'"),
    /permission denied/, 'what was said stays as it was said');
  await assert.rejects(db.query('delete from public.conversation_messages'), /permission denied/);
});

let factId: string;
test('a reading enters as a proposal, never as a confirmed fact', async () => {
  await asUser(patient);
  const inserted = await db.query<{ id: string; state: string }>(
    `insert into public.conversation_facts(patient_id,message_id,kind,value,unit,unit_stated,reported_when,created_by)
     values($1,$2,'blood_pressure','135/80','mmHg',false,'сегодня утром',$3) returning id,state`,
    [pid, personMessage, patient]);
  factId = inserted.rows[0].id;
  assert.equal(inserted.rows[0].state, 'proposed');
  // A client cannot insert something already marked reviewed.
  await assert.rejects(db.query(
    `insert into public.conversation_facts(patient_id,message_id,kind,value,created_by,state,reviewed_by,reviewed_at)
     values($1,$2,'pulse','72',$3,'confirmed',$3,now())`, [pid, personMessage, patient]),
    /row-level security/, 'nothing may arrive pre-confirmed');
});

test('an unwritten unit is stored as absent, not as a guess', async () => {
  await asUser(patient);
  const row = await db.query<{ unit: string; unit_stated: boolean }>(
    `insert into public.conversation_facts(patient_id,message_id,kind,value,created_by)
     values($1,$2,'temperature','37.8',$3) returning unit,unit_stated`, [pid, personMessage, patient]);
  assert.equal(row.rows[0].unit, '', 'an absent unit stays absent');
  assert.equal(row.rows[0].unit_stated, false);
});

test('confirming records who reviewed it and when', async () => {
  await asUser(care);
  await db.query('select public.review_conversation_fact($1,$2)', [factId, 'confirmed']);
  await db.exec('reset role');
  const row = (await db.query<{ state: string; reviewed_by: string; reviewed_at: string }>(
    'select state,reviewed_by,reviewed_at from public.conversation_facts where id=$1', [factId])).rows[0];
  assert.equal(row.state, 'confirmed');
  assert.equal(row.reviewed_by, care, 'a review names its reviewer');
  assert.ok(row.reviewed_at);
  const audit = await db.query<{ event_type: string }>(
    "select event_type from public.audit_events where event_type like 'conversation.fact.%'");
  assert.deepEqual(audit.rows.map(r => r.event_type), ['conversation.fact.confirmed']);
});

test('a review happens once; a later change of mind cannot overwrite it', async () => {
  await asUser(patient);
  await assert.rejects(db.query('select public.review_conversation_fact($1,$2)', [factId, 'declined']),
    /Already reviewed/, 'the earlier decision stays visible');
});

test('correcting stores the corrected value and marks the unit as stated by a person', async () => {
  await asUser(patient);
  const pending = (await db.query<{ id: string }>(
    `insert into public.conversation_facts(patient_id,message_id,kind,value,created_by)
     values($1,$2,'weight','78',$3) returning id`, [pid, personMessage, patient])).rows[0].id;
  await db.query('select public.review_conversation_fact($1,$2,$3,$4)', [pending, 'corrected', '78.5', 'kg']);
  await db.exec('reset role');
  const row = (await db.query<{ value: string; unit: string; unit_stated: boolean; state: string }>(
    'select value,unit,unit_stated,state from public.conversation_facts where id=$1', [pending])).rows[0];
  assert.deepEqual([row.value, row.unit, row.unit_stated, row.state], ['78.5', 'kg', true, 'corrected']);
});

test('an outsider cannot review anything', async () => {
  await asUser(patient);
  const pending = (await db.query<{ id: string }>(
    `insert into public.conversation_facts(patient_id,message_id,kind,value,created_by)
     values($1,$2,'pulse','72',$3) returning id`, [pid, personMessage, patient])).rows[0].id;
  await asUser(outsider);
  await assert.rejects(db.query('select public.review_conversation_fact($1,$2)', [pending, 'confirmed']),
    /Access denied/);
  await asUser(patient);
  await assert.rejects(db.query('select public.review_conversation_fact($1,$2)', [pending, 'approved']),
    /Unsupported review state/, 'only the documented review states exist');
});

test('a conversation never becomes an approved medical fact', async () => {
  await db.exec('reset role');
  const facts = await db.query<{ count: number | string }>('select count(*) count from public.medical_records');
  assert.equal(Number(facts.rows[0].count), 0,
    'nothing said in conversation may enter the record without the reviewed path');
  const version = await db.query<{ version: number }>('select max(version) version from public.schema_versions');
  assert.equal(Number(version.rows[0].version), 7);
});

// The complete journey the owner asked to be tested, at the level this test can honestly
// reach: what a person writes becomes a proposal, a person reviews it, and a LATER
// conversation retrieves exactly what was reviewed - not the proposal, and not a guess.
// The HTTP and browser halves of the journey are exercised separately; see the readiness
// report for what is and is not verified against the live project.
test('a confirmed reading is retrieved correctly in a later conversation', async () => {
  await asUser(patient);
  // Session one: the person writes a sentence and the reader proposes what it saw.
  const first = (await db.query<{ id: string }>(
    `insert into public.conversation_messages(patient_id,author_id,role,locale,body,safety_level)
     values($1,$2,'person','ru','Сегодня утром давление 128/76, пульс 68','none') returning id`,
    [pid, patient])).rows[0].id;
  const proposals = await db.query<{ id: string; kind: string }>(
    `insert into public.conversation_facts(patient_id,message_id,kind,value,unit,unit_stated,reported_when,created_by)
     values($1,$2,'blood_pressure','128/76','mmHg',false,'сегодня утром',$3),
           ($1,$2,'pulse','68','/min',false,'сегодня утром',$3) returning id,kind`,
    [pid, first, patient]);
  assert.equal(proposals.rows.length, 2);

  // The person confirms one and declines the other.
  const bp = proposals.rows.find(r => r.kind === 'blood_pressure')!.id;
  const pulse = proposals.rows.find(r => r.kind === 'pulse')!.id;
  await db.query('select public.review_conversation_fact($1,$2)', [bp, 'confirmed']);
  await db.query('select public.review_conversation_fact($1,$2)', [pulse, 'declined']);

  // Session two, the caregiver this time: only what a person reviewed comes back, with the
  // value unchanged and the person's own words about when.
  await asUser(care);
  const recalled = await db.query<{ kind: string; value: string; unit: string; reported_when: string }>(
    `select kind,value,unit,reported_when from public.conversation_facts
     where patient_id=$1 and message_id=$2 and state in ('confirmed','corrected')`, [pid, first]);
  assert.deepEqual(recalled.rows, [
    { kind: 'blood_pressure', value: '128/76', unit: 'mmHg', reported_when: 'сегодня утром' },
  ], 'the confirmed reading comes back exactly as reviewed, and the declined one does not');

  // The earlier message is still readable in full, so the reply can cite what was said.
  const said = await db.query<{ body: string }>(
    'select body from public.conversation_messages where id=$1', [first]);
  assert.match(said.rows[0].body, /128\/76/);

  // And none of it has become an approved medical fact.
  await db.exec('reset role');
  const records = await db.query<{ count: number | string }>('select count(*) count from public.medical_records');
  assert.equal(Number(records.rows[0].count), 0);
});

// One turn is one transaction, and a retry is harmless. Added after the independent review
// of 2026-09-21, which found that the person's message, the reply and the facts were three
// separate writes: a failure between them stored a question with no answer, and pressing
// Retry stored the question a second time.
const TOKEN_A = '70000000-0000-4000-8000-0000000000aa';
const TOKEN_B = '70000000-0000-4000-8000-0000000000bb';
const post = (token: string, body: string, reply: string, facts: unknown[] = [], as = pid) =>
  db.query('select public.post_conversation_turn($1,$2,$3,$4,null,$5,$6,$7::jsonb) result',
    [as, 'ru', token, body, 'none', reply, JSON.stringify(facts)]);

test('a turn stores the message, the reply and the readings together', async () => {
  await asUser(patient);
  const result = await post(TOKEN_A, 'Пульс 72', 'Вот что я прочитал:',
    [{ kind: 'pulse', value: '72', unit: '/min', unit_stated: false, reported_when: 'сегодня' }]);
  const turn = (result.rows[0] as { result: { person: { id: string; body: string }; assistant: { body: string }; facts: Array<{ kind: string; state: string }> } }).result;
  assert.equal(turn.person.body, 'Пульс 72');
  assert.equal(turn.assistant.body, 'Вот что я прочитал:');
  assert.deepEqual(turn.facts.map(f => [f.kind, f.state]), [['pulse', 'proposed']]);
});

test('retrying the same turn returns the same rows instead of duplicating it', async () => {
  await asUser(patient);
  const before = await db.query<{ count: string }>(
    "select count(*) count from public.conversation_messages where client_token=$1", [TOKEN_A]);
  const again = await post(TOKEN_A, 'Пульс 72', 'Вот что я прочитал:',
    [{ kind: 'pulse', value: '72', unit: '/min', unit_stated: false, reported_when: 'сегодня' }]);
  const turn = (again.rows[0] as { result: { facts: unknown[] } }).result;
  const after = await db.query<{ count: string }>(
    "select count(*) count from public.conversation_messages where client_token=$1", [TOKEN_A]);
  assert.equal(Number(after.rows[0].count), Number(before.rows[0].count),
    'a retry must not store the message twice');
  assert.equal(turn.facts.length, 1, 'nor propose the same reading twice');
});

test('a turn whose reading cannot be stored stores nothing at all', async () => {
  await asUser(patient);
  // 'walking' is not one of the documented measurement kinds, so the fact insert fails.
  await assert.rejects(post(TOKEN_B, 'Я прошёл 2000 шагов', 'Хорошо.',
    [{ kind: 'walking', value: '2000' }]), /violates check constraint/);
  const orphan = await db.query<{ count: string }>(
    'select count(*) count from public.conversation_messages where client_token=$1', [TOKEN_B]);
  assert.equal(Number(orphan.rows[0].count), 0,
    'a failed reading must not leave the message stored without its reply');
});

test('a turn needs a token, and current access to the record', async () => {
  await asUser(patient);
  await assert.rejects(db.query(
    'select public.post_conversation_turn($1,$2,null,$3,null,$4,$5,$6::jsonb)',
    [pid, 'ru', 'hi', 'none', 'hello', '[]']), /A turn needs a token/);
  await asUser(outsider);
  await assert.rejects(post('70000000-0000-4000-8000-0000000000cc', 'hi', 'hello'), /Access denied/);
});

test('an assistant line lost mid-turn is completed by the retry, not duplicated', async () => {
  // Simulates the exact half-failure: the person's row exists, the reply does not.
  await db.exec('reset role');
  const token = '70000000-0000-4000-8000-0000000000dd';
  await db.query(
    `insert into public.conversation_messages(patient_id,author_id,role,locale,body,client_token)
     values($1,$2,'person','ru','Вес 80 кг',$3)`, [pid, patient, token]);
  await asUser(patient);
  const result = await post(token, 'Вес 80 кг', 'Вот что я прочитал:');
  const turn = (result.rows[0] as { result: { assistant: { body: string } } }).result;
  assert.equal(turn.assistant.body, 'Вот что я прочитал:', 'the missing reply is written');
  const rows = await db.query<{ count: string }>(
    "select count(*) count from public.conversation_messages where client_token=$1 and role='person'", [token]);
  assert.equal(Number(rows.rows[0].count), 1, 'the person’s message stays single');
});
