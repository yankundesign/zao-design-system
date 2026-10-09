import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Histogram chart' };

export default function HistogramChartPage() {
  return <ChartDetail chart="histogram" />;
}
