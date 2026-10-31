'use client';

import { StorageRingStudy } from '../storage-ring-study';
import { BarChart } from './bar-chart';
import { HeatmapChart } from './heatmap-chart';
import { HistogramChart } from './histogram-chart';
import { LineChart } from './line-chart';
import { MeterChart } from './meter-chart';
import { ShareStrip } from './share-strip';
import type { ChartId } from './chart-ids';

export function ChartSpecimen({
  chart,
  compact = false,
  drawing = false,
}: {
  chart: ChartId;
  compact?: boolean;
  drawing?: boolean;
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
      return <BarChart compact={compact} drawing={drawing} />;
    case 'line':
      return <LineChart compact={compact} drawing={drawing} />;
    case 'heatmap':
      return <HeatmapChart compact={compact} drawing={drawing} />;
    case 'histogram':
      return <HistogramChart compact={compact} drawing={drawing} />;
  }
}
