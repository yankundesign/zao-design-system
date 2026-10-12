'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Switch, finish } from '@zao/react';
import { allTokens } from '@/lib/tokens';
import { useFinish } from './use-finish';
import './motion-rules.css';

interface Point {
  x: number;
  y: number;
}

/** Points of a CSS linear() easing, read from the published token value. */
export function linearPoints(value: string): Point[] {
  const inner = value.trim().match(/^linear\((.*)\)$/)?.[1];
  if (!inner) return [];
  const stops = inner.split(',').map((stop) => stop.trim().split(/\s+/));
  return stops.map(([y, x], index) => ({
    y: Number(y),
    x: x ? Number.parseFloat(x) / 100 : index === 0 ? 0 : 1,
  }));
}

function bezierPoints(value: string, samples = 48): Point[] {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = (value.match(/cubic-bezier\(([^)]+)\)/)?.[1] ?? '')
    .split(',')
    .map(Number);
  return Array.from({ length: samples + 1 }, (_, i) => {
    const s = i / samples;
    return {
      x: 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3,
      y: 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s ** 2 * y2 + s ** 3,
    };
  });
}

const token = (id: string) => String(allTokens[id]?.value ?? '');
const ms = (id: string) => Number.parseFloat(token(id));

const enter = token('motion.easing.fold-enter');
const exit = token('motion.easing.fold-exit');
const standard = token('motion.easing.standard');
const profile = linearPoints(exit);

