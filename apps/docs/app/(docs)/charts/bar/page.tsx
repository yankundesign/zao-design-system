import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Bar chart' };

export default function BarChartPage() {
  return <ChartDetail chart="bar" />;
}
