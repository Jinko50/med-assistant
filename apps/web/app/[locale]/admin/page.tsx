import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale} from '../../../lib/i18n';
import {requireAdmin} from '../../../lib/admin';
import {AccessMessage} from '../../../components/access-message';
import {PatientForm,AccountForm} from '../../../components/admin-forms';
import {signOut} from '../../actions';
export const dynamic='force-dynamic';
export default async function Admin({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 let data;
 try{const {db}=await requireAdmin();const [patients,accounts,audit]=await Promise.all([
 db.from('patients').select('id,display_name').order('created_at').limit(101),
 db.from('managed_accounts').select('*').order('email').limit(501),
 db.from('access_audit').select('id,action,email,created_at').order('created_at',{ascending:false}).limit(30)]);
 if(patients.error||accounts.error||audit.error||patients.data.length>100||accounts.data.length>500)throw new Error('UNAVAILABLE');
 data={patients:patients.data,accounts:accounts.data,audit:audit.data};
 }catch{return <AccessMessage locale={locale} message="denied"/>;}
 return <main className="page-content" style={{maxWidth:1050,margin:'auto'}} dir="ltr" lang="en"><header><h1>Account administration</h1><p>Only approved, verified email addresses receive patient access. Caregivers cannot add users or promote themselves.</p><p>Development testing only — medical AI is unavailable.</p><p>To maintain a patient record yourself, approve your own email as a caregiver too. Administration does not automatically grant access to medical records.</p><form action={signOut}><input type="hidden" name="locale" value={locale}/><button className="button" type="submit">Sign out</button></form></header>
 <section className="card" style={{padding:24,marginBlock:24}}><h2>Create a patient record</h2><PatientForm locale={locale}/></section>
 {data.patients.map(patient=><section className="card" style={{padding:24,marginBlock:24}} key={patient.id}><h2>{patient.display_name}</h2><Link href={`/${locale}/records/${patient.id}`}>Open record (caregiver or patient access required)</Link><p>One active patient account; any number of approved caregivers. Changing a role or revoking access is recorded below.</p><div className="form-grid">{data.accounts.filter(a=>a.patient_id===patient.id).map(account=><div key={`${account.email}-${account.version}`}><AccountForm locale={locale} patient={patient.id} account={account}/></div>)}<div><h3>Add an approved account</h3><AccountForm locale={locale} patient={patient.id}/></div></div></section>)}
 <section><h2>Recent access changes</h2><ul>{data.audit.map(event=><li key={event.id}>{event.created_at} · {event.action} · {event.email??'Patient record'}</li>)}</ul></section></main>;
}
