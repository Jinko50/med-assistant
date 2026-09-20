'use client';
import {useActionState} from 'react';
import {uploadDocument} from '../app/document-actions';
import {translations,type Locale} from '../lib/i18n';

export function DocumentUpload({patient,locale}:{patient:string;locale:Locale}){
 const t=translations[locale];
 const [state,action,pending]=useActionState(uploadDocument,{message:''});
 const messages=translations[locale].documentMessages as Record<string,string>;
 return <form action={action} className="login-form"><input type="hidden" name="patient" value={patient}/><input type="hidden" name="locale" value={locale}/>
 <label>{t.uploadLabel}<input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required/></label>
 <button className="button primary" disabled={pending}>{pending?t.uploading:t.uploadButton}</button>
 <p role="status">{state.message?messages[state.message]??'':''}</p></form>;
}
