import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../../packages/domain/access.ts';

const caregiver = { userId: 'synthetic-caregiver', patientId: 'synthetic-patient', role: 'caregiver', revokedAt: null, canManageAccess: false };
test('patient can read own record but cannot maintain or approve it', () => {
  const row = { ...caregiver, userId: 'synthetic-patient-user', role: 'patient' };
  assert.equal(authorize(row.userId, row.patientId, 'read_record', [row]), true);
  for (const permission of ['maintain_record', 'review_candidates', 'manage_access'])
    assert.equal(authorize(row.userId, row.patientId, permission, [row]), false);
});
test('caregiver maintenance does not implicitly confer access administration', () => {
  for (const permission of ['read_record', 'maintain_record', 'review_candidates'])
    assert.equal(authorize(caregiver.userId, caregiver.patientId, permission, [caregiver]), true);
  assert.equal(authorize(caregiver.userId, caregiver.patientId, 'manage_access', [caregiver]), false);
  assert.equal(authorize(caregiver.userId, caregiver.patientId, 'manage_access', [{ ...caregiver, canManageAccess: true }]), true);
});
test('unauthenticated, cross-patient and cross-user access denied', () => {
  for (const [user, patient] of [[null, caregiver.patientId], ['', caregiver.patientId], [caregiver.userId, 'other'], ['other', caregiver.patientId]])
    assert.equal(authorize(user, patient, 'read_record', [caregiver]), false);
});
test('revoked and removed memberships deny even read access', () => {
  for (const rows of [[], [{ ...caregiver, revokedAt: '2026-09-19T00:00:00Z' }]])
    assert.equal(authorize(caregiver.userId, caregiver.patientId, 'read_record', rows), false);
});
test('malformed membership, duplicate relationship and unknown capability fail closed', () => {
  for (const rows of [null, [null], [caregiver, caregiver], [{ ...caregiver, role: 'admin' }], [{ ...caregiver, revokedAt: undefined }], [{ ...caregiver, canManageAccess: 'true' }]])
    assert.equal(authorize(caregiver.userId, caregiver.patientId, 'read_record', rows), false);
  assert.equal(authorize(caregiver.userId, caregiver.patientId, 'invented', [caregiver]), false);
});
