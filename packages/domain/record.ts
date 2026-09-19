import { z } from 'zod';

export const categories = ['profile','medication','allergy','condition','lab','observation','care_plan','timeline','note'] as const;
export const provenances = ['DOCUMENTED','REPORTED','SEEN IN PHOTO','ESTIMATED','UNKNOWN'] as const;
export const sourceDate = z.string().refine(value => {
  if (value === 'UNKNOWN') return true;
  if (!/^\d{4}(-\d{2}){0,2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200 || (month !== undefined && (month < 1 || month > 12))) return false;
  if (day !== undefined && (day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate())) return false;
  return true;
});
export const recordInput = z.object({
  patientId: z.uuid(), recordId: z.uuid().nullable(), expectedVersion: z.number().int().nonnegative(),
  category: z.enum(categories), label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(2000).nullable(), unit: z.string().trim().max(40).nullable(),
  provenance: z.enum(provenances), unknownReason: z.string().trim().min(1).max(500).nullable(),
  derivation: z.string().trim().min(1).max(500).nullable(), sourceDescription: z.string().trim().min(1).max(500),
  sourceDate, hasConflict: z.boolean(),
}).superRefine((data, ctx) => {
  const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (data.provenance === 'UNKNOWN') {
    if (data.value !== null || !data.unknownReason) fail('unknownReason', 'Unknown requires a reason and no value');
  } else if (!data.value || data.unknownReason !== null) fail('value', 'Recorded value required');
  if (data.provenance === 'ESTIMATED' && (!data.derivation || !['note','timeline'].includes(data.category)))
    fail('derivation', 'Only nonclinical note/timeline estimates with derivation are supported');
  if (['lab','observation'].includes(data.category) && data.provenance !== 'UNKNOWN' && !data.unit)
    fail('unit', 'Units are required');
  if (!data.recordId && data.expectedVersion !== 0) fail('expectedVersion', 'New records require version zero');
});
export type RecordInput = z.infer<typeof recordInput>;
export type MedicalRecord = {
  id: string; patient_id: string; category: typeof categories[number]; label: string; value: string | null;
  unit: string | null; provenance: typeof provenances[number]; unknown_reason: string | null; derivation: string | null;
  source_id: string; has_conflict: boolean; version: number; updated_at: string; confirmed_by: string;
};
export type Source = { id: string; description: string; source_date: string };
