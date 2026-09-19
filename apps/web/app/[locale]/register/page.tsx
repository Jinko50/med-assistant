import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale} from '../../../lib/i18n';
import {backendConfigured} from '../../../lib/config';
import {AccessMessage} from '../../../components/access-message';
import {RegisterForm} from '../../../components/register-form';
export default async function Register({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 if(!backendConfigured())return <AccessMessage locale={locale} message="setup"/>;
 return <main className="page-content" style={{maxWidth:600,margin:'auto'}} dir="ltr"><h1>Set up your account</h1><p>Use the exact email approved by your administrator. Confirm your email before signing in. Registration alone does not grant access to any patient.</p><RegisterForm/><Link href={`/${locale}/login`}>Back to sign in</Link></main>;
}
