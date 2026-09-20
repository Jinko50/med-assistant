'use server';
import {z} from 'zod';
import {database} from '../lib/supabase';
export async function registerAccount(_state:{message:string},form:FormData){
 const parsed=z.object({email:z.email().max(254),password:z.string().min(6).max(128)}).safeParse({email:form.get('email'),password:form.get('password')});
 if(!parsed.success)return {message:'Enter a valid email and a password of at least 6 characters.'};
 if(form.get('password')!==form.get('confirm'))return {message:'Passwords do not match.'};
 try{const db=await database();const {error}=await db.auth.signUp(parsed.data);
 if(error)return {message:'Registration is unavailable. Ask your administrator to check email delivery and account settings.'};
 // Do not reveal account existence or approval status to anonymous callers.
 return {message:'If registration is available, check your email and confirm your address. Then return here and sign in. Only administrator-approved addresses can access records.'};
 }catch{return {message:'Registration is temporarily unavailable. Try again later.'};}
}
