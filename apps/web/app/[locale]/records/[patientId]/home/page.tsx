import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale } from '../../../../../lib/i18n';
export const dynamic = 'force-dynamic';

// The separate daily home screen has been replaced by the conversation. This redirect is
// kept so an existing bookmark, or a link in an earlier release note, still lands somewhere
// useful instead of on a 404.
export default async function Home({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params;
  if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  redirect(`/${locale}/records/${patientId}/chat`);
}
