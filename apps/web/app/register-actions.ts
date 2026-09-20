'use server';
import {z} from 'zod';
import {database} from '../lib/supabase';
// The message is a key into translations[locale].registerMessages.
export async function registerAccount(_state:{message:string},form:FormData){
 const parsed=z.object({email:z.email().max(254),password:z.string().min(6).max(128)}).safeParse({email:form.get('email'),password:form.get('password')});
 if(!parsed.success)return {message:'invalidInput'};
 if(form.get('password')!==form.get('confirm'))return {message:'mismatch'};
 try{const db=await database();const {error}=await db.auth.signUp(parsed.data);
 if(error)return {message:'unavailable'};
 // Do not reveal account existence or approval status to anonymous callers.
 return {message:'submitted'};
 }catch{return {message:'tempUnavailable'};}
}
