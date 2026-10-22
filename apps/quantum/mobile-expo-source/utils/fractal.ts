export type FractalType = "mandelbrot" | "julia" | "burning-ship" | "newton";

export interface FractalParams {
  type: FractalType;
  centerX: number;
  centerY: number;
  zoom: number;
  maxIterations: number;
  juliaReal?: number;
  juliaImag?: number;
  colorScheme: ColorScheme;
}

export type ColorScheme =
  | "quantum"
  | "fire"
  | "ice"
  | "nebula"
  | "monochrome"
  | "aurora";

export interface SavedFractal {
  id: string;
  name: string;
  params: FractalParams;
  thumbnail?: string;
  createdAt: number;
}

export const DEFAULT_FRACTALS: Record<
  FractalType,
  Omit<FractalParams, "colorScheme">
> = {
  mandelbrot: {
    type: "mandelbrot",
    centerX: -0.5,
    centerY: 0,
    zoom: 0.8,
    maxIterations: 100,
  },
  julia: {
    type: "julia",
    centerX: 0,
    centerY: 0,
    zoom: 1.5,
    maxIterations: 100,
    juliaReal: -0.7269,
    juliaImag: 0.1889,
  },
  "burning-ship": {
    type: "burning-ship",
    centerX: -1.765,
    centerY: -0.032,
    zoom: 3,
    maxIterations: 100,
  },
  newton: {
    type: "newton",
    centerX: 0,
    centerY: 0,
    zoom: 1,
    maxIterations: 40,
  },
};

export const COLOR_PALETTES: Record<ColorScheme, string> = {
  quantum: "Quantum Cyan",
  fire: "Solar Flare",
  ice: "Arctic Blue",
  nebula: "Deep Nebula",
  monochrome: "Void Dark",
  aurora: "Aurora Borealis",
};

export function iterateMandelbrot(
  px: number,
  py: number,
  maxIter: number
): number {
  let x = 0,
    y = 0;
  let iter = 0;
  while (x * x + y * y <= 4 && iter < maxIter) {
    const xt = x * x - y * y + px;
    y = 2 * x * y + py;
    x = xt;
    iter++;
  }
  if (iter === maxIter) return -1;
  const smooth =
    iter + 1 - Math.log(Math.log(Math.sqrt(x * x + y * y))) / Math.log(2);
  return smooth;
}

export function iterateJulia(
  px: number,
  py: number,
  cr: number,
  ci: number,
  maxIter: number
): number {
  let x = px,
    y = py;
  let iter = 0;
  while (x * x + y * y <= 4 && iter < maxIter) {
    const xt = x * x - y * y + cr;
    y = 2 * x * y + ci;
    x = xt;
    iter++;
  }
  if (iter === maxIter) return -1;
  const smooth =
    iter + 1 - Math.log(Math.log(Math.sqrt(x * x + y * y))) / Math.log(2);
  return smooth;
}

export function iterateBurningShip(
  px: number,
  py: number,
  maxIter: number
): number {
  let x = 0,
    y = 0;
  let iter = 0;
  while (x * x + y * y <= 4 && iter < maxIter) {
    const xt = x * x - y * y + px;
    y = Math.abs(2 * x * y) + py;
    x = xt;
    iter++;
  }
  if (iter === maxIter) return -1;
  return iter;
}

export function iterateNewton(
  px: number,
  py: number,
  maxIter: number
): { iter: number; root: number } {
  let x = px,
    y = py;
  const roots = [
    { r: 1, i: 0 },
    { r: -0.5, i: Math.sqrt(3) / 2 },
    { r: -0.5, i: -Math.sqrt(3) / 2 },
  ];

  for (let iter = 0; iter < maxIter; iter++) {
    const r2 = x * x + y * y;
    const r4 = r2 * r2;
    const r6 = r4 * r2;
    const denom = 3 * r4;
    const nx = (2 * x) / 3 + (x * r4 - x) / (r6 + 1e-10);
    const ny = (2 * y) / 3 + (y * r4 - y) / (r6 + 1e-10);

    if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < 1e-12) {
      let root = 0;
      let minDist = Infinity;
      for (let r = 0; r < roots.length; r++) {
        const dx = x - roots[r].r;
        const dy = y - roots[r].i;
        const d = dx * dx + dy * dy;
        if (d < minDist) {
          minDist = d;
          root = r;
        }
      }
      return { iter, root };
    }
    x = nx;
    y = ny;
  }
  return { iter: maxIter, root: 0 };
}

export function getColor(
  value: number,
  maxIter: number,
  scheme: ColorScheme
): [number, number, number] {
  if (value === -1) return [0, 0, 0];

  // Normalize 0..1 with logarithmic emphasis on lower values
  const t = Math.pow(value / maxIter, 0.4);

  switch (scheme) {
    case "quantum": {
      // Cyan to blue to dark — classic quantum
      const r = Math.floor(Math.sin(t * Math.PI * 3) * 40);
      const g = Math.floor(Math.sin(t * Math.PI * 2) * 200 + 55);
      const b = Math.floor(Math.sin(t * Math.PI * 1.5 + 0.5) * 100 + 155);
      return [Math.max(0, r), Math.max(0, Math.min(255, g)), Math.min(255, b)];
    }
    case "fire": {
      // Dark red → orange → yellow → white
      const r = Math.floor(255 * Math.min(1, t * 2));
      const g = Math.floor(255 * Math.max(0, Math.min(1, t * 2.5 - 0.5)));
      const b = Math.floor(255 * Math.max(0, Math.min(1, t * 4 - 3)));
      return [r, g, b];
    }
    case "ice": {
      // Deep blue → cyan → white
      const r = Math.floor(t * t * 200);
      const g = Math.floor(t * 220);
      const b = Math.floor(150 + t * 105);
      return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
    }
    case "nebula": {
      // Purple → magenta → gold
      const r = Math.floor(Math.sin(t * Math.PI * 2 + 0.5) * 100 + 155);
      const g = Math.floor(t * t * 100);
      const b = Math.floor(Math.sin(t * Math.PI + 1) * 120 + 100);
      return [Math.min(255, r), Math.max(0, g), Math.min(255, b)];
    }
    case "monochrome": {
      // Pure luminance
      const v = Math.floor(Math.sqrt(t) * 255);
      return [v, v, v];
    }
    case "aurora": {
      // Green dominant aurora bands
      const r = Math.floor(Math.sin(t * Math.PI * 2.5 + 2) * 40 + 20);
      const g = Math.floor(Math.sin(t * Math.PI * 2) * 150 + 150);
      const b = Math.floor(Math.sin(t * Math.PI * 1.5 + 0.5) * 80 + 120);
      return [Math.max(0, r), Math.min(255, g), Math.min(255, b)];
    }
  }
}
