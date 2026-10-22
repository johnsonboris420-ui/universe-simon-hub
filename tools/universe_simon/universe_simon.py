#!/usr/bin/env python3
"""
Universe Simon - public cancer genomics explorer (cBioPortal REST API, no login).

For each study x gene it reports the share of *sequenced* samples carrying at
least one mutation in that gene, mutation types and the most common protein
changes, then draws a frequency heatmap and a top-protein-change bar chart.

Research/education only: public aggregate data, not medical advice.

Usage:
  python universe_simon.py                       # defaults
  python universe_simon.py --genes TP53 KRAS --studies luad_tcga paad_tcga --out reports
"""
import argparse, json, os, sys, time
from collections import Counter
from typing import Dict, List, Optional

import requests

BASE = "https://www.cbioportal.org/api"
DEFAULT_GENES = ["TP53", "EGFR", "IDH1", "KRAS", "PIK3CA", "BRAF", "PTEN", "APC", "NF1",
                 "CDKN2A", "ATRX", "BRCA1", "BRCA2", "SMAD4", "ARID1A"]
DEFAULT_STUDIES = ["gbm_tcga", "brca_tcga", "luad_tcga", "coadread_tcga", "paad_tcga",
                   "ov_tcga", "lusc_tcga", "prad_tcga"]

SESSION = requests.Session()
SESSION.headers.update({"Accept": "application/json", "User-Agent": "universe-simon/2.0"})


def api(method: str, path: str, retries: int = 4, **kw):
    """HTTP call with retry + exponential backoff on network errors, 429 and 5xx."""
    url = f"{BASE}{path}"
    for attempt in range(retries):
        try:
            r = SESSION.request(method, url, timeout=60, **kw)
            if r.status_code == 404:
                return None
            if r.status_code in (429, 500, 502, 503, 504):
                raise requests.HTTPError(f"HTTP {r.status_code}")
            r.raise_for_status()
            return r.json() if r.content else None
        except (requests.RequestException, ValueError) as e:
            if attempt == retries - 1:
                raise RuntimeError(f"{method} {path} failed after {retries} tries: {e}") from e
            time.sleep(1.5 * 2 ** attempt)


def resolve_genes(symbols: List[str]) -> Dict[str, int]:
    """Look up Entrez IDs from cBioPortal (no hardcoded IDs)."""
    data = api("POST", "/genes/fetch", params={"geneIdType": "HUGO_GENE_SYMBOL"}, json=symbols) or []
    found = {g["hugoGeneSymbol"]: g["entrezGeneId"] for g in data}
    for s in symbols:
        if s not in found:
            print(f"  ! gene {s} not found, skipping", file=sys.stderr)
    return {s: found[s] for s in symbols if s in found}


def study_context(study: str) -> Optional[Dict]:
    info = api("GET", f"/studies/{study}")
    if not info:
        return None
    profiles = api("GET", f"/studies/{study}/molecular-profiles") or []
    mut = next((p["molecularProfileId"] for p in profiles if p.get("molecularAlterationType") == "MUTATION_EXTENDED"), None)
    lists = api("GET", f"/studies/{study}/sample-lists", params={"projection": "DETAILED"}) or []
    seq = next((l for l in lists if l["sampleListId"] == f"{study}_sequenced"), None) \
        or next((l for l in lists if l.get("category") == "all_cases_with_mutation_data"), None)
    return {"info": info, "profile": mut, "sample_list": seq["sampleListId"] if seq else None,
            "sequenced": seq.get("sampleCount") if seq else None}


def fetch_mutations(profile: str, sample_list: str, entrez_ids: List[int]) -> List[Dict]:
    out, page = [], 0
    while True:
        batch = api("POST", f"/molecular-profiles/{profile}/mutations/fetch",
                    params={"projection": "SUMMARY", "pageSize": 10000, "pageNumber": page},
                    json={"entrezGeneIds": entrez_ids, "sampleListId": sample_list}) or []
        out += batch
        if len(batch) < 10000:
            return out
        page += 1


def analyse(genes: Dict[str, int], studies: List[str]) -> Dict:
    id2sym = {v: k for k, v in genes.items()}
    results = {"genes": list(genes), "studies": {}, "errors": []}
    for study in studies:
        print(f"- {study}")
        try:
            ctx = study_context(study)
            if not ctx or not ctx["profile"] or not ctx["sequenced"]:
                results["errors"].append(f"{study}: missing study, mutation profile or sequenced sample list")
                continue
            muts = fetch_mutations(ctx["profile"], ctx["sample_list"], list(genes.values()))
        except RuntimeError as e:
            results["errors"].append(str(e)); continue
        per_gene = {}
        for sym in genes:
            gm = [m for m in muts if id2sym.get(m["entrezGeneId"]) == sym]
            samples = {m["sampleId"] for m in gm}
            per_gene[sym] = {
                "mutations": len(gm),
                "mutated_samples": len(samples),
                "freq_pct": round(100 * len(samples) / ctx["sequenced"], 2),
                "types": dict(Counter(m.get("mutationType") for m in gm if m.get("mutationType")).most_common()),
                "top_changes": Counter(m.get("proteinChange") for m in gm if m.get("proteinChange")).most_common(5),
            }
        results["studies"][study] = {"name": ctx["info"].get("name", study), "sequenced": ctx["sequenced"],
                                     "all_samples": ctx["info"].get("allSampleCount"), "genes": per_gene}
    return results


