/**
 * Derives ZAO's motion from Yingzao Fashi (finish plan V5 and V6, Oct 11, 2026).
 *
 * - foldProfile: the 举折 roof profile, normalized from eave (0) to ridge (1).
 * - foldCurves: the exit curve (the profile as built) and the enter curve (turned 180°),
 *   as CSS `linear()` strings plus a smoothed cubic-bezier fit for DTCG and older engines.
 * - gradeDurations: each timber grade's 材 height times a grade unit.
 *
 * Run through `pnpm motion` in @zao/tokens.
 */

export interface FoldPoint {
  /** Horizontal position, eave 0 to ridge 1. */
  x: number;
  /** Height, eave 0 to ridge 1. */
  y: number;
}

const round = (n: number, digits = 4) => Number(n.toFixed(digits));

/**
 * The 举折 profile for a hall of `rafters` rafters (both slopes), normalized.
 *
 * 折屋之法: the first purlin below the ridge drops one tenth of the rise below the chord
 * from eave to ridge; each purlin below drops half the previous amount, measured from the
 * chord between the eave and the purlin just folded.
 */
export function foldProfile(rafters: number): FoldPoint[] {
  if (!Number.isInteger(rafters) || rafters < 4 || rafters % 2 !== 0) {
    throw new Error(`举折 needs an even number of rafters, at least 4; received ${rafters}.`);
  }
  const perSlope = rafters / 2;
  const x = Array.from({ length: perSlope + 1 }, (_, i) => i / perSlope);
  const y = new Array<number>(perSlope + 1).fill(0);
  y[perSlope] = 1;
  let drop = 1 / 10;
  // Fold from the ridge down: each purlin sits below the chord from the eave to the
  // purlin above it.
  for (let i = perSlope - 1; i >= 1; i--) {
    const chord = (y[i + 1]! * x[i]!) / x[i + 1]!;
    y[i] = chord - drop;
    drop /= 2;
  }
  return x.map((xi, i) => ({ x: round(xi), y: round(y[i]!) }));
}

function linearString(points: FoldPoint[]): string {
  const stops = points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return String(round(p.y));
    return `${round(p.y)} ${round(p.x * 100, 2)}%`;
  });
  return `linear(${stops.join(', ')})`;
}

/** Piecewise-linear value of a curve at progress t. */
function sample(points: FoldPoint[], t: number): number {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (t <= b.x) return a.y + ((b.y - a.y) * (t - a.x)) / (b.x - a.x);
  }
  return points[points.length - 1]!.y;
}

/** y of cubic-bezier(x1, y1, x2, y2) at x = t, by bisection on the curve parameter. */
function bezierAt([x1, y1, x2, y2]: number[], t: number): number {
  const bx = (s: number) => 3 * (1 - s) ** 2 * s * x1! + 3 * (1 - s) * s ** 2 * x2! + s ** 3;
  const by = (s: number) => 3 * (1 - s) ** 2 * s * y1! + 3 * (1 - s) * s ** 2 * y2! + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}

/** Least-squares cubic-bezier fit of a monotone curve, by a coarse grid then local refinement. */
export function fitCubic(points: FoldPoint[]): [number, number, number, number] {
  const samples = Array.from({ length: 41 }, (_, i) => i / 40);
  const error = (c: number[]) =>
    samples.reduce((sum, t) => sum + (bezierAt(c, t) - sample(points, t)) ** 2, 0);
  // Coarse grid, then local refinement from the best few cells, so the fit does not settle
  // in a poor local minimum.
  const grid = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const cells: Array<{ c: number[]; e: number }> = [];
  for (const x1 of grid)
    for (const y1 of grid)
      for (const x2 of grid)
        for (const y2 of grid) cells.push({ c: [x1, y1, x2, y2], e: error([x1, y1, x2, y2]) });
  cells.sort((a, b) => a.e - b.e);
  let best = cells[0]!.c;
  let bestError = cells[0]!.e;
  for (const start of cells.slice(0, 6)) {
    let current = start.c;
    let currentError = start.e;
    for (let step = 0.1; step > 0.0005; step /= 2) {
      let improved = true;
      while (improved) {
        improved = false;
        for (let k = 0; k < 4; k++) {
          for (const sign of [-1, 1]) {
            const next = [...current];
            next[k] = next[k]! + sign * step;
            if (k % 2 === 0 && (next[k]! < 0 || next[k]! > 1)) continue;
            const e = error(next);
            if (e < currentError) {
              [current, currentError] = [next, e];
              improved = true;
            }
          }
        }
      }
    }
    if (currentError < bestError) [best, bestError] = [current, currentError];
  }
  return best.map((n) => round(n, 3)) as [number, number, number, number];
}

export interface FoldCurves {
  rafters: number;
  /** The roof profile as built, eave to ridge. */
  profile: FoldPoint[];
  enter: { linear: string; cubic: [number, number, number, number]; points: FoldPoint[] };
  exit: { linear: string; cubic: [number, number, number, number]; points: FoldPoint[] };
}

const foldCache = new Map<number, FoldCurves>();

/** Exit is the profile as built (it starts slow and accelerates); enter is it turned 180°. */
export function foldCurves(rafters: number): FoldCurves {
  const cached = foldCache.get(rafters);
  if (cached) return cached;
  const profile = foldProfile(rafters);
  const exitPoints = profile;
  const enterPoints = [...profile].reverse().map((p) => ({ x: round(1 - p.x), y: round(1 - p.y) }));
  const curves: FoldCurves = {
    rafters,
    profile,
    enter: { linear: linearString(enterPoints), cubic: fitCubic(enterPoints), points: enterPoints },
    exit: { linear: linearString(exitPoints), cubic: fitCubic(exitPoints), points: exitPoints },
  };
  foldCache.set(rafters, curves);
  return curves;
}

/** Duration in milliseconds for each grade: 材 height in 寸 times the grade unit. */
export function gradeDurations(
  heights: Record<string, number>,
  gradeUnit: number,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(heights).map(([grade, height]) => [grade, round(height * gradeUnit, 1)]),
  );
}
