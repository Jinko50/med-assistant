'use client';
import {useActionState} from 'react';
import {createPatient,manageAccount} from '../app/admin-actions';
type Account={patient_id:string;email:string;role:string;active:boolean;version:number;user_id:string|null};
export function PatientForm({locale}:{locale:string}){
 const [state,action,pending]=useActionState(createPatient,{message:''});
 return <form action={action} className="login-form"><input type="hidden" name="locale" value={locale}/><label>Patient display name<input name="name" maxLength={120} required/></label><button className="button primary" disabled={pending}>Create patient record</button><p role="status">{state.message}</p></form>;
}
export function AccountForm({locale,patient,account}:{locale:string;patient:string;account?:Account}){
 const [state,action,pending]=useActionState(manageAccount,{message:''});
 return <form action={action} className="login-form"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="patient" value={patient}/><input type="hidden" name="version" value={account?.version??0}/>
 <label>Email address<input type="email" dir="ltr" name="email" required maxLength={254} defaultValue={account?.email} readOnly={Boolean(account)}/></label>
 <label>Role<select name="role" defaultValue={account?.role??'caregiver'}><option value="patient">Patient — read only</option><option value="caregiver">Caregiver — maintain records</option></select></label>
 <label>Access<select name="active" defaultValue={String(account?.active??true)}><option value="true">Enabled</option><option value="false">Revoked</option></select></label>
 {account&&<p>{account.user_id?'Account linked':'Waiting for verified sign-up'}</p>}
 <button className="button primary" disabled={pending}>{account?'Save account access':'Approve email address'}</button><p role="status">{state.message}</p></form>;
}
