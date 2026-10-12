import type { CSSProperties, ReactNode } from 'react';
import { roundedOutline } from './outline';
import type { SolidGeometry } from './outline';

/**
 * One drawn part: a canvas-filled outline and an optional lighter crease. A part index groups the
 * paths so a figure can seat its parts in order; without one, the paths render bare.
 */
export function Solid({ outline, crease, part }: SolidGeometry & { part?: number }) {
  const paths = (
    <>
      <path d={outline} fill="var(--zao-color-bg-canvas)" vectorEffect="non-scaling-stroke" />
      {crease && (
        <path
          className="docs-nav-figure-detail"
          d={crease}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </>
  );
  if (part === undefined) return paths;
  return (
    <g data-figure-part="" style={{ '--figure-part': part } as CSSProperties}>
      {paths}
    </g>
  );
}

/** A rectangular solid: front face from x0 to x1, back edge at top, front edge at bottom. */
export function block(x0: number, x1: number, top: number, bottom: number): SolidGeometry {
  return {
    outline: roundedOutline([
      [x0, top + 2],
      [x0 + 3, top],
      [x1 + 3, top],
      [x1 + 3, bottom - 2],
      [x1, bottom],
      [x0, bottom],
    ]),
    crease: `M${x0 + 1.2} ${top + 2.3}H${x1 - 0.2}L${x1 + 1.8} ${top + 1}`,
  };
}

/** A layer of an exploded assembly rises a share of the part's lift, so its gaps open evenly. */
export function Layer({ share, children }: { share: number; children: ReactNode }) {
  return (
    <g
      className="docs-nav-figure-layer"
      style={{ '--docs-nav-figure-share': share } as CSSProperties}
    >
      {children}
    </g>
  );
}
