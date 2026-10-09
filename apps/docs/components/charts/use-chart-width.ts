'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Charts draw in pixel coordinates from the measured width, so hairlines stay one
 * pixel and labels keep their type role's size at every container width.
 */
export function useChartWidth<T extends HTMLElement>(fallback = 560) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(Math.max(200, Math.floor(node.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/** Center a one-pixel stroke on a device pixel. */
export function crisp(value: number) {
  return Math.round(value) + 0.5;
}
