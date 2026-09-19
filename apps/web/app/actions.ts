'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { database } from '../lib/supabase';
import { backendConfigured } from '../lib/config';
import { isLocale } from '../lib/i18n';
import { authorizedPatient } from '../lib/dal';
import { recordInput } from '../../../packages/domain/record';

export type FormState = { status: 'idle' | 'saved' | 'invalid' | 'conflict' | 'unavailable' | 'denied' | 'credentials' | 'setup' };
export async function signIn(_state: FormState, form: FormData): Promise<FormState> {
  const locale = String(form.get('locale'));
  if (!isLocale(locale)) return { status: 'invalid' };
  if (!backendConfigured()) return { status: 'setup' };
  const login = z.object({ email: z.email().max(254), password: z.string().min(1).max(256) }).safeParse({ email: form.get('email'), password: form.get('password') });
  if (!login.success) return { status: 'credentials' };
  try {
    const db = await database();
    const { error } = await db.auth.signInWithPassword(login.data);
    if (error) return { status: 'credentials' };
  } catch { return { status: 'unavailable' }; }
  redirect(`/${locale}/workspace`);
}
export async function signOut(form: FormData) {
  const raw = String(form.get('locale')); const locale = isLocale(raw) ? raw : 'en';
  try { const db = await database(); await db.auth.signOut(); } catch { /* Login page remains non-sensitive. */ }
  const store = await cookies();
  store.getAll().filter(cookie => cookie.name.startsWith('sb-')).forEach(cookie => store.delete(cookie.name));
  redirect(`/${locale}/login`);
}
export async function saveRecord(_state: FormState, form: FormData): Promise<FormState> {
  const locale = String(form.get('locale'));
  if (!isLocale(locale) || form.get('confirmed') !== 'on') return { status: 'invalid' };
  const optional = (name: string) => String(form.get(name) ?? '').trim() || null;
  const parsed = recordInput.safeParse({
    patientId: form.get('patientId'), recordId: optional('recordId'), expectedVersion: Number(form.get('expectedVersion')),
    category: form.get('category'), label: form.get('label'), value: optional('value'), unit: optional('unit'),
    provenance: form.get('provenance'), unknownReason: optional('unknownReason'), derivation: optional('derivation'),
    sourceDescription: form.get('sourceDescription'), sourceDate: form.get('sourceDate'), hasConflict: form.get('hasConflict') === 'on',
  });
  if (!parsed.success) return { status: 'invalid' };
  const d = parsed.data;
  try {
    const { db } = await authorizedPatient(d.patientId, 'maintain_record');
    const { error } = await db.rpc('save_record', {
      p_patient_id: d.patientId, p_record_id: d.recordId, p_expected_version: d.expectedVersion,
      p_category: d.category, p_label: d.label, p_value: d.value, p_unit: d.unit, p_provenance: d.provenance,
      p_unknown_reason: d.unknownReason, p_derivation: d.derivation, p_source_description: d.sourceDescription,
      p_source_date: d.sourceDate, p_has_conflict: d.hasConflict,
    });
    if (error) return { status: error.code === '40001' ? 'conflict' : error.code === '42501' ? 'denied' : 'unavailable' };
  } catch (error) { return { status: error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable' }; }
  revalidatePath(`/${locale}/records/${d.patientId}`);
  return { status: 'saved' };
}
