// The portfolio names no employer (Kevin, 24 Nov 2026: "Make them generic"). Visible text in the app, README and
// docs must not name the company or its business units. Source links stay: a URL is a citation, not a mention, so
// addresses are stripped before the check.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const NAMES = /\b(CVS|Caremark|Aetna|Omnicare|MinuteClinic|Health100)\b/i;
const SKIP = ['node_modules', '.git', 'dist', '.vercel', '.claude', 'tests', 'data', 'eval'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(md|html|jsx?|mjs|css)$/.test(name) && !name.startsWith('package-lock')) out.push(p);
  }
  return out;
}

describe('no employer name in public text', () => {
  const files = walk(root);
  it('sees the files it is meant to check', () => {
    expect(files.some((f) => f.endsWith('README.md'))).toBe(true);
    expect(files.some((f) => f.includes('/src/'))).toBe(true);
    expect(files.length).toBeGreaterThan(10);
  });
  for (const f of files) {
    it(`${f.slice(root.length)} names no employer`, () => {
      const text = readFileSync(f, 'utf8').replace(/https?:\/\/[^\s'"`)<>]+/g, '[link]');
      const hit = text.match(NAMES);
      expect(hit ? hit[0] : null, f).toBeNull();
    });
  }
});
