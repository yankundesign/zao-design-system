'use client';

import { useState } from 'react';
import { AccentSquare, ChartFrame, ChartLabel, Ruler, fittedDash } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import { barReading, count } from './bar-chart';
import { regionCalls, regions, regionScaleMax, stepRegionCalls } from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

/** Geist Mono's advance at the caption role's 12px, for placing the accent beside a label. */
const captionAdvance = 7.4;
const fen = 4;

/**
 * Prism proportions (charts wave 2, P2): the face is half its slot, rounded down to the fen,
 * from 12 to 48px; the depth is a third of the face, rounded down to the fen, at least 4px,
 * and every bar in the plot shares it.
 */
export function prismProportions(slot: number) {
  const face = Math.min(48, Math.max(12, Math.floor(slot / 2 / fen) * fen));
  const depth = Math.max(fen, Math.floor(face / 3 / fen) * fen);
  return { face, depth };
}

/**
 * Bar's prism form: its front face carries the reading at true height on the ruler (P6). At
 * rest every bar is a flat front face; the inspected bar (hover, focus, or the selection)
 * shows its depth, one shared depth along the depth axis, right and up (Oct 31 revision).
 * The selected bar, or the lead bar, is built (P3, P4). Nothing tweens (P5).
 */
export function PrismBarChart({ drawing = false }: { drawing?: boolean }) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [values, setValues] = useState(regionCalls);
  const simulation = useLiveSimulation(() => setValues((current) => stepRegionCalls(current)));
  const inspection = useInspection(values.length);

  const left = 8;
  const right = width - 8;
  const slot = (right - left) / values.length;
  const { face, depth } = prismProportions(slot);
  // The plot reserves the depth above the scale's top, so the tallest bar keeps its planes
  // and label inside it.
  const top = 28 + depth;
  const height = 216 + depth;
  const baseline = height - 30;
  const y = (value: number) => baseline - (value / regionScaleMax) * (baseline - top);
  const { average, lead, summary, readout, table, data } = barReading(values, inspection.active, {
    left,
    slot,
    height,
  });
  const active = inspection.active;
  const built = inspection.selected ?? lead;
  const averageY = crisp(y(average));
  const b = crisp(baseline);

  return (
    <ChartFrame
      kind="bar-prism"
      series="calls.by_region"
      scale="last 24 h"
      title="Calls by region"
      summary={summary}
      readout={readout}
      unit="calls"
      announcement={inspection.announcement}
      table={table}
      drawing={drawing}
      drawingLabel="Loading calls by region"
      controls={
        <LiveSimulationSwitch
          running={simulation.running}
          onRunningChange={simulation.setRunning}
        />
      }
    >
      <div ref={plotRef} className="chart-plot" style={{ height }}>
        <svg width={width} height={height} aria-hidden="true" focusable="false">
          <Ruler x0={left} x1={right} y={baseline} />
          {!drawing && (
            <>
              {values.map((value, index) => {
                const x0 = Math.round(left + slot * index + (slot - face) / 2) + 0.5;
                const x1 = x0 + face - 1;
                const h = Math.round(y(value)) + 0.5;
                const isBuilt = index === built;
                // Only the inspected bar shows its planes; the rest stay flat front faces.
                const inspected = index === active;
                const center = (x0 + x1) / 2;
                const labelY = h - depth - fen;
                const label = count.format(value);
                // Top and right planes, then each plane edge drawn once (shared edges never
                // double up). The front face is drawn last, so it owns its three edges.
                const topPlane = `M${x0} ${h}L${x0 + depth} ${h - depth}H${x1 + depth}L${x1} ${h}Z`;
                const sidePlane = `M${x1} ${h}L${x1 + depth} ${h - depth}V${b - depth}L${x1} ${b}Z`;
                const edges =
                  `M${x0} ${h}L${x0 + depth} ${h - depth}H${x1 + depth}V${b - depth}L${x1} ${b}` +
                  `M${x1} ${h}L${x1 + depth} ${h - depth}`;
                const front = `M${x0} ${b}V${h}H${x1}V${b}`;
                return (
                  <g
                    key={regions[index]!.id}
                    data-zao-slot="chart-mark"
                    data-zao-prism=""
                    data-state={isBuilt ? 'built' : inspected ? 'active' : 'rest'}
                    data-depth={inspected ? 'shown' : undefined}
                  >
                    {inspected && (
                      <>
                        <path
                          data-zao-slot="chart-prism-top"
                          className={isBuilt ? 'chart-prism-plane-top' : 'chart-prism-ground'}
                          d={topPlane}
                        />
                        <path
                          data-zao-slot="chart-prism-side"
                          className={isBuilt ? 'chart-prism-plane-side' : 'chart-prism-ground'}
                          d={sidePlane}
                        />
                        <path
                          data-zao-slot="chart-prism-edges"
                          className={isBuilt ? 'chart-prism-edges is-built' : 'chart-prism-edges'}
                          d={edges}
                        />
                      </>
                    )}
                    <path
                      data-zao-slot="chart-prism-face"
                      data-chart-ink={isBuilt || inspected ? 'data' : 'muted'}
                      data-chart-fill={isBuilt ? '' : undefined}
                      className={isBuilt ? undefined : 'chart-prism-ground'}
                      d={front}
                      fill={isBuilt ? 'var(--zao-color-fg-default)' : undefined}
                      stroke={
                        isBuilt || inspected
                          ? 'var(--zao-color-fg-default)'
                          : 'var(--zao-color-fg-muted)'
                      }
                      strokeWidth="1"
                    />
                    <ChartLabel x={center} y={labelY} strong={isBuilt || inspected}>
                      {label}
                    </ChartLabel>
                    {isBuilt && (
                      <AccentSquare
                        x={center - (label.length * captionAdvance) / 2 - fen - 3}
                        y={labelY - 4}
                      />
                    )}
                    <ChartLabel x={center} y={baseline + 20} strong={inspected}>
                      {regions[index]!.id}
                    </ChartLabel>
                  </g>
                );
              })}
              {/* References stay in the front plane: drawn over every prism (P6). */}
              <line
                data-zao-slot="chart-reference"
                data-chart-ink="muted"
                x1={left}
                x2={right}
                y1={averageY}
                y2={averageY}
                stroke="var(--zao-color-fg-muted)"
                strokeWidth="1"
                strokeDasharray={fittedDash(right - left)}
              />
              <ChartLabel x={right} y={averageY - 6} anchor="end">
                avg {average}
              </ChartLabel>
            </>
          )}
        </svg>
        {!drawing && (
          <ChartInspector
            inspection={inspection}
            data={data}
            width={width}
            height={height}
            name="calls by region"
          />
        )}
      </div>
    </ChartFrame>
  );
}
