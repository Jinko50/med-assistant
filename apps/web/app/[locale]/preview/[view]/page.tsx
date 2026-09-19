import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n';
import { previewEnabled } from '../../../../lib/config';
import { fictional } from '../../../../lib/fictional';
import { Shell } from '../../../../components/shell';
import { RecordView } from '../../../../components/record-view';
export const dynamic = 'force-dynamic';
export default async function Preview({ params }: { params: Promise<{ locale: string; view: string }> }) {
  const { locale, view } = await params;
  if (!isLocale(locale) || !['patient','caregiver'].includes(view) || !previewEnabled()) notFound();
  const role = view as 'patient' | 'caregiver';
  return <Shell locale={locale} path={`/preview/${view}`} role={role} preview><RecordView locale={locale} role={role} {...fictional(locale)} preview/></Shell>;
}
