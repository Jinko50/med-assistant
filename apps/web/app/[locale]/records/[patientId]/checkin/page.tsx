import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { isLocale, translations, direction, formatTimestamp } from '../../../../../lib/i18n';
import { authorizedPatient } from '../../../../../lib/dal';
import { backendConfigured } from '../../../../../lib/config';
import { AccessMessage } from '../../../../../components/access-message';
import { LanguageLinks } from '../../../../../components/shell';
import { CheckInForm } from '../../../../../components/check-in-form';
export const dynamic = 'force-dynamic';

// Reports, shown as reports. They carry a date and who wrote them, they are kept visibly
// apart from the medical record, and the page says plainly that nobody is alerted and that
// nothing here has been confirmed by a clinician.
export default async function CheckIn({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params;
  if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  if (!backendConfigured()) return <AccessMessage locale={locale} message="setup"/>;
  const t = translations[locale];

  let reports: Array<{ id: string; created_at: string; reported_by: string; feeling: string | null; energy: string | null; appetite: string | null; sleep: string | null; activity: string | null; note: string | null }> = [];
  let me = '';
  // Access failures still refuse the page. A failure to LIST past reports does not: the
  // history is shown as unavailable while today's check-in stays usable. This is also what
  // happens before migration 006 is applied, so the screen degrades instead of erroring.
  let listUnavailable = false;
  try {
    const { db, user } = await authorizedPatient(patientId, 'read_record');
    me = user.id;
    const result = await db.from('wellbeing_reports')
      .select('id,created_at,reported_by,feeling,energy,appetite,sleep,activity,note')
      .eq('patient_id', patientId).order('created_at', { ascending: false }).limit(20);
    if (result.error) listUnavailable = true; else reports = result.data ?? [];
  } catch (error) {
    return <AccessMessage locale={locale} message={error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable'}/>;
  }

  const label = (value: string | null) => {
    const map: Record<string, string> = {
      good: t.optionGood, ok: t.optionOk, poor: t.optionPoor, low: t.optionLow,
      active: t.optionActive, some: t.optionSome, resting: t.optionResting,
    };
    return value ? map[value] ?? value : null;
  };

  return <main className="page-content" lang={locale} dir={direction(locale)} style={{maxWidth:760,margin:'auto'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
      <Link href={`/${locale}/records/${patientId}/home`}>{t.back}</Link>
      <LanguageLinks locale={locale} path={`/records/${patientId}/checkin`}/>
    </div>
    <h1>{t.checkInTitle}</h1>
    <p>{t.checkInIntro}</p>
    <p className="tiny">{t.checkInOptional}</p>
    <CheckInForm patient={patientId} locale={locale}/>

    <section style={{marginTop:32}}>
      <h2>{t.checkInRecent}</h2>
      <p className="tiny">{t.checkInReportNote} {t.checkInNoWatching}</p>
      {listUnavailable ? <p role="status">{t.unavailable}</p> : reports.length === 0 ? <p>{t.checkInNone}</p> : <ul>
        {reports.map(report => {
          const parts = [
            [t.checkInFeeling, label(report.feeling)], [t.checkInEnergy, label(report.energy)],
            [t.checkInAppetite, label(report.appetite)], [t.checkInSleep, label(report.sleep)],
            [t.checkInActivity, label(report.activity)],
          ].filter(([, value]) => value);
          return <li key={report.id} style={{marginBlock:12}}>
            <time dateTime={report.created_at} dir="ltr">{formatTimestamp(locale, report.created_at)}</time>
            {' · '}{t.checkInBy} {report.reported_by === me ? t.checkInSelf : t.checkInOther}
            {parts.length > 0 && <div>{parts.map(([name, value]) => `${name}: ${value}`).join(' · ')}</div>}
            {report.note && <div style={{whiteSpace:'pre-wrap'}}>{report.note}</div>}
          </li>;
        })}
      </ul>}
    </section>
  </main>;
}
