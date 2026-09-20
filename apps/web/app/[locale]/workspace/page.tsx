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
  let admin = false;
  try {
    const db = await database(); const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return <AccessMessage locale={locale} message="denied"/>;
    const adminResult=await db.from('app_admins').select('user_id').eq('user_id',user.id).is('revoked_at',null).maybeSingle();
    admin=Boolean(adminResult.data);
    const claimed=await db.rpc('claim_managed_access');
    if(claimed.error) return <AccessMessage locale={locale} message="unavailable"/>;
    const { data, error: dbError } = await db.from('patient_access').select('patient_id').eq('user_id',user.id).is('revoked_at',null).order('patient_id').limit(1);
    if (dbError) return <AccessMessage locale={locale} message="unavailable"/>;
    patientId = data?.[0]?.patient_id;
  } catch { return <AccessMessage locale={locale} message="unavailable"/>; }
  // Everyday use comes first. An administrator who is also a member of a record
  // lands on that record; user management stays one click away from there.
  // An administrator with no record access still lands on administration.
  if (patientId) redirect(`/${locale}/records/${patientId}`);
  if (admin) redirect(`/${locale}/admin`);
  return <AccessMessage locale={locale} message="noAccess"/>;
}
