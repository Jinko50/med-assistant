import 'server-only';
import { database } from './supabase';
export async function requireAdmin() {
 const db = await database();
 const {data:{user},error}=await db.auth.getUser();
 if(error || !user) throw new Error('ACCESS_DENIED');
 const check=await db.from('app_admins').select('user_id').eq('user_id',user.id).is('revoked_at',null).maybeSingle();
 if(check.error || !check.data) throw new Error('ACCESS_DENIED');
 return {db,user};
}
