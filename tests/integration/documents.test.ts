import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const care='40000000-0000-4000-8000-000000000001',patient='40000000-0000-4000-8000-000000000002',other='40000000-0000-4000-8000-000000000003';
let pid:string,doc:string;
async function asUser(id:string){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
 alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;`);
 for(const name of ['001_record_foundation','003_private_documents','004_large_documents','005_pending_document_verification'])await db.exec(readFileSync(new URL(`../../database/migrations/${name}.sql`,import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3)',[care,patient,other]);
 pid=(await db.query<{id:string}>("insert into public.patients(display_name,preferred_language) values('Synthetic documents','en') returning id")).rows[0].id;
 await db.query("insert into public.patient_access(patient_id,user_id,role) values($1,$2,'caregiver'),($1,$3,'patient')",[pid,care,patient]);
});
after(()=>db.close());
const reserve=()=>db.query<{id:string}>("select public.reserve_document($1,'synthetic.pdf','application/pdf',12,$2) id",[pid,'a'.repeat(64)]);
test('only assigned editors can reserve document uploads',async()=>{
 await asUser(patient);await assert.rejects(reserve(),/Access denied/);
 await asUser(other);await assert.rejects(reserve(),/Access denied/);
 await asUser(care);doc=(await reserve()).rows[0].id;
 await assert.rejects(db.query('select public.finish_document($1)',[doc]),/Upload incomplete/);
});
test('uploader can verify pending original while other editors cannot read or finalize it',async()=>{
 const insert=(name:string)=>db.query("insert into storage.objects(bucket_id,name) values('medical-originals',$1)",[name]);
 await asUser(other);await assert.rejects(insert(`${pid}/${doc}`),/row-level security/);
 await asUser(care);await assert.rejects(insert(`${pid}/arbitrary`),/row-level security/);
 await insert(`${pid}/${doc}`);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 // This SELECT is the permission used by Storage createSignedUrl during verification.
 await db.exec('reset role');
 await db.query("insert into public.patient_access(patient_id,user_id,role) values($1,$2,'caregiver')",[pid,other]);
 await asUser(other);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(db.query('select public.finish_document($1)',[doc]),/Access denied/);
 await asUser(care);
 await db.query('select public.finish_document($1)',[doc]);
 assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await asUser(other);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await asUser(care);
 assert.equal((await db.query("select * from public.audit_events where event_type='document.uploaded'")).rows.length,1);
 await db.query('select public.finish_document($1)',[doc]);
 assert.equal((await db.query("select * from public.audit_events where event_type='document.uploaded'")).rows.length,1);
});
test('originals cannot be overwritten or removed and revocation cuts access',async()=>{
 await asUser(care);
 assert.equal((await db.query("update storage.objects set name='changed' returning *")).rows.length,0);
 assert.equal((await db.query('delete from storage.objects returning *')).rows.length,0);
 await asUser(patient);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 assert.equal((await db.query('select * from public.patient_documents')).rows.length,0);
 await db.exec('reset role');await db.query('update public.patient_access set revoked_at=now() where user_id=$1',[care]);
 await asUser(care);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(reserve(),/Access denied/);
});

// Migration 004 raises the supported original from 10 MiB to 50 MB so a real scanned PDF
// can be stored unchanged. The metadata constraint and the bucket ceiling must move
// together: if only one is raised, a file the interface accepts is refused later, after a
// row already exists, leaving a pending entry behind.
test('migration 004 raises the document ceiling in metadata and in storage together',async()=>{
 const {MAX_DOCUMENT_BYTES}=await import('../../packages/domain/document.ts');
 await db.exec('reset role');
 const bucket=await db.query<{file_size_limit:string|number;public:boolean}>(
  "select file_size_limit,public from storage.buckets where id='medical-originals'");
 assert.equal(Number(bucket.rows[0].file_size_limit),MAX_DOCUMENT_BYTES,
  'the bucket ceiling must equal the application cap exactly');
 assert.equal(bucket.rows[0].public,false,'the bucket must stay private');
 const version=await db.query<{version:number}>('select max(version) version from public.schema_versions');
 assert.equal(Number(version.rows[0].version),5);

 // Earlier tests revoke access on the shared patient, so use a fresh record here.
 const large=(await db.query<{id:string}>("insert into public.patients(display_name,preferred_language) values('Synthetic large','en') returning id")).rows[0].id;
 await db.query("insert into public.patient_access(patient_id,user_id,role) values($1,$2,'caregiver')",[large,care]);
 await asUser(care);
 // Exactly the supported maximum is accepted by the metadata constraint.
 const biggest=await db.query<{id:string}>("select public.reserve_document($1,'synthetic-large.pdf','application/pdf',$2,$3) id",
  [large,MAX_DOCUMENT_BYTES,'b'.repeat(64)]);
 assert.ok(biggest.rows[0].id);
 // One byte more is refused by the database, not only by the interface.
 await assert.rejects(db.query("select public.reserve_document($1,'synthetic-too-large.pdf','application/pdf',$2,$3) id",
  [large,MAX_DOCUMENT_BYTES+1,'c'.repeat(64)]),/violates check constraint/);
});
