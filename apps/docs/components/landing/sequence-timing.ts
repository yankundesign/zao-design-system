/*
 * Landing sequence timing (docs/plans/2026-11-landing-sequence). Pure functions shared by the
 * sequence and the exploded drawing, so both read one assembly.
 *
 * Carried over from the WP 1.1 spike, which Yankun tried on Nov 3 without changing them: the
 * gaps close over the assembly's first 70% and the drawing turns flat over the last 30%.
 */

export const closeShare = 0.7;

export const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const lerp = (from: number, to: number, q: number) => from + (to - from) * q;

/** Evaluates a CSS `linear()` easing, as the fold tokens are written. */
export function parseLinear(value: string): (t: number) => number {
  const match = /linear\((.*)\)/.exec(value.trim());
  if (!match) return (t) => t;
  const stops: { y: number; x: number | null }[] = [];
  for (const part of match[1]!.split(',')) {
    const [first, ...rest] = part.trim().split(/\s+/);
    const y = Number.parseFloat(first!);
    if (rest.length === 0) stops.push({ y, x: null });
    for (const token of rest) stops.push({ y, x: Number.parseFloat(token) / 100 });
  }
  if (stops.length === 0) return (t) => t;
  if (stops[0]!.x === null) stops[0]!.x = 0;
  if (stops.at(-1)!.x === null) stops.at(-1)!.x = 1;
  for (let i = 1; i < stops.length; i++) {
    if (stops[i]!.x !== null) {
      stops[i]!.x = Math.max(stops[i]!.x!, stops[i - 1]!.x!);
      continue;
    }
    let j = i;
    while (stops[j]!.x === null) j++;
    const from = stops[i - 1]!.x!;
    const to = stops[j]!.x!;
    for (let k = i; k < j; k++) stops[k]!.x = from + ((to - from) * (k - i + 1)) / (j - i + 1);
  }
  return (t) => {
    if (t <= stops[0]!.x!) return stops[0]!.y;
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1]!;
      const b = stops[i]!;
      if (t <= b.x!) return b.x === a.x ? b.y : lerp(a.y, b.y, (t - a.x!) / (b.x! - a.x!));
    }
    return stops.at(-1)!.y;
  };
}

/** The fold-enter curve as the page computes it. */
export function foldEnter(element: Element = document.documentElement) {
  return parseLinear(getComputedStyle(element).getPropertyValue('--zao-motion-easing-fold-enter'));
}

/** The drawing's tilt at assembly progress `a` (0 Parts, 1 Built): 1 while the gaps close. */
export function tiltAt(a: number, ease: (t: number) => number) {
  return 1 - ease(clamp((a - closeShare) / (1 - closeShare)));
}

/**
 * LS2: the layers seat from the ground up. Gap j (between layers j − 1 and j) closes in turn
 * over the first 70%; a layer's depth is the sum of the gaps still open beneath it. A layer's
 * tag retires as it lands, and the canvas tag once the drawing is flat.
 */
export function seating(a: number, count: number, gap: number, ease: (t: number) => number) {
  const width = closeShare / Math.max(1, count - 1);
  const closed = Array.from({ length: count }, (_, j) =>
    j === 0 ? 1 : ease(clamp((a - (j - 1) * width) / width)),
  );
  const depths = closed.map((_, i) => {
    let z = 0;
    for (let j = 1; j <= i; j++) z += (1 - closed[j]!) * gap;
    return z;
  });
  const t = tiltAt(a, ease);
  const tags = closed.map((value, i) => (i === 0 ? t > 0 : value < 1));
  return { depths, t, tags };
}

/**
 * A keyframe list that stops short of the timeline's end gains an implicit final keyframe at
 * the underlying value (spike finding, Nov 3), so every list holds its last value to offset 1.
 */
export function holdToEnd(frames: Keyframe[]) {
  const last = frames.at(-1);
  if (last && (last.offset ?? 1) < 1) frames.push({ ...last, offset: 1 });
  return frames;
}
