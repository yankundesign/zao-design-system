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

/** A second form shown in its own section on a chart's page (charts wave 2). */
export type ChartForm = 'prism' | 'forecast' | 'compare';
