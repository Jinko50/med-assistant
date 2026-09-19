import { notFound } from 'next/navigation';
import { z } from 'zod';
import { isLocale } from '../../../../lib/i18n';
import { readPatient } from '../../../../lib/dal';
import { backendConfigured } from '../../../../lib/config';
import { AccessMessage } from '../../../../components/access-message';
import { Shell } from '../../../../components/shell';
import { RecordView } from '../../../../components/record-view';
export const dynamic = 'force-dynamic';
export default async function RecordPage({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params; if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  if (!backendConfigured()) return <AccessMessage locale={locale} message="setup"/>;
  try {
    const result = await readPatient(patientId);
    return <Shell locale={locale} path={`/records/${patientId}`} role={result.role}><RecordView locale={locale} {...result}/></Shell>;
  } catch (error) {
    return <AccessMessage locale={locale} message={error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable'}/>;
  }
}
