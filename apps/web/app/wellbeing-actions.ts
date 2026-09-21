'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authorizedPatient} from '../lib/dal';
import {isLocale} from '../lib/i18n';
import {screen,withholdsRoutineAdvice} from '../../../packages/domain/safety';

// A check-in is what a person said today. It is stored as a report, with a timestamp and
// the account that wrote it, and it never touches the approved medical record.
//
// Order is the documented one: authentication and current authorization first (inside
// authorizedPatient), then the deterministic safety screen, then persistence. The screen
// runs before anything is written, and its decision is stored with the row for audit.
// No model is involved anywhere in this path.

// Message is a translation key. safety carries the localized escalation to show instead of
// any routine acknowledgement.
export type CheckInState={message:string;safety?:'safetyEmergency'|'safetyUrgent'|'safetyMedication';truncated?:boolean};

const choice=<T extends readonly [string,...string[]]>(values:T)=>
 z.union([z.enum(values),z.literal('')]).optional().transform(v=>v?v:null);

const checkIn=z.object({
 patient:z.uuid(),
 feeling:choice(['good','ok','poor']),
 energy:choice(['good','ok','low']),
 appetite:choice(['good','ok','low']),
 sleep:choice(['good','ok','poor']),
 activity:choice(['active','some','resting']),
 note:z.string().max(2000).optional().transform(v=>v&&v.trim()?v.trim():null),
});

export async function saveCheckIn(_state:CheckInState,form:FormData):Promise<CheckInState>{
 const locale=String(form.get('locale'));
 if(!isLocale(locale))return {message:'checkInInvalid'};
 const parsed=checkIn.safeParse({
  patient:form.get('patient'),
  feeling:form.get('feeling')??'',energy:form.get('energy')??'',appetite:form.get('appetite')??'',
  sleep:form.get('sleep')??'',activity:form.get('activity')??'',note:String(form.get('note')??''),
 });
 if(!parsed.success)return {message:'checkInInvalid'};
 const d=parsed.data;
 // Skipping everything is allowed, but there is then nothing to record.
 if(!d.feeling&&!d.energy&&!d.appetite&&!d.sleep&&!d.activity&&!d.note)return {message:'checkInEmpty'};

 // Deterministic screen, before storage and before any suggestion is shown.
 const decision=screen(d.note??'');
 try{
  // read_record is deliberate: a patient may report on themselves without being an editor.
  const {db,user}=await authorizedPatient(d.patient,'read_record');
  const {error}=await db.from('wellbeing_reports').insert({
   patient_id:d.patient,reported_by:user.id,
   feeling:d.feeling,energy:d.energy,appetite:d.appetite,sleep:d.sleep,activity:d.activity,
   note:d.note,safety_level:decision.level,
  });
  if(error)return {message:'checkInUnavailable'};
  revalidatePath(`/${locale}/records/${d.patient}/checkin`);
  // When the screen matched, the escalation replaces the ordinary acknowledgement. Routine
  // wellbeing content is withheld rather than shown alongside it.
  return withholdsRoutineAdvice(decision)
   ? {message:'checkInSaved',safety:decision.messageKey as CheckInState['safety'],truncated:decision.truncated}
   : {message:'checkInSaved',truncated:decision.truncated};
 }catch{return {message:'checkInUnavailable'};}
}
