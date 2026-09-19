import { inventory, gatingCases } from './scenarios.ts';
const cases = inventory();
console.log(JSON.stringify({ writtenParentScenarios: cases.length, gatingInputs: gatingCases().length,
  note: 'Inventory only; execution evidence is validated separately.', cases }, null, 2));
