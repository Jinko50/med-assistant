'use client';
import {useRef,useState} from 'react';
import {beginUpload,finishUpload} from '../app/document-actions';
import {translations,actionMessage,type Locale} from '../lib/i18n';
import {uploadRejection,HEADER_SAMPLE_BYTES} from '../../../packages/domain/document';

// The file is sent by the browser straight to Storage with a short-lived signed URL, so a
// 50 MB original never passes through the app server. That is what makes the owner's
// 40,844,643-byte scan possible: the framework request limits that silently truncated the
// old upload — and turned it into a full-page server error — are no longer on the path.
//
// Every failure below ends in a translated line and leaves the form usable, so an
// interrupted transfer never produces a blank or crashed page.

function toBase64(bytes:Uint8Array){
 let binary='';
 for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
 return btoa(binary);
}

export function DocumentUpload({patient,locale}:{patient:string;locale:Locale}){
 const t=translations[locale];
 const [message,setMessage]=useState('');
 const [refused,setRefused]=useState('');
 const [busy,setBusy]=useState(false);
 const [percent,setPercent]=useState(0);
 const request=useRef<XMLHttpRequest|null>(null);

 // Re-decided on every selection, so choosing a smaller file clears a refusal and the
 // button becomes usable again without reloading the page.
 function choose(file:File|undefined){
  setMessage('');setPercent(0);
  setRefused(file?uploadRejection(file.size)??'':'');
 }

 async function send(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  const form=event.currentTarget;
  const input=form.elements.namedItem('file') as HTMLInputElement|null;
  const file=input?.files?.[0];
  const rejection=file?uploadRejection(file.size):'chooseFile';
  if(!file||rejection){setRefused(rejection??'');return;}
  setBusy(true);setMessage('');setPercent(0);
  try{
   // Read once: the header is checked by the server before an upload URL is issued, and
   // the digest is recorded with the file as reported by this browser.
   const buffer=new Uint8Array(await file.arrayBuffer());
   const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));
   const begin=new FormData();
   begin.set('patient',patient);begin.set('locale',locale);
   begin.set('filename',file.name);begin.set('size',String(file.size));
   begin.set('header',toBase64(buffer.subarray(0,HEADER_SAMPLE_BYTES)));
   begin.set('sha256',[...digest].map(b=>b.toString(16).padStart(2,'0')).join(''));
   const started=await beginUpload({message:''},begin);
   if(started.message||!started.uploadUrl||!started.documentId){
    setMessage(started.message||'notStarted');return;
   }
   await new Promise<void>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    request.current=xhr;
    xhr.open('PUT',started.uploadUrl!,true);
    xhr.setRequestHeader('content-type','application/octet-stream');
    xhr.setRequestHeader('x-upsert','false');
    xhr.upload.onprogress=progress=>{
     if(progress.lengthComputable)setPercent(Math.round(progress.loaded/progress.total*100));
    };
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error(String(xhr.status)));
    // A dropped connection, a refusal by Storage or a cancelled transfer all land here and
    // are reported as a translated line rather than an unhandled rejection.
    xhr.onerror=()=>reject(new Error('network'));
    xhr.onabort=()=>reject(new Error('aborted'));
    xhr.ontimeout=()=>reject(new Error('timeout'));
    xhr.send(file);
   });
   const finish=new FormData();
   finish.set('patient',patient);finish.set('locale',locale);finish.set('documentId',started.documentId);
   const done=await finishUpload({message:''},finish);
   setMessage(done.message);
   if(done.message==='stored'&&input)input.value='';
  }catch(error){
   const status=Number((error as Error)?.message);
   // 413 and Storage's own size refusal mean the object was larger than Storage accepts,
   // which happens when the app cap is raised but migration 004 has not been applied.
   setMessage(status===413?'storageRejected':'interrupted');
  }finally{
   request.current=null;setBusy(false);setPercent(0);
  }
 }

 const shown=refused||message;
 return <form className="login-form" onSubmit={send}>
  <label>{t.uploadLabel}<input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required
   onChange={event=>choose(event.target.files?.[0])}/></label>
  <button className="button primary" type="submit" disabled={busy||refused!==''}>
   {busy?`${t.uploading}${percent?` ${percent}%`:''}`:t.uploadButton}
  </button>
  {busy&&<button className="button secondary" type="button" onClick={()=>request.current?.abort()}>{t.cancel}</button>}
  <p role="status">{shown?actionMessage(locale,'documentMessages',shown):''}</p>
  <noscript><p>{t.uploadNeedsJs}</p></noscript>
 </form>;
}
