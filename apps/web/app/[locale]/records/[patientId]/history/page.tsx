import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { isLocale, translations } from '../../../../../lib/i18n';
import { authorizedPatient } from '../../../../../lib/dal';
import { Shell } from '../../../../../components/shell';
import { AccessMessage } from '../../../../../components/access-message';
export const dynamic = 'force-dynamic';
export default async function History({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params; if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  const t = translations[locale];
  try {
    const { db, role } = await authorizedPatient(patientId);
    const { data, error } = await db.from('record_revisions').select('record_id,version,snapshot,created_at,actor_id').eq('patient_id',patientId).order('created_at',{ ascending: false }).limit(100);
    if (error) throw new Error('BACKEND_UNAVAILABLE');
    return <Shell locale={locale} path={`/records/${patientId}/history`} role={role}><Link className="text-link" href={`/${locale}/records/${patientId}`}>{t.back}</Link><h1>{t.history}</h1><p className="intro">{t.historyNote}</p><section className="record-section">{!data?.length ? <p>{t.emptyHistory}</p> : data.map(item => <article className="record-item" key={`${item.record_id}-${item.version}`}><span className="badge">{t.version} {item.version}</span><h2>{item.snapshot.label}</h2><p>{item.snapshot.value ?? item.snapshot.unknown_reason}</p><p className="tiny">{item.created_at} · {item.actor_id}</p></article>)}</section></Shell>;
  } catch (error) { return <AccessMessage locale={locale} message={error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable'}/>; }
}
