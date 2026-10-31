'use client';

import { Button, Switch } from '@zao/react';
import { useEffect, useRef, useState } from 'react';
import { ChartSpecimen } from './chart-specimens';
import type { ChartId } from './chart-ids';

/** How long the local simulation keeps a chart drawn before its readings arrive. */
const loadMs = 1800;

/**
 * A chart page's preview, with a local simulation of readings loading: the chart shows its
 * drawing, then builds when the readings arrive (charts wave 1, C3).
 */
export function ChartPreview({ chart }: { chart: ChartId }) {
  const [drawing, setDrawing] = useState(false);
  const [keepLoading, setKeepLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function arrive(after: number) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setDrawing(false);
    }, after);
  }

  function reload() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setDrawing(true);
    if (!keepLoading) arrive(loadMs);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <ChartSpecimen chart={chart} drawing={drawing} />
      <div
        data-zao-slot="chart-loading-demo"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-subtle pt-3"
      >
        <Button variant="secondary" size="small" onClick={reload}>
          Reload readings
        </Button>
        <label className="flex cursor-pointer items-center gap-2 type-caption">
          Keep loading
          <Switch
            checked={keepLoading}
            onCheckedChange={(checked) => {
              setKeepLoading(checked);
              if (checked && timer.current !== null) {
                window.clearTimeout(timer.current);
                timer.current = null;
              }
              if (!checked && drawing) arrive(0);
            }}
          />
        </label>
        <span className="type-caption text-muted">Local simulation of readings loading.</span>
      </div>
    </div>
  );
}
