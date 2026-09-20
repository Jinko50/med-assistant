import {NextResponse} from 'next/server';
import {authorizedPatient} from '../../../../../../lib/dal';
export async function GET(_request:Request,{params}:{params:Promise<{patientId:string;documentId:string}>}){
 const {patientId,documentId}=await params;
 try{const {db}=await authorizedPatient(patientId,'maintain_record');const {data,error}=await db.from('patient_documents').select('filename').eq('patient_id',patientId).eq('id',documentId).eq('state','uploaded').single();
 if(error||!data)throw new Error('Unavailable');
 const signed=await db.storage.from('medical-originals').createSignedUrl(`${patientId}/${documentId}`,60,{download:data.filename});
 if(signed.error||!signed.data)throw new Error('Unavailable');
 return NextResponse.redirect(signed.data.signedUrl,{status:303,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 }catch{return new NextResponse('Document unavailable',{status:403,headers:{'Cache-Control':'private, no-store'}});}
}
