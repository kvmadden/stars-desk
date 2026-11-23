# Sources

Every number in the desk that is not synthetic comes from one of these.

## Measure rules, weights and cut points

These are the latest published cut points. The 2027 ratings are built on 2025 data. A 2026 measurement year feeds the 2028 ratings, whose cut points come out in fall 2027, so the 2027 numbers stand in for them. The 2028 adherence measures may also add risk adjustment.

CMS, *Medicare 2027 Part C & D Star Ratings Technical Notes*, last updated 11/04/2026.
https://www.cms.gov/files/document/2027-tech-notes-2026-09-30.pdf

| Measure | Weight | MA-PD cut points (2, 3, 4, 5 stars) | MA-PD average |
| --- | --- | --- | --- |
| D08 Medication Adherence for Diabetes Medications | 3 | 86, 89, 91, 93 | 89% |
| D09 Medication Adherence for Hypertension (RAS antagonists) | 3 | 84, 88, 90, 93 | 89% |
| D10 Medication Adherence for Cholesterol (Statins) | 3 | 84, 88, 90, 93 | 89% |
| D11 Statin Use in Persons with Diabetes (SUPD) | 1 | 83, 87, 90, 94 | 88% |
| D12 Concurrent Use of Opioids and Benzodiazepines (COB), lower is better | 1 | 20, 16, 12, 8 | 13% |
| D13 Polypharmacy: Use of Multiple Anticholinergic Medications in Older Adults (Poly-ACH), lower is better | 1 | 15, 11, 7, 5 | 9% |

Higher-is-better cut points are the lower bound for each star. Lower-is-better cut points are the upper bound (a rate at or below 8% earns 5 stars on COB). Measure scores are rounded to whole percents before cut points apply (Technical Notes, "Rounding Rules for Measure Scores").

From the same document:
- Adherence denominator: at least two fills on unique dates of service, a treatment period from the first fill to year end of at least 91 days, age 18 or older.
- Adherence exclusions: hospice, ESRD or dialysis, insulin (D08), sacubitril/valsartan (D09).
- PDC method (Attachment L): overlapping fills of the same generic ingredient shift forward, different ingredients do not, and inpatient and SNF stay days, discharge day included, leave both numerator and denominator.
- SUPD: ages 40 to 75, at least two diabetes fills, first fill at least 90 days before year end. Exclusions include hospice, ESRD, rhabdomyolysis and myopathy, pregnancy, lactation and fertility, cirrhosis, prediabetes and polycystic ovary syndrome.
- COB: at least two opioid fills and 15 days' supply, numerator needs two benzodiazepine fills and 30 cumulative days of overlap. Exclusions include hospice, cancer, sickle cell disease and palliative care. The synthetic plan models hospice and cancer only.
- The SUPD diabetes medication list includes insulin, unlike the D08 adherence list, so the desk counts insulin fills toward the SUPD denominator.
- Polypharmacy: Use of Multiple CNS-Active Medications in Older Adults (Poly-CNS) is a display measure in 2027, not a scored one, so the desk leaves it out.
- Poly-ACH: age 65 or older, two or more unique anticholinergic drugs, each with two fills, overlapping 30 cumulative days.

## Part D benefit, 2026

CMS, *Final CY 2026 Part D Redesign Program Instructions*: the 2026 annual out-of-pocket threshold is $2,100 and the maximum deductible is $615.
https://www.cms.gov/newsroom/fact-sheets/final-cy-2026-part-d-redesign-program-instructions

## Transition fills

42 CFR 423.120(b)(3): the transition process covers Part D drugs that are not on the formulary, or that need prior authorization or step therapy, including for current enrollees affected by formulary changes. It must provide a one-time temporary supply of at least an approved month's supply within the first 90 days. A tier change alone is not covered, so the member letter for a tier change points to an exception request instead.
https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-423/subpart-C/section-423.120

## Clinical references used in faxes and switch notes

- American Diabetes Association, *Standards of Care in Diabetes*, section 10 (cardiovascular disease and risk management): statin therapy for people with diabetes aged 40 to 75.
- CDC, *Clinical Practice Guideline for Prescribing Opioids for Pain*, 2022: caution with concurrent opioids and benzodiazepines, offer naloxone.
- American Geriatrics Society, *Beers Criteria*, 2023: minimize the number of drugs with strong anticholinergic properties in older adults.
- ACC/AHA 2018 cholesterol guideline: statin intensity bands used in the pitavastatin switch note.

## What is synthetic

The plan, members, names, prescribers, pharmacies, claims, copays, tiers and the January 2027 formulary changes are all made up. Drug names are real generics.
