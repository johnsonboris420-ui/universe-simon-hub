#!/bin/sh
# Copy generated charts/images from the Python tools into the dashboard's public/hub folder.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
DEST="$ROOT/apps/crypto-ledger/artifacts/crypto-dashboard/public/hub-assets"
mkdir -p "$DEST"
cp "$ROOT"/tools/universe_simon/reports/heatmap_freq.png "$ROOT"/tools/universe_simon/reports/top_protein_changes.png "$DEST"/ 2>/dev/null || true
cp "$ROOT"/tools/universe_simon/reports/results.json "$DEST"/cancer_results.json 2>/dev/null || true
cp "$ROOT"/tools/universe_simon/reports/sample_driver_report.md "$DEST"/cancer_report.md 2>/dev/null || true
cp "$ROOT"/tools/ara_algo/aqfle_output.png "$ROOT"/tools/ara_algo/aqfle_fitness.png "$DEST"/ 2>/dev/null || true
cp "$ROOT"/tools/ara_algo/aqfle_best.json "$DEST"/ 2>/dev/null || true
for f in mandelbulb_4d_v1.png mandelbulb_4d_v2.png mandelbulb_4d_v3.png mandelbulb_4d_2d.png; do cp "$ROOT/apps/mandelbulb/$f" "$DEST"/ 2>/dev/null || true; done
echo "hub assets synced to $DEST"
