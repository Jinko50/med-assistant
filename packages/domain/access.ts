/** Pure server policy. Inputs MUST come from verified identity and fresh DB rows.
 * This is not authentication and must never trust memberships supplied by a client.
 */
export type Capability = 'read_record' | 'maintain_record' | 'review_candidates' | 'manage_access';
export type PatientAccess = {
  userId: string;
  patientId: string;
  role: 'patient' | 'caregiver';
  revokedAt: string | null;
  canManageAccess: boolean;
};

const capabilities = ['read_record', 'maintain_record', 'review_candidates', 'manage_access'];

export function authorize(
  verifiedUserId: unknown,
  patientId: unknown,
  capability: unknown,
  memberships: unknown,
): boolean {
  if (typeof verifiedUserId !== 'string' || !verifiedUserId.trim() ||
      typeof patientId !== 'string' || !patientId.trim() ||
      typeof capability !== 'string' || !capabilities.includes(capability) ||
      !Array.isArray(memberships)) return false;

  const matching = memberships.filter(row => row && typeof row === 'object' &&
    row.userId === verifiedUserId && row.patientId === patientId);
  // A unique DB relationship is required. Ambiguous duplicates fail closed.
  if (matching.length !== 1) return false;
  const row = matching[0];
  if (row.revokedAt !== null || typeof row.canManageAccess !== 'boolean' ||
      !['patient', 'caregiver'].includes(row.role)) return false;
  if (capability === 'read_record') return true;
  if (capability === 'manage_access') return row.canManageAccess === true;
  return row.role === 'caregiver';
}
