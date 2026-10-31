'use client';

import { MeterStates } from './meter-chart';
import { ShareStates } from './share-strip';
import type { ChartId } from './chart-ids';

export function ChartStates({ chart }: { chart: ChartId }) {
  if (chart === 'meter') return <MeterStates />;
  if (chart === 'share') return <ShareStates />;
  return null;
}
