# Stars Desk

A Part D Stars pharmacist's desk. It answers one question for a Medicare Advantage clinical pharmacy team on October 1: which members move the plan's star ratings, and what should we do about each one?

Everything runs on a synthetic plan of 6,000 members. No real member, claim or plan data is used. Measure rules, weights and cut points come from the CMS 2027 Star Ratings Technical Notes ([docs/SOURCES.md](docs/SOURCES.md)).

## What it does

- **Plan.** Forecasts where each Part D measure lands on December 31 and how many saves separate it from the next star, against the latest published cut points (2027 Star Ratings, standing in for the 2028 ratings that 2026 data feeds).
- **Call list.** Ranks members by expected saves. For each member it shows days covered so far, the gap budget left, the last day to refill, a likely barrier read from the claims and the fix to offer (a 90-day supply with auto-refill, one pharmacy with synced dates, a lower-cost option with Extra Help and the Medicare Prescription Payment Plan, or a clinical call about side effects). One call covers every adherence drug the member takes.
- **Judgment lanes.** Members who cannot reach 80% this year, new starts with one fill (a second fill adds them to the measure, so clinical need decides), and members whose claims show a therapy change (ask the prescriber, do not push a refill).
- **Safety faxes.** Statin use in diabetes, opioids with benzodiazepines and two anticholinergics, grouped into one fax per prescriber with a specific ask and references.
- **January changes.** Members hit by the plan's 2027 formulary changes, who has no room for a gap, a pharmacist switch note for the prescriber and a member letter held to a sixth grade reading level.

## How well it works

Scored by playing October 1 to December 31 forward on each plan, with and without 500 member calls, and counting members who finished at or above 80% because of a call.

| Call list | Development plans (5) | Held-out plans (3) |
| --- | --- | --- |
| Under 80%, lowest first | 2.2 per 100 calls | 2.5 |
| Most overdue first | 3.4 | 2.5 |
| Under 80%, closest to 80 first | 10.1 | 7.7 |
| Fewest missed days left first (strongest plain list) | 14.0 | 10.2 |
| Desk order, plain reminder call | 14.4 | 10.5 |
| **Desk order and matched fix** | **28.3** | **24.6** |

What carries the result is the fix, not the ordering. Against the list a capable adherence team already uses (skip members who cannot reach 80%, call those with the fewest missed days left first), the desk's ordering with a plain reminder is about even. Reading the barrier from the claims and offering the matching fix more than doubles the saves. Across 27 combinations of the call assumptions (reach, fix rate and how often a pharmacist finds the barrier on the phone), the full desk beat the strongest plain list in all 27 on both sets.

The held-out plans use new settings, written by a separate agent that never saw the desk's rules and hashed before the first run, on the same generator. The fewest-missed-days list was added after that run at an independent reviewer's request. The desk did not change, and its held-out numbers reproduced exactly. Because the barrier types are the generator's own, the barrier match rate (1,469 of 1,709 called member-drugs on held-out, 86%) is an upper bound.

The plans and the call effects are simulated. That makes this a test of the ranking and the fixes given those mechanics, not a measured result on real members. A pilot with real outreach logs would measure reach and fix rates directly.

The method, the assumptions and what this does not show are in [docs/METHOD.md](docs/METHOD.md).

## Run it

```bash
npm install
npm run build   # builds the synthetic plan's data, then the app
npm run dev     # prints a local address, open it
npm test        # PDC against the CMS worked examples, the rulebook, safety measures, the public text guard
```

`node eval/run-eval.mjs dev` reruns the development evaluation. The held-out evaluation has already run once and refuses to run again.

## Stack

React and Vite, plain JavaScript, Vitest. The engine in `src/engine` has no dependencies and is shared by the app, the data build and the evaluation.

## License

MIT
