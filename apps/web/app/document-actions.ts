'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authorizedPatient} from '../lib/dal';
import {isLocale} from '../lib/i18n';
import {documentType,uploadRejection,storagePath,HEADER_SAMPLE_BYTES,MAX_DOCUMENT_BYTES,MIN_DOCUMENT_BYTES} from '../../../packages/domain/document';

// Documents are uploaded by the browser straight to Supabase Storage using a short-lived
// signed URL. The file itself never passes through this server, so a 50 MB original is not
// buffered in the launcher's Node process and is not subject to the framework request
// limits that silently truncated the family's upload and produced a full-page error.
//
// These two actions carry only metadata:
//   begin  -> authorize, check size and format, reserve the row, mint a one-object upload URL
//   finish -> re-read the stored object's own first bytes and size, then finalize
// Authorization is unchanged: both call authorizedPatient(..., 'maintain_record'), so a
// patient-role or revoked account can neither obtain an upload URL nor finalize one, and
// the signed URL is issued for exactly one object path that the storage policy also checks.

// Every message is a key into translations[locale].documentMessages.
export type BeginState={message:string;documentId?:string;uploadUrl?:string;token?:string};

const beginInput=z.object({
 patient:z.uuid(),
 filename:z.string().min(1).max(400),
 size:z.number().int().min(MIN_DOCUMENT_BYTES).max(MAX_DOCUMENT_BYTES),
 header:z.string().min(8).max(HEADER_SAMPLE_BYTES*2),
 sha256:z.string().regex(/^[0-9a-f]{64}$/),
});

export async function beginUpload(_state:BeginState,form:FormData):Promise<BeginState>{
 const locale=String(form.get('locale'));
 if(!isLocale(locale))return {message:'chooseFile'};
 const size=Number(form.get('size'));
 // Size is decided before anything else, exactly as the browser decided it. The browser is
 // not trusted; this is the authoritative check.
 const rejection=uploadRejection(size);
 if(rejection)return {message:rejection};
 const parsed=beginInput.safeParse({
  patient:form.get('patient'),filename:String(form.get('filename')??''),
  size,header:String(form.get('header')??''),sha256:String(form.get('sha256')??''),
 });
 if(!parsed.success)return {message:'chooseFile'};
 // The browser sends only the first bytes, so the format is judged from the file's own
 // header rather than from its name or the declared content type.
 let header:Buffer;
 try{header=Buffer.from(parsed.data.header,'base64');}catch{return {message:'unsupported'};}
 const type=documentType(header);
 if(!type)return {message:'unsupported'};
 try{
  const {db}=await authorizedPatient(parsed.data.patient,'maintain_record');
  const filename=parsed.data.filename.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,200)||'document';
  // The digest is computed by the uploading browser over the exact bytes it sends. It is
  // recorded as reported, not as verified: the file no longer passes through this server,
  // so re-hashing it would mean downloading 50 MB back. It detects accidental corruption
  // between reading the file and storing it; it is not evidence against a dishonest client.
  const reserved=await db.rpc('reserve_document',{p_patient:parsed.data.patient,p_filename:filename,p_media_type:type,p_bytes:parsed.data.size,p_sha256:parsed.data.sha256});
  if(reserved.error||!reserved.data){
   // reserve_document still enforces the metadata size constraint. Before migration 004 is
   // applied it refuses anything above 10 MiB, which is a clear early failure rather than a
   // transfer that dies part-way through.
   return {message:reserved.error?.code==='23514'?'storageRejected':'notStarted'};
  }
  const signed=await db.storage.from('medical-originals').createSignedUploadUrl(storagePath(parsed.data.patient,String(reserved.data)));
  if(signed.error||!signed.data)return {message:'notStarted'};
  // The client library has returned this either absolute or relative depending on version;
  // resolve it here so the browser never has to guess the Storage endpoint.
  const uploadUrl=new URL(signed.data.signedUrl,process.env.SUPABASE_URL).toString();
  return {message:'',documentId:String(reserved.data),uploadUrl,token:signed.data.token};
 }catch{return {message:'unavailable'};}
}

export async function finishUpload(_state:{message:string},form:FormData):Promise<{message:string}>{
 const locale=String(form.get('locale'));
 const patient=String(form.get('patient'));
 const documentId=String(form.get('documentId'));
 if(!isLocale(locale)||!z.uuid().safeParse(patient).success||!z.uuid().safeParse(documentId).success)return {message:'chooseFile'};
 try{
  const {db}=await authorizedPatient(patient,'maintain_record');
  const path=storagePath(patient,documentId);
  // Re-read the object that Storage actually holds. The browser reported the size and the
  // header before the transfer; neither is taken on trust afterwards.
  const signed=await db.storage.from('medical-originals').createSignedUrl(path,60);
  if(signed.error||!signed.data?.signedUrl)return {message:'verifyFailed'};
  const probe=await fetch(signed.data.signedUrl,{headers:{Range:`bytes=0-${HEADER_SAMPLE_BYTES-1}`},cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!probe.ok&&probe.status!==206)return {message:'verifyFailed'};
  const sample=new Uint8Array(await probe.arrayBuffer());
  if(!documentType(sample))return {message:'unsupported'};
  // Content-Range reports the object's true total length, which is compared with the
  // reserved metadata by finish_document's own checks downstream.
  const total=Number(/\/(\d+)$/.exec(probe.headers.get('content-range')??'')?.[1]??NaN);
  if(Number.isFinite(total)&&uploadRejection(total))return {message:'tooLarge'};
  const finished=await db.rpc('finish_document',{p_document:documentId});
  if(finished.error)return {message:'finalizeFailed'};
  revalidatePath(`/${locale}/records/${patient}/documents`);
  return {message:'stored'};
 }catch{return {message:'unavailable'};}
}
