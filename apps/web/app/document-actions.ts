'use server';
import {createHash} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authorizedPatient} from '../lib/dal';
import {isLocale} from '../lib/i18n';
import {documentType,MAX_DOCUMENT_BYTES} from '../../../packages/domain/document';
// The message is a key into translations[locale].documentMessages.
export async function uploadDocument(_state:{message:string},form:FormData){
 const patient=String(form.get('patient'));const locale=String(form.get('locale'));const file=form.get('file');
 if(!z.uuid().safeParse(patient).success||!isLocale(locale)||!(file instanceof File)||file.size<8||file.size>MAX_DOCUMENT_BYTES)return {message:'chooseFile'};
 try{
  const {db}=await authorizedPatient(patient,'maintain_record');
  const content=Buffer.from(await file.arrayBuffer());const type=documentType(content);
  if(!type)return {message:'unsupported'};
  const filename=file.name.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,200)||'document';
  const reserved=await db.rpc('reserve_document',{p_patient:patient,p_filename:filename,p_media_type:type,p_bytes:file.size,p_sha256:createHash('sha256').update(content).digest('hex')});
  if(reserved.error||!reserved.data)return {message:'notStarted'};
  const result=await db.storage.from('medical-originals').upload(`${patient}/${reserved.data}`,content,{contentType:'application/octet-stream',upsert:false});
  if(result.error)return {message:'uploadFailed'};
  const finished=await db.rpc('finish_document',{p_document:reserved.data});
  revalidatePath(`/${locale}/records/${patient}/documents`);
  return {message:finished.error?'finalizeFailed':'stored'};
 }catch{return {message:'unavailable'};}
}
