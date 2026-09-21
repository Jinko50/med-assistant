import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { isLocale, translations } from '../../../../lib/i18n';
import { readPatient } from '../../../../lib/dal';
import { database } from '../../../../lib/supabase';
import { backendConfigured } from '../../../../lib/config';
import { AccessMessage } from '../../../../components/access-message';
import { Shell } from '../../../../components/shell';
import { RecordView } from '../../../../components/record-view';
export const dynamic = 'force-dynamic';

// Administration is a separate permission; this only decides whether to show a
// route back to user management, never what medical data is readable.
async function isAppAdmin() {
  try {
    const db = await database();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return false;
    const result = await db.from('app_admins').select('user_id').eq('user_id', user.id).is('revoked_at', null).maybeSingle();
    return Boolean(result.data);
  } catch { return false; }
}

export default async function RecordPage({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params; if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  if (!backendConfigured()) return <AccessMessage locale={locale} message="setup"/>;
  try {
    const result = await readPatient(patientId);
    const t = translations[locale];
    const admin = await isAppAdmin();
    return <Shell locale={locale} path={`/records/${patientId}`} role={result.role}>
      <nav className="record-actions" aria-label={t.dailyUse} style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:24}}>
        <Link className="button secondary" href={`/${locale}/records/${patientId}/home`}>{t.homeTitle}</Link>
        <Link className="button secondary" href={`/${locale}/records/${patientId}/checkin`}>{t.homeFeeling}</Link>
        {result.role === 'caregiver' && <Link className="button primary" href={`/${locale}/records/${patientId}/documents`}>{t.uploadDocuments}</Link>}
        {result.role === 'caregiver' && <Link className="button secondary" href={`/${locale}/records/${patientId}/history`}>{t.history}</Link>}
        {admin && <Link className="text-link" href={`/${locale}/admin`}>{t.manageUsers}</Link>}
      </nav>
      <RecordView locale={locale} {...result}/>
    </Shell>;
  } catch (error) {
    return <AccessMessage locale={locale} message={error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable'}/>;
  }
}
