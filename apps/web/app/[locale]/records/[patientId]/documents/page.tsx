import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale,translations,direction} from '../../../../../lib/i18n';
import {authorizedPatient} from '../../../../../lib/dal';
import {AccessMessage} from '../../../../../components/access-message';
import {DocumentUpload} from '../../../../../components/document-upload';
import {LanguageLinks} from '../../../../../components/shell';
import {APP_VERSION} from '../../../../../lib/version';
export const dynamic='force-dynamic';
export default async function Documents({params}:{params:Promise<{locale:string;patientId:string}>}){
 const {locale,patientId}=await params;if(!isLocale(locale))notFound();
 const t=translations[locale];
 let docs;
 try{const {db}=await authorizedPatient(patientId,'maintain_record');
 const result=await db.from('patient_documents').select('id,filename,bytes,state,created_at').eq('patient_id',patientId).order('created_at',{ascending:false}).limit(101);
 if(result.error||!result.data||result.data.length>100)throw new Error('Unavailable');docs=result.data;
 }catch{return <AccessMessage locale={locale} message="denied"/>;}
 return <main className="page-content" style={{maxWidth:850,margin:'auto'}} lang={locale} dir={direction(locale)}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
   <Link href={`/${locale}/records/${patientId}`}>{t.back}</Link>
   <LanguageLinks locale={locale} path={`/records/${patientId}/documents`}/>
  </div>
  <h1>{t.documentsTitle}</h1>
  <p>{t.documentsIntro}</p>
  <DocumentUpload patient={patientId} locale={locale}/>
  {docs.length===0
   ? <p>{t.noDocuments}</p>
   : <ul>{docs.map(doc=><li key={doc.id}><span dir="ltr">{doc.filename}</span> · {Math.ceil(doc.bytes/1024)} KB · {doc.state==='uploaded'?t.stateUploaded:t.statePending} {doc.state==='uploaded'&&<a href={`/${locale}/records/${patientId}/documents/${doc.id}`}>{t.downloadOriginal}</a>}</li>)}</ul>}
  <footer className="footer"><span>{t.versionLabel} {APP_VERSION}</span></footer>
 </main>;
}
