import { describe, it, expect } from 'vitest';
import { ADHERENCE, SAFETY, starFor, movesToNextStar } from '../src/engine/measures.js';
import { targetFills, walkCoverage, statusAsOf, finalPdc } from '../src/engine/pdc.js';

const RAS = ADHERENCE.D09;
const fill = (day, ingredients, daysSupply) => ({ day, ingredients, daysSupply });

describe('PDC matches CMS Attachment L worked examples', () => {
  it('Example 1: two different drugs back to back cover 120 of 120 days', () => {
    const tf = targetFills({ ingredients: ['benazepril', 'captopril'] }, [fill(0, ['benazepril'], 59), fill(59, ['captopril'], 61)]);
    expect(walkCoverage(tf, 0, 120, []).covered).toBe(120);
  });
  it('Example 3: same ingredient shifts, different ingredient does not, 105 of 120', () => {
    const m = { ingredients: ['lisinopril', 'captopril'] };
    const tf = targetFills(m, [
      fill(0, ['lisinopril'], 31),
      fill(15, ['lisinopril', 'hydrochlorothiazide'], 31),
      fill(59, ['captopril'], 31),
      fill(74, ['lisinopril'], 31),
    ]);
    expect(walkCoverage(tf, 0, 120, []).covered).toBe(105);
  });
  it('a stay removes days from both sides and carries supply past discharge', () => {
    const m = { ingredients: ['atorvastatin'] };
    const tf = targetFills(m, [fill(0, ['atorvastatin'], 30)]);
    const w = walkCoverage(tf, 0, 50, [{ start: 10, end: 19 }]);
    expect(w.eligible).toBe(40);
    expect(w.covered).toBe(30);
  });
});

describe('denominator rules', () => {
  const base = { hospice: false, esrd: false, stays: [] };
  it('needs two fills on unique dates and a 91 day treatment period', () => {
    expect(finalPdc(ADHERENCE.D10, { ...base, fills: [fill(10, ['atorvastatin'], 90)] })).toBeNull();
    expect(finalPdc(ADHERENCE.D10, { ...base, fills: [fill(280, ['atorvastatin'], 30), fill(300, ['atorvastatin'], 30)] })).toBeNull();
    expect(finalPdc(ADHERENCE.D10, { ...base, fills: [fill(0, ['atorvastatin'], 90), fill(90, ['atorvastatin'], 90)] })).toBeCloseTo(180 / 365);
  });
  it('insulin excludes from the diabetes measure and sacubitril from blood pressure', () => {
    const fills = [fill(0, ['metformin'], 90), fill(90, ['metformin'], 90), fill(100, ['insulin glargine'], 30)];
    expect(finalPdc(ADHERENCE.D08, { ...base, fills })).toBeNull();
    const ras = [fill(0, ['valsartan'], 90), fill(90, ['valsartan'], 90), fill(150, ['sacubitril', 'valsartan'], 30)];
    expect(finalPdc(ADHERENCE.D09, { ...base, fills: ras })).toBeNull();
  });
});

describe('status on an as-of date', () => {
  const base = { hospice: false, esrd: false, stays: [] };
  it('computes the gap budget and the last day to fill', () => {
    // 30 day fills from day 0, perfectly on time through day 239, then nothing.
    const fills = Array.from({ length: 8 }, (_, i) => fill(i * 30, ['atorvastatin'], 30));
    const s = statusAsOf(ADHERENCE.D10, { ...base, fills }, 273);
    expect(s.coveredSoFar).toBe(240);
    expect(s.periodDays).toBe(365);
    expect(s.needCovered).toBe(292);
    expect(s.budget).toBe(73 - 33);
    expect(s.mustFillBy).toBe(273 + 40);
    expect(s.state).toBe('open');
  });
  it('marks a member lost when 80% is out of reach', () => {
    const fills = [fill(0, ['atorvastatin'], 30), fill(100, ['atorvastatin'], 30)];
    expect(statusAsOf(ADHERENCE.D10, { ...base, fills }, 273).state).toBe('lost');
  });
});

describe('stars and cut points (2027 Star Ratings, MA-PD)', () => {
  it('rounds before applying cut points', () => {
    expect(starFor(ADHERENCE.D10, 89.4)).toBe(3);
    expect(starFor(ADHERENCE.D10, 89.5)).toBe(4);
    expect(starFor(SAFETY.D12, 12.4)).toBe(4);
    expect(starFor(SAFETY.D12, 12.6)).toBe(3);
  });
  it('counts members needed for the next star', () => {
    // 1000 members, 885 adherent is 88.5 -> rounds to 89 (3 stars), needs 89.5 -> 895
    expect(movesToNextStar(ADHERENCE.D10, 885, 1000)).toBe(10);
    // lower is better: 130 of 1000 = 13% (3 stars), 4 stars needs <= 12.49 -> 124
    expect(movesToNextStar(SAFETY.D12, 130, 1000)).toBe(6);
  });
});
