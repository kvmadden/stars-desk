// Real plans from CMS's public 2027 Star Ratings data tables (data/cms/star-ratings-2027-partd.json):
// where Medicare Advantage drug plans (MA-PD contracts) scored on the six Part D measures the desk uses.
// Scores are whole percents as CMS published them, and CMS assigns stars from those whole percents.
import { ALL_MEASURES, starFor } from './measures.js';

export const ADHERENCE_IDS = ['D08', 'D09', 'D10'];

const at = (data, id) => data.measures.indexOf(id);
const maPd = (data) => data.contracts.filter((c) => c.org === 'MA-PD');

// Whole points between a score and the next star, or null at 5 stars.
export function pointsToNextStar(measure, score) {
  const s = starFor(measure, score);
  if (s >= 5) return null;
  const next = measure.cut[s - 1];
  return measure.higherIsBetter ? next - Math.round(score) : Math.round(score) - next;
}

// [score, plans] pairs for one measure, MA-PD contracts with a published score only.
export function histogram(data, id) {
  const i = at(data, id);
  const counts = new Map();
  for (const c of maPd(data)) {
    const s = c.score[i];
    if (s != null) counts.set(s, (counts.get(s) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]);
}

export function measureSummary(data, id) {
  const measure = ALL_MEASURES[id];
  const hist = histogram(data, id);
  const scores = hist.flatMap(([s, n]) => Array(n).fill(s));
  const oneAway = hist.filter(([s]) => pointsToNextStar(measure, s) === 1).reduce((t, [, n]) => t + n, 0);
  return { id, plans: scores.length, median: scores[Math.floor(scores.length / 2)], oneAway, hist };
}

// How many MA-PD plans were exactly one point from the next star on at least one adherence measure.
export function oneAwaySummary(data, ids = ADHERENCE_IDS) {
  let plans = 0;
  let oneAway = 0;
  for (const c of maPd(data)) {
    const scored = ids.filter((id) => c.score[at(data, id)] != null);
    if (!scored.length) continue;
    plans++;
    if (scored.some((id) => pointsToNextStar(ALL_MEASURES[id], c.score[at(data, id)]) === 1)) oneAway++;
  }
  return { plans, oneAway };
}

// Does the desk's star logic give the star CMS published? Contracts with at least 25% of members in
// 2025 disaster areas keep the higher of their 2026 or 2027 measure star (Technical Notes, page 9),
// so a difference there is explained only when the published star is the 2026 one and it is higher.
export function starCheck(data) {
  const out = { checked: 0, reproduced: 0, heldAt2026: [], unexplained: [] };
  for (const c of maPd(data)) {
    data.measures.forEach((id, i) => {
      const score = c.score[i];
      const published = c.star[i];
      if (score == null || published == null) return;
      out.checked++;
      const ours = starFor(ALL_MEASURES[id], score);
      if (ours === published) out.reproduced++;
      else if (c.disaster2025 >= 25 && c.star2026[i] === published && published > ours) out.heldAt2026.push({ id: c.id, measure: id, score, published, ours });
      else out.unexplained.push({ id: c.id, measure: id, score, published, ours });
    });
  }
  return out;
}
