'use client';

import { Switch } from '@zao/react';
import { useEffect, useId, useRef, useState } from 'react';

/** Interval between simulated readings. Updates are discrete; nothing tweens. */
const tickMs = 900;

/**
 * Rule 5: motion only from data. The simulation is labeled, off by default, and
 * stops when switched off or when the chart leaves the page.
 */
export function useLiveSimulation(onTick: () => void) {
  const [running, setRunning] = useState(false);
  const tick = useRef(onTick);
  tick.current = onTick;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => tick.current(), tickMs);
    return () => window.clearInterval(timer);
  }, [running]);

  return { running, setRunning };
}

export function LiveSimulationSwitch({
  running,
  onRunningChange,
}: {
  running: boolean;
  onRunningChange: (running: boolean) => void;
}) {
  const descriptionId = useId();
  return (
    <div
      data-zao-slot="chart-simulation"
      className="flex flex-col gap-0.5 border-t border-subtle pt-3"
    >
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="type-body">Simulate live updates</span>
        <Switch
          aria-describedby={descriptionId}
          checked={running}
          onCheckedChange={(checked) => onRunningChange(checked)}
        />
      </label>
      <p id={descriptionId} className="type-caption text-muted">
        Illustrative readings arrive about once a second.
      </p>
    </div>
  );
}
