import { Layout } from "@/components/layout";
import { useEffect, useRef, useState, useCallback } from "react";

const POWER_DEFAULT = 8;
const MAX_ITER_DEFAULT = 50;
const W_SLICE_DEFAULT = 0.0;
const BOUND_DEFAULT = 1.5;

function renderMandelbulb(
  canvas: HTMLCanvasElement,
  power: number,
  maxIter: number,
  wSlice: number,
  bound: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const cx = ((px / width) * 2 - 1) * bound;
      const cy = ((py / height) * 2 - 1) * bound;

      // 4D Mandelbulb: iterate z = z^n + c where c = [cx, cy, 0, wSlice]
      let zx = 0, zy = 0, zz = 0, zw = 0;
      let escaped = false;
      let smoothIter = 0;

      for (let i = 0; i < maxIter; i++) {
        const r_xy = Math.sqrt(zx * zx + zy * zy);
        const r_xyz = Math.sqrt(r_xy * r_xy + zz * zz);
        const r = Math.sqrt(r_xyz * r_xyz + zw * zw);

        if (r > 4.0) {
          smoothIter = i + 1 - Math.log(Math.log(r) / Math.log(4.0)) / Math.log(power);
          escaped = true;
          break;
        }

        if (r === 0) {
          zx = cx; zy = cy; zz = 0; zw = wSlice;
          continue;
        }

        const phi = Math.atan2(zy, zx);
        const theta = Math.atan2(zz, r_xy);
        const psi = Math.atan2(zw, r_xyz);

        const rn = Math.pow(r, power);
        const phin = power * phi;
        const thetan = power * theta;
        const psin = power * psi;

        const cosPsi = Math.cos(psin);
        const cosTheta = Math.cos(thetan);

        zx = rn * cosPsi * cosTheta * Math.cos(phin) + cx;
        zy = rn * cosPsi * cosTheta * Math.sin(phin) + cy;
        zz = rn * cosPsi * Math.sin(thetan) + 0;
        zw = rn * Math.sin(psin) + wSlice;
      }

      const idx = (py * width + px) * 4;
      if (!escaped) {
        data[idx] = 5;
        data[idx + 1] = 5;
        data[idx + 2] = 15;
        data[idx + 3] = 255;
      } else {
        // Smooth inferno-like coloring
        const t = Math.min(smoothIter / maxIter, 1);
        const t2 = t * t;

        // Inferno palette approximation
        const r = Math.min(255, Math.floor(255 * Math.max(0, 1.70 * t - 0.42)));
        const g = Math.min(255, Math.floor(255 * Math.max(0, t < 0.5
          ? 1.8 * t2
          : -1.8 * t2 + 3.6 * t - 1.0)));
        const b = Math.min(255, Math.floor(255 * Math.max(0, t < 0.35
          ? 2.5 * t
          : Math.max(0, -3.5 * t + 2.4))));

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export default function MandelbulbPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [power, setPower] = useState(POWER_DEFAULT);
  const [maxIter, setMaxIter] = useState(MAX_ITER_DEFAULT);
  const [wSlice, setWSlice] = useState(W_SLICE_DEFAULT);
  const [bound, setBound] = useState(BOUND_DEFAULT);
  const [rendering, setRendering] = useState(false);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || rendering) return;
    setRendering(true);
    setRenderTime(null);

    setTimeout(() => {
      const t0 = performance.now();
      renderMandelbulb(canvas, power, maxIter, wSlice, bound);
      const elapsed = performance.now() - t0;
      setRenderTime(elapsed);
      setRendering(false);
    }, 10);
  }, [power, maxIter, wSlice, bound, rendering]);

  // Initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.min(canvas.parentElement?.clientWidth ?? 600, 600);
    canvas.width = size;
    canvas.height = size;
    renderMandelbulb(canvas, power, maxIter, wSlice, bound);
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">4D</div>
            <h1 className="text-2xl font-bold text-foreground">Mandelbulb Explorer</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Interactive 4D Mandelbulb fractal — hyperspherical reconstruction rendered in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-black/40 backdrop-blur-sm flex items-center justify-center min-h-[400px]">
            <canvas
              ref={canvasRef}
              className="block max-w-full max-h-full"
              style={{ imageRendering: "pixelated" }}
            />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Rendering fractal...</span>
                </div>
              </div>
            )}
            {renderTime !== null && !rendering && (
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 text-xs text-muted-foreground border border-border/40">
                {renderTime.toFixed(0)}ms
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-5">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Parameters</h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">Power (n)</label>
                  <span className="text-sm font-mono text-purple-400">{power}</span>
                </div>
                <input
                  type="range" min={2} max={20} step={0.5} value={power}
                  onChange={e => setPower(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">Max Iterations</label>
                  <span className="text-sm font-mono text-purple-400">{maxIter}</span>
                </div>
                <input
                  type="range" min={10} max={150} step={5} value={maxIter}
                  onChange={e => setMaxIter(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">W-Slice (4th dim)</label>
                  <span className="text-sm font-mono text-purple-400">{wSlice.toFixed(2)}</span>
                </div>
                <input
                  type="range" min={-1.5} max={1.5} step={0.01} value={wSlice}
                  onChange={e => setWSlice(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">Bounds</label>
                  <span className="text-sm font-mono text-purple-400">{bound.toFixed(1)}</span>
                </div>
                <input
                  type="range" min={0.5} max={3.0} step={0.1} value={bound}
                  onChange={e => setBound(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <button
                onClick={render}
                disabled={rendering}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
              >
                {rendering ? "Rendering..." : "Render"}
              </button>
            </div>

            {/* Info */}
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Math</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground font-mono bg-black/30 rounded-lg p-3">
                <div>φ = atan2(y, x)</div>
                <div>θ = atan2(z, r_xy)</div>
                <div>ψ = atan2(w, r_xyz)</div>
                <div className="border-t border-border/30 pt-1.5 mt-1.5">x = rⁿ·cos(nψ)·cos(nθ)·cos(nφ)</div>
                <div>y = rⁿ·cos(nψ)·cos(nθ)·sin(nφ)</div>
                <div>z = rⁿ·cos(nψ)·sin(nθ)</div>
                <div>w = rⁿ·sin(nψ)</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cross-section through z=0 plane of the 4D hyperspherical Mandelbulb. Adjust W-Slice to travel through the 4th dimension.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
