# Held-out world

Seeds for the held-out run: 9001, 9002, 9003. Parameters are in params.json, same shape as DEV_PARAMS.

This world stands for a plan in a lower-income, more rural region with a stronger mail-order benefit. Changes versus dev:

- Barrier mix: steady falls from 66 to 61 percent. Cost rises from 6 to 10 and logistics from 8 to 11, which fits members with tighter budgets who live farther from a pharmacy. Forgetful falls from 11 to 8 because the plan pushes auto-refill.
- Cost barrier members: 38 percent sit on low-tier drugs (dev 25). Many cost-strained members already take generics, so the drug tier says less about the barrier. Cost lateness mean drops to 10 days and the skip rate to 18 percent.
- Logistics: base lateness 5 days, with travel or supply spikes more often (26 percent) but shorter (11 days).
- Forgetful lateness mean drops to 6 days, a milder pattern than dev.
- Steady noise: 16 percent of steady members use several pharmacies (dev 8) and 18 percent run a few days late (dev 12). Steady lateness centers half a day late with a wider spread (sd 3), which fits members who refill when they happen to pass a pharmacy.
- Supply: 56 percent of fills are 90-day (dev 42) and 65 percent of those go by mail (dev 50), matching a plan with a mail-order copay incentive.
- Population: slightly higher condition prevalence, more new starts (16 percent), more hospital stays (8 percent), and a little more hospice, ESRD and sacubitril use, which fits an older, sicker membership.
- Side effect members can stop after up to 5 fills (dev 4).
- Safety: a bit more opioid and anticholinergic use, and more people with diabetes without a statin (26 percent).

Sanity check, seed 9001, share with PDC at least 80 percent: diabetes 91.9, RAS antagonists 89.2, statins 89.2. All three seeds sit between 89 and 92 percent, inside the range real plans report.
