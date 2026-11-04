import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Heatmap chart' };

export default function HeatmapChartPage() {
  return <ChartDetail chart="heatmap" />;
}
