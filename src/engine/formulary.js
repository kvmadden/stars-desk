// January 1, 2027 formulary changes for the synthetic plan, and who they put at risk.
// The changes are this demo plan's, not any real plan's. The transition rule is federal:
// 42 CFR 423.120(b)(3) requires a temporary supply of at least a month within the first 90 days
// for drugs that leave the formulary or gain prior authorization or step therapy. A tier change
// alone does not qualify, so those members are pointed to an exception request instead.
import { ADHERENCE } from './measures.js';
import { targetFills } from './pdc.js';

export const CHANGES_2027 = [
  { drug: 'pitavastatin', measure: 'D10', change: 'Removed from the formulary', short: 'Removed', alternatives: ['atorvastatin', 'rosuvastatin'], switchNote: 'Moderate intensity: pitavastatin 2 to 4 mg is in the same band as atorvastatin 10 to 20 mg or rosuvastatin 5 to 10 mg (ACC/AHA 2018).' },
  { drug: 'telmisartan', measure: 'D09', change: 'Removed from the formulary', short: 'Removed', alternatives: ['losartan', 'valsartan'], switchNote: 'Same class (ARB). Prescriber picks the dose and rechecks blood pressure and potassium after the switch.' },
  { drug: 'candesartan', measure: 'D09', change: 'Moves from tier 3 to tier 4', short: 'Tier 3 to 4', alternatives: ['losartan'], switchNote: 'Same class (ARB). Staying on candesartan is fine if the member can afford tier 4.' },
  { drug: 'linagliptin', measure: 'D08', change: 'Prior authorization added', short: 'PA added', alternatives: ['sitagliptin'], switchNote: 'Same class (DPP-4). Sitagliptin needs a dose check against kidney function. Linagliptin does not, which can justify the PA.' },
  { drug: 'dapagliflozin', measure: 'D08', change: 'Moves from tier 3 to tier 4', short: 'Tier 3 to 4', alternatives: ['empagliflozin'], switchNote: 'Same class (SGLT2). Check the indication first: heart failure or kidney disease may favor staying put.' },
];

export const TIMELINE_2027 = [
  { date: 'Sep 30', label: 'Annual notice of change mailed' },
  { date: 'Oct to Dec', label: 'Switch or file an exception before January' },
  { date: 'Jan 1', label: 'Changes take effect' },
  { date: 'Jan 1 to Mar 31', label: 'Transition fill window for removals and new PA' },
  { date: 'After the fill', label: 'Gap risk if nothing changed' },
];

export function formularyImpact(members, asOf, statusFor) {
  const out = CHANGES_2027.map((c) => ({ ...c, members: [] }));
  const byDrug = new Map(out.map((c) => [c.drug, c]));
  for (const m of members) {
    for (const meas of Object.values(ADHERENCE)) {
      const tf = targetFills(meas, m.fills.filter((f) => f.day < asOf));
      const last = tf[tf.length - 1];
      if (!last) continue;
      const c = byDrug.get(last.ingredients[0]);
      if (!c || asOf - last.day > 120) continue;
      const s = statusFor ? statusFor(m, meas.id) : null;
      const margin = s && s.state === 'open' ? s.budget : null;
      const thin = s ? s.state === 'lost' || (margin != null && margin < 15) : false;
      c.members.push({ id: m.id, measure: meas.id, risk: thin ? 'high' : 'watch', margin, prescriber: last.prescriber });
    }
  }
  return out;
}

// Flesch-Kincaid grade, so the member notice can be held to a reading level.
export function fleschKincaid(text) {
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) || []).length);
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  const syl = words.reduce((s, w) => s + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / Math.max(1, words.length)) - 15.59;
}
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

export function memberNotice(change, firstName) {
  const alt = change.alternatives[0];
  return [
    `Dear ${firstName},`,
    `On January 1, your plan will change how it covers ${change.drug}. ${change.short === 'Removed' ? 'It will no longer be on our drug list.' : change.short === 'PA added' ? 'Your doctor will need to ask us to approve it first.' : 'It will cost more.'}`,
    `You do not need to stop taking it today. Please talk to your doctor before January.`,
    `Your doctor may switch you to ${alt}, which is covered. We have sent your doctor a note about this.`,
    change.short === 'Removed' || change.short === 'PA added'
      ? `If you still need ${change.drug} in January, we will cover a one-time supply of at least one month in the first 90 days. This gives you time to make a plan.`
      : `If the new cost is too high, your doctor can ask us for an exception.`,
    `Questions? Call the pharmacist line on the back of your card.`,
  ].join('\n\n');
}
