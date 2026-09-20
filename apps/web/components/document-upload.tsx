'use client';
import {useActionState} from 'react';
import {uploadDocument} from '../app/document-actions';
export function DocumentUpload({patient,locale}:{patient:string;locale:string}){
 const [state,action,pending]=useActionState(uploadDocument,{message:''});
 return <form action={action} className="login-form"><input type="hidden" name="patient" value={patient}/><input type="hidden" name="locale" value={locale}/><label>PDF, JPEG or PNG — maximum 10 MB<input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required/></label><button className="button primary" disabled={pending}>{pending?'Uploading…':'Upload document'}</button><p role="status">{state.message}</p></form>;
}