def write_report(res: Dict, out: str) -> str:
    L = ["# Cancer Driver Mutation Report", "",
         "Source: cBioPortal public API. Frequency = % of *sequenced* samples with >=1 mutation in the gene.",
         "Research/education only, not medical advice.", "", "## Summary: most frequently mutated gene per study", "",
         "| Study | Sequenced samples | Top gene | Freq |", "|---|---|---|---|"]
    for sid, s in res["studies"].items():
        g, v = max(s["genes"].items(), key=lambda kv: kv[1]["freq_pct"])
        L.append(f"| {s['name']} (`{sid}`) | {s['sequenced']} | {g} | {v['freq_pct']}% |")
    L += ["", "## Frequency table (%)", "", "| Gene | " + " | ".join(res["studies"]) + " |",
          "|---|" + "---|" * len(res["studies"])]
    for g in res["genes"]:
        L.append(f"| {g} | " + " | ".join(f"{s['genes'][g]['freq_pct']}" for s in res["studies"].values()) + " |")
    L += ["", "![heatmap](heatmap_freq.png)", "", "![top changes](top_protein_changes.png)", ""]
    for sid, s in res["studies"].items():
        L += [f"## {s['name']}", f"- Study ID `{sid}`, {s['sequenced']} sequenced of {s['all_samples']} samples", ""]
        for g, v in sorted(s["genes"].items(), key=lambda kv: -kv[1]["freq_pct"]):
            if not v["mutations"]:
                continue
            L.append(f"- **{g}**: {v['freq_pct']}% ({v['mutated_samples']} samples, {v['mutations']} mutations). "
                     + "Types: " + ", ".join(f"{k} {n}" for k, n in v["types"].items())
                     + (". Top: " + ", ".join(f"{c} ({n})" for c, n in v["top_changes"]) if v["top_changes"] else ""))
        L.append("")
    if res["errors"]:
        L += ["## Errors", ""] + [f"- {e}" for e in res["errors"]]
    path = os.path.join(out, "sample_driver_report.md")
    open(path, "w").write("\n".join(L))
    return path


def charts(res: Dict, out: str):
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt, numpy as np
    sids = list(res["studies"]); genes = res["genes"]
    M = np.array([[res["studies"][s]["genes"][g]["freq_pct"] for s in sids] for g in genes])
    fig, ax = plt.subplots(figsize=(1.1 * len(sids) + 3, 0.45 * len(genes) + 2))
    im = ax.imshow(M, cmap="magma_r", aspect="auto")
    ax.set_xticks(range(len(sids)), [s.replace("_tcga", "").upper() for s in sids], rotation=45, ha="right")
    ax.set_yticks(range(len(genes)), genes)
    for i in range(len(genes)):
        for j in range(len(sids)):
            ax.text(j, i, f"{M[i, j]:.0f}", ha="center", va="center", fontsize=8, color="white" if M[i, j] > M.max() / 2 else "black")
    fig.colorbar(im, label="% of sequenced samples mutated")
    ax.set_title("Driver gene mutation frequency (cBioPortal, TCGA)")
    fig.tight_layout(); fig.savefig(os.path.join(out, "heatmap_freq.png"), dpi=150); plt.close(fig)

    c = Counter()
    for s in res["studies"].values():
        for g, v in s["genes"].items():
            for ch, n in v["top_changes"]:
                c[f"{g} {ch}"] += n
    top = c.most_common(20)[::-1]
    fig, ax = plt.subplots(figsize=(8, 7))
    ax.barh([t[0] for t in top], [t[1] for t in top], color="#c0392b")
    ax.set_xlabel("Mutation count across selected studies"); ax.set_title("Top recurrent protein changes")
    fig.tight_layout(); fig.savefig(os.path.join(out, "top_protein_changes.png"), dpi=150); plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--genes", nargs="+", default=DEFAULT_GENES)
    ap.add_argument("--studies", nargs="+", default=DEFAULT_STUDIES)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports"))
    ap.add_argument("--no-charts", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    print("Resolving genes..."); genes = resolve_genes([g.upper() for g in a.genes])
    if not genes:
        sys.exit("No valid genes.")
    print(json.dumps(genes))
    res = analyse(genes, a.studies)
    json.dump(res, open(os.path.join(a.out, "results.json"), "w"), indent=1)
    print("Report:", write_report(res, a.out))
    if not a.no_charts and res["studies"]:
        charts(res, a.out); print("Charts written to", a.out)
    for e in res["errors"]:
        print("ERROR:", e, file=sys.stderr)


if __name__ == "__main__":
    main()
