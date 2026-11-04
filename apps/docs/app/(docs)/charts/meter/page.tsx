import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Meter chart' };

export default function MeterChartPage() {
  return <ChartDetail chart="meter" />;
}
