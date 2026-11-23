// Synthetic Part D plan generator. Every member, claim and prescriber here is made up.
// Each member carries a hidden barrier (what really drives their refills). The desk never reads it.
// The evaluation uses it to play the rest of the year forward, with and without a pharmacist call.
import { mulberry32, hashSeed, pick, weighted, normal, expo } from './rng.js';
import { DRUGS, COPAY_30, OOP_CAP_2026, SWITCH_TARGETS, OPIOIDS, BENZOS, ANTICHOLINERGICS, LOWER_COST } from './catalog.js';
import { YEAR_DAYS } from './measures.js';

export const DEV_PARAMS = {
  name: 'dev',
  members: 6000,
  archetypes: { steady: 0.66, forgetful: 0.11, cost: 0.06, sideEffect: 0.05, logistics: 0.08, switched: 0.04 },
  prevalence: { D10: 0.62, D09: 0.55, D08: 0.32 },
  newStart: 0.12,
  ninetyDay: 0.42,
  mailGivenNinety: 0.5,
  stay: 0.05,
  hospice: 0.012,
  esrd: 0.01,
  sacubitril: 0.03,
  late: {
    steady: { mean: 0, sd: 2.5 },
    forgetful: { mean: 7.5 },
    cost: { mean: 13, skip: 0.25 },
    logistics: { mean: 4, spike: 0.2, spikeMean: 14 },
  },
  quitAfterMax: 4,
  noise: { steadyMultiPharmacy: 0.08, steadyLate: 0.12, costOnLowTier: 0.25 },
  safety: { opioid: 0.05, benzoGivenOpioid: 0.14, achGiven65: 0.14, secondAch: 0.12, noStatinGivenDiabetes: 0.1 },
};

const FIRST = ['Mary', 'James', 'Linda', 'Robert', 'Patricia', 'John', 'Barbara', 'William', 'Carol', 'Richard', 'Susan', 'Thomas', 'Dorothy', 'Charles', 'Nancy', 'Joseph', 'Betty', 'Donald', 'Sandra', 'Ronald', 'Margaret', 'Kenneth', 'Sharon', 'Gary', 'Judith', 'Larry', 'Joyce', 'Frank', 'Gloria', 'Raymond', 'Rosa', 'Luis', 'Maria', 'Jose', 'Mei', 'Wei', 'Anh', 'Minh', 'Fatima', 'Ahmed', 'Gwen', 'Earl', 'Delores', 'Walter', 'Yolanda', 'Harold', 'Bernice', 'Carlos', 'Elena', 'Hector'];
const LAST = ['Alvarez', 'Bennett', 'Coleman', 'Duarte', 'Ellison', 'Fontaine', 'Garrity', 'Holloway', 'Ibarra', 'Jansen', 'Kowalski', 'Lindqvist', 'Mercado', 'Nakamura', 'Okafor', 'Pellegrino', 'Quintero', 'Rasmussen', 'Salgado', 'Thibodeaux', 'Underwood', 'Valdez', 'Whitfield', 'Xiong', 'Yarbrough', 'Zielinski', 'Abernathy', 'Brannigan', 'Castellano', 'Delacroix', 'Esposito', 'Fairbanks', 'Grummond', 'Haverford', 'Iverson', 'Jessup', 'Kincaid', 'Lockhart', 'Moreau', 'Nguyen', 'Oyelaran', 'Prewitt', 'Rinaldi', 'Stroud', 'Tremblay', 'Vance', 'Wexler', 'Yoder', 'Zamora', 'Pruitt'];
const PRACTICES = ['Bayview Family Medicine', 'Harbor Internal Medicine', 'Cypress Primary Care', 'Northgate Medical Group', 'Riverside Geriatrics', 'Palmetto Health Partners', 'Lakeshore Endocrinology', 'Seaside Cardiology', 'Oak Hollow Clinic', 'Gulf Coast Physicians'];
const PHARMACIES = ['Corner Pharmacy #12', 'Main Street Drug', 'Harbor Pharmacy', 'Westside Rx', 'Neighborhood Apothecary', 'Grove Pharmacy', 'Parkway Drug', 'Sunrise Pharmacy', 'Village Rx', 'Coastal Pharmacy'];
const MAIL = 'Plan mail service';

export function generateWorld(seed, params = DEV_PARAMS) {
  const rng = mulberry32(seed);
  const prescribers = Array.from({ length: 140 }, (_, i) => ({
    id: `P-${String(1000 + i)}`,
    name: `Dr. ${pick(rng, FIRST)} ${pick(rng, LAST)}`,
    practice: pick(rng, PRACTICES),
  }));
  const members = [];
  for (let i = 0; i < params.members; i++) members.push(makeMember(seed, i, params, rng, prescribers));
  return { seed, params: params.name, prescribers, members };
}

