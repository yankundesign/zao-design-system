'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Switch, finish } from '@zao/react';
import { useFinish } from './use-finish';
import './construction-states.css';

type Phase = 'built' | 'removed' | 'loading';
const phaseText: Record<Phase, string> = {
  built: 'Built: the Card stands at its rest depth.',
  removed: 'Removed: the Card returned to its drawing, then to nothing.',
  loading: 'Loading: the drawing waits for its material.',
};

/** Docs-local dimensions illustrate the same part while the published Card owns its drawing. */
export function ConstructionStates() {
  const { theme, resolved } = useFinish();
  const [phase, setPhase] = useState<Phase>('built');
  const [keepLoading, setKeepLoading] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
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
    if (next === 'loading' && !keepLoading)
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setPhase('built');
      }, 1800);
  }

  const fen = (px: number) => Math.round(px / 4);
  const drawing = phase === 'loading' || phase === 'removed';

  return (
    <section
      className="docs-detail-section grid gap-5 border-t border-subtle pt-5"
      aria-labelledby="construction-states-heading"
    >
      <h2 id="construction-states-heading" className="type-heading">
        Drawn, then built
      </h2>
      <div
        {...finish(theme, resolved)}
        className="construction-states flex min-w-0 flex-col gap-4 bg-canvas text-default"
        data-phase={phase}
      >
        <p className="max-w-2xl type-body text-muted">
          Local simulation. A Card arrives as its published construction drawing and becomes solid.
          Removing it returns to the drawing, then to nothing. While loading, the drawing stays
          still with its dimensions in fen.
        </p>
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
          <label className="flex items-center gap-2 type-caption">
            Keep loading <Switch checked={keepLoading} onCheckedChange={setKeepLoading} />
          </label>
          <p className="type-caption text-muted" aria-live="polite">
            {phaseText[phase]}
          </p>
        </div>
        <div className="construction-states-stage">
          <div ref={stage} className="construction-states-frame">
            <div className="construction-states-dimensions" aria-hidden="true">
              <span className="construction-states-width type-caption figures-tabular">
                <span className="construction-states-label">{fen(size.width)} fen</span>
              </span>
              <span className="construction-states-height type-caption figures-tabular">
                <span className="construction-states-label">{fen(size.height)} fen</span>
              </span>
            </div>
            <div className="construction-states-solid" inert={phase === 'removed'}>
              <Card drawing={drawing} drawingLabel="Loading storage usage" className="h-full">
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
