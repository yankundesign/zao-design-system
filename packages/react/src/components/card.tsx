'use client';

import { forwardRef, useCallback, useRef } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { useDrawingState } from './drawing.js';

export interface CardProps extends ComponentPropsWithRef<'div'> {
  /** Show the host-provided placeholder content as a still construction drawing. */
  drawing?: boolean;
  /** Polite loading status announced while drawing. */
  drawingLabel?: string;
}

/** A grounded content surface; native actions belong inside its stationary frame. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, drawing = false, drawingLabel = 'Loading', children, ...props },
  forwardedRef,
) {
  const root = useRef<HTMLDivElement>(null);
  const building = useDrawingState(drawing, root);
  const setRoot = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element;
      if (typeof forwardedRef === 'function') forwardedRef(element);
      else if (forwardedRef) (forwardedRef as { current: HTMLDivElement | null }).current = element;
    },
    [forwardedRef],
  );
  return (
    <>
      <div
        ref={setRoot}
        className={`card-shaded-construction card-material construction-planes border bg-surface p-4 text-default${drawing ? ' construction-drawing' : ''}${className ? ` ${className}` : ''}`}
        {...props}
        aria-hidden={drawing ? true : props['aria-hidden']}
        aria-busy={drawing ? true : props['aria-busy']}
        inert={drawing ? true : props.inert}
        data-zao-drawing={drawing ? '' : undefined}
        data-zao-building={building ? '' : undefined}
        data-zao-component="card"
      >
        {children}
      </div>
      {drawing ? (
        <span className="button-loading-announcement" role="status">
          {drawingLabel}
        </span>
      ) : null}
    </>
  );
});
