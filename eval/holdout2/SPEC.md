# Held-out world v2 ("holdout-v2")

Seeds: 9101, 9102, 9103. Members: 6000. Written without reading the desk or the eval code.

What changed versus DEV_PARAMS_V2, and why each is plausible:

- Barrier mix: steady drops from 0.63 to 0.55. Mixed and unexplained each double to 0.06, and forgetful (0.11), cost (0.06) and logistics (0.07) rise slightly. A plan with more low-income or dual-eligible members sees more tangled barriers.
- Steady members are noisier: lateness mean 0.5 days with sd 3, steadyLate 0.18 and steadyMultiPharmacy 0.12. Real "good" refillers drift and shop around.
- Lateness by regime: forgetful mean 8.5, cost mean 12 with skip 0.2, logistics mean 5 with spike 0.25 at 12 days, mixed mean 7 with skip 0.15, unexplained mean 9. Each barrier looks a little different from the development worlds.
- costOnLowTier rises to 0.3, so more cost-driven members sit on cheap drugs and cost is harder to read from the tier.
- Add-on therapy is more common: ezetimibe 0.16 and amlodipine 0.38. Combination lipid and blood pressure therapy keeps growing in practice.
- Supply: 90-day use rises to 0.5 but mail given 90-day falls to 0.4, matching a plan that pushes 90-day retail.
- New starts 0.15, quitAfterMax 3, inpatient stays 0.08, hospice 0.018, ESRD 0.014 and sacubitril 0.045 reflect an older, sicker panel with more heart failure.
- Prevalence edges up (D10 0.65, D09 0.58, D08 0.35) for the same sicker panel.
- Safety: opioid 0.06, benzo given opioid 0.12, anticholinergic given 65 0.17, second anticholinergic 0.1, no statin given diabetes 0.13.

Sanity check (share with PDC at or above 0.8 among scored members), seed 9101: D08 87.4, D09 84.5, D10 88.0. Seeds 9102 and 9103 land between 84.6 and 88.6.
