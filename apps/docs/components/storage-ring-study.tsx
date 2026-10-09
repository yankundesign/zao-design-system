'use client';

import { useId, useState } from 'react';
import type { PointerEvent } from 'react';
import './storage-ring-study.css';

type CapacityRegion = 'used' | 'available';

const center = 80;
/** Shared inner radius: every mark starts on the same circle and radiates outward. */
const markStart = 60;
/** Used marks are long and available marks short, so the outline steps at the reading. */
const markEnd = { used: 76, available: 67 } as const;
/** Fine scale ring: structure, kept separate from the data marks. */
const scaleRadius = 54;

function polar(percent: number, radius: number) {
  const angle = ((percent * 3.6 - 90) * Math.PI) / 180;
  return {
    x: Math.round((center + radius * Math.cos(angle)) * 100) / 100,
    y: Math.round((center + radius * Math.sin(angle)) * 100) / 100,
  };
}

/** One mark per percentage point. The marks are parts of the whole, not individual records. */
const markAngles = Array.from({ length: 100 }, (_, index) => index + 0.5);

/** Graduations every 10% on the scale ring; zero carries a longer registration tick. */
const graduations = Array.from({ length: 10 }, (_, index) => ({
  from: polar(index * 10, scaleRadius),
  to: polar(index * 10, index === 0 ? scaleRadius - 7 : scaleRadius - 3),
  registration: index === 0,
}));

function inspectionArc(start: number, end: number) {
  const from = polar(start, scaleRadius);
  const to = polar(end, scaleRadius);
  return `M ${from.x} ${from.y} A ${scaleRadius} ${scaleRadius} 0 ${end - start > 50 ? 1 : 0} 1 ${to.x} ${to.y}`;
}

/**
 * Capacity ring, refined Oct 9 with the five data visualization rules: hairline marks,
 * structure separate from data, four slots, and one accent square. Docs-local study.
 */
export function StorageRingStudy() {
  const detailId = useId();
  const used = 68;
  const [hovered, setHovered] = useState<CapacityRegion | null>(null);
  const [focused, setFocused] = useState<CapacityRegion | null>(null);
  const [selected, setSelected] = useState<CapacityRegion | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const activeRegion = dismissed ? null : (hovered ?? focused ?? selected);
  const available = 100 - used;

  function inspectPointer(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 160 - 80;
    const y = ((event.clientY - bounds.top) / bounds.height) * 160 - 80;
    if (Math.hypot(x, y) < 50 || Math.hypot(x, y) > 80) {
      setHovered(null);
      return;
    }
    const percent = (((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360) / 3.6;
    setHovered(percent < used ? 'used' : 'available');
  }

  return (
    <div
      data-zao-slot="storage-study"
      data-inspection={activeRegion ?? 'none'}
      className="storage-ring-study relative flex min-w-0 flex-col gap-3"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        setDismissed(true);
        setSelected(null);
        setAnnouncement('Storage inspection dismissed.');
      }}
    >
      <div
        data-zao-slot="chart-head"
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono type-caption text-muted"
      >
        <span>storage.used</span>
        <span>1 mark = 1 part</span>
      </div>
      <div
        className="flex min-w-0 flex-wrap items-center justify-center gap-4"
        role="img"
        aria-label={`Storage use at ${used} percent`}
      >
        <svg
          data-zao-slot="storage-chart"
          className="h-32 w-32 shrink-0"
          viewBox="0 0 160 160"
          aria-hidden="true"
          focusable="false"
          onPointerMove={inspectPointer}
          onPointerEnter={(event) => {
            if (event.pointerType !== 'touch') setDismissed(false);
          }}
          onPointerLeave={() => {
            setHovered(null);
          }}
        >
          <g data-zao-slot="storage-scale" fill="none" strokeWidth="1">
            <circle
              cx={center}
              cy={center}
              r={scaleRadius}
              stroke="var(--zao-color-border-subtle)"
              vectorEffect="non-scaling-stroke"
            />
            {graduations.map(({ from, to, registration }) => (
              <line
                key={`${from.x}-${from.y}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={
                  registration
                    ? 'var(--zao-color-border-strong)'
                    : 'var(--zao-color-border-default)'
                }
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
          <g strokeWidth="1">
            {markAngles.map((percent, index) => {
              const state = index < used ? 'used' : 'available';
              const from = polar(percent, markStart);
              const to = polar(percent, markEnd[state]);
              return (
                <line
                  key={index}
                  data-zao-slot="storage-mark"
                  data-state={state}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>
          {activeRegion ? (
            <path
              key={activeRegion}
              data-zao-slot="storage-inspection-guide"
              className="storage-inspection-guide"
              d={inspectionArc(
                activeRegion === 'used' ? 0 : used,
                activeRegion === 'used' ? used : 100,
              )}
              fill="none"
              stroke="var(--zao-color-fg-default)"
              strokeWidth="1"
              pathLength="1"
              strokeDasharray="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <circle
            cx={center}
            cy={center}
            r="24"
            fill="none"
            stroke="var(--zao-color-border-subtle)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <rect
            data-zao-slot="chart-accent"
            x="77"
            y="77"
            width="6"
            height="6"
            fill="var(--zao-color-accent-solid)"
          />
        </svg>
        <div className="figure-mark flex min-w-0 flex-col gap-1">
          <span className="type-heading figures-tabular">{used}%</span>
          <small className="type-caption text-muted">Storage used</small>
          <span className="type-caption figures-tabular text-muted">{available}% available</span>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-1"
        role="group"
        aria-label="Inspect storage capacity"
      >
        {(['used', 'available'] as const).map((region) => (
          <button
            key={region}
            type="button"
            className="storage-region-control h-7 px-2 type-caption outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Inspect ${region} capacity`}
            aria-pressed={selected === region}
            aria-describedby={detailId}
            data-active={activeRegion === region ? '' : undefined}
            onPointerEnter={(event) => {
              if (event.pointerType === 'touch') return;
              setHovered(region);
              setDismissed(false);
            }}
            onPointerLeave={() => {
              setHovered(null);
            }}
            onFocus={() => {
              setHovered(null);
              setFocused(region);
              setDismissed(false);
            }}
            onBlur={() => setFocused(null)}
            onClick={() => {
              const next = selected === region ? null : region;
              setSelected(next);
              setDismissed(false);
              setAnnouncement(
                next
                  ? `Selected ${region} capacity: ${region === 'used' ? used : available}%.`
                  : 'Storage selection cleared.',
              );
            }}
          >
            {region === 'used' ? 'Used' : 'Available'}
          </button>
        ))}
      </div>
      <div
        data-zao-slot="chart-foot"
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-subtle pt-2 font-mono type-caption figures-tabular"
      >
        <p id={detailId} data-zao-slot="storage-detail">
          {activeRegion
            ? `${activeRegion === 'used' ? 'Used' : 'Available'} capacity: ${activeRegion === 'used' ? used : available} of 100 parts.`
            : 'Total capacity: 100 parts.'}
        </p>
        <span className="text-muted">parts</span>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
