import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMeasurements } from '../../packages/domain/measurements.ts';

// Independent release review, 2026-09-21. Synthetic inputs only.
// Run explicitly: node --test tests/review/chat-release.test.ts
// Kept separate from the existing suite to expose its coverage gaps.
for (const [text, expected] of [
  ['weight 80 kg, pulse 72', { weight: '80', pulse: '72' }],
  ['pulse 72, temperature 37.8 C', { pulse: '72', temperature: '37.8' }],
  ['temperature 37.8 and weight 78', { temperature: '37.8', weight: '78' }],
  ['Сегодня вес 80 кг, пульс 72', { weight: '80', pulse: '72' }],
  ['משקל 80 קג, דופק 72', { weight: '80', pulse: '72' }],
] as const) {
  test(`each measurement keeps its own number: ${text}`, () => {
    const actual = Object.fromEntries(extractMeasurements(text).map(m => [m.kind, m.value]));
    assert.deepEqual(actual, expected);
  });
}

test('degrees without a named scale remain unknown', () => {
  const [actual] = extractMeasurements('температура 98.6 градусов');
  assert.ok(actual);
  assert.equal(actual.unit, '');
  assert.equal(actual.needsUnit, true);
});
