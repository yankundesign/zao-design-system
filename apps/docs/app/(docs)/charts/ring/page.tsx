import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Ring chart' };

export default function RingChartPage() {
  return <ChartDetail chart="ring" />;
}
