'use client';
import {useActionState} from 'react';
import {createPatient,manageAccount} from '../app/admin-actions';
import {translations,type Locale} from '../lib/i18n';

type Account={patient_id:string;email:string;role:string;active:boolean;version:number;user_id:string|null};

// Server actions return a key; unknown keys are shown as nothing rather than as
// raw English, so a missing translation can never leak untranslated text.
function adminMessage(locale:Locale,key:string){
 const messages=translations[locale].adminMessages as Record<string,string>;
 return key?messages[key]??'':'';
}

export function PatientForm({locale}:{locale:Locale}){
 const t=translations[locale];
 const [state,action,pending]=useActionState(createPatient,{message:''});
 return <form action={action} className="login-form"><input type="hidden" name="locale" value={locale}/>
 <label>{t.patientName}<input name="name" maxLength={120} required/></label>
 <button className="button primary" disabled={pending}>{t.createPatientButton}</button>
 <p role="status">{adminMessage(locale,state.message)}</p></form>;
}

export function AccountForm({locale,patient,account}:{locale:Locale;patient:string;account?:Account}){
 const t=translations[locale];
 const [state,action,pending]=useActionState(manageAccount,{message:''});
 return <form action={action} className="login-form"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="patient" value={patient}/><input type="hidden" name="version" value={account?.version??0}/>
 {/* Email addresses stay left-to-right even when the page is right-to-left. */}
 <label>{t.email}<input type="email" dir="ltr" name="email" required maxLength={254} defaultValue={account?.email} readOnly={Boolean(account)}/></label>
 <label>{t.roleLabel}<select name="role" defaultValue={account?.role??'caregiver'}><option value="patient">{t.rolePatient}</option><option value="caregiver">{t.roleCaregiver}</option></select></label>
 <label>{t.accessLabel}<select name="active" defaultValue={String(account?.active??true)}><option value="true">{t.accessEnabled}</option><option value="false">{t.accessRevoked}</option></select></label>
 {account&&<p>{account.user_id?t.accountLinked:t.accountWaiting}</p>}
 <button className="button primary" disabled={pending}>{account?t.saveAccount:t.approveEmail}</button>
 <p role="status">{adminMessage(locale,state.message)}</p></form>;
}
