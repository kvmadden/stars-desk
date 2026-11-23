// Part D safety measures as of a date: SUPD (D11), COB (D12) and Poly-ACH (D13).
// Definitions from the CMS 2027 Star Ratings Technical Notes. Only claims before asOf are used.
import { ADHERENCE, YEAR_DAYS } from './measures.js';
import { OPIOIDS, BENZOS, ANTICHOLINERGICS, ACH_SUGGEST } from './catalog.js';

const has = (f, list) => f.ingredients.some((i) => list.includes(i));

function daySet(fills, upTo) {
  const s = new Set();
  for (const f of fills) for (let d = f.day; d < Math.min(f.day + f.daysSupply, upTo); d++) s.add(d);
  return s;
}
const uniqueDates = (fills) => new Set(fills.map((f) => f.day)).size;

export function supdStatus(member, asOf) {
  const known = member.fills.filter((f) => f.day < asOf);
  const dm = known.filter((f) => has(f, ADHERENCE.D08.ingredients));
  if (member.age < 40 || member.age > 75 || uniqueDates(dm) < 2) return null;
  if (dm[0].day > YEAR_DAYS - 90) return null;
  if (member.hospice || member.esrd || member.safety.supdExcluded) return { state: 'excluded' };
  const statin = known.some((f) => has(f, ADHERENCE.D10.ingredients));
  if (statin) return { state: 'met' };
  const last = dm[dm.length - 1];
  return { state: 'gap', prescriber: last.prescriber, drug: last.ingredients[0] };
}

function concurrency(known, aList, bList, asOf) {
  const a = daySet(known.filter((f) => has(f, aList)), asOf);
  const b = daySet(known.filter((f) => has(f, bList)), asOf);
  let overlap = 0;
  for (const d of a) if (b.has(d)) overlap++;
  return overlap;
}

export function cobStatus(member, asOf) {
  const known = member.fills.filter((f) => f.day < asOf);
  const op = known.filter((f) => has(f, OPIOIDS));
  if (member.age < 18 || uniqueDates(op) < 2) return null;
  const opDays = op.reduce((s, f) => s + f.daysSupply, 0);
  if (opDays < 15 || op[0].day > YEAR_DAYS - 30) return null;
  if (member.hospice || member.safety.cancer) return { state: 'excluded' };
  const bz = known.filter((f) => has(f, BENZOS));
  if (uniqueDates(bz) < 2) return { state: 'clear' };
  const overlap = concurrency(known, OPIOIDS, BENZOS, asOf);
  const lastOp = op[op.length - 1];
  const lastBz = bz[bz.length - 1];
  const active = lastOp.day + lastOp.daysSupply >= asOf - 7 && lastBz.day + lastBz.daysSupply >= asOf - 7;
  const base = { overlap, active, opioid: lastOp.ingredients[0], benzo: lastBz.ingredients[0], prescribers: [...new Set([lastOp.prescriber, lastBz.prescriber])] };
  if (overlap >= 30) return { ...base, state: 'counted' };
  if (active) return { ...base, state: 'heading' };
  return { ...base, state: 'clear' };
}

export function achStatus(member, asOf) {
  if (member.age < 65) return null;
  const known = member.fills.filter((f) => f.day < asOf && has(f, ANTICHOLINERGICS));
  const byDrug = {};
  for (const f of known) (byDrug[f.ingredients[0]] = byDrug[f.ingredients[0]] || []).push(f);
  const qualifying = Object.entries(byDrug).filter(([, fs]) => uniqueDates(fs) >= 2);
  if (qualifying.length === 0) return null;
  if (member.hospice) return { state: 'excluded' };
  if (qualifying.length < 2) return { state: 'clear' };
  const [[d1, f1], [d2, f2]] = qualifying;
  const s1 = daySet(f1, asOf);
  const s2 = daySet(f2, asOf);
  let overlap = 0;
  for (const d of s1) if (s2.has(d)) overlap++;
  const active = [f1, f2].every((fs) => fs[fs.length - 1].day + fs[fs.length - 1].daysSupply >= asOf - 7);
  const base = { overlap, active, drugs: [d1, d2], prescribers: [...new Set([f1[f1.length - 1].prescriber, f2[f2.length - 1].prescriber])], suggestions: [d1, d2].map((d) => ({ drug: d, text: ACH_SUGGEST[d] })) };
  if (overlap >= 30) return { ...base, state: 'counted' };
  if (active) return { ...base, state: 'heading' };
  return { ...base, state: 'clear' };
}

// Plan-level rates as of the date, and the faxes worth sending, grouped by prescriber.
export function safetyBoard(members, asOf) {
  const counts = { D11: { den: 0, num: 0 }, D12: { den: 0, num: 0, heading: 0 }, D13: { den: 0, num: 0, heading: 0 } };
  const items = [];
  for (const m of members) {
    const s = supdStatus(m, asOf);
    if (s && s.state !== 'excluded') {
      counts.D11.den++;
      if (s.state === 'met') counts.D11.num++;
      else items.push({ measure: 'D11', member: m.id, prescriber: s.prescriber, detail: s });
    }
    const c = cobStatus(m, asOf);
    if (c && c.state !== 'excluded') {
      counts.D12.den++;
      if (c.state === 'counted') counts.D12.num++;
      if (c.state === 'heading') counts.D12.heading++;
      if (c.active) for (const p of c.prescribers) items.push({ measure: 'D12', member: m.id, prescriber: p, detail: c });
    }
    const a = achStatus(m, asOf);
    if (a && a.state !== 'excluded') {
      counts.D13.den++;
      if (a.state === 'counted') counts.D13.num++;
      if (a.state === 'heading') counts.D13.heading++;
      if (a.active) for (const p of a.prescribers) items.push({ measure: 'D13', member: m.id, prescriber: p, detail: a });
    }
  }
  const byPrescriber = {};
  for (const it of items) (byPrescriber[it.prescriber] = byPrescriber[it.prescriber] || []).push(it);
  return { counts, byPrescriber };
}
