'use client';
import { useActionState } from 'react';
import { signIn } from '../app/actions';
import { translations, type Locale } from '../lib/i18n';
import { Icon } from './icon';
export function LoginForm({ locale, configured }: { locale: Locale; configured: boolean }) {
  const t = translations[locale]; const [state, action, pending] = useActionState(signIn, { status: 'idle' } as const);
  return <form action={action} className="login-form"><input name="locale" type="hidden" value={locale}/>
    {!configured && <p className="form-status" role="status">{t.setup}</p>}
    <label htmlFor="email">{t.email}<input type="email" name="email" id="email" autoComplete="username" required maxLength={254} disabled={!configured} dir="ltr"/></label>
    <label htmlFor="password">{t.password}<input type="password" name="password" id="password" autoComplete="current-password" required maxLength={256} disabled={!configured}/></label>
    {state.status !== 'idle' && <p className="form-status error" role="status">{t[state.status]}</p>}
    <button className="button primary" disabled={!configured || pending} type="submit">{t.signIn}<Icon name="arrow" size={18}/></button>
    {configured && <a href={`/${locale}/register`}>First time? Set up your approved account</a>}
  </form>;
}