function makeMember(seed, i, P, rng, prescribers) {
  const id = `M-${String(20000 + i)}`;
  const older = rng() < 0.86;
  const age = Math.round(older ? normal(rng, 75, 6) : normal(rng, 56, 6));
  const archetype = weighted(rng, Object.entries(P.archetypes));
  const m = {
    id,
    name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
    age: Math.max(40, Math.min(97, age)),
    pcp: pick(rng, prescribers).id,
    hospice: rng() < P.hospice,
    esrd: rng() < P.esrd,
    stays: [],
    fills: [],
    hidden: { archetype, plans: {} },
  };
  if (rng() < P.stay) {
    const s = Math.floor(rng() * 300);
    m.stays.push({ start: s, end: s + 2 + Math.floor(expo(rng, 5)) });
  }
  const diabetes = rng() < P.prevalence.D08;
  const onStatin = diabetes ? rng() > P.safety.noStatinGivenDiabetes : rng() < P.prevalence.D10 * 0.9;
  const onRas = rng() < (diabetes ? 0.7 : P.prevalence.D09);
  const measures = [];
  if (diabetes) measures.push('D08');
  if (onStatin) measures.push('D10');
  if (onRas) measures.push('D09');
  if (measures.length === 0) measures.push(pick(rng, ['D10', 'D09']));
  // sideEffect and switched hit one measure, the rest of the member's drugs follow a steady pattern
  const special = archetype === 'sideEffect' || archetype === 'switched' ? pick(rng, measures) : null;
  const pharmacy = pick(rng, PHARMACIES);
  for (const meas of measures) {
    const a = special ? (meas === special ? archetype : 'steady') : archetype;
    const plan = makePlan(seed, id, meas, a, P, rng, pharmacy, m.pcp, prescribers);
    m.hidden.plans[meas] = plan;
  }
  if (diabetes && rng() < 0.18) m.hidden.plans.D08.insulinFrom = Math.floor(rng() * 330);
  if (onRas && rng() < P.sacubitril) m.hidden.plans.D09.sacubitrilFrom = Math.floor(rng() * 300);
  // Projected yearly out-of-pocket, to find the day the member would reach the $2,100 cap.
  const monthly = Object.values(m.hidden.plans).reduce((s, p) => s + COPAY_30[p.tier], 0);
  m.capDay = monthly > 0 ? Math.min(YEAR_DAYS + 1, Math.ceil((OOP_CAP_2026 / monthly) * 30.4)) : YEAR_DAYS + 1;
  m.safety = makeSafety(rng, m, P, prescribers);
  return m;
}

function makePlan(seed, id, meas, a, P, rng, pharmacy, pcp, prescribers) {
  const pool = Object.entries(DRUGS).filter(([, d]) => d.measure === meas);
  let drug;
  if (a === 'cost' && rng() > P.noise.costOnLowTier) {
    const brand = pool.filter(([n, d]) => d.tier >= 3 && (n !== 'pitavastatin' || rng() < 0.5));
    drug = pick(rng, brand.length ? brand : pool)[0];
  } else {
    drug = weighted(rng, pool.map(([n, d]) => [n, (d.tier === 1 ? 6 : d.tier === 2 ? 2 : d.tier === 3 ? 1.2 : 0.8) * (n === 'pitavastatin' ? 0.3 : 1)]));
  }
  const ninety = a !== 'sideEffect' && rng() < P.ninetyDay;
  const mail = ninety && rng() < P.mailGivenNinety;
  const pharmacies = a === 'logistics' || (a === 'steady' && rng() < P.noise.steadyMultiPharmacy)
    ? [pharmacy, pick(rng, PHARMACIES.filter((p) => p !== pharmacy)), ...(rng() < 0.4 ? [MAIL] : [])]
    : [mail ? MAIL : pharmacy];
  const newStart = a === 'sideEffect' ? rng() < 0.7 : rng() < P.newStart;
  const prescriber = rng() < 0.75 ? pcp : pick(rng, prescribers).id;
  return {
    measure: meas,
    archetype: a,
    lateTweak: a === 'steady' && rng() < P.noise.steadyLate ? 4 : 0,
    drug,
    strength: pick(rng, DRUGS[drug].strengths),
    tier: DRUGS[drug].tier,
    ds: ninety ? 90 : 30,
    pharmacies,
    prescriber,
    newStart,
    start: newStart ? Math.floor(rng() * 290) : Math.floor(rng() * (ninety ? 85 : 28)),
    quitAfter: 1 + Math.floor(rng() * P.quitAfterMax),
    switchDay: 110 + Math.floor(rng() * 160),
    seed: hashSeed(seed, id, meas),
  };
}

