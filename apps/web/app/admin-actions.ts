'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../lib/admin';
import { isLocale } from '../lib/i18n';
// The message is a key into translations[locale].adminMessages. Server actions
// never return display text, so every message can be shown in RU/HE/EN.
export type AdminState={message:string};
export async function manageAccount(_state:AdminState,form:FormData):Promise<AdminState>{
 const locale=String(form.get('locale')); if(!isLocale(locale)) return {message:'invalidLanguage'};
 const parsed=z.object({patient:z.uuid(),email:z.email().max(254),role:z.enum(['patient','caregiver']),active:z.boolean(),version:z.number().int().min(0)}).safeParse({patient:form.get('patient'),email:String(form.get('email')).trim().toLowerCase(),role:form.get('role'),active:form.get('active')==='true',version:Number(form.get('version'))});
 if(!parsed.success) return {message:'checkFields'};
 try {const {db}=await requireAdmin();const p=parsed.data;const {error}=await db.rpc('admin_set_account',{p_patient:p.patient,p_email:p.email,p_role:p.role,p_active:p.active,p_version:p.version});
 if(error) return {message:error.code==='40001'?'conflict':error.code==='23505'?'duplicatePatient':'notChanged'};
 revalidatePath(`/${locale}/admin`);return {message:'saved'};
 }catch{return {message:'adminRequired'};}
}
export async function createPatient(_state:AdminState,form:FormData):Promise<AdminState>{
 const locale=String(form.get('locale'));const name=String(form.get('name')).trim();
 if(!isLocale(locale)||name.length<1||name.length>120) return {message:'enterName'};
 try{const {db}=await requireAdmin();const {error}=await db.rpc('admin_create_patient',{p_name:name,p_locale:locale});
 if(error)return {message:'patientNotCreated'};revalidatePath(`/${locale}/admin`);return {message:'patientCreated'};
 }catch{return {message:'adminRequiredShort'};}
}
