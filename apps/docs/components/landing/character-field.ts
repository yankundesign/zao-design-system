/**
 * The character field (Oct 16): a ground of faint drafting marks in Geist Mono, gathered into
 * drifting clusters. It is painted once into a tile that repeats without a seam, and used only as
 * a mask: CSS fills it with a semantic ink, so the field follows the mode and the copies in the
 * exploded drawing carry it without being painted again. Nothing moves.
 */

import { useEffect } from 'react';
import type { RefObject } from 'react';

const fontSize = 10;
/** The tile in CSS pixels: 1440 × 1008, as wide as the docs frame, so a ground rarely repeats. */
export const fieldTile = { width: 1440, height: 1008 } as const;

/**
 * - `grid`: a 3-fen lattice of dots with a + at every fourth mark, like the fen grid seen
 *   through the drawing. Toward a cluster's core the crosses close in.
 * - `hatch`: section hatching, ╱ in the cores and dots at the edges.
 * - `lines`: fragments of a construction grid, ─ and │ meeting at ┼.
 */
export type FieldPattern = 'grid' | 'hatch' | 'lines';

/** Grid marks sit on a square 3-fen lattice; strokes sit on the mono advance (6 × 12px). */
const cells: Record<FieldPattern, { width: number; height: number }> = {
  grid: { width: 12, height: 12 },
  hatch: { width: 6, height: 12 },
  lines: { width: 6, height: 12 },
};

/** A repeatable hash in [0, 1). */
function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(seed, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise that wraps every `nx` × `ny` lattice cells, so the tile has no seam. */
function noise(x: number, y: number, nx: number, ny: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const i0 = ((x0 % nx) + nx) % nx;
  const j0 = ((y0 % ny) + ny) % ny;
  const i1 = (i0 + 1) % nx;
  const j1 = (j0 + 1) % ny;
  const a = hash(i0, j0, seed);
  const b = hash(i1, j0, seed);
  const c = hash(i0, j1, seed);
  const d = hash(i1, j1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Layered noise over the tile, u and v in [0, 1). Wider than tall, like lines of output. */
function density(u: number, v: number, seed: number) {
  // A slow warp turns round blobs into drifting streaks.
  const wu = u + 0.14 * (noise(u * 2, v * 2, 2, 2, seed + 17) - 0.5);
  const wv = v + 0.1 * (noise(u * 2, v * 2, 2, 2, seed + 29) - 0.5);
  let sum = 0;
  let weight = 0;
  let amplitude = 1;
  for (let octave = 0; octave < 4; octave++) {
    const f = 2 ** octave;
    const tu = (((wu % 1) + 1) % 1) * 4 * f;
    const tv = (((wv % 1) + 1) % 1) * 5 * f;
    sum += amplitude * noise(tu, tv, 4 * f, 5 * f, seed + octave);
    weight += amplitude;
    amplitude *= 0.52;
  }
  return sum / weight;
}

/** The mark for one cell, given its strength `s` (0 at a cluster's edge, 1 at its core). */
function mark(pattern: FieldPattern, col: number, row: number, s: number, roll: number) {
  if (pattern === 'grid') {
    // Every fourth mark is a +; toward a core every second one is, then every one.
    const major = col % 4 === 0 && row % 4 === 0;
    const minor = col % 2 === 0 && row % 2 === 0;
    if (major || (minor && s > 0.45) || s > 0.8) {
      return { glyph: '+', alpha: s > 0.6 && roll < 0.08 ? 1 : 0.3 + 0.55 * s };
    }
    return { glyph: '·', alpha: 0.22 + 0.4 * s };
  }
  if (pattern === 'hatch') {
    if (s > 0.28) return { glyph: '╱', alpha: 0.2 + 0.5 * s };
    return (col + row) % 2 === 0 ? { glyph: '·', alpha: 0.22 } : null;
  }
  const across = row % 4 === 0;
  const down = col % 8 === 0;
  const alpha = 0.22 + 0.5 * s;
  if (across && down) return { glyph: '┼', alpha: Math.min(1, alpha + 0.2) };
  if (across) return { glyph: '─', alpha };
  if (down) return { glyph: '│', alpha };
  return s > 0.55 && roll < 0.2 ? { glyph: '·', alpha: 0.25 } : null;
}

export type FieldOptions = {
  pattern?: FieldPattern;
  /** Share of cells inside a cluster, 0 to 1. */
  coverage?: number;
  seed?: number;
};

/**
 * Paints the tile's mask into a 2D context already sized to `fieldTile × scale`. Alpha carries
 * the strength: cluster cores are firmer, and their edges thin out mark by mark.
 */
export function paintField(
  context: CanvasRenderingContext2D,
  scale: number,
  family: string,
  { pattern = 'grid', coverage = 0.3, seed = 7 }: FieldOptions = {},
) {
  const cell = cells[pattern];
  const cols = fieldTile.width / cell.width;
  const rows = fieldTile.height / cell.height;
  const values: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      values.push(density((col + 0.5) / cols, (row + 0.5) / rows, seed));
    }
  }
  // Thresholds by rank, so coverage holds whatever the seed draws.
  const sorted = [...values].sort((a, b) => a - b);
  const at = (share: number) =>
    sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(share * sorted.length)))]!;
  const floor = at(1 - coverage);
  const peak = at(0.995);

  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, fieldTile.width, fieldTile.height);
  context.font = `${fontSize}px ${family}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#000';

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const value = values[row * cols + col]!;
      if (value < floor) continue;
      const s = Math.min(1, (value - floor) / (peak - floor));
      // Edges thin out: a cell near the threshold is drawn less often.
      if (hash(col, row, seed + 101) >= 0.35 + 0.65 * Math.min(1, s * 3)) continue;
      const drawn = mark(pattern, col, row, s, hash(col, row, seed + 303));
      if (!drawn) continue;
      context.globalAlpha = Math.min(1, drawn.alpha);
      context.fillText(
        drawn.glyph,
        col * cell.width + cell.width / 2,
        row * cell.height + cell.height / 2,
      );
    }
  }
  context.globalAlpha = 1;
}

/**
 * Paints the tile once the mono face has loaded and sets it on `host` as `--landing-field`,
 * with its size as `--landing-field-width` and `--landing-field-height`. Grounds inside the
 * host use it as a mask.
 */
export function useCharacterField(host: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = host.current;
    if (!element || typeof document === 'undefined') return;
    let url: string | null = null;
    let cancelled = false;
    const family =
      getComputedStyle(element).getPropertyValue('--zao-font-family-mono').trim() || 'monospace';
    const scale = window.devicePixelRatio >= 1.5 ? 2 : 1;

    document.fonts
      .load(`${fontSize}px ${family}`)
      .catch(() => [])
      .then(() => {
        if (cancelled) return;
        const canvas = document.createElement('canvas');
        canvas.width = fieldTile.width * scale;
        canvas.height = fieldTile.height * scale;
        const context = canvas.getContext('2d');
        if (!context) return;
        paintField(context, scale, family);
        canvas.toBlob((blob) => {
          if (!blob || cancelled) return;
          url = URL.createObjectURL(blob);
          element.style.setProperty('--landing-field', `url("${url}")`);
          element.style.setProperty('--landing-field-width', `${fieldTile.width}px`);
          element.style.setProperty('--landing-field-height', `${fieldTile.height}px`);
        });
      });

    return () => {
      cancelled = true;
      element.style.removeProperty('--landing-field');
      element.style.removeProperty('--landing-field-width');
      element.style.removeProperty('--landing-field-height');
      if (url) URL.revokeObjectURL(url);
    };
  }, [host]);
}
