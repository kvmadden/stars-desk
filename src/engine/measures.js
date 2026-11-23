// Part D measure definitions used by the desk.
// Source: CMS, Medicare 2027 Part C & D Star Ratings Technical Notes (last updated 11/04/2026),
// measures D08 to D13 and Attachment L. Cut points are the MA-PD rows. See docs/SOURCES.md.
// The 2027 ratings are built on 2025 data. A 2026 plan year feeds the 2028 ratings, whose cut points
// are not published yet, so the latest published cut points stand in for them.

export const YEAR = 2026;
export const YEAR_DAYS = 365; // 2026 is not a leap year
export const PDC_THRESHOLD = 0.8;
export const MIN_TREATMENT_DAYS = 91;

// Target ingredients at the generic name level. A subset of the PQA lists, enough for the synthetic plan.
export const ADHERENCE = {
  D08: {
    id: 'D08',
    short: 'Diabetes',
    label: 'Taking diabetes medication',
    weight: 3,
    higherIsBetter: true,
    cut: [86, 89, 91, 93], // percent needed for 2, 3, 4, 5 stars
    ingredients: [
      'metformin', 'glipizide', 'glimepiride', 'pioglitazone', 'sitagliptin', 'linagliptin',
      'empagliflozin', 'dapagliflozin', 'semaglutide', 'dulaglutide', 'tirzepatide', 'repaglinide',
    ],
    excludingIngredients: ['insulin glargine', 'insulin lispro', 'insulin aspart'],
    exclusionLabel: 'Insulin in the treatment period',
  },
  D09: {
    id: 'D09',
    short: 'Blood pressure',
    label: 'Taking blood pressure medication (RAS antagonists)',
    weight: 3,
    higherIsBetter: true,
    cut: [84, 88, 90, 93],
    ingredients: [
      'lisinopril', 'benazepril', 'enalapril', 'ramipril', 'losartan', 'valsartan', 'olmesartan',
      'irbesartan', 'telmisartan', 'candesartan', 'aliskiren',
    ],
    excludingIngredients: ['sacubitril'],
    exclusionLabel: 'Sacubitril/valsartan in the treatment period',
  },
  D10: {
    id: 'D10',
    short: 'Cholesterol',
    label: 'Taking cholesterol medication (statins)',
    weight: 3,
    higherIsBetter: true,
    cut: [84, 88, 90, 93],
    ingredients: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'lovastatin', 'pitavastatin'],
    excludingIngredients: [],
    exclusionLabel: null,
  },
};

export const SAFETY = {
  D11: {
    id: 'D11', short: 'Statins in diabetes', label: 'Statin use in persons with diabetes (SUPD)',
    weight: 1, higherIsBetter: true, cut: [83, 87, 90, 94],
  },
  D12: {
    id: 'D12', short: 'Opioids with benzos', label: 'Concurrent use of opioids and benzodiazepines (COB)',
    weight: 1, higherIsBetter: false, cut: [20, 16, 12, 8], // percent at or below which 2, 3, 4, 5 stars
  },
  D13: {
    id: 'D13', short: 'Two anticholinergics', label: 'Polypharmacy: multiple anticholinergic medications (Poly-ACH)',
    weight: 1, higherIsBetter: false, cut: [15, 11, 7, 5],
  },
};

export const ALL_MEASURES = { ...ADHERENCE, ...SAFETY };

// Star for a rate in percent. CMS displays whole percents, so rates are rounded first.
export function starFor(measure, ratePct) {
  const r = Math.round(ratePct);
  const c = measure.cut;
  if (measure.higherIsBetter) {
    let s = 1;
    for (let i = 0; i < c.length; i++) if (r >= c[i]) s = i + 2;
    return s;
  }
  // lower is better: >c0 is 1 star, (c1, c0] is 2 stars, ... <= c3 is 5 stars
  if (r > c[0]) return 1;
  if (r > c[1]) return 2;
  if (r > c[2]) return 3;
  if (r > c[3]) return 4;
  return 5;
}

// Members who must move to reach the next star. For higher-is-better this is extra numerator members.
// For lower-is-better it is members who must leave the numerator (for example a benzo tapered).
export function movesToNextStar(measure, numerator, denominator) {
  if (!denominator) return null;
  const star = starFor(measure, (100 * numerator) / denominator);
  if (star >= 5) return 0;
  if (measure.higherIsBetter) {
    const target = measure.cut[star - 1]; // percent needed for star + 1
    // smallest n with round(100 * n / d) >= target, i.e. 100 n / d >= target - 0.5
    const need = Math.ceil(((target - 0.5) * denominator) / 100);
    return Math.max(0, need - numerator);
  }
  const target = measure.cut[star - 1]; // must be <= target after rounding
  // largest n with round(100 n / d) <= target, i.e. 100 n / d < target + 0.5
  const maxN = Math.ceil(((target + 0.5) * denominator) / 100) - 1;
  return Math.max(0, numerator - maxN);
}
