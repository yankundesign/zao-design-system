'use client';

import { StorageRingStudy } from '../storage-ring-study';
import { BarChart } from './bar-chart';
import { HeatmapChart } from './heatmap-chart';
import { HistogramChart, MirroredHistogram } from './histogram-chart';
import { LineChart } from './line-chart';
import { MeterChart } from './meter-chart';
import { PrismBarChart } from './prism-bar-chart';
import { ShareStrip } from './share-strip';
import type { ChartForm, ChartId } from './chart-ids';

export function ChartSpecimen({
  chart,
  compact = false,
  drawing = false,
  form,
}: {
  chart: ChartId;
  compact?: boolean;
  drawing?: boolean;
  /** A second form of the chart, shown in its own section on the chart's page. */
  form?: ChartForm;
}) {
  switch (chart) {
    case 'ring':
      return (
        <div data-zao-specimen="ring" className={compact ? 'min-w-0' : 'max-w-sm min-w-0'}>
          <StorageRingStudy drawing={drawing} dataView={!compact} />
        </div>
      );
    case 'share':
      return <ShareStrip compact={compact} drawing={drawing} />;
    case 'meter':
      return <MeterChart compact={compact} drawing={drawing} />;
    case 'bar':
      if (form === 'prism') return <PrismBarChart drawing={drawing} />;
      return <BarChart compact={compact} drawing={drawing} />;
    case 'line':
      return <LineChart compact={compact} drawing={drawing} forecast={form === 'forecast'} />;
    case 'heatmap':
      return <HeatmapChart compact={compact} drawing={drawing} />;
    case 'histogram':
      if (form === 'compare') return <MirroredHistogram drawing={drawing} />;
      return <HistogramChart compact={compact} drawing={drawing} />;
  }
}
