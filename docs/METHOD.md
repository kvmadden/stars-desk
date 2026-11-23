# Method

## The question

It is October 1. A Medicare Advantage plan has a small clinical pharmacy team and three months left in the measurement year. Who should they call, and what should they say, so the most members finish the year at or above 80% proportion of days covered?

## What the desk does

1. **Status.** For each member and adherence measure, it computes PDC to date the way the CMS Technical Notes describe it (same-ingredient overlap shifts forward, stay days leave both sides), then the gap budget: how many more uncovered days the member can have and still finish at 80%. That gives a last day to fill.
2. **Lanes.** Members who can no longer reach 80% go to "Lost for 2026", since a call cannot change their rating, but it can still change their health. Members with one fill go to "New starts", because a second fill brings them into the denominator and clinical need should decide that, not the rating. Members whose claims show a different drug after the last fill go to "Ask the prescriber", because pushing a refill on a stopped drug is the wrong call.
3. **Barrier guess.** A short rulebook reads the claims a pharmacist would read: lateness per refill, copay, number of pharmacies, a short run followed by a long stop, a switch to a non-target drug. It names a likely barrier and a fix (90-day supply with auto-refill, one pharmacy and synced dates, a lower-cost option with Extra Help and the Medicare Prescription Payment Plan, a clinical call about side effects).
4. **Ranking.** A simple model estimates the chance each member misses 80% without help, multiplies by the chance a matched call fixes it, weights by the measure (adherence measures count triple), and sums across the member's drugs, since one call covers all of them. The top 500 are called in order of the earliest deadline.

The desk never reads the hidden barrier. A test checks that ranking is identical with the hidden fields removed.

## How it is scored

The synthetic plan gives every member a hidden barrier that drives their refills. The evaluation plays October 1 to December 31 twice for each plan: once with no calls, once with a call list. Both runs share the same random draws until the call day, so any difference comes from the call.

A call reaches the member 60% of the time. If the delivered fix matches the hidden barrier, it changes refill behavior 55% of the time. If it does not match, the pharmacist still finds the real barrier on the phone 35% of the time, and otherwise the call works like a reminder 25% of the time. A member who switched therapy cannot be saved by any call.

Those numbers are assumptions, so the score is repeated over a grid of 27 combinations (reach 40, 60 or 80%, fix rate 30, 55 or 80%, discovery 0, 35 or 70%).

Five call lists are compared at 500 calls each:
- **Under 80%, lowest first**: everyone below 80% PDC today, worst first.
- **Most overdue first**: everyone past their run-out date, longest first.
- **Under 80%, closest to 80 first**: the strongest plain list.
- **Desk order, plain reminder call**: the desk's ranking with no fix, to separate the ranking from the fix.
- **Desk order and matched fix**: the full desk.

The score is members who finished at or above 80% because of a call, per 100 calls.

## Development and held-out

The rules and the miss model were written against development plans (seeds 101 to 105). One tuning step used seeds 101 to 103: an offset in the miss model so predicted and actual miss rates line up (checked by `eval/calibration-dev.mjs`). The app shows seed 201, a plan with development settings that no tuning touched.

The held-out plan settings were written by a separate agent that was told not to read the desk's rules. It changed the barrier mix, made signals noisier (steady members using several pharmacies, cost-barrier members on low-tier drugs), changed lateness patterns and leaned the plan toward 90-day mail order. The settings were hashed in `eval/holdout/FREEZE.json` before the first run, and `eval/run-eval.mjs holdout` refuses to run twice. (FREEZE.json names the script `eval/run-holdout.mjs`. The script that ran is `eval/run-eval.mjs holdout`. The record is left as written.)

Held-out means new settings for the same generator, not a new generator. The barrier types the rulebook reads are the generator's own types, so the barrier match rate is an upper bound on what real claims would give.

**Amendment.** After the held-out run, an independent review asked for one more comparison list: members who can still reach 80%, fewest allowable missed days first. That is how a capable adherence team already sorts. The desk did not change. `eval/holdout-amendment.mjs` scores only that list on the frozen plans and confirms the desk's held-out numbers reproduce exactly.

## Version 2

The independent review pointed out that version 1 plans made the "therapy changed" rule look better than real claims would, since ezetimibe and amlodipine only appeared after a true switch. Version 2 plans add add-on therapy in members who never switched, members with two barriers at once (refill routine and cost), and members whose barrier no fix reaches. The switch rule now needs a new non-target drug and a stop of more than two weeks. A new held-out plan set was written by a separate agent, hashed in `eval/holdout2/FREEZE.json` and scored once with `node eval/run-eval.mjs holdout2`. Version 2 is the headline result. Version 1 stays on record.

## What this does and does not show

It shows that, given these refill mechanics, triage by deadline and gap budget beats the plain lists, and that guessing the barrier from claims adds more on top. It does not show real reach or fix rates. Those come from a pilot with outreach logs, which is the first thing to measure.

The plan is synthetic and so is the barrier model, so a clean held-out result is necessary but not sufficient.

## Known limits

- The rulebook names one barrier per drug. Version 2 members can have two, or one no fix reaches, and the barrier match drops to 55% on held-out. A second-barrier prompt in the call script is the next rule to add.
- Days since run-out ignores supply carried forward from early refills.
- Safety rates are part-year, compared against full-year cut points.
- The synthetic plan models hospice and cancer for COB, not sickle cell disease or palliative care.
