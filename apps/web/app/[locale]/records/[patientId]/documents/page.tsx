import {notFound} from 'next/navigation';
import Link from 'next/link';
import {isLocale} from '../../../../../lib/i18n';
import {authorizedPatient} from '../../../../../lib/dal';
import {AccessMessage} from '../../../../../components/access-message';
import {DocumentUpload} from '../../../../../components/document-upload';
export const dynamic='force-dynamic';
export default async function Documents({params}:{params:Promise<{locale:string;patientId:string}>}){
 const {locale,patientId}=await params;if(!isLocale(locale))notFound();
 let docs;
 try{const {db}=await authorizedPatient(patientId,'maintain_record');const result=await db.from('patient_documents').select('id,filename,bytes,state,created_at').eq('patient_id',patientId).order('created_at',{ascending:false}).limit(101);
 if(result.error||!result.data||result.data.length>100)throw new Error('Unavailable');docs=result.data;
 }catch{return <AccessMessage locale={locale} message="denied"/>;}
 return <main className="page-content" style={{maxWidth:850,margin:'auto'}} lang="en" dir="ltr"><Link href={`/${locale}/records/${patientId}`}>Back to record</Link><h1>Source documents</h1><p>Private original files for caregiver review. Uploading does not verify their contents or change medical facts. Automated extraction and malware scanning are not available.</p><DocumentUpload patient={patientId} locale={locale}/><ul>{docs.map(doc=><li key={doc.id}>{doc.filename} · {Math.ceil(doc.bytes/1024)} KB · {doc.state} {doc.state==='uploaded'&&<a href={`/${locale}/records/${patientId}/documents/${doc.id}`}>Download original</a>}</li>)}</ul></main>;
}
