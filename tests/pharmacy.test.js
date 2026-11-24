import { describe, it, expect } from 'vitest';
import { reachAt, memberGaps, counterAction, COUNTER_DAYS } from '../src/engine/pharmacy.js';

const f = (day, ds, pharmacy, drug = 'lisinopril', measure = 'D09') => ({ day, daysSupply: ds, pharmacy, ingredients: [drug], measure });

describe('store reach', () => {
  it('counter when a refill here falls due within 30 days', () => {
    const r = reachAt('Sunrise Pharmacy', [f(250, 30, 'Sunrise Pharmacy')], 273);
    expect(r).toMatchObject({ reach: 'counter', next: 280, drug: 'lisinopril' });
  });
  it('phone when they fill here but are not due back this month', () => {
    const r = reachAt('Sunrise Pharmacy', [f(260, 90, 'Sunrise Pharmacy')], 273);
    expect(r.reach).toBe('phone');
    expect(r.next - 273).toBeGreaterThan(COUNTER_DAYS);
    const late = reachAt('Sunrise Pharmacy', [f(200, 30, 'Sunrise Pharmacy')], 273);
    expect(late).toMatchObject({ reach: 'phone', overdue: true });
  });
  it('elsewhere when nothing recent was filled here', () => {
    expect(reachAt('Sunrise Pharmacy', [f(250, 30, 'Grove Pharmacy'), f(100, 30, 'Sunrise Pharmacy')], 273).reach).toBe('elsewhere');
  });
  it('ignores the generator\'s placeholder store for safety drugs', () => {
    expect(reachAt('Harbor Pharmacy', [f(260, 30, 'Harbor Pharmacy', 'oxycodone', 'opioid')], 273).reach).toBe('elsewhere');
  });
  it('reads no claim on or after the as-of day', () => {
    expect(reachAt('Sunrise Pharmacy', [f(273, 30, 'Sunrise Pharmacy'), f(280, 30, 'Sunrise Pharmacy')], 273).reach).toBe('elsewhere');
  });
  it('counts a safety gap once per measure, and only open adherence lanes', () => {
    const a = { measures: [{ measure: 'D09', lane: 'save', fix: 'ninety' }, { measure: 'D10', lane: 'safe' }, { measure: 'D08', lane: 'lost' }] };
    const g = memberGaps(a, [{ measure: 'D12' }, { measure: 'D12' }]);
    expect(g.map((x) => x.measure)).toEqual(['D09', 'D12']);
  });
  it('the counter never changes therapy on its own', () => {
    expect(counterAction({ measure: 'D12', lane: 'safety' })).toMatch(/prescriber/);
    expect(counterAction({ measure: 'D11', lane: 'safety' })).toMatch(/prescriber/);
    expect(counterAction({ measure: 'D09', lane: 'save', fix: 'ninety' })).toMatch(/90 days/);
  });
});

describe('plan-wide reach', async () => {
  const { planReach } = await import('../src/engine/pharmacy.js');
  it('walk-in, store call, mail and none', () => {
    expect(planReach([f(250, 30, 'Grove Pharmacy')], 273)).toBe('walk-in');
    expect(planReach([f(200, 30, 'Grove Pharmacy')], 273)).toBe('store-call');
    expect(planReach([f(250, 90, 'Plan mail service')], 273)).toBe('mail');
    expect(planReach([f(10, 30, 'Grove Pharmacy')], 273)).toBe('none');
    expect(planReach([f(250, 30, 'Harbor Pharmacy', 'oxycodone', 'opioid')], 273)).toBe('none');
  });
});
