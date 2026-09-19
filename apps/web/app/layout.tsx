import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isLocale } from '../lib/i18n';
import './globals.css';
export const metadata: Metadata = { title: 'Med Assistant', description: 'Your health record, with clarity and care.', robots: { index: false, follow: false } };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requested = (await headers()).get('x-med-locale') ?? 'en';
  const locale = isLocale(requested) ? requested : 'en';
  return <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}><body>{children}</body></html>;
}
