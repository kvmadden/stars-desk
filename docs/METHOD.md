# Method

## The question

It is October 1. A Medicare Advantage plan has a small clinical pharmacy team and three months left in the measurement year. Who should they call, and what should they say, so the most members finish the year at or above 80% proportion of days covered?

## What the desk does

1. **Status.** For each member and adherence measure, it computes PDC to date the way the CMS Technical Notes describe it (same-ingredient overlap shifts forward, stay days leave both sides). Then it works out how many more uncovered days the member can have and still finish at 80%, which gives a last day to refill. This part is pure CMS arithmetic on the claims.
2. **Lanes.** Members who can no longer reach 80% go to "Lost for 2026", since a call cannot change their rating, but it can still change their health. Members with one fill go to "New starts", because a second fill brings them into the denominator and clinical need should decide that, not the rating. Members whose claims show a new non-target drug and a stop of more than two weeks go to "Ask the prescriber", because pushing a refill on a stopped drug is the wrong call.
3. **Barrier guess.** A short pharmacist rulebook reads the claims: lateness per refill, copay, number of pharmacies, a short run followed by a long stop, a switch to a non-target drug. It names a likely barrier and a fix (a 90-day supply with auto-refill, one pharmacy with synced dates, a lower-cost option and an Extra Help check, a clinical call about side effects).
4. **Ranking.** A rule of thumb estimates the chance each member misses 80% without help, from their own refill lateness against the days they can still miss. It multiplies that by a planning guess of how often a matched call fixes each barrier, weights by the measure (adherence measures count triple), and sums across the member's drugs, since one call covers all of them. The top 500 are called in order of the earliest last day to refill.

The ranking weights and the projection are planning guesses. The projection's one tuned constant was set during development on simulated plans. A pilot measures both.

## How a pilot would prove it

The desk makes no outcome claim before a pilot.

- **Population.** On October 1, members who can still reach 80% on at least one adherence measure.
- **Design.** Randomize members into two arms with equal call capacity. Arm A: the team's current list and script. Arm B: the desk's list and matched fix. Both arms keep the plan's standard refill reminders. Pharmacists can override the list, and no member is denied a clinical call.
- **Main outcome.** Share of each arm at or above 80% PDC on December 31, computed with the CMS rules on the plan's own claims once December claims settle.
- **Other outcomes.** Saves per 100 calls. Reach rate. How often the desk's barrier guess matched the barrier the pharmacist found on the call (the first real test of the rulebook). How close the year-end projection came for the arm-A members.
- **Logging.** Every call records reached or not, the barrier found, the fix offered and accepted, and a follow-up date. The app's Log call outcome button captures these.
- **Sizing and decision.** Before the first call, size the arms from the plan's own prior-year rate for members like these, and set the smallest difference that would justify adopting the desk. If the desk arm does not clear it, the barrier log shows whether the ranking or the fix fell short.
- **Timeline.** Calls in October, readout in February.

## The simulator

`eval/` holds a simulator built during development. It generates synthetic plans whose members each carry a hidden barrier, plays October 1 to December 31 forward with and without calls, and counts who finishes at 80%.

It is a logic check, not evidence:
- **Its effect sizes are assumptions.** A call reaches the member 60% of the time, a matched fix works 55% of the time and otherwise acts as a reminder, a pharmacist finds the real barrier on the phone 35% of the time, and a plain call works as a reminder 25% of the time. None of these rates come from a study.
- **Its barriers are the rulebook's own types.** The generator plants the signals the rules read (high copays on cost-barrier members, for example), so a high match rate is expected by construction.
- **Its sensitivity grid never tested a world where a matched fix works no better than a reminder.**

So any advantage the desk shows in the simulator mostly restates those assumptions. What the simulator does show is that the code behaves as designed: the desk never reads hidden fields or later claims, lanes route members the way the rules say, and nothing breaks on harder plans (add-on therapy that looks like a switch, members with two barriers, members no fix reaches). Its outputs in `eval/results` are kept as a record of development, and nothing in the README or the app quotes them as results.

## Known limits

- No outcome evidence yet. The pilot is how to get it.
- The rulebook names one barrier per drug and has not been checked against real calls.
- Days since run-out ignores supply carried forward from early refills.
- Safety rates are part-year, compared against full-year cut points.
- The synthetic plan models hospice and cancer for COB, not sickle cell disease or palliative care.
