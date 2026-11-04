'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Card } from '@zao/react';
import { BarChart } from '../charts/bar-chart';
import { HeatmapChart } from '../charts/heatmap-chart';
import { HistogramChart } from '../charts/histogram-chart';
import { LineChart } from '../charts/line-chart';
import { PrismBarChart } from '../charts/prism-bar-chart';
import { StorageRingStudy } from '../storage-ring-study';
import type { PlateDefinition } from './plates';

/** Every chart plate arrives as its drawing, then builds when its readings land (wave 1, C3). */
const arrivalMs = 1200;

function useArrival() {
  const [drawing, setDrawing] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setDrawing(false), arrivalMs);
    return () => window.clearTimeout(timer);
  }, []);
  return drawing;
}

/** A chart sits on a Card, one step above the plate's recessed ground. */
function ChartCard({ drawing, children }: { drawing: boolean; children: ReactNode }) {
  return (
    <Card className="gallery-demo" drawing={drawing} drawingLabel="Loading readings">
      {children}
    </Card>
  );
}

function PrismDemo() {
  const drawing = useArrival();
  return (
    <ChartCard drawing={drawing}>
      <PrismBarChart compact drawing={drawing} />
    </ChartCard>
  );
}

function RingDemo() {
  const drawing = useArrival();
  return (
    <ChartCard drawing={drawing}>
      <StorageRingStudy drawing={drawing} framed />
    </ChartCard>
  );
}

function LineDemo() {
  const drawing = useArrival();
  return (
    <ChartCard drawing={drawing}>
      <LineChart compact drawing={drawing} />
    </ChartCard>
  );
}

function HeatmapDemo() {
  const drawing = useArrival();
  return (
    <ChartCard drawing={drawing}>
      <HeatmapChart compact drawing={drawing} />
    </ChartCard>
  );
}

function HistogramDemo() {
  const drawing = useArrival();
  return (
    <ChartCard drawing={drawing}>
      <HistogramChart compact drawing={drawing} />
    </ChartCard>
  );
}

function BarDemo() {
  const drawing = useArrival();
  return (
    <ChartCard drawing={drawing}>
      <BarChart compact drawing={drawing} />
    </ChartCard>
  );
}

/** Six charts in Yankun's order (Oct 31): the prism form first, needles last. */
export const chartPlates: readonly PlateDefinition[] = [
  {
    id: 'bar-prism',
    name: 'Bar · prism form',
    verb: 'Raise',
    note: 'Flat at rest. Hover raises a bar in full; a click keeps it raised while you look at the others.',
    Demo: PrismDemo,
    replayOnView: true,
  },
  {
    id: 'ring',
    name: 'Ring',
    verb: 'Measure',
    note: 'One share of a whole in 100 marks. Point at the ring to measure a region.',
    Demo: RingDemo,
    replayOnView: true,
  },
  {
    id: 'line',
    name: 'Line',
    verb: 'Trace',
    note: 'A trace over one faint stroke per sample. Events tick the ruler, and the readout names them.',
    Demo: LineDemo,
    replayOnView: true,
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
    verb: 'Scan',
    note: 'Five gray steps across days and hours. Brackets mark the current hour; a dot is no data yet.',
    Demo: HeatmapDemo,
    replayOnView: true,
  },
  {
    id: 'histogram',
    name: 'Histogram',
    verb: 'Sweep',
    note: 'One hairline per bin, with dashed p50, p95 and p99. Inspecting a bin mutes the rest.',
    Demo: HistogramDemo,
    replayOnView: true,
  },
  {
    id: 'bar',
    name: 'Bar',
    verb: 'Compare',
    note: 'Needles on one baseline against a dashed average. Ink follows the bar you point at.',
    Demo: BarDemo,
    replayOnView: true,
  },
];
