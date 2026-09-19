import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const admin='30000000-0000-4000-8000-000000000001',care='30000000-0000-4000-8000-000000000002',patient='30000000-0000-4000-8000-000000000003',stranger='30000000-0000-4000-8000-000000000004';
let pid:string;
async function asUser(id:string){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
const setAccount=(email:string,role='caregiver',active=true,version=0)=>db.query('select public.admin_set_account($1,$2,$3,$4,$5)',[pid,email,role,active,version]);
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const name of ['001_record_foundation','002_fixed_accounts'])await db.exec(readFileSync(new URL(`../../database/migrations/${name}.sql`,import.meta.url),'utf8'));
 await db.query("insert into auth.users values($1,'admin@example.invalid',now()),($2,'care@example.invalid',now()),($3,'patient@example.invalid',null),($4,'stranger@example.invalid',now())",[admin,care,patient,stranger]);
 await db.query('insert into public.app_admins(user_id) values($1)',[admin]);
});
after(()=>db.close());
test('only the bootstrapped admin can create patients and assign roles',async()=>{
 await asUser(care);await assert.rejects(db.query("select public.admin_create_patient('Test','ru')"),/Access denied/);
 await asUser(admin);pid=(await db.query<{id:string}>("select public.admin_create_patient('Synthetic admin test','ru') as id")).rows[0].id;
 await setAccount(' CARE@example.invalid ');await setAccount('patient@example.invalid','patient');
 await asUser(care);await assert.rejects(setAccount('stranger@example.invalid'),/Access denied/);
 await assert.rejects(db.query('insert into public.app_admins(user_id) values($1)',[care]),/permission denied/);
 assert.equal((await db.query('select * from public.managed_accounts')).rows.length,0);
});
test('unconfirmed and unapproved accounts cannot claim record access',async()=>{
 await asUser(patient);await assert.rejects(db.query('select public.claim_managed_access()'),/Verified account/);
 await asUser(stranger);await db.query('select public.claim_managed_access()');assert.equal((await db.query('select * from public.patients')).rows.length,0);
 await db.exec('reset role');await db.query('update auth.users set email_confirmed_at=now() where id=$1',[patient]);
 await asUser(patient);await db.query('select public.claim_managed_access()');assert.equal((await db.query('select * from public.patients')).rows.length,1);
});
test('patient writes denied; caregiver can save and patient sees shared record',async()=>{
 const save=()=>db.query("select public.save_record($1,null,0,'note','Synthetic note','For testing',null,'REPORTED',null,null,'Test source','UNKNOWN',false)",[pid]);
 await asUser(patient);await assert.rejects(save(),/Access denied/);
 await asUser(care);await save();await asUser(patient);assert.equal((await db.query('select * from public.medical_records')).rows.length,1);
});
test('stale admin edits are refused and revocation cannot be undone by login',async()=>{
 await asUser(admin);await assert.rejects(setAccount('care@example.invalid','caregiver',false,0),/Version conflict/);
 await setAccount('care@example.invalid','caregiver',false,1);
 await asUser(care);await db.query('select public.claim_managed_access()');assert.equal((await db.query('select * from public.patients')).rows.length,0);
 await assert.rejects(db.query("select public.save_record($1,null,0,'note','x','y',null,'REPORTED',null,null,'source','UNKNOWN',false)",[pid]),/Access denied/);
});
test('single patient account rule, role validation and admin revocation are enforced',async()=>{
 await asUser(admin);await assert.rejects(setAccount('stranger@example.invalid','patient'),/unique constraint/);
 await assert.rejects(setAccount('stranger@example.invalid','admin'),/check constraint/);
 assert.ok((await db.query('select * from public.access_audit')).rows.length>=5);
 await db.exec('reset role');await db.query('update public.app_admins set revoked_at=now() where user_id=$1',[admin]);
 await asUser(admin);await assert.rejects(setAccount('care@example.invalid','caregiver',true,2),/Access denied/);
});
