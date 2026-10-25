# HighLife × AQFLE hybrid experiment (22 Oct 2026)

## Method
- HighLife B36/S23, numpy vectorised, 1024×1024 grid, zero (dead) boundary, stepping on the live bounding box +2. No run touched the edge.
- Each run lasts 1000 generations. It records a first-on generation map and a live spacetime map, with cells projected onto u = x + y (the replicator's axis) against time.
- Box-counting dimension: a log–log fit over box sizes 2–64 px on the trace's bounding box, with R² reported.
- GA (AQFLE-style): population 16, 10 generations, 4 elites, uniform crossover and mutation, seed 42. The genome is (dx, dy ∈ ±60 Bomber offset from the replicator, phase 0–47, orientation = rot90 k ∈ 0–3). Fitness is the spatial ever-on dimension, minus 1 if the pattern dies or explodes (density > 0.5). 160 evaluations (108 unique) took about 7 min. Every evaluation is in `results.csv`.

## Verified patterns
- **Replicator**: `x = 5, y = 5, rule = B36/S23` `2b3o$bo2bo$o3bo$o2bo$3o!`. In the sim it makes copies along the diagonal (population 24 at gen 12/48/96, bounding box growing 2 cells per 12 gens). Verified.
- **Bomber**: I could not fetch LifeWiki (Cloudflare blocked it). I rebuilt the Bomber instead by searching replicator + blinker placements. The result is exactly periodic with period 48 and displacement (8, 8), i.e. c/6 diagonal. A 960-gen check matched exactly at +160, +160. Population is 23 in this phase.
  `x = 15, y = 12, rule = B36/S23` `9bo5b$9bo5b$9bo5b$3o12b$obo12b$3o12b$15b$12b3o$11bo2bo$10bo3bo$10bo2bob$10b3o2b!`
  This is a replicator plus blinker plus debris with the known Bomber's period and speed. I have not confirmed it cell-for-cell against the LifeWiki RLE.

## Baseline (replicator alone, 1000 gens)
- Spatial ever-on set: D = **1.265** (R² 0.981). It is a thick diagonal stripe, so it is not Sierpinski. D also drifts with box range (1.49 at 2–16, 1.15 at 4–64).
- Spacetime trace (u vs t): D = **1.646** (R² 0.9996). This is where the Sierpinski triangle lives. It sits near log2 3 = 1.585, with the excess coming from finite size and cell thickness. See `poster_baseline_spacetime.png`.

## Evolved
| rank | genome (dx,dy,phase,orient) | spatial D | R² | spacetime D | cells | last new cell |
|---|---|---|---|---|---|---|
| 1 | (3,-7,21,0) | 1.705 | 0.9989 | 1.559 | 1495 | gen 661 |
| 2 | (5,-7,21,0) | 1.694 | 0.9987 | 1.632 | 1444 | gen 399 |
| 3 | (-11,0,21,0) | 1.680 | 0.9969 | 1.727 | 1359 | gen 335 |
No run died or exploded. All top genomes share phase 21 and orientation 0.

## Did anything beat the baseline?
Not meaningfully. The runs are deterministic, so a rerun gives the same numbers; the problem is not noise. The high spatial D is an artefact: in every top run the Bomber collides with the replicator and destroys it, leaving a compact ~50×50 blob that settles by gen 335–661. Box-counting with boxes up to 64 px on a 50 px blob measures something close to "a filled area" (D → 2), not a fractal. The spacetime D of the evolved runs (1.56–1.73) brackets the baseline's 1.65 with no consistent gain.

**Interpretation:** the Bomber does not enrich the replicator's fractal. It kills it, and naive box-counting rewards the wreckage. A better next fitness would be spacetime D, with a requirement that the trace extent stays ≥ 200 cells and keeps growing.

Files: `poster_baseline.png`, `poster_baseline_spacetime.png`, `poster_top1..3.png` (2400²), `compare.png` (2000 px), `results.csv`, `robustness.txt`, code `hl.py exp.py ga.py render.py verify.py`.
