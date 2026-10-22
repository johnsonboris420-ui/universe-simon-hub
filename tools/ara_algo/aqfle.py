"""
AraAra Quantum Fractal Life Engine (AQFLE) v2
=============================================
Generative art / artificial-life (ALife) toy. Honest scope: it makes pictures
and evolves the settings that make them more interesting. It does NOT mine,
trade, earn money or do anything "quantum"; the playful names are just names.

How it works
------------
1. A *world* is a Conway Game-of-Life grid laid over a Julia-set fractal.
   Parameters ("genes") of a world:
     c_re, c_im      Julia constant offset (fractal shape)
     resonance_freq  "orbital resonance": how fast the spontaneous-birth boost oscillates
     magic_rate      "ara ara magic": base chance of spontaneous births next to live cells,
                     biased toward fractal-rich regions
     mutation_rate   chance per step of random bit-flips
     init_density    initial share of live cells
2. Each world is simulated and scored with a measurable fitness:
     entropy     Shannon entropy of the rendered greyscale image (0..1)
     complexity  zlib compression ratio of the rendered image (structure, not noise/flat)
     persistence life survives and stays in a lively band (not extinct, not a flood),
                 and keeps changing (not frozen)
     fitness = 0.35*entropy + 0.35*complexity + 0.30*persistence
3. A genetic algorithm evolves a population: tournament selection, blend
   crossover, Gaussian mutation, elitism. Every world is scored on the same
   fixed random seeds so scores are comparable.
4. The best genome + full history are saved to aqfle_best.json; the next run
   seeds its population from it, so results build up across runs.

Run:  python aqfle.py [--generations 12] [--pop 16] [--fresh]
Outputs (next to this file): aqfle_best.json, aqfle_output.png, aqfle_fitness.png
"""
import argparse, json, math, os, zlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BEST_PATH = os.path.join(HERE, "aqfle_best.json")
BOUNDS = {"c_re": (-1.0, 0.5), "c_im": (-1.0, 1.0), "resonance_freq": (0.05, 3.0),
          "magic_rate": (0.0, 0.01), "mutation_rate": (0.0, 0.3), "init_density": (0.02, 0.6)}
EVAL_SEEDS = (11, 23)


