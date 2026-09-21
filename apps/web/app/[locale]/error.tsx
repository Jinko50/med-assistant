'use client';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {isLocale,translations,direction} from '../../lib/i18n';
import {Icon} from '../../components/icon';

// Without this boundary an unexpected failure — including a request rejected during
// parsing, before any server action runs — rendered the framework's untranslated
// full-page "a server error occurred". The family saw that after an oversized upload.
// Nothing here reports what failed: the message must never leak record contents.
export default function LocaleError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 const raw=useParams()?.locale;
 const locale=typeof raw==='string'&&isLocale(raw)?raw:'en';
 const t=translations[locale];
 return <main className="access-message" lang={locale} dir={direction(locale)}>
  <span className="brand-mark"><Icon name="shield" size={32}/></span>
  <h1>{t.errorTitle}</h1>
  <p role="status">{t.errorBody}</p>
  <button className="button primary" type="button" onClick={()=>reset()}>{t.retry}</button>
  <Link className="text-link" href={`/${locale}/workspace`}>{t.back}</Link>
  <p className="tiny">{t.emergency}</p>
 </main>;
}
