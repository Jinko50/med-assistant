import Link from 'next/link';
import { locales, translations, type Locale } from '../lib/i18n';
import { signOut } from '../app/actions';
import { Icon } from './icon';

export function LanguageLinks({ locale, path }: { locale: Locale; path: string }) {
  // Full navigation updates the root document's lang/dir (root layouts persist on client transitions).
  return <nav className="languages" aria-label={translations[locale].language}>{locales.map(l => <a key={l} lang={l} hrefLang={l} href={`/${l}${path}`} aria-current={l === locale ? 'page' : undefined}>{l === 'en' ? 'EN' : l === 'ru' ? 'RU' : 'עב'}</a>)}</nav>;
}
export function Shell({ locale, path, role, preview = false, children }: {
  locale: Locale; path: string; role: 'patient' | 'caregiver'; preview?: boolean; children: React.ReactNode;
}) {
  const t = translations[locale];
  return <>
    <a className="skip" href="#main">{t.skip}</a>
    <div className="app-shell">
      <aside className="sidebar">
        <Link href={`/${locale}/login`} className="brand"><span className="brand-mark"><Icon name="leaf" size={28}/></span><span>Med<span className="brand-light"> Assistant</span></span></Link>
        <p className="sidebar-label">{role === 'caregiver' ? t.caregiver : t.patient}</p>
        <nav className="main-nav" aria-label={t.navLabel}>
          {[['home',t.overview,'#main'],['record',t.records,'#records'],['pill',t.medicines,'#medication'],['heart',t.care,'#care_plan'],['clock',t.timeline,'#timeline']].map(([icon,label,href],i) => <a className={i === 0 ? 'selected' : ''} key={href} href={href}><Icon name={icon}/><span>{label}</span>{i === 0 && <span className="nav-dot"/>}</a>)}
        </nav>
        <div className="sidebar-bottom"><Icon name="shield"/><p>{t.development}</p><span className="tiny">{t.emergencyDetail}</span></div>
      </aside>
      <div className="workspace">
        <header className="topbar"><span className="breadcrumb">{role === 'caregiver' ? t.caregiver : t.patient} <span>/</span> {t.overview}</span><div className="topbar-actions"><LanguageLinks locale={locale} path={path}/>{preview ? <Link className="text-link" href={`/${locale}/login`}>{t.signIn}<Icon name="arrow" size={17}/></Link> : <form action={signOut}><input type="hidden" name="locale" value={locale}/><button className="text-link" type="submit">{t.signOut}</button></form>}</div></header>
        {preview && <div className="preview-banner"><span>{t.previewNotice}</span><Link href={`/${locale}/preview/${role === 'patient' ? 'caregiver' : 'patient'}`}>{role === 'patient' ? t.previewCaregiver : t.previewPatient} <span aria-hidden="true">↗</span></Link></div>}
        <main id="main" className={`page-content ${role === 'patient' ? 'patient-content' : ''}`}>{children}</main>
        <footer className="footer"><span>Med Assistant</span><span>{t.tagline}</span><span>{t.development}</span></footer>
      </div>
    </div>
  </>;
}
