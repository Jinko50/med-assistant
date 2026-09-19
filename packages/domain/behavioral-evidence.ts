/** Evidence validation only, never a clinical scorer or overall release approval. */
export type RequiredCase = { id: string; sourceHash: string };
export type RunConfiguration = { build: string; model: string; policyHash: string };

const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const hash = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export function evaluateEvidence(required: RequiredCase[], expected: RunConfiguration, evidence: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(required) || !required.length || new Set(required.map(c => c.id)).size !== required.length ||
      required.some(c => !nonempty(c.id) || !hash(c.sourceHash))) return ['Invalid required case inventory'];
  if (!expected || !nonempty(expected.build) || !nonempty(expected.model) || !hash(expected.policyHash))
    return ['Invalid expected release configuration'];
  if (!evidence || typeof evidence !== 'object') return ['Missing behavioral evidence'];
  const run = evidence as Record<string, any>;
  if (run.schemaVersion !== 1 || run.syntheticDataOnly !== true || !nonempty(run.runId))
    errors.push('Invalid run metadata or synthetic-data declaration');
  for (const key of ['build', 'model', 'policyHash'] as const) {
    if (run.configuration?.[key] !== expected[key]) errors.push(`Configuration mismatch: ${key}`);
  }
  if (!Array.isArray(run.results)) return [...errors, 'Missing results'];
  const ids = new Set(required.map(c => c.id));
  for (const result of run.results) {
    if (!result || !ids.has(result.id)) errors.push('Unknown or malformed result');
  }
  for (const scenario of required) {
    const matches = run.results.filter((r: any) => r?.id === scenario.id);
    if (matches.length !== 1) { errors.push(`${scenario.id}: missing or duplicate result`); continue; }
    const result = matches[0];
    if (result.verdict !== 'PASS') errors.push(`${scenario.id}: verdict is not PASS`);
    if (result.sourceHash !== scenario.sourceHash) errors.push(`${scenario.id}: scenario changed`);
    if (!nonempty(result.actualOutput) || !nonempty(result.actualInput) || !nonempty(result.reviewedBy) ||
        !nonempty(result.reviewNotes) || result.captureKind !== 'provider-response' ||
        !nonempty(result.providerRequestId) || !nonempty(result.executedAt) ||
        !Number.isFinite(Date.parse(result.executedAt))) errors.push(`${scenario.id}: incomplete observed evidence`);
  }
  return errors;
}
