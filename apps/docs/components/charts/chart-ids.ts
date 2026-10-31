export type ChartId = 'ring' | 'share' | 'meter' | 'bar' | 'line' | 'heatmap' | 'histogram';

/** Grouped by question (C1): the first three answer "how much of a whole?". */
export const chartOrder: readonly ChartId[] = [
  'ring',
  'share',
  'meter',
  'bar',
  'line',
  'heatmap',
  'histogram',
];
