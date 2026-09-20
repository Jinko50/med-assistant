'use client';
import {useActionState} from 'react';
import {registerAccount} from '../app/register-actions';
import {translations,type Locale} from '../lib/i18n';

export function RegisterForm({locale}:{locale:Locale}){
 const t=translations[locale];
 const [state,action,pending]=useActionState(registerAccount,{message:''});
 const messages=translations[locale].registerMessages as Record<string,string>;
 return <form action={action} className="login-form">
 {/* Email addresses stay left-to-right even when the page is right-to-left. */}
 <label>{t.registerEmailLabel}<input type="email" dir="ltr" name="email" required maxLength={254} autoComplete="username"/></label>
 <label>{t.registerPasswordLabel}<input type="password" name="password" minLength={6} maxLength={128} required autoComplete="new-password"/></label>
 <label>{t.registerConfirmLabel}<input type="password" name="confirm" minLength={6} maxLength={128} required autoComplete="new-password"/></label>
 <button className="button primary" disabled={pending}>{t.registerButton}</button>
 <p role="status">{state.message?messages[state.message]??'':''}</p></form>;
}
