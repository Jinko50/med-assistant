import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale,translations,direction,auditLabel,formatTimestamp} from '../../../lib/i18n';
import {requireAdmin} from '../../../lib/admin';
import {AccessMessage} from '../../../components/access-message';
import {PatientForm,AccountForm} from '../../../components/admin-forms';
import {LanguageLinks} from '../../../components/shell';
import {signOut} from '../../actions';
import {APP_VERSION} from '../../../lib/version';
export const dynamic='force-dynamic';

export default async function Admin({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 const t=translations[locale];
 let data;
 try{
  const {db,user}=await requireAdmin();
  const [patients,accounts,audit,mine]=await Promise.all([
   db.from('patients').select('id,display_name').order('created_at').limit(101),
   db.from('managed_accounts').select('*').order('email').limit(501),
   db.from('access_audit').select('id,action,email,created_at').order('created_at',{ascending:false}).limit(30),
   // Administration does not grant record access. Only the patients this
   // account is actually a member of get everyday record/document buttons.
   db.from('patient_access').select('patient_id,role').eq('user_id',user.id).is('revoked_at',null)]);
  if(patients.error||accounts.error||audit.error||mine.error||patients.data.length>100||accounts.data.length>500)throw new Error('UNAVAILABLE');
  data={patients:patients.data,accounts:accounts.data,audit:audit.data,
   mine:new Map((mine.data??[]).map(row=>[row.patient_id as string,row.role as string]))};
 }catch{return <AccessMessage locale={locale} message="denied"/>;}

 const myPatients=data.patients.filter(p=>data.mine.has(p.id));

 return <main className="page-content" style={{maxWidth:1050,margin:'auto'}} dir={direction(locale)} lang={locale}>
  <header>
   <div style={{display:'flex',gap:16,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
    <h1>{t.adminTitle}</h1>
    <div style={{display:'flex',gap:16,alignItems:'center'}}>
     <LanguageLinks locale={locale} path="/admin"/>
     <form action={signOut}><input type="hidden" name="locale" value={locale}/><button className="button" type="submit">{t.signOut}</button></form>
    </div>
   </div>
   <p>{t.adminIntro}</p>
   <p>{t.adminDevNote}</p>
   <p>{t.adminSelfNote}</p>
  </header>

  {myPatients.length>0&&<section className="card" style={{padding:24,marginBlock:24}}>
   <h2>{t.dailyUse}</h2>
   {myPatients.map(patient=><div key={patient.id} style={{marginBlock:12}}>
    <h3>{patient.display_name}</h3>
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
     <Link className="button primary" href={`/${locale}/records/${patient.id}`}>{t.openRecord}</Link>
     {data.mine.get(patient.id)==='caregiver'&&<Link className="button secondary" href={`/${locale}/records/${patient.id}/documents`}>{t.uploadDocuments}</Link>}
    </div>
   </div>)}
   <p className="tiny">{t.accessNote}</p>
  </section>}

  <section className="card" style={{padding:24,marginBlock:24}}><h2>{t.createPatientTitle}</h2><PatientForm locale={locale}/></section>

  {data.patients.map(patient=><section className="card" style={{padding:24,marginBlock:24}} key={patient.id}>
   <h2>{patient.display_name}</h2>
   {data.mine.has(patient.id)
    ? <p><Link href={`/${locale}/records/${patient.id}`}>{t.openRecord}</Link></p>
    : <p className="tiny">{t.accessNote}</p>}
   <p>{t.accountsNote}</p>
   <div className="form-grid">
    {data.accounts.filter(a=>a.patient_id===patient.id).map(account=><div key={`${account.email}-${account.version}`}><AccountForm locale={locale} patient={patient.id} account={account}/></div>)}
    <div><h3>{t.addApprovedAccount}</h3><AccountForm locale={locale} patient={patient.id}/></div>
   </div>
  </section>)}

  <section><h2>{t.recentChanges}</h2><ul>{data.audit.map(event=><li key={event.id}><time dateTime={event.created_at} dir="ltr">{formatTimestamp(locale,event.created_at)}</time> · {auditLabel(locale,event.action)} · <span dir="ltr">{event.email??t.patientRecordLabel}</span></li>)}</ul></section>
  <footer className="footer"><span>{t.versionLabel} {APP_VERSION}</span><span className="tiny">{t.updateHelp}</span></footer>
 </main>;
}
