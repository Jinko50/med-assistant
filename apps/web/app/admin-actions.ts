'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../lib/admin';
import { isLocale } from '../lib/i18n';
export type AdminState={message:string};
export async function manageAccount(_state:AdminState,form:FormData):Promise<AdminState>{
 const locale=String(form.get('locale')); if(!isLocale(locale)) return {message:'Invalid language.'};
 const parsed=z.object({patient:z.uuid(),email:z.email().max(254),role:z.enum(['patient','caregiver']),active:z.boolean(),version:z.number().int().min(0)}).safeParse({patient:form.get('patient'),email:String(form.get('email')).trim().toLowerCase(),role:form.get('role'),active:form.get('active')==='true',version:Number(form.get('version'))});
 if(!parsed.success) return {message:'Check the email address, patient and role.'};
 try {const {db}=await requireAdmin();const p=parsed.data;const {error}=await db.rpc('admin_set_account',{p_patient:p.patient,p_email:p.email,p_role:p.role,p_active:p.active,p_version:p.version});
 if(error) return {message:error.code==='40001'?'Another change was saved. Refresh and try again.':error.code==='23505'?'This patient already has an active patient account. Revoke that account first.':'Account was not changed. Check access and try again.'};
 revalidatePath(`/${locale}/admin`);return {message:'Saved. Access changes apply immediately.'};
 }catch{return {message:'Administrator access is required. Nothing was changed.'};}
}
export async function createPatient(_state:AdminState,form:FormData):Promise<AdminState>{
 const locale=String(form.get('locale'));const name=String(form.get('name')).trim();
 if(!isLocale(locale)||name.length<1||name.length>120) return {message:'Enter a patient display name.'};
 try{const {db}=await requireAdmin();const {error}=await db.rpc('admin_create_patient',{p_name:name,p_locale:locale});
 if(error)return {message:'Patient was not created.'};revalidatePath(`/${locale}/admin`);return {message:'Patient created. Add the approved email addresses below.'};
 }catch{return {message:'Administrator access is required.'};}
}
