// No simulated outcome number may be presented as a result in the README, docs or app.
// The simulator's effect sizes come from assumed call success rates (see docs/METHOD.md).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
// Every file under src/ui, including subfolders such as the review directions.
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => (statSync(join(root, dir, f)).isDirectory() ? walk(`${dir}/${f}`) : [`${dir}/${f}`]));
const files = [
  'README.md',
  'docs/METHOD.md',
  ...walk('src/ui'),
  'src/App.jsx',
];
const RESULT_CLAIMS = [/\d+(\.\d+)?\s+(members\s+)?per 100 calls/i, /kept\s+\d+(\.\d+)?\s+members/i, /should save about \d+/i, /\d+(\.\d+)?\s+(vs|against)\s+\d+(\.\d+)?\s+per 100/i];

describe('no simulated outcome claims', () => {
  it('checks the files it means to check', () => {
    expect(files.length).toBeGreaterThan(6);
    expect(files).toContain('src/ui/directions/StoreA.jsx');
  });
  for (const f of files) {
    it(`${f} quotes no simulated result`, () => {
      const text = readFileSync(join(root, f), 'utf8');
      for (const re of RESULT_CLAIMS) expect(text, String(re)).not.toMatch(re);
    });
  }
  it('the app data build does not read simulator results', () => {
    const src = readFileSync(join(root, 'scripts/build-data.mjs'), 'utf8');
    expect(src).not.toMatch(/eval\/results/);
  });
});
