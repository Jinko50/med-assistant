import { notFound, redirect } from 'next/navigation';
import { isLocale } from '../../../lib/i18n';
import { backendConfigured } from '../../../lib/config';
import { database } from '../../../lib/supabase';
import { AccessMessage } from '../../../components/access-message';
export const dynamic = 'force-dynamic';
export default async function Workspace({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  if (!backendConfigured()) return <AccessMessage locale={locale} message="setup"/>;
  let patientId: string | undefined;
  try {
    const db = await database(); const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return <AccessMessage locale={locale} message="denied"/>;
    const { data, error: dbError } = await db.from('patient_access').select('patient_id').eq('user_id',user.id).is('revoked_at',null).order('patient_id').limit(1);
    if (dbError) return <AccessMessage locale={locale} message="unavailable"/>;
    patientId = data?.[0]?.patient_id;
  } catch { return <AccessMessage locale={locale} message="unavailable"/>; }
  if (!patientId) return <AccessMessage locale={locale} message="noAccess"/>;
  redirect(`/${locale}/records/${patientId}`);
}
