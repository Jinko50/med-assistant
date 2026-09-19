import Link from 'next/link';
import { translations, type Locale } from '../lib/i18n';
import { Icon } from './icon';
export function AccessMessage({ locale, message }: { locale: Locale; message: 'setup' | 'denied' | 'unavailable' | 'noAccess' }) {
  const t = translations[locale];
  return <main className="access-message"><span className="brand-mark"><Icon name="shield" size={32}/></span><h1>Med Assistant</h1><p role="status">{t[message]}</p><Link className="button primary" href={`/${locale}/login`}>{t.signIn}</Link><p className="tiny">{t.emergency}</p></main>;
}
