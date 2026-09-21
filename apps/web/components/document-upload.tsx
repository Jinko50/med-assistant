'use client';
import {useActionState,useState} from 'react';
import {uploadDocument} from '../app/document-actions';
import {translations,actionMessage,type Locale} from '../lib/i18n';
import {uploadRejection} from '../../../packages/domain/document';

export function DocumentUpload({patient,locale}:{patient:string;locale:Locale}){
 const t=translations[locale];
 const [state,action,pending]=useActionState(uploadDocument,{message:''});
 // A body larger than the framework's request limit is rejected while the request is
 // parsed, before the server action runs and outside its try/catch, which showed the
 // family a full-page server error. So the file is refused here and nothing is sent.
 // Re-checked on every selection, so choosing a smaller file clears the refusal and
 // re-enables the button. The server repeats the check; the browser is not trusted.
 const [refused,setRefused]=useState('');
 return <form action={action} className="login-form"
  onSubmit={event=>{if(refused)event.preventDefault();}}>
 <input type="hidden" name="patient" value={patient}/><input type="hidden" name="locale" value={locale}/>
 <label>{t.uploadLabel}<input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required
  onChange={event=>{const file=event.target.files?.[0];setRefused(file?uploadRejection(file.size)??'':'');}}/></label>
 <button className="button primary" disabled={pending||refused!==''}>{pending?t.uploading:t.uploadButton}</button>
 <p role="status">{refused?actionMessage(locale,'documentMessages',refused):actionMessage(locale,'documentMessages',state.message)}</p></form>;
}
