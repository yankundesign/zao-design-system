'use client';

import { memo, useCallback, useId, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

export interface InspectableDatum {
  /** Hit box in the plot's pixel coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Accessible name for the datum's control, e.g. "eu: 412 calls". */
  label: string;
}

export interface Inspection {
  active: number | null;
  selected: number | null;
  hovered: number | null;
  cursor: number;
  announcement: string;
  setHovered: (index: number | null) => void;
  setFocused: (index: number | null) => void;
  setCursor: (index: number) => void;
  toggle: (index: number, label: string) => void;
  clear: () => void;
  undismiss: () => void;
}

/**
 * Inspection state shared by every chart: hover or focus inspects, Enter, Space or
 * a tap selects, Escape clears. Selection is announced; hover never is.
 */
export function useInspection(count: number): Inspection {
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursorState] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const within = (index: number | null) => (index !== null && index < count ? index : null);
  const active = dismissed ? null : (within(hovered) ?? within(focused) ?? within(selected));

  // Stable for the life of the chart, so a datum control re-renders only when its own state
  // changes: a hover re-renders none of them.
  const toggle = useCallback((index: number, label: string) => {
    setDismissed(false);
    setSelected((current) => {
      const next = current === index ? null : index;
      setAnnouncement(next === null ? 'Selection cleared.' : `Selected ${label}.`);
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    setDismissed(true);
    setSelected((current) => {
      if (current !== null) setAnnouncement('Selection cleared.');
      return null;
    });
  }, []);
  const undismiss = useCallback(() => setDismissed(false), []);

  return {
    active,
    selected: within(selected),
    hovered: within(hovered),
    cursor: Math.min(cursor, Math.max(0, count - 1)),
    announcement,
    setHovered,
    setFocused,
    setCursor: setCursorState,
    toggle,
    clear,
    undismiss,
  };
}

/**
 * One datum's native button. Memoized on its own geometry and state, so moving the pointer
 * across a plot re-renders no controls, and an arrow key re-renders the two that trade focus.
 */
const DatumControl = memo(function DatumControl({
  index,
  count,
  columns,
  x,
  y,
  width,
  height,
  label,
  current,
  selected,
  setCursor,
  setFocused,
  toggle,
  clear,
  undismiss,
}: {
  index: number;
  count: number;
  columns?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** Holds the group's one tab stop. */
  current: boolean;
  selected: boolean;
} & Pick<Inspection, 'setCursor' | 'setFocused' | 'toggle' | 'clear' | 'undismiss'>) {
  function move(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      clear();
      return;
    }
    const last = count - 1;
    const step = columns ?? 1;
    const targets: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: columns ? index + step : index + 1,
      ArrowUp: columns ? index - step : index - 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = Math.min(last, Math.max(0, target));
    setCursor(next);
    // The group holds exactly one button per datum, in order.
    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  }

  return (
    <button
      type="button"
      data-zao-slot="chart-datum"
      tabIndex={current ? 0 : -1}
      aria-label={label}
      aria-pressed={selected}
      className="chart-datum-control absolute outline-focus focus-visible:outline-2 focus-visible:-outline-offset-1"
      style={{ left: x, top: y, width, height }}
      onFocus={() => {
        setCursor(index);
        setFocused(index);
        undismiss();
      }}
      onBlur={() => setFocused(null)}
      onKeyDown={move}
      onClick={() => toggle(index, label)}
    />
  );
});

/**
 * One tab stop with roving focus across native buttons, one per datum. Pointer
 * input finds the nearest datum anywhere on the plot, so there are no tiny targets.
 */
export function ChartInspector({
  inspection,
  data,
  width,
  height,
  name,
  columns,
  nearest = 'x',
}: {
  inspection: Inspection;
  data: readonly InspectableDatum[];
  width: number;
  height: number;
  /** Names the group of datum controls, e.g. "Calls by region". */
  name: string;
  /** Set for grids: Up and Down move by this many data. */
  columns?: number;
  /** 'x' picks the nearest column; 'box' picks the datum under the pointer. */
  nearest?: 'x' | 'box';
}) {
  const hintId = useId();

  const locate = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (nearest === 'box') {
        const index = data.findIndex(
          (datum) =>
            x >= datum.x && x < datum.x + datum.width && y >= datum.y && y < datum.y + datum.height,
        );
        return index === -1 ? null : index;
      }
      let best: number | null = null;
      let distance = Infinity;
      data.forEach((datum, index) => {
        const next = Math.abs(datum.x + datum.width / 2 - x);
        if (next < distance) {
          distance = next;
          best = index;
        }
      });
      return best;
    },
    [data, nearest],
  );

  return (
    <div
      data-zao-slot="chart-inspector"
      className="absolute top-0 left-0"
      style={{ width, height, touchAction: 'pan-y' }}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return;
        inspection.setHovered(locate(event));
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') inspection.undismiss();
      }}
      onPointerLeave={() => inspection.setHovered(null)}
      onClick={(event) => {
        // Native button activation from the keyboard reaches the button directly.
        if (event.target !== event.currentTarget) return;
        const index = locate(event as unknown as PointerEvent<HTMLDivElement>);
        if (index !== null) inspection.toggle(index, data[index]!.label);
      }}
    >
      <p id={hintId} className="sr-only">
        Arrow keys move between data. Enter selects. Escape clears.
      </p>
      <div role="group" aria-label={`Inspect ${name}`} aria-describedby={hintId}>
        {data.map((datum, index) => (
          <DatumControl
            key={index}
            index={index}
            count={data.length}
            columns={columns}
            x={datum.x}
            y={datum.y}
            width={datum.width}
            height={datum.height}
            label={datum.label}
            current={index === inspection.cursor}
            selected={inspection.selected === index}
            setCursor={inspection.setCursor}
            setFocused={inspection.setFocused}
            toggle={inspection.toggle}
            clear={inspection.clear}
            undismiss={inspection.undismiss}
          />
        ))}
      </div>
    </div>
  );
}
