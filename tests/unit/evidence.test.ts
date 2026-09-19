import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEvidence } from '../../packages/domain/behavioral-evidence.ts';
import { inventory, gatingCases } from '../../tools/scenarios.ts';

const required = [{ id: 'SYNTHETIC-ONLY', sourceHash: 'a'.repeat(64) }];
const config = { build: 'synthetic-build', model: 'synthetic-provider', policyHash: 'b'.repeat(64) };
// Validator test data, NOT model execution evidence, and never persisted as a run.
function sample() { return { schemaVersion: 1, syntheticDataOnly: true, runId: 'validator-test', configuration: config,
  results: [{ id: required[0].id, sourceHash: required[0].sourceHash, verdict: 'PASS', actualInput: 'synthetic input',
    actualOutput: 'synthetic validator fixture', reviewedBy: 'test-reviewer', reviewNotes: 'validator fixture only',
    captureKind: 'provider-response', providerRequestId: 'test-request', executedAt: '2026-09-19T00:00:00Z' }] }; }
test('inventory preserves 79 parent cases and all 34 gating subcases', () => {
  assert.equal(inventory().length, 79);
  assert.equal(new Set(inventory().map(c => c.id)).size, 79);
  assert.equal(gatingCases().length, 34);
  assert.ok(gatingCases().some(c => c.id === 'REG-05d'));
  assert.ok(gatingCases().some(c => c.id === 'REG-18b'));
});
test('complete evidence structure accepted, not clinical certification', () => assert.deepEqual(evaluateEvidence(required, config, sample()), []));
test('empty inventory and absent evidence cannot pass vacuously', () => {
  assert.ok(evaluateEvidence([], config, sample()).length);
  assert.ok(evaluateEvidence(required, config, null).length);
  assert.ok(evaluateEvidence(required, config, { ...sample(), results: [] }).length);
});
test('FAIL, PARTIAL and NOT RUN always block', () => {
  for (const verdict of ['FAIL', 'PARTIAL', 'NOT RUN']) {
    const run = sample(); run.results[0].verdict = verdict;
    assert.ok(evaluateEvidence(required, config, run).length);
  }
});
test('duplicate, unknown, missing and stale case evidence blocks', () => {
  const run = sample();
  assert.ok(evaluateEvidence(required, config, { ...run, results: [...run.results, ...run.results] }).length);
  assert.ok(evaluateEvidence(required, config, { ...run, results: [{ ...run.results[0], id: 'unknown' }] }).length);
  run.results[0].sourceHash = 'c'.repeat(64);
  assert.ok(evaluateEvidence(required, config, run).length);
});
test('wrong model, build or policy cannot reuse old results', () => {
  for (const key of ['model', 'build', 'policyHash'])
    assert.ok(evaluateEvidence(required, config, { ...sample(), configuration: { ...config, [key]: 'wrong' } }).length);
});
test('expected-response-only, unreviewed and malformed records block', () => {
  for (const key of ['actualInput', 'actualOutput', 'reviewedBy', 'reviewNotes', 'providerRequestId', 'executedAt']) {
    const run = sample(); (run.results[0] as any)[key] = '';
    assert.ok(evaluateEvidence(required, config, run).length);
  }
  const run = sample(); run.results[0].captureKind = 'expected-response';
  assert.ok(evaluateEvidence(required, config, run).length);
  assert.ok(evaluateEvidence(required, config, { ...sample(), syntheticDataOnly: false }).length);
});
