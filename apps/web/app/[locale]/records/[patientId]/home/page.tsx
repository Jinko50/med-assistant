import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { isLocale, translations, direction } from '../../../../../lib/i18n';
import { authorizedPatient } from '../../../../../lib/dal';
import { database } from '../../../../../lib/supabase';
import { backendConfigured } from '../../../../../lib/config';
import { AccessMessage } from '../../../../../components/access-message';
import { LanguageLinks } from '../../../../../components/shell';
import { Icon } from '../../../../../components/icon';
import { signOut } from '../../../../actions';
import { APP_VERSION } from '../../../../../lib/version';
export const dynamic = 'force-dynamic';

// The daily home screen. Ordinary use is the default after signing in: big targets, few
// words, one tap to each thing a person actually does. Access management is reachable but
// deliberately quiet, and unfinished features are shown as unfinished rather than hidden,
// so nobody is promised something the app cannot do yet.
async function isAppAdmin() {
  try {
    const db = await database();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return false;
    const result = await db.from('app_admins').select('user_id').eq('user_id', user.id).is('revoked_at', null).maybeSingle();
    return Boolean(result.data);
  } catch { return false; }
}

export default async function Home({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params;
  if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  if (!backendConfigured()) return <AccessMessage locale={locale} message="setup"/>;
  const t = translations[locale];
  let role: 'patient' | 'caregiver';
  try { ({ role } = await authorizedPatient(patientId, 'read_record')); }
  catch (error) {
    return <AccessMessage locale={locale} message={error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable'}/>;
  }
  const admin = await isAppAdmin();
  const base = `/${locale}/records/${patientId}`;

  const ready: Array<[string, string, string]> = [
    [`${base}/checkin`, t.homeFeeling, 'heart'],
    [`${base}/documents`, t.homeDocuments, 'record'],
    [base, t.homeRecord, 'home'],
  ];
  // Not built yet. Shown, disabled, and labelled — see the readiness report.
  const pending: Array<[string, string]> = [[t.homeMeal, 'pill'], [t.homeAsk, 'shield']];

  return <main className="page-content home-screen" lang={locale} dir={direction(locale)} style={{maxWidth:820,margin:'auto'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
      <h1>{t.homeTitle}</h1>
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <LanguageLinks locale={locale} path={`/records/${patientId}/home`}/>
        <form action={signOut}><input type="hidden" name="locale" value={locale}/><button className="text-link" type="submit">{t.signOut}</button></form>
      </div>
    </header>
    <p style={{fontSize:'1.15rem'}}>{t.homeGreeting}</p>

    <nav aria-label={t.homeGreeting} style={{display:'grid',gap:16,gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',marginBlock:24}}>
      {ready.map(([href,label,icon]) => (
        <Link key={href} href={href} className="card home-tile" style={{padding:24,display:'flex',alignItems:'center',gap:16,fontSize:'1.2rem',textDecoration:'none'}}>
          <span className="section-icon"><Icon name={icon}/></span><span>{label}</span>
        </Link>
      ))}
      {pending.map(([label,icon]) => (
        <div key={label} className="card home-tile" aria-disabled="true"
          style={{padding:24,display:'flex',alignItems:'center',gap:16,fontSize:'1.2rem',opacity:0.55}}>
          <span className="section-icon"><Icon name={icon}/></span>
          <span>{label}<br/><span className="tiny">{t.comingSoon}</span></span>
        </div>
      ))}
    </nav>
    <p className="tiny">{t.comingSoonHint}</p>

    <p style={{marginTop:24,display:'flex',gap:16,flexWrap:'wrap'}}>
      {role === 'caregiver' && <Link className="text-link" href={`${base}/history`}>{t.history}</Link>}
      {admin && <Link className="text-link" href={`/${locale}/admin`}>{t.manageUsers}</Link>}
    </p>
    <footer className="footer"><span>{t.development}</span><span>{t.versionLabel} {APP_VERSION}</span></footer>
  </main>;
}
