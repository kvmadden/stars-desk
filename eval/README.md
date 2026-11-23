# Simulator (logic check, not evidence)

These scripts generate synthetic plans, play October 1 to December 31 forward with and without calls, and check that the desk behaves as designed.

The call effects are assumed, not measured (reach 60%, matched fix 55%, pharmacist finds the barrier 35%, reminder 25%), and the hidden barriers are the rulebook's own types. Any advantage the desk shows here mostly restates those assumptions, so nothing in `results/` is a result about real members, and the README and app quote none of it. See [../docs/METHOD.md](../docs/METHOD.md). The test that would produce real evidence is the pilot described there.

- `run-eval.mjs`: development and held-out runs (`dev`, `dev2`, `holdout`, `holdout2`)
- `holdout-amendment.mjs`, `stress.mjs`: extra comparison lists and conditions on frozen settings
- `calibration-dev.mjs`: compares the projection's miss rate with the simulator's
- `holdout/`, `holdout2/`: frozen settings, hashed before their one run
