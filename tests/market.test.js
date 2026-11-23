// Real plans: the desk's cut points and star logic against CMS's own 2027 Star Ratings data tables
// (data/cms/star-ratings-2027-partd.json, trimmed from cms.gov by scripts/cms-derive.mjs).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ALL_MEASURES } from '../src/engine/measures.js';
import { starCheck, oneAwaySummary, measureSummary, pointsToNextStar } from '../src/engine/market.js';

const root = new URL('..', import.meta.url).pathname;
const cms = JSON.parse(readFileSync(`${root}data/cms/star-ratings-2027-partd.json`, 'utf8'));
const readme = readFileSync(`${root}README.md`, 'utf8');
const n = (v) => v.toLocaleString('en-US');

describe('the CMS 2027 data file', () => {
  it('names each source zip with its checksum', () => {
    expect(cms.sources).toHaveLength(2);
    for (const s of cms.sources) {
      expect(s.url).toMatch(/^https:\/\/www\.cms\.gov\/files\/zip\//);
      expect(s.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });
  it('holds every contract in the CMS table and no plan names', () => {
    expect(cms.contracts).toHaveLength(735);
    expect(cms.contracts.filter((c) => c.org === 'MA-PD')).toHaveLength(687);
    for (const c of cms.contracts) expect(Object.keys(c).sort()).toEqual(['disaster2025', 'id', 'org', 'score', 'star', 'star2026']);
  });
});

describe('cut points', () => {
  for (const id of ['D08', 'D09', 'D10', 'D11', 'D12', 'D13']) {
    it(`${id} matches the MA-PD row of CMS's cut point file`, () => {
      expect(ALL_MEASURES[id].cut).toEqual(cms.cutPoints['MA-PD'][id].cut);
      expect(ALL_MEASURES[id].higherIsBetter).toBe(cms.cutPoints['MA-PD'][id].higherIsBetter);
    });
  }
});

describe("star logic against CMS's published stars", () => {
  const check = starCheck(cms);
  it('checks thousands of real plan scores', () => {
    expect(check.checked).toBeGreaterThan(3000);
  });
  it('gives the published star everywhere except plans held at their 2026 star', () => {
    expect(check.unexplained).toEqual([]);
    expect(check.reproduced + check.heldAt2026.length).toBe(check.checked);
  });
  it('holds only plans with at least 25% of members in 2025 disaster areas', () => {
    for (const h of check.heldAt2026) {
      const c = cms.contracts.find((x) => x.id === h.id);
      expect(c.disaster2025).toBeGreaterThanOrEqual(25);
    }
  });
  it('matches the README', () => {
    expect(readme).toContain(`${n(check.reproduced)} of ${n(check.checked)}`);
    expect(readme).toContain(`other ${check.heldAt2026.length}`);
  });
});

describe('one point from the next star', () => {
  it('counts whole points both ways', () => {
    expect(pointsToNextStar(ALL_MEASURES.D08, 88)).toBe(1); // 2 stars, 3 stars at 89
    expect(pointsToNextStar(ALL_MEASURES.D08, 86)).toBe(3);
    expect(pointsToNextStar(ALL_MEASURES.D08, 93)).toBe(null); // 5 stars
    expect(pointsToNextStar(ALL_MEASURES.D12, 13)).toBe(1); // 3 stars, 4 stars at 12% or lower
    expect(pointsToNextStar(ALL_MEASURES.D12, 21)).toBe(1); // 1 star, 2 stars at 20% or lower
  });
  it('sums per measure to the histogram', () => {
    for (const id of cms.measures) {
      const s = measureSummary(cms, id);
      expect(s.hist.reduce((t, [, k]) => t + k, 0)).toBe(s.plans);
      expect(s.oneAway).toBeLessThanOrEqual(s.plans);
    }
  });
  it('matches the README', () => {
    const { plans, oneAway } = oneAwaySummary(cms);
    expect(plans).toBeGreaterThan(500);
    expect(readme).toContain(`${oneAway} of ${plans}`);
  });
});
