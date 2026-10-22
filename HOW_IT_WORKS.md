# How It Works: a beginner's guide to the three projects

All three run on this box. None of them needs a password or API key, none can spend or send money, and none uploads anything.

---

## 1. Universe Simon: cancer genomics explorer

**What it does in plain words.** Big public research projects such as TCGA (The Cancer Genome Atlas) have sequenced the DNA of thousands of tumours. **cBioPortal** puts that data online for free. Universe Simon asks cBioPortal a simple question:

> "In each cancer type, what share of the sequenced tumours has a mutation in each well-known cancer gene?"

It then writes a report and draws two charts.

**Words you'll see**
- *Gene / driver gene*: a stretch of DNA. "Driver" genes are ones whose mutations help cancer grow (for example TP53 and KRAS).
- *Entrez ID*: a gene's ID number. The tool looks these up from the gene names, so nothing is guessed.
- *Study*: one dataset, e.g. `luad_tcga` (lung adenocarcinoma).
- *Sequenced samples*: tumours whose DNA was actually read. Frequency = mutated samples ÷ sequenced samples × 100.
- *Protein change*: what a mutation does to the protein, e.g. `KRAS G12D` (position 12 changes from G to D).

**Step by step (`universe_simon/universe_simon.py`)**
1. `resolve_genes`: turns gene names into Entrez IDs using `/genes/fetch`.
2. `study_context`: for each study, finds its mutation dataset and its "sequenced" sample list, and how many samples that list has.
3. `fetch_mutations`: downloads every mutation in the chosen genes, one page at a time.
4. `analyse`: counts the distinct mutated samples per gene, works out the %, and tallies mutation types and the top protein changes.
5. `write_report` and `charts`: write the Markdown report, a heatmap (gene × study) and a bar chart of the most common protein changes.
6. `api()`: wraps every web call and retries on network errors or busy servers (waiting 1.5 s, 3 s, 6 s…). If a study fails, it's listed under "Errors" and the rest still run.

**Run it**
```bash
cd tools/universe_simon
PY=python3   # needs: pip install requests matplotlib numpy
$PY universe_simon.py                                       # 15 genes x 8 TCGA studies
$PY universe_simon.py --genes TP53 KRAS BRAF --studies skcm_tcga thca_tcga --out /tmp/myreport
```
Outputs in `reports/`: `sample_driver_report.md`, `heatmap_freq.png`, `top_protein_changes.png` and `results.json` (raw numbers).

*For learning and research only, not medical advice.*

---

## 2. AQFLE ("AraAra Quantum Fractal Life Engine"): evolving art

**What it really is.** A generative-art and artificial-life toy. The names are just for fun: it isn't quantum, it doesn't mine crypto, and it doesn't earn anything. It makes pictures, and a **genetic algorithm** gradually finds settings that make more interesting ones.

**The picture ("world")**
- Background: a *Julia set* fractal, coloured by how fast each point escapes.
- On top: Conway's *Game of Life*. Each cell is alive or dead; a dead cell with exactly 3 live neighbours comes alive, and a live cell with 2 or 3 live neighbours survives.
- Extras: "ara ara magic" spontaneous births near live cells, stronger where the fractal is rich. They pulse in and out with the "orbital resonance" rhythm. Occasional random flips act as mutations.

**The genes, i.e. the settings being evolved**

| gene | meaning |
|---|---|
| `c_re`, `c_im` | the fractal's shape constant |
| `resonance_freq` | how fast the birth boost pulses |
| `magic_rate` | how many spontaneous births |
| `mutation_rate` | how often random flips happen |
| `init_density` | how full the grid starts |

**Fitness: how "good" a world is, measured not guessed**
- *Entropy (35%)*: how varied the image's brightness values are.
- *Complexity (35%)*: how well the image compresses. It scores best in the middle: neither flat nor pure noise.
- *Persistence (30%)*: life survives at a lively level (about 15% of cells alive, not extinct and not flooded) and keeps changing.

Each world is scored on the same 2 fixed random seeds, so comparisons are fair.

**The genetic algorithm (`evolve`)**
1. Start with 16 settings. If `aqfle_best.json` exists, half are copies or small variations of the previous best.
2. Score them all and keep the top 2 unchanged (*elitism*).
3. Make children: pick parents by *tournament* (the fitter of 2 random ones), *blend* their genes (*crossover*), then nudge some genes at random (*mutation*). The nudges get smaller over time.
4. Repeat for 12 generations, then save the best settings and history to `aqfle_best.json`.

Each new run carries on from the previous best.

**Run it**
```bash
cd tools/ara_algo
PY=python3   # needs: pip install numpy pillow matplotlib
$PY aqfle.py                    # continue from previous best
$PY aqfle.py --generations 30 --pop 24
$PY aqfle.py --fresh            # forget the saved best
```
Outputs: `aqfle_output.png` (best world, drawn larger), `aqfle_fitness.png` (best and average fitness per generation, across all runs) and `aqfle_best.json`.

---

## 3. Crypto-Ledger ("BlockScan"): read-only wallet tracker

**What it does.** It shows what the wallet you choose (WALLET_ADDRESS or pasted in the UI) holds on Ethereum and BNB Chain right now, what that is worth, and its transfer history. It's **watch-only**: it never asks for a private key and can't move funds. The "Mining" page is a labelled **simulation** (made-up numbers that drive a fractal animation), not real crypto.

**Where the data comes from (all free, no keys)**
- Balances: public nodes at publicnode.com (`eth_getBalance`, and `balanceOf` for known BNB-chain tokens).
- Ethereum tokens, prices and history: eth.blockscout.com.
- Prices and 24-hour changes: CoinGecko's free price endpoint.

Results are cached for about 60 seconds. If a source fails, the app shows the last good data and a warning.

**Pieces**
| part | file(s) | job |
|---|---|---|
| Database | any Postgres via `DATABASE_URL` (locally PGlite or the compose `db` service) | stores imported CSV rows, value snapshots, mining-sim counters |
| API server | `artifacts/api-server/src/` (port 8080) | `lib/live.ts` fetches live data; `lib/snapshots.ts` records wallet value every 5 min; `routes/*.ts` are the URLs |
| Dashboard | `artifacts/crypto-dashboard/src/` (port 5173) | React pages: `portfolio.tsx`, `asset.tsx`, `transactions.tsx`, `token-transfers.tsx`, `mining.tsx` |

**Features**
- **Portfolio**: live total, a value-history chart from real snapshots, and a "Show unpriced/airdrop tokens" toggle (hidden by default, since these are usually spam). Click a row for the **asset detail** page: balance, price, a per-asset history chart, and that token's transfers with explorer links.
- **Token Transfers**: live transfers plus **Import Etherscan CSV**. Any outgoing transfer to an address the wallet had never dealt with before is flagged **⚠ new address**, which helps catch mistakes or scams.
- **Transactions**: live Ethereum transactions.

**Useful API URLs**: `/api/portfolio`, `/api/portfolio/history`, `/api/transactions`, `/api/token-transfers`, `POST /api/token-transfers/import` (body = CSV text).

**Start it**: see the root `README.md` (local dev, or `docker compose up --build`).

**Limits**: no BNB-chain transfer history (that needs a BscScan key), and only 8 known BNB-chain tokens are checked. The history chart starts empty and fills in from the moment the server first ran.
