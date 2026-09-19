import 'server-only';
import { database } from './supabase';
import { authorize } from '../../../packages/domain/access';
import type { MedicalRecord, Source } from '../../../packages/domain/record';

export async function authorizedPatient(patientId: string, capability: 'read_record' | 'maintain_record' = 'read_record') {
  const db = await database();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) throw new Error('ACCESS_DENIED');
  const { data: access, error } = await db.from('patient_access').select('user_id,patient_id,role,revoked_at,can_manage_access').eq('patient_id', patientId).eq('user_id', user.id);
  if (error) throw new Error('BACKEND_UNAVAILABLE');
  const rows = (access ?? []).map(row => ({ userId: row.user_id, patientId: row.patient_id, role: row.role, revokedAt: row.revoked_at, canManageAccess: row.can_manage_access }));
  if (!authorize(user.id, patientId, capability, rows)) throw new Error('ACCESS_DENIED');
  return { db, user, role: rows[0].role as 'patient' | 'caregiver' };
}

export async function readPatient(patientId: string) {
  const { db, role } = await authorizedPatient(patientId);
  const results = await Promise.all([
    db.from('patients').select('id,display_name,preferred_language').eq('id', patientId).single(),
    db.from('medical_records').select('*').eq('patient_id', patientId).order('updated_at', { ascending: false }).limit(201),
  ]);
  if (results.some(r => r.error)) throw new Error('BACKEND_UNAVAILABLE');
  if (!results[0].data) throw new Error('ACCESS_DENIED');
  const records = (results[1].data ?? []) as MedicalRecord[];
  // Until pagination exists, fail visibly rather than silently omit medical facts.
  if (records.length > 200) throw new Error('BACKEND_UNAVAILABLE');
  const sourceIds = [...new Set(records.map(record => record.source_id))];
  const sourceResult = sourceIds.length ? await db.from('record_sources').select('id,description,source_date')
    .eq('patient_id',patientId).in('id',sourceIds) : { data: [], error: null };
  if (sourceResult.error || sourceResult.data?.length !== sourceIds.length) throw new Error('BACKEND_UNAVAILABLE');
  return { patient: results[0].data, records, sources: sourceResult.data as Source[], role };
}