// The lateness (days past run-out) of one refill under a regime. u holds three uniforms drawn per step,
// so the same random stream serves every arm of the evaluation.
function lateness(regime, plan, P, u, copay) {
  const n = Math.sqrt(-2 * Math.log(Math.max(1e-12, u[0]))) * Math.cos(2 * Math.PI * u[1]);
  const ex = (mean) => -mean * Math.log(Math.max(1e-12, 1 - u[2]));
  switch (regime) {
    case 'steady':
      return Math.max(-7, Math.round(P.late.steady.mean + plan.lateTweak + P.late.steady.sd * n));
    case 'forgetful':
      return Math.max(-2, Math.round(ex(P.late.forgetful.mean) + 1.5 * n));
    case 'cost':
      if (copay < 20) return Math.max(-5, Math.round(2 + 3 * n));
      return Math.round(ex(P.late.cost.mean)) + (u[1] < P.late.cost.skip ? 30 : 0);
    case 'logistics':
      return Math.max(-3, Math.round(ex(P.late.logistics.mean))) + (u[0] < P.late.logistics.spike ? Math.round(P.late.logistics.spikeMean + 4 * n) : 0);
    case 'once':
      return Math.max(-3, Math.round(1.5 * n));
    default:
      return Math.max(-7, Math.round(P.late.steady.mean + P.late.steady.sd * n));
  }
}

// Generate one member-measure's fills for the whole year.
// intervention: { day, effect } where effect is steady | ninety | costfix | restart | once | none.
// Draws before the call day are identical with or without an intervention (common random numbers).
export function planFills(member, plan, P, intervention = null) {
  const rng = mulberry32(plan.seed);
  const side = mulberry32(plan.seed ^ 0x9e3779b9);
  const fills = [];
  const base = plan.archetype === 'sideEffect' || plan.archetype === 'switched' ? 'steady' : plan.archetype;
  let regime = base;
  let ds = plan.ds;
  let drug = plan.drug;
  let tier = plan.tier;
  let day = plan.start;
  let count = 0;
  let stopped = false;
  let restarted = false;
  let onceNext = false;
  const iv = intervention && intervention.effect !== 'none' ? intervention : null;
  let applied = false;
  const endFor = plan.archetype === 'switched' ? plan.switchDay : YEAR_DAYS;
  let last = null;
  for (let guard = 0; guard < 80; guard++) {
    if (iv && !applied && (stopped || day >= iv.day) && iv.day < endFor) {
      applied = true;
      const e = iv.effect;
      const prompt = iv.day + Math.floor(side() * 4);
      if (stopped) {
        if (e === 'restart') {
          stopped = false;
          restarted = true;
          regime = 'steady';
          const alt = Object.keys(DRUGS).find((x) => DRUGS[x].measure === plan.measure && x !== drug && DRUGS[x].tier <= 2);
          if (alt) { drug = alt; tier = DRUGS[alt].tier; }
          day = iv.day + 7 + Math.floor(side() * 8);
        } else if (e === 'once') {
          fills.push(fill(prompt));
          break;
        }
      } else {
        if (e === 'steady' || e === 'restart') regime = 'steady';
        if (e === 'ninety') { regime = 'steady'; ds = 90; }
        if (e === 'costfix') {
          regime = 'steady';
          const alt = (LOWER_COST[drug] || []).find((x) => DRUGS[x]);
          if (alt) { drug = alt; tier = DRUGS[alt].tier; } else tier = Math.min(tier, 2);
        }
        if (e === 'once') onceNext = true;
        const out = last ? last.day + last.daysSupply : 0;
        if (out <= iv.day) day = prompt;
        else if (e !== 'once') day = Math.max(iv.day, last.day + last.daysSupply + lateness(regime, plan, P, [side(), side(), side()], 0));
        else day = Math.max(iv.day, out + Math.round(side() * 2));
      }
    }
    if (stopped || day >= endFor || day >= YEAR_DAYS) break;
    const f = fill(day);
    fills.push(f);
    last = f;
    count++;
    if (plan.archetype === 'sideEffect' && count >= plan.quitAfter && !restarted) { stopped = true; continue; }
    const u = [rng(), rng(), rng()];
    const r = onceNext ? 'once' : regime;
    onceNext = false;
    day = Math.max(day + 1, day + ds + lateness(r, plan, P, u, f.copay));
  }
  function fill(d) {
    const capped = d >= member.capDay;
    return {
      day: d, ingredients: [drug], daysSupply: ds, copay: capped ? 0 : COPAY_30[tier] * (ds / 30),
      pharmacy: plan.pharmacies[fills.length % plan.pharmacies.length], prescriber: plan.prescriber,
      strength: drug === plan.drug ? plan.strength : '', measure: plan.measure,
    };
  }
  // Non-target follow-on therapy after a switch, so the claims show what happened.
  if (plan.archetype === 'switched') {
    const to = SWITCH_TARGETS[plan.measure][0];
    for (let d = plan.switchDay; d < YEAR_DAYS; d += 30) fills.push({ day: d, ingredients: [to], daysSupply: 30, copay: 0, pharmacy: plan.pharmacies[0], prescriber: plan.prescriber, strength: '', measure: null });
  }
  if (plan.insulinFrom != null) for (let d = plan.insulinFrom; d < YEAR_DAYS; d += 30) fills.push({ day: d, ingredients: ['insulin glargine'], daysSupply: 30, copay: 0, pharmacy: plan.pharmacies[0], prescriber: plan.prescriber, strength: '', measure: null });
  if (plan.sacubitrilFrom != null) fills.push({ day: plan.sacubitrilFrom, ingredients: ['sacubitril', 'valsartan'], daysSupply: 30, copay: 47, pharmacy: plan.pharmacies[0], prescriber: plan.prescriber, strength: '49/51 mg', measure: null });
  return fills;
}