class AraAraQuantumFractalLife:
    def __init__(self, params, size=128, max_iter=48, seed=0):
        self.p = params; self.n = size; self.max_iter = max_iter
        self.rng = np.random.default_rng(seed)
        self.life = (self.rng.random((size, size)) < params["init_density"]).astype(np.uint8)
        xs = np.linspace(-1.6, 1.6, size)
        zr, zi = np.meshgrid(xs, xs)
        self.depth = self.fractal_depth(zr + 1j * zi, complex(params["c_re"], params["c_im"]))
        self.generation = 0; self.alive_hist = []; self.change_hist = []

    def fractal_depth(self, z, c):
        zz = z.copy(); depth = np.zeros(z.shape, np.float32)
        for i in range(self.max_iter):
            m = np.abs(zz) <= 2.0
            zz[m] = zz[m] ** 2 + c; depth[m] = i
        return depth / self.max_iter

    def orbital_resonance(self):
        return 0.5 + 0.5 * math.sin(self.generation * self.p["resonance_freq"])

    def life_step(self):
        L = self.life
        nb = sum(np.roll(np.roll(L, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
        new = ((L == 0) & (nb == 3)) | ((L == 1) & ((nb == 2) | (nb == 3)))
        magic_p = self.p["magic_rate"] * self.orbital_resonance() * (0.5 + self.depth)
        new |= (self.rng.random(L.shape) < magic_p) & (nb >= 1)
        if self.rng.random() < self.p["mutation_rate"]:
            flip = self.rng.random(L.shape) < 0.002
            new = np.where(flip, ~new, new)
        new = new.astype(np.uint8)
        self.change_hist.append(float(np.mean(new != L)))
        self.life = new; self.generation += 1
        self.alive_hist.append(float(new.mean()))

    def run(self, steps=60):
        for _ in range(steps):
            self.life_step()
        return self

    def image_array(self):
        d, L = self.depth, self.life
        rgb = np.stack([np.clip(d * 290, 0, 255), np.clip(100 + d * 150, 0, 255),
                        np.clip(180 - d * 100 + L * 75, 0, 255)], -1)
        rgb[L == 1] = rgb[L == 1] * 0.4 + np.array([255, 220, 160]) * 0.6
        return rgb.astype(np.uint8)

    def metrics(self):
        grey = self.image_array().mean(-1).astype(np.uint8)
        hist = np.bincount(grey.ravel(), minlength=256) / grey.size
        h = hist[hist > 0]; entropy = float(-(h * np.log2(h)).sum() / 8)
        ratio = len(zlib.compress(grey.tobytes(), 9)) / grey.size
        complexity = float(max(0.0, 1 - abs(ratio - 0.35) / 0.35))   # peaks at mid compressibility
        tail = self.alive_hist[-10:]; alive = float(np.mean(tail))
        band = math.exp(-((alive - 0.15) / 0.1) ** 2) if alive > 0.002 else 0.0
        activity = min(1.0, float(np.mean(self.change_hist[-10:])) / 0.02)
        persistence = band * (0.5 + 0.5 * activity)
        fitness = 0.35 * entropy + 0.35 * complexity + 0.30 * persistence
        return {"fitness": fitness, "entropy": entropy, "complexity": complexity,
                "persistence": persistence, "alive_frac": alive}


def evaluate(params, steps=60):
    ms = [AraAraQuantumFractalLife(params, seed=s).run(steps).metrics() for s in EVAL_SEEDS]
    return {k: float(np.mean([m[k] for m in ms])) for k in ms[0]}


def clip(p):
    return {k: float(np.clip(v, *BOUNDS[k])) for k, v in p.items()}


def random_params(rng):
    return {k: float(rng.uniform(*b)) for k, b in BOUNDS.items()}


def crossover(a, b, rng):
    child = {}
    for k in BOUNDS:
        t = rng.uniform(-0.25, 1.25)               # BLX-alpha blend
        child[k] = a[k] + t * (b[k] - a[k])
    return clip(child)


def mutate(p, rng, strength):
    return clip({k: v + rng.normal(0, strength * (BOUNDS[k][1] - BOUNDS[k][0])) if rng.random() < 0.4 else v
                 for k, v in p.items()})


def evolve(generations=12, pop_size=16, fresh=False, seed=None):
    rng = np.random.default_rng(seed)
    state = json.load(open(BEST_PATH)) if (os.path.exists(BEST_PATH) and not fresh) else {"runs": []}
    pop = [random_params(rng) for _ in range(pop_size)]
    if state.get("best"):
        pop[0] = clip(state["best"]["params"])
        for i in range(1, pop_size // 2):
            pop[i] = mutate(pop[0], rng, 0.1)
    scored = [(evaluate(p), p) for p in pop]
    history = []
    for g in range(generations):
        scored.sort(key=lambda s: -s[0]["fitness"])
        fits = [s[0]["fitness"] for s in scored]
        history.append({"gen": g, "best": fits[0], "mean": float(np.mean(fits))})
        print(f"Gen {g:2d}: best {fits[0]:.4f}  mean {np.mean(fits):.4f}  {json.dumps({k: round(v, 4) for k, v in scored[0][1].items()})}")
        def pick():
            i, j = rng.choice(len(scored), 2, replace=False)
            return scored[min(i, j)][1]                # sorted, so lower index = fitter
        children = [scored[0][1], scored[1][1]]          # elitism
        strength = 0.15 * (1 - g / max(1, generations)) + 0.03
        while len(children) < pop_size:
            children.append(mutate(crossover(pick(), pick(), rng), rng, strength))
        elite = scored[:2]
        scored = elite + [(evaluate(c), c) for c in children[2:]]
    scored.sort(key=lambda s: -s[0]["fitness"])
    best_m, best_p = scored[0]
    history.append({"gen": generations, "best": best_m["fitness"], "mean": float(np.mean([s[0]["fitness"] for s in scored]))})
    prev = state.get("best", {}).get("metrics", {}).get("fitness")
    state["runs"].append({"start_best": history[0]["best"], "end_best": best_m["fitness"], "history": history})
    if prev is None or best_m["fitness"] >= prev:
        state["best"] = {"params": best_p, "metrics": best_m}
    json.dump(state, open(BEST_PATH, "w"), indent=1)
    return state, history


def render(params, path, size=512, steps=80):
    e = AraAraQuantumFractalLife(params, size=size, max_iter=64, seed=EVAL_SEEDS[0]).run(steps)
    img = Image.fromarray(e.image_array()); m = e.metrics()
    d = ImageDraw.Draw(img)
    try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
    except OSError: font = ImageFont.load_default()
    d.text((10, 10), "AQFLE - generative art / ALife", fill=(255, 220, 180), font=font)
    d.text((10, size - 28), f"fitness {m['fitness']:.3f}  entropy {m['entropy']:.2f}  alive {m['alive_frac']:.2f}", fill=(220, 220, 255), font=font)
    img.save(path); return path


def plot(state, path):
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(8, 4.5)); x0 = 0
    for i, r in enumerate(state["runs"]):
        xs = [x0 + h["gen"] for h in r["history"]]
        ax.plot(xs, [h["best"] for h in r["history"]], "-o", ms=3, label=f"run {i+1} best")
        ax.plot(xs, [h["mean"] for h in r["history"]], "--", alpha=0.5)
        x0 = xs[-1] + 1
    ax.set_xlabel("generation (cumulative over runs)"); ax.set_ylabel("fitness"); ax.set_title("AQFLE genetic algorithm: best (solid) / mean (dashed)")
    ax.legend(fontsize=7); ax.grid(alpha=0.3); fig.tight_layout(); fig.savefig(path, dpi=130); plt.close(fig)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Evolve AQFLE art parameters with a genetic algorithm.")
    ap.add_argument("--generations", type=int, default=12)
    ap.add_argument("--pop", type=int, default=16)
    ap.add_argument("--fresh", action="store_true", help="ignore saved best and start from scratch")
    ap.add_argument("--seed", type=int, default=None)
    a = ap.parse_args()
    state, hist = evolve(a.generations, a.pop, a.fresh, a.seed)
    print(f"\nThis run: best fitness {hist[0]['best']:.4f} -> {hist[-1]['best']:.4f}; all-time best {state['best']['metrics']['fitness']:.4f}")
    print("Best params:", json.dumps(state["best"]["params"], indent=1))
    print("Image:", render(state["best"]["params"], os.path.join(HERE, "aqfle_output.png")))
    plot(state, os.path.join(HERE, "aqfle_fitness.png")); print("Fitness plot:", os.path.join(HERE, "aqfle_fitness.png"))
