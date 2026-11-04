'use client';

import { Plate } from '../gallery/plate';
import { chartPlates } from '../gallery/chart-plates';
import { plates } from '../gallery/plates';
import type { PlateDefinition } from '../gallery/plates';
import '../gallery/gallery.css';

const part = (id: string) => plates.find((plate) => plate.id === id)!;
const chart = (id: string) => chartPlates.find((plate) => plate.id === id)!;

/**
 * LS8 (Nov 3): thirteen plates, each row a part beside a chart. The components wall's Storage
 * ring is left out, because the charts wall has its own.
 */
const room: readonly PlateDefinition[] = [
  part('button'),
  chart('ring'),
  part('switch'),
  chart('line'),
  part('tabs'),
  chart('bar-prism'),
  part('menu'),
  chart('heatmap'),
  part('composer'),
  chart('histogram'),
  part('plan'),
  chart('bar'),
  part('approval-gate'),
];

/**
 * Section 2 (landing sequence, WP 3.1): the display room. Every plate runs the real component
 * or chart, as on /gallery; chart plates arrive as their drawing when they come into view.
 */
export function Room() {
  return (
    <section
      id="components"
      aria-labelledby="landing-room-heading"
      data-landing-section="room"
      className="landing-section flex flex-col gap-6"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        {/* LS9: a draft for Yankun's copy. */}
        <h2 id="landing-room-heading" className="type-title">
          Every part, live.
        </h2>
        <p className="type-body text-muted text-pretty">
          Point, press, type and tab through them. Each plate runs the real component or chart.
        </p>
      </div>
      <ol className="gallery-wall" aria-label="Components and charts">
        {room.map((plate, index) => (
          <li key={plate.id} className="min-w-0">
            <Plate plate={plate} number={String(index + 1).padStart(2, '0')} />
          </li>
        ))}
      </ol>
    </section>
  );
}
