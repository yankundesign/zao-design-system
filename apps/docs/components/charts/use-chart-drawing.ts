'use client';

import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

function milliseconds(value: string) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return 0;
  return value.trim().endsWith('ms') ? number : number * 1000;
}

/**
 * The post-drawing paint window, mirrored from @zao/react's private `useDrawingState` so
 * docs-local charts build on Card and Table's timing (C3). A chart package would share the
 * package hook instead (DV5). Returns true while a chart builds after its data arrives.
 */
export function useChartDrawing(drawing: boolean, element: RefObject<HTMLElement | null>) {
  const [state, setState] = useState({ drawing, building: false });
  if (state.drawing !== drawing) {
    setState({
      drawing,
      building:
        state.drawing && !drawing && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }

  useLayoutEffect(() => {
    if (drawing || !state.building) return;
    const root = element.current;
    if (!root) return;
    const style = getComputedStyle(root);
    const exit = milliseconds(style.getPropertyValue('--zao-motion-duration-reveal-exit'));
    const reveal = milliseconds(style.getPropertyValue('--zao-motion-duration-reveal'));
    const lift = milliseconds(style.getPropertyValue('--zao-motion-duration-lift'));
    const timer = window.setTimeout(
      () => setState((current) => ({ ...current, building: false })),
      exit + reveal / 2 + lift,
    );
    return () => window.clearTimeout(timer);
  }, [drawing, state.building, element]);

  return !drawing && state.building;
}
