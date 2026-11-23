import { describe, it, expect } from 'vitest';
import { inferBarrier, analyzeMember, features } from '../src/engine/desk.js';
import { ADHERENCE } from '../src/engine/measures.js';
import { statusAsOf } from '../src/engine/pdc.js';
import { buildWorld, planFills, DEV_PARAMS } from '../src/engine/world.js';
import { cobStatus, achStatus, supdStatus } from '../src/engine/safety.js';
import { fleschKincaid, memberNotice, CHANGES_2027 } from '../src/engine/formulary.js';

const f = (over) => ({ fills: 6, meanLate: 2, rawMean: 2, maxLate: 4, copay30: 0, pharmacies: 1, switchFill: null, newStart: false, daysLate: 0, ds: 30, drug: 'atorvastatin', ...over });

describe('pharmacist rulebook', () => {
  it('reads a switch to a non-target drug as a prescriber question, not a refill push', () => {
    expect(inferBarrier(f({ switchFill: { day: 200, drug: 'ezetimibe' }, daysLate: 20 })).fix).toBe('confirm');
  });
  it('does not read long-running add-on ezetimibe as a switch', () => {
    const fx = (day, drug) => ({ day, ingredients: [drug], daysSupply: 30, copay: 0, pharmacy: 'A', prescriber: 'P-1' });
    const fills = [];
    for (let d = 0; d < 240; d += 30) fills.push(fx(d, 'atorvastatin'));
    for (let d = 40; d < 273; d += 30) fills.push(fx(d, 'ezetimibe'));
    const m = { hospice: false, esrd: false, stays: [], fills };
    const s = statusAsOf(ADHERENCE.D10, m, 273);
    expect(features(ADHERENCE.D10, m, 273, s).switchFill).toBeNull();
  });
  it('reads a short run then a long stop as possible side effects', () => {
    expect(inferBarrier(f({ fills: 2, daysLate: 40, newStart: true })).barrier).toBe('sideEffect');
  });
  it('reads a high copay with late refills as cost', () => {
    expect(inferBarrier(f({ copay30: 47, rawMean: 9 })).fix).toBe('costfix');
  });
  it('sends chronic lateness on 30-day fills to a 90-day supply', () => {
    expect(inferBarrier(f({ rawMean: 8 })).fix).toBe('ninety');
    expect(inferBarrier(f({ rawMean: 8, ds: 90 })).fix).toBe('steady');
  });
  it('falls back to a reminder when nothing stands out', () => {
    expect(inferBarrier(f({})).fix).toBe('reminder');
  });
});

describe('synthetic world', () => {
  const w = buildWorld(101, { ...DEV_PARAMS, members: 300 });
  it('is reproducible from its seed', () => {
    const again = buildWorld(101, { ...DEV_PARAMS, members: 300 });
    expect(JSON.stringify(again.members[5].fills)).toBe(JSON.stringify(w.members[5].fills));
  });
  it('keeps every fill before the call identical with or without the call', () => {
    for (const m of w.members.slice(0, 120)) {
      for (const plan of Object.values(m.hidden.plans)) {
        const base = planFills(m, plan, DEV_PARAMS).filter((x) => x.day < 273);
        const called = planFills(m, plan, DEV_PARAMS, { day: 273, effect: 'ninety' }).filter((x) => x.day < 273);
        expect(called).toEqual(base);
      }
    }
  });
  it('never reads the hidden barrier or any fill after the as-of day', () => {
    for (const m of w.members) {
      const a = analyzeMember(m, 273);
      const blind = { ...m, hidden: undefined, fills: m.fills.filter((x) => x.day < 273) };
      expect(analyzeMember(blind, 273)).toEqual(a);
    }
  });
});

describe('safety measures', () => {
  const fill = (day, drug, ds = 30) => ({ day, ingredients: [drug], daysSupply: ds, prescriber: 'P-1', copay: 0 });
  const base = { age: 70, hospice: false, esrd: false, safety: { cancer: false, supdExcluded: false } };
  it('counts 30 days of opioid and benzodiazepine overlap', () => {
    const fills = [fill(0, 'oxycodone'), fill(30, 'oxycodone'), fill(10, 'alprazolam'), fill(40, 'alprazolam')];
    expect(cobStatus({ ...base, fills }, 273).state).toBe('counted');
  });
  it('counts overlap across any two of three anticholinergics', () => {
    const fills = [fill(0, 'oxybutynin'), fill(30, 'oxybutynin'), fill(100, 'amitriptyline'), fill(130, 'amitriptyline'), fill(110, 'hydroxyzine'), fill(140, 'hydroxyzine')];
    // oxybutynin covers 0 to 59, so the pair that overlaps is amitriptyline with hydroxyzine
    expect(achStatus({ ...base, fills }, 273).state).toBe('counted');
  });
  it('needs two fills of each anticholinergic', () => {
    const fills = [fill(0, 'oxybutynin'), fill(30, 'oxybutynin'), fill(0, 'amitriptyline')];
    expect(achStatus({ ...base, fills }, 273).state).toBe('clear');
  });
  it('flags a diabetes patient aged 40 to 75 with no statin', () => {
    const fills = [fill(0, 'metformin', 90), fill(90, 'metformin', 90)];
    expect(supdStatus({ ...base, fills }, 273).state).toBe('gap');
    expect(supdStatus({ ...base, age: 80, fills }, 273)).toBeNull();
  });
});

describe('member letters', () => {
  it('read at or below a sixth grade level', () => {
    for (const c of CHANGES_2027) {
      const text = memberNotice(c, 'Rosa').replace(/^Dear [^\n]+\n\n/, '');
      expect(fleschKincaid(text)).toBeLessThanOrEqual(6);
    }
  });
});
