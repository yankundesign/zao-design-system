'use client';

import { useId, useState } from 'react';
import type { PointerEvent } from 'react';
import './storage-ring-study.css';

type CapacityRegion = 'used' | 'available';

/** The graduated marks are percentage increments, not individual records. */
const scaleMarks = Array.from({ length: 100 }, (_, index) => {
  const angle = (((index + 0.5) * 3.6 - 90) * Math.PI) / 180;
  const innerRadius = index % 10 === 0 ? 58 : index % 5 === 0 ? 62 : 66;
  const coordinate = (radius: number, axis: 'x' | 'y') =>
    Math.round((80 + radius * (axis === 'x' ? Math.cos(angle) : Math.sin(angle))) * 100) / 100;
  return {
    x1: coordinate(innerRadius, 'x'),
    y1: coordinate(innerRadius, 'y'),
    x2: coordinate(72, 'x'),
    y2: coordinate(72, 'y'),
  };
});

function inspectionArc(start: number, end: number) {
  const point = (percent: number) => {
    const angle = ((percent * 3.6 - 90) * Math.PI) / 180;
    return [80 + 52 * Math.cos(angle), 80 + 52 * Math.sin(angle)];
  };
  const [x1, y1] = point(start);
  const [x2, y2] = point(end);
  return `M ${x1} ${y1} A 52 52 0 ${end - start > 50 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** First local chart study; no published chart API or finish values are selected here. */
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
    if (Math.hypot(x, y) < 52 || Math.hypot(x, y) > 80) {
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
          <g strokeWidth="1.5">
            {scaleMarks.map(({ x1, y1, x2, y2 }, index) => (
              <line
                key={index}
                data-zao-slot="storage-mark"
                data-state={index < used ? 'used' : 'available'}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              />
            ))}
          </g>
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke="var(--zao-color-border-subtle)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
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
            />
          ) : null}
          <circle
            cx="80"
            cy="80"
            r="24"
            fill="none"
            stroke="var(--zao-color-border-subtle)"
            strokeWidth="1"
          />
          <rect x="77" y="77" width="6" height="6" fill="var(--zao-color-accent-solid)" />
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
      <p
        id={detailId}
        data-zao-slot="storage-detail"
        className="text-center type-caption figures-tabular text-muted"
      >
        {activeRegion
          ? `${activeRegion === 'used' ? 'Used' : 'Available'} capacity: ${activeRegion === 'used' ? used : available} of 100 parts.`
          : 'Total capacity: 100 parts.'}
      </p>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
