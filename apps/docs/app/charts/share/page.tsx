import type { Metadata } from 'next';
import { ChartDetail } from '@/components/charts/chart-detail';

export const metadata: Metadata = { title: 'Share strip chart' };

export default function ShareStripChartPage() {
  return <ChartDetail chart="share" />;
}
