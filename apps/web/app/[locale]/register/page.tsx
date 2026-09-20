import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale,translations,direction} from '../../../lib/i18n';
import {backendConfigured} from '../../../lib/config';
import {AccessMessage} from '../../../components/access-message';
import {RegisterForm} from '../../../components/register-form';
import {LanguageLinks} from '../../../components/shell';
export default async function Register({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 const t=translations[locale];
 if(!backendConfigured())return <AccessMessage locale={locale} message="setup"/>;
 return <main className="page-content" style={{maxWidth:600,margin:'auto'}} dir={direction(locale)} lang={locale}>
  <div style={{display:'flex',justifyContent:'flex-end'}}><LanguageLinks locale={locale} path="/register"/></div>
  <h1>{t.registerTitle}</h1>
  <p>{t.registerIntro}</p>
  <RegisterForm locale={locale}/>
  <Link href={`/${locale}/login`}>{t.backToSignIn}</Link>
 </main>;
}
