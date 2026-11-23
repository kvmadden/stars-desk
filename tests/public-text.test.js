// Public text must not name a local machine, disk or private working folder.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const BANNED = [/\/Users\//, /\/Volumes\//, /HubData/, /\/private\/tmp/, /~\/dev/, /MFW_UMBRELLA_ROOT/, /OPERATOR_ECOSYSTEM_ROOT/, /localhost/, /127\.0\.0\.1/];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', '.vercel', '.claude', 'results'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(md|json|html)$/.test(name) && !name.startsWith('package-lock')) out.push(p);
  }
  return out;
}

describe('public text guard', () => {
  const files = walk(root);
  it('sees the docs it is meant to check', () => {
    expect(files.some((f) => f.endsWith('README.md'))).toBe(true);
    expect(files.length).toBeGreaterThan(3);
  });
  for (const f of files) {
    it(`${f.slice(root.length)} has no local paths`, () => {
      const text = readFileSync(f, 'utf8');
      for (const re of BANNED) expect(text, String(re)).not.toMatch(re);
    });
  }
});
