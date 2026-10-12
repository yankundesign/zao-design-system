'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, finish } from '@zao/react';
import { useFinish } from './use-finish';
import './construction-states.css';

type Phase = 'built' | 'removed' | 'loading';

const phaseText: Record<Phase, string> = {
  built: 'Built: the Card stands at its rest depth.',
  removed: 'Removed: the Card returned to its drawing, then to nothing.',
  loading: 'Loading: the drawing waits for its material.',
};

/** The drawing's placeholder rows, in percent of the Card, matching the built content. */
const rows = [
  { x: 5.5, y: 12, w: 34, h: 9 },
  { x: 72, y: 14, w: 22.5, h: 5 },
  { x: 5.5, y: 36, w: 20, h: 14 },
  { x: 5.5, y: 54, w: 46, h: 5 },
  { x: 5.5, y: 68, w: 89, h: 4 },
  { x: 5.5, y: 82, w: 18, h: 5 },
  { x: 76.5, y: 82, w: 18, h: 5 },
];

/**
 * Drawn → built (finish plan V8): a docs-local Card that arrives as its construction drawing
 * and becomes solid, returns to the drawing on removal, and shows the drawing with its fen
 * dimensions while loading. Nothing plays on its own; reduced motion switches instantly.
 */
export function ConstructionStates() {
  const { theme, resolved } = useFinish();
  const [phase, setPhase] = useState<Phase>('built');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function go(next: Phase) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setPhase(next);
    if (next === 'loading') {
      // A stand-in for data arriving; the drawing itself stays still while it waits.
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setPhase('built');
      }, 1800);
    }
  }

  const fen = (px: number) => Math.round(px / 4);

  return (
    <section
      className="docs-detail-section grid gap-5 border-t border-subtle pt-5"
      aria-labelledby="construction-states-heading"
    >
      <div className="flex max-w-2xl flex-col gap-2">
        <h2 id="construction-states-heading" className="type-heading">
          Drawn, then built
        </h2>
        <p className="type-body text-muted">
          A Card arrives as its construction drawing and becomes solid. Removing it reverses the
          order. While its data loads, the drawing stays still with its dimensions in fen.
        </p>
      </div>
      <div
        {...finish(theme, resolved)}
        className="construction-states flex min-w-0 flex-col gap-4 bg-canvas text-default"
        data-phase={phase}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => go('built')} disabled={phase === 'built'}>
            Build
          </Button>
          <Button variant="secondary" onClick={() => go('removed')} disabled={phase === 'removed'}>
            Remove
          </Button>
          <Button variant="secondary" onClick={() => go('loading')} disabled={phase === 'loading'}>
            Load
          </Button>
          <p className="type-caption text-muted" aria-live="polite">
            {phaseText[phase]}
          </p>
        </div>
        <div className="construction-states-stage">
          <div ref={stage} className="construction-states-frame">
            <svg
              className="construction-states-drawing"
              aria-hidden="true"
              focusable="false"
              preserveAspectRatio="none"
            >
              <rect
                className="construction-states-line"
                x="0"
                y="0"
                width="100%"
                height="100%"
                pathLength={1}
              />
              {rows.map((row, index) => (
                <rect
                  key={index}
                  className="construction-states-line construction-states-placeholder"
                  x={`${row.x}%`}
                  y={`${row.y}%`}
                  width={`${row.w}%`}
                  height={`${row.h}%`}
                  pathLength={1}
                />
              ))}
            </svg>
            <div className="construction-states-dimensions" aria-hidden="true">
              <span className="construction-states-width type-caption figures-tabular">
                <span className="construction-states-label">{fen(size.width)} fen</span>
              </span>
              <span className="construction-states-height type-caption figures-tabular">
                <span className="construction-states-label">{fen(size.height)} fen</span>
              </span>
            </div>
            <div className="construction-states-solid" inert={phase !== 'built'}>
              <Card className="h-full">
                <div className="flex h-full flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="type-heading">Storage</h3>
                    <span className="type-caption figures-tabular text-muted">340 of 500 GB</span>
                  </div>
                  <p className="type-title figures-tabular">68%</p>
                  <p className="type-caption text-muted">used. Photos are the largest part.</p>
                  <div className="construction-states-bar" aria-hidden="true">
                    <span />
                  </div>
                  <div className="mt-auto flex justify-between type-caption">
                    <span>Photos</span>
                    <span className="figures-tabular">182 GB</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
