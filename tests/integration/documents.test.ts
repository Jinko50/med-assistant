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
 for(const name of ['001_record_foundation','003_private_documents'])await db.exec(readFileSync(new URL(`../../database/migrations/${name}.sql`,import.meta.url),'utf8'));
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
test('storage restricts upload paths and hides pending originals',async()=>{
 const insert=(name:string)=>db.query("insert into storage.objects(bucket_id,name) values('medical-originals',$1)",[name]);
 await asUser(other);await assert.rejects(insert(`${pid}/${doc}`),/row-level security/);
 await asUser(care);await assert.rejects(insert(`${pid}/arbitrary`),/row-level security/);
 await insert(`${pid}/${doc}`);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await db.query('select public.finish_document($1)',[doc]);
 assert.equal((await db.query('select * from storage.objects')).rows.length,1);
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
