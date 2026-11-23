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

## Real plan scores

CMS, *2027 Star Ratings Data Tables* (October 8, 2026), from the Part C and D performance data page.
https://www.cms.gov/medicare/health-drug-plans/part-c-d-performance-data
Zip: https://www.cms.gov/files/zip/2027-star-ratings-data-tables-oct-8-2026.zip (SHA-256 2704032d3f72e71a763aac075a8449e382ca07834417b1da53995b70d54e9967). The desk uses its Measure Data, Measure Stars, Summary Ratings and Part D Cut Points tables.

CMS, *2026 Star Ratings Data Tables*, for each contract's 2026 measure stars.
Zip: https://www.cms.gov/files/zip/2026-star-ratings-data-tables.zip (SHA-256 a72f4f4965239e12b3b264c843a71ea6bbd9c655547be5b1f95b3b0df4d1cde7).

`scripts/cms-derive.mjs` downloads both, checks the checksums and keeps only what the desk needs in `data/cms/star-ratings-2027-partd.json`: contract ID, MA-PD or PDP, the six Part D measure scores and stars, the 2025 disaster share and the 2026 stars. CMS renumbered the measures between years (SUPD was D12 in the 2026 ratings, and COB and Poly-ACH were not rated), so columns are matched by measure name.

- Of 735 contracts in the tables, 687 are MA-PD. 567 have a published score on at least one adherence measure, and 385 of those sat one whole point short of the next star on at least one of D08, D09 and D10.
- Scores are whole percents, and CMS assigns stars from them. The desk's star logic gives CMS's published star on 3,320 of 3,336 MA-PD contract scores across the six measures.
- The other 16 are all D08 scores at contracts with at least 25% of members in 2025 disaster areas. Under the extreme and uncontrollable circumstances policy, those contracts receive the higher of their 2026 or 2027 measure star (Technical Notes, page 9), and in all 16 the published star is the 2026 one.

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

The plan, members, names, prescribers, pharmacies, claims, copays, tiers and the January 2027 formulary changes are all made up. Drug names are real generics. Only the real plan scores in `data/cms` are real, and they are public.
