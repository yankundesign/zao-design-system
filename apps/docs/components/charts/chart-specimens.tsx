'use client';

import { StorageRingStudy } from '../storage-ring-study';
import { BarChart } from './bar-chart';
import { HeatmapChart } from './heatmap-chart';
import { HistogramChart } from './histogram-chart';
import { LineChart } from './line-chart';
import type { ChartId } from './chart-ids';

export function ChartSpecimen({ chart, compact = false }: { chart: ChartId; compact?: boolean }) {
  switch (chart) {
    case 'ring':
      return (
        <div data-zao-specimen="ring" className={compact ? 'min-w-0' : 'max-w-sm min-w-0'}>
          <StorageRingStudy />
        </div>
      );
    case 'bar':
      return <BarChart compact={compact} />;
    case 'line':
      return <LineChart compact={compact} />;
    case 'heatmap':
      return <HeatmapChart compact={compact} />;
    case 'histogram':
      return <HistogramChart compact={compact} />;
  }
}
