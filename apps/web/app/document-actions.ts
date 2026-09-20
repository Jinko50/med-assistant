'use server';
import {createHash} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authorizedPatient} from '../lib/dal';
import {isLocale} from '../lib/i18n';
import {documentType,MAX_DOCUMENT_BYTES} from '../../../packages/domain/document';
export async function uploadDocument(_state:{message:string},form:FormData){
 const patient=String(form.get('patient'));const locale=String(form.get('locale'));const file=form.get('file');
 if(!z.uuid().safeParse(patient).success||!isLocale(locale)||!(file instanceof File)||file.size<8||file.size>MAX_DOCUMENT_BYTES)return {message:'Choose a PDF, JPEG or PNG file up to 10 MB.'};
 try{
  const {db}=await authorizedPatient(patient,'maintain_record');
  const content=Buffer.from(await file.arrayBuffer());const type=documentType(content);
  if(!type)return {message:'The file content is not a supported PDF, JPEG or PNG.'};
  const filename=file.name.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,200)||'document';
  const reserved=await db.rpc('reserve_document',{p_patient:patient,p_filename:filename,p_media_type:type,p_bytes:file.size,p_sha256:createHash('sha256').update(content).digest('hex')});
  if(reserved.error||!reserved.data)return {message:'Upload was not started. Check your access and try again.'};
  const result=await db.storage.from('medical-originals').upload(`${patient}/${reserved.data}`,content,{contentType:'application/octet-stream',upsert:false});
  if(result.error)return {message:'Upload failed. The pending entry remains visible; no medical facts were added.'};
  const finished=await db.rpc('finish_document',{p_document:reserved.data});
  revalidatePath(`/${locale}/records/${patient}/documents`);
  return {message:finished.error?'The file was transferred but could not be finalized. Ask the administrator to inspect the pending entry.':'Document stored privately. It has not been interpreted or added to confirmed medical facts.'};
 }catch{return {message:'Upload unavailable. Check your connection and access.'};}
}