function makeSafety(rng, m, P, prescribers) {
  const s = { opioid: null, benzo: null, ach: [] };
  if (rng() < P.safety.opioid) {
    const start = Math.floor(rng() * 250);
    s.opioid = { drug: pick(rng, OPIOIDS), start, fills: chronic(rng, start), ds: 30, prescriber: pick(rng, prescribers).id };
    if (rng() < P.safety.benzoGivenOpioid) {
      s.benzo = { drug: pick(rng, BENZOS), start: Math.max(0, start + Math.floor(normal(rng, 0, 40))), fills: chronic(rng, start), ds: 30, prescriber: pick(rng, prescribers).id };
    }
  }
  if (m.age >= 65 && rng() < P.safety.achGiven65) {
    const a1 = pick(rng, ANTICHOLINERGICS);
    s.ach.push({ drug: a1, start: Math.floor(rng() * 200), fills: 0, ds: 30, prescriber: pick(rng, prescribers).id });
    if (rng() < P.safety.secondAch) {
      const a2 = pick(rng, ANTICHOLINERGICS.filter((x) => x !== a1));
      s.ach.push({ drug: a2, start: Math.floor(rng() * 260), fills: 0, ds: 30, prescriber: pick(rng, prescribers).id });
    }
  }
  for (const a of s.ach) a.fills = chronic(rng, a.start);
  s.cancer = rng() < 0.04;
  s.supdExcluded = rng() < 0.06; // rhabdomyolysis, myopathy, cirrhosis, prediabetes and the other SUPD exclusions
  return s;
}

// Most safety-measure drugs are taken long term. Some stop after a few months.
function chronic(rng, start) {
  return rng() < 0.6 ? Math.ceil((YEAR_DAYS - start) / 30) : 2 + Math.floor(rng() * 5);
}

export function safetyFills(m) {
  const out = [];
  const add = (x, cls) => {
    if (!x) return;
    for (let k = 0; k < x.fills; k++) {
      const d = x.start + k * x.ds;
      if (d < YEAR_DAYS) out.push({ day: d, ingredients: [x.drug], daysSupply: x.ds, copay: 0, pharmacy: 'Harbor Pharmacy', prescriber: x.prescriber, strength: '', measure: cls });
    }
  };
  add(m.safety.opioid, 'opioid');
  add(m.safety.benzo, 'benzo');
  for (const a of m.safety.ach) add(a, 'ach');
  return out;
}

// Build the realized full year under no intervention, or under interventions keyed by measure.
export function realizeFills(m, P, interventions = {}) {
  const fills = [];
  for (const [meas, plan] of Object.entries(m.hidden.plans)) fills.push(...planFills(m, plan, P, interventions[meas] || null));
  fills.push(...safetyFills(m));
  return fills.sort((a, b) => a.day - b.day);
}

export function buildWorld(seed, params = DEV_PARAMS) {
  const w = generateWorld(seed, params);
  for (const m of w.members) m.fills = realizeFills(m, params);
  return w;
}
