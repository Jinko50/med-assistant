import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, translations } from '../../../lib/i18n';
import { backendConfigured, previewEnabled } from '../../../lib/config';
import { LoginForm } from '../../../components/login-form';
import { LanguageLinks } from '../../../components/shell';
import { Icon } from '../../../components/icon';
export const dynamic = 'force-dynamic';
export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); const t = translations[locale];
  return <div className="login-page"><header className="login-header"><Link className="brand" href={`/${locale}`}><span className="brand-mark"><Icon name="leaf" size={28}/></span>Med<span className="brand-light">Assistant</span></Link><LanguageLinks locale={locale} path="/login"/></header>
    <main className="login-main"><section className="login-story"><span className="eyebrow">MED ASSISTANT</span><h1>{t.loginTitle}</h1><p>{t.tagline}</p><div className="login-art" aria-hidden="true"><span/><span/><Icon name="leaf" size={110}/></div><div className="login-promise"><Icon name="shield"/><p>{t.privateAccount}</p></div></section>
    <section className="login-panel"><p className="eyebrow">{t.welcome}</p><h2>{t.signIn}</h2><p>{t.loginDescription}</p><LoginForm locale={locale} configured={backendConfigured()}/>
      {previewEnabled() && <div className="preview-options"><span className="tiny">{t.previewNotice}</span><Link className="button secondary" href={`/${locale}/preview/patient`}>{t.previewPatient}<Icon name="arrow" size={18}/></Link><Link className="text-link" href={`/${locale}/preview/caregiver`}>{t.previewCaregiver}<Icon name="arrow" size={16}/></Link></div>}
      <p className="tiny login-disclaimer">{t.development}</p>
    </section></main><footer className="login-footer">{t.emergency} {t.emergencyDetail}</footer></div>;
}
