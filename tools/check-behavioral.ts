import { readFileSync } from 'node:fs';
import { evaluateEvidence } from '../packages/domain/behavioral-evidence.ts';
import { gatingCases } from './scenarios.ts';

// Explicit candidate configuration prevents a run from supplying its own target.
const [configurationPath, evidencePath] = process.argv.slice(2);
if (!configurationPath || !evidencePath) {
  console.error('BLOCKED: supply expected release configuration JSON and actual behavioral evidence JSON. No model tests have been run by this command.');
  process.exitCode = 1;
} else {
  try {
    const expected = JSON.parse(readFileSync(configurationPath, 'utf8'));
    const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
    const errors = evaluateEvidence(gatingCases(), expected, evidence);
    if (errors.length) {
      console.error('BLOCKED\n' + errors.join('\n'));
      process.exitCode = 1;
    } else console.log('Behavioral evidence structure passes. Human review, integration checks and readiness blockers still govern release.');
  } catch {
    // Do not echo paths, document contents or malformed evidence into logs.
    console.error('BLOCKED: configuration or evidence could not be read and validated.');
    process.exitCode = 1;
  }
}
