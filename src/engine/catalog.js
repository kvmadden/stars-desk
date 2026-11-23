// Drug catalog for the synthetic plan. Tiers and copays are this demo plan's design, not any real plan's.
// Ingredient names follow the PQA target lists at the generic name level.
export const COPAY_30 = { 1: 0, 2: 5, 3: 47, 4: 105 };
export const OOP_CAP_2026 = 2100; // CMS, final CY 2026 Part D redesign program instructions

export const DRUGS = {
  // statins (D10)
  atorvastatin: { measure: 'D10', tier: 1, strengths: ['10 mg', '20 mg', '40 mg', '80 mg'] },
  rosuvastatin: { measure: 'D10', tier: 1, strengths: ['5 mg', '10 mg', '20 mg', '40 mg'] },
  simvastatin: { measure: 'D10', tier: 1, strengths: ['20 mg', '40 mg'] },
  pravastatin: { measure: 'D10', tier: 1, strengths: ['20 mg', '40 mg', '80 mg'] },
  lovastatin: { measure: 'D10', tier: 2, strengths: ['20 mg', '40 mg'] },
  pitavastatin: { measure: 'D10', tier: 3, strengths: ['2 mg', '4 mg'] },
  // RAS antagonists (D09)
  lisinopril: { measure: 'D09', tier: 1, strengths: ['10 mg', '20 mg', '40 mg'] },
  losartan: { measure: 'D09', tier: 1, strengths: ['25 mg', '50 mg', '100 mg'] },
  valsartan: { measure: 'D09', tier: 2, strengths: ['80 mg', '160 mg', '320 mg'] },
  olmesartan: { measure: 'D09', tier: 2, strengths: ['20 mg', '40 mg'] },
  irbesartan: { measure: 'D09', tier: 2, strengths: ['150 mg', '300 mg'] },
  telmisartan: { measure: 'D09', tier: 3, strengths: ['40 mg', '80 mg'] },
  benazepril: { measure: 'D09', tier: 1, strengths: ['10 mg', '20 mg', '40 mg'] },
  enalapril: { measure: 'D09', tier: 1, strengths: ['10 mg', '20 mg'] },
  ramipril: { measure: 'D09', tier: 2, strengths: ['5 mg', '10 mg'] },
  candesartan: { measure: 'D09', tier: 3, strengths: ['16 mg', '32 mg'] },
  // diabetes (D08)
  metformin: { measure: 'D08', tier: 1, strengths: ['500 mg', '1000 mg'] },
  glipizide: { measure: 'D08', tier: 1, strengths: ['5 mg', '10 mg'] },
  glimepiride: { measure: 'D08', tier: 1, strengths: ['2 mg', '4 mg'] },
  pioglitazone: { measure: 'D08', tier: 2, strengths: ['15 mg', '30 mg'] },
  sitagliptin: { measure: 'D08', tier: 3, strengths: ['100 mg'] },
  linagliptin: { measure: 'D08', tier: 3, strengths: ['5 mg'] },
  empagliflozin: { measure: 'D08', tier: 3, strengths: ['10 mg', '25 mg'] },
  dapagliflozin: { measure: 'D08', tier: 3, strengths: ['5 mg', '10 mg'] },
  semaglutide: { measure: 'D08', tier: 4, strengths: ['0.5 mg weekly', '1 mg weekly'] },
  dulaglutide: { measure: 'D08', tier: 4, strengths: ['1.5 mg weekly', '3 mg weekly'] },
  tirzepatide: { measure: 'D08', tier: 4, strengths: ['5 mg weekly', '10 mg weekly'] },
  repaglinide: { measure: 'D08', tier: 2, strengths: ['1 mg'] },
};

// Simulation mechanics only: the drug a cost fix moves a simulated member to. Never shown as advice.
// A real switch depends on the indication (an SGLT2 inhibitor for heart failure or kidney disease,
// Beers 2023 cautions on sulfonylureas in older adults), which the desk leaves to the prescriber.
export const LOWER_COST = {
  pitavastatin: ['atorvastatin', 'rosuvastatin'],
  lovastatin: ['atorvastatin', 'pravastatin'],
  telmisartan: ['losartan'],
  candesartan: ['losartan'],
  valsartan: ['losartan'],
  olmesartan: ['losartan'],
  irbesartan: ['losartan'],
  ramipril: ['lisinopril'],
  sitagliptin: ['glipizide', 'pioglitazone'],
  linagliptin: ['glipizide', 'pioglitazone'],
  empagliflozin: ['metformin dose review'],
  dapagliflozin: ['metformin dose review'],
  semaglutide: ['coverage review'],
  dulaglutide: ['coverage review'],
  tirzepatide: ['coverage review'],
  pioglitazone: ['glipizide'],
  repaglinide: ['glipizide'],
};

export const SWITCH_TARGETS = {
  D10: ['ezetimibe'], // non-statin, not a target drug
  D09: ['amlodipine'], // not a RAS antagonist
  D08: ['insulin glargine'], // insulin excludes the member from D08
};

// Safety measure drugs (subsets of the PQA lists).
export const OPIOIDS = ['oxycodone', 'hydrocodone/acetaminophen', 'tramadol', 'morphine ER'];
export const BENZOS = ['alprazolam', 'lorazepam', 'clonazepam', 'diazepam', 'temazepam'];
export const ANTICHOLINERGICS = ['oxybutynin', 'amitriptyline', 'paroxetine', 'hydroxyzine', 'cyclobenzaprine', 'meclizine', 'tolterodine', 'benztropine'];

export const ACH_SUGGEST = {
  oxybutynin: 'For overactive bladder, consider mirabegron, which is not anticholinergic, or behavioral measures.',
  tolterodine: 'For overactive bladder, consider mirabegron, which is not anticholinergic, or behavioral measures.',
  amitriptyline: 'If used for sleep or neuropathic pain, consider a non-anticholinergic option suited to the indication, with a gradual taper.',
  paroxetine: 'If an SSRI is still needed, consider sertraline or escitalopram, which carry less anticholinergic burden. Cross-taper to avoid discontinuation symptoms.',
  hydroxyzine: 'For itch, consider a non-sedating antihistamine. For anxiety, reassess the indication.',
  cyclobenzaprine: 'Reassess ongoing need. Muscle relaxants are poorly tolerated in older adults.',
  meclizine: 'Reassess ongoing need for daily use.',
  benztropine: 'Review the indication. If for antipsychotic side effects, consider whether the antipsychotic dose can change.',
};