/** The half-section of a hall, folded by the 举折 rule, and the curves it becomes. */
export function FoldFigure() {
  const sx = (x: number) => 60 + x * 400;
  const sy = (y: number) => 320 - y * 266;
  const purlins = profile.slice(1, -1);
  // Each fold drops half as far as the one above it, starting at one tenth of the rise.
  const drops = purlins.map((_, index) => 1 / (10 * 2 ** (purlins.length - 1 - index)));
  const chordAt = (index: number) => {
    const above = profile[index + 1]!;
    return (above.y * profile[index]!.x) / above.x;
  };
  const plot = (points: Point[]) =>
    points.map((p) => `${(40 + p.x * 240).toFixed(1)},${(280 - p.y * 240).toFixed(1)}`).join(' ');

  return (
    <div className="docs-fold grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <figure className="flex min-w-0 flex-col gap-3">
        <svg
          viewBox="0 0 560 360"
          className="w-full"
          role="img"
          aria-label={`Half section of a hall roof with ${purlins.length} folded purlins. Each purlin sits below the chord from the eave to the purlin above it, by ${drops
            .slice()
            .reverse()
            .map((d) => `1/${Math.round(1 / d)}`)
            .join(', ')} of the rise.`}
        >
          <path d="M30 320 H500" className="docs-fold-ground" />
          <path d={`M${sx(1)} ${sy(1)} V320`} className="docs-fold-axis" />
          <path d={`M${sx(0)} ${sy(0)} L${sx(1)} ${sy(1)}`} className="docs-fold-chord" />
          {purlins.map((p, index) => {
            const i = index + 1;
            return (
              <g key={i}>
                <path
                  d={`M${sx(0)} ${sy(0)} L${sx(p.x)} ${sy(chordAt(i))}`}
                  className="docs-fold-chord docs-fold-chord-minor"
                />
                <path d={`M${sx(p.x)} ${sy(chordAt(i))} V${sy(p.y)}`} className="docs-fold-drop" />
                <text x={sx(p.x) + 8} y={sy(chordAt(i)) - 6} className="docs-fold-label">
                  1/{Math.round(1 / drops[index]!)}
                </text>
              </g>
            );
          })}
          <polyline
            points={profile.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
            className="docs-fold-profile"
          />
          {profile.map((p, index) => (
            <circle key={index} cx={sx(p.x)} cy={sy(p.y)} r="4.5" className="docs-fold-purlin" />
          ))}
          <text x={sx(0)} y="344" textAnchor="middle" className="docs-fold-label">
            橑檐方 eave
          </text>
          <text x={sx(1)} y={sy(1) - 14} textAnchor="middle" className="docs-fold-label">
            脊槫 ridge
          </text>
        </svg>
        <figcaption className="type-caption text-muted">
          举折: raise the ridge, then fold each purlin below the chord to the one above it, by half
          the previous drop.
        </figcaption>
      </figure>
      <figure className="flex min-w-0 flex-col gap-3">
        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-sm"
          role="img"
          aria-label="Easing curves: the enter curve is the roof profile turned 180 degrees, the exit curve is the profile as built, and the earlier standard curve is shown dashed."
        >
          <path d="M40 40 H280 V280 H40 Z" className="docs-fold-grid" />
          <path
            d="M100 40 V280 M160 40 V280 M220 40 V280 M40 100 H280 M40 160 H280 M40 220 H280"
            className="docs-fold-grid docs-fold-grid-minor"
          />
          <polyline points={plot(bezierPoints(standard))} className="docs-fold-standard" />
          <polyline points={plot(linearPoints(exit))} className="docs-fold-exit" />
          <polyline points={plot(linearPoints(enter))} className="docs-fold-enter" />
          <text x="40" y="304" className="docs-fold-label">
            0
          </text>
          <text x="280" y="304" textAnchor="end" className="docs-fold-label">
            time
          </text>
        </svg>
        <figcaption className="flex flex-col gap-1 type-caption text-muted">
          <span>
            <span className="docs-fold-key docs-fold-key-enter" /> Enter: the profile turned 180°.
            Lift, slide and reveal.
          </span>
          <span>
            <span className="docs-fold-key docs-fold-key-exit" /> Exit: the profile as built.
            Closing and removal.
          </span>
          <span>
            <span className="docs-fold-key docs-fold-key-standard" /> Before: {standard}.
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

/** The same 600ms on the earlier curve and on the fold, with an optional slow view. */
export function FoldRace() {
  const { theme, resolved } = useFinish();
  const [run, setRun] = useState(false);
  const [slow, setSlow] = useState(false);
  const duration = 600 * (slow ? 6 : 1);
  const lane = (curve: string) =>
    ({ '--docs-race-duration': `${duration}ms`, '--docs-race-curve': curve }) as CSSProperties;

  return (
    <div
      {...finish(theme, resolved)}
      className="docs-race flex min-w-0 flex-col gap-4 bg-canvas text-default"
      data-run={run ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={() => setRun((value) => !value)}>
          {run ? 'Return' : 'Run'}
        </Button>
        <label className="inline-flex items-center gap-3 type-label">
          <Switch checked={slow} onCheckedChange={setSlow} />
          Slow ×6
        </label>
      </div>
      <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3">
        <span className="type-caption text-muted">Before</span>
        <div className="docs-race-lane" style={lane(standard)}>
          <span className="docs-race-puck docs-race-puck-standard" />
        </div>
        <span className="type-caption text-muted">举折 enter</span>
        <div className="docs-race-lane" style={lane(enter)}>
          <span className="docs-race-puck" />
        </div>
      </div>
    </div>
  );
}

const ladder = [
  { grade: 7, name: 'Button, Switch face', width: 26, height: 8.5 },
  { grade: 5, name: 'Menu', width: 40, height: 33 },
  { grade: 3, name: 'Card', width: 58, height: 40 },
  { grade: 1, name: 'Dialog', width: 80, height: 50 },
] as const;

const gradeNames: Record<number, string> = {
  1: '一等',
  3: '三等',
  5: '五等',
  7: '七等',
};

/** Size sets the pace: each part arrives over its grade's duration. */
export function GradeLadder() {
  const { theme, resolved } = useFinish();
  const statusId = useId();
  const [up, setUp] = useState(true);
  const [slow, setSlow] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) window.clearTimeout(frame.current);
    },
    [],
  );

  function play() {
    if (frame.current !== null) window.clearTimeout(frame.current);
    setUp(false);
    // Let the parts settle out of view, then bring them back on their own grades.
    frame.current = window.setTimeout(
      () => {
        frame.current = null;
        setUp(true);
      },
      slow ? 1800 : 360,
    );
  }

  const unit = ms('motion.grade-unit');

  return (
    <div
      {...finish(theme, resolved)}
      className="docs-ladder flex min-w-0 flex-col gap-5 bg-canvas text-default"
      data-up={up ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={play} aria-describedby={statusId}>
          Play all
        </Button>
        <label className="inline-flex items-center gap-3 type-label">
          <Switch checked={slow} onCheckedChange={setSlow} />
          Slow ×6
        </label>
        <p id={statusId} className="type-caption text-muted">
          Duration = 材 height in 寸 × {unit}ms.
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-end gap-8">
        {ladder.map((part) => {
          const duration = ms(`motion.duration.grade.${part.grade}`) * (slow ? 6 : 1);
          const height = token(`grade.${part.grade}`);
          return (
            <div key={part.grade} className="flex flex-col gap-3">
              <div
                className="docs-ladder-part card-shaded-construction construction-shading construction-planes border border-subtle bg-surface"
                style={
                  {
                    width: `calc(${part.width} * var(--zao-space-1))`,
                    height: `calc(${part.height} * var(--zao-space-1))`,
                    '--docs-ladder-duration': `${duration}ms`,
                  } as CSSProperties
                }
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="type-label font-medium">{part.name}</span>
                <span className="type-caption figures-tabular text-muted">
                  {gradeNames[part.grade]} · {height} 寸 →{' '}
                  {ms(`motion.duration.grade.${part.grade}`)}
                  ms
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
