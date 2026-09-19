import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function inventory() {
  return readdirSync(new URL('../tests/', import.meta.url)).filter(f => f.endsWith('_cases.md')).sort().flatMap(file => {
    const text = readFileSync(new URL(`../tests/${file}`, import.meta.url), 'utf8');
    const starts = [...text.matchAll(/^### ((?:FOOD|MED|SYM|DOC|LANG|SAFE|QF|REG)-\d+)\b.*$/gm)];
    return starts.map((match, index) => {
      const body = text.slice(match.index, starts[index + 1]?.index ?? text.length);
      return { id: match[1], file: `tests/${file}`, sourceHash: createHash('sha256').update(body.replace(/\r\n/g, '\n')).digest('hex') };
    });
  });
}
export function gatingCases() {
  return inventory().filter(c => /^(REG|SAFE)-/.test(c.id)).flatMap(c => {
    const variants = c.id === 'REG-05' ? ['a','b','c','d'] : ['REG-13','REG-18'].includes(c.id) ? ['a','b'] : [''];
    return variants.map(suffix => ({ ...c, id: c.id + suffix }));
  });
}
