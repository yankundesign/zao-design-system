import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Line chart' };

export default function LineChartPage() {
  return <ChartDetail chart="line" />;
}
