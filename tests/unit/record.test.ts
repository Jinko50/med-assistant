import test from 'node:test';
import assert from 'node:assert/strict';
import { recordInput, sourceDate } from '../../packages/domain/record.ts';
const base = { patientId:'10000000-0000-4000-8000-000000000001', recordId:null,expectedVersion:0,
  category:'profile', label:'Synthetic language', value:'Russian', unit:null,provenance:'REPORTED',unknownReason:null,derivation:null,
  sourceDescription:'Synthetic caregiver', sourceDate:'2026-09',hasConflict:false };
test('source date keeps original precision and explicit unknown', () => {
  for (const date of ['2026','2026-09','2024-02-29','UNKNOWN']) assert.ok(sourceDate.safeParse(date).success);
  for (const date of ['', '2026-99','2026-02-30','2025-02-29','next Friday']) assert.equal(sourceDate.safeParse(date).success,false);
});
test('unknown is distinct from an empty or fabricated fact', () => {
  assert.ok(recordInput.safeParse(base).success);
  assert.equal(recordInput.safeParse({...base,value:null}).success,false);
  assert.equal(recordInput.safeParse({...base,provenance:'UNKNOWN',unknownReason:'unreadable'}).success,false);
  assert.ok(recordInput.safeParse({...base,provenance:'UNKNOWN',value:null,unknownReason:'unreadable'}).success);
});
test('measurements require units and estimates cannot populate clinical fields', () => {
  assert.equal(recordInput.safeParse({...base,category:'lab'}).success,false);
  assert.ok(recordInput.safeParse({...base,category:'lab',unit:'mmol/L'}).success);
  assert.equal(recordInput.safeParse({...base,category:'medication',provenance:'ESTIMATED',derivation:'guessed'}).success,false);
});
