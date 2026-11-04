/**
 * Illustrative data for the docs charts. Every series is deterministic at rest so
 * server and client render the same reading; only the labeled simulation varies it.
 */

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/* Bar: calls by region over the last 24 hours. */
export const regions = [
  { id: 'us-w', name: 'US West' },
  { id: 'us-e', name: 'US East' },
  { id: 'eu', name: 'Europe' },
  { id: 'apac', name: 'Asia Pacific' },
  { id: 'latam', name: 'Latin America' },
  { id: 'mea', name: 'Middle East and Africa' },
] as const;
export const regionCalls = [318, 276, 412, 245, 138, 96];
/** Fixed scale so live updates never rescale the chart. */
export const regionScaleMax = 500;

export function stepRegionCalls(values: readonly number[], random = Math.random) {
  return values.map((value) =>
    Math.round(Math.min(regionScaleMax - 20, Math.max(40, value + (random() - 0.5) * 36))),
  );
}

/* Line: p95 latency, one sample every 30 minutes for 24 hours. */
export const latencySamples = 48;
export const latencyScaleMax = 250;
const missingSamples = new Set([20, 21]);

function latencyAt(index: number, random: () => number) {
  return Math.round(118 + 38 * Math.sin(index / 6.5) + 18 * random() + (index > 36 ? 22 : 0));
}

/** Something that happened to the service, attached to the sample it falls on (wave 2, E1). */
export interface LatencyEvent {
  /** The sample the event falls on; it scrolls left with its sample. */
  index: number;
  /** Short label in the event lane. */
  label: string;
  /** Full name, for the readout's accessible name and the data view. */
  name: string;
  /** How the summary refers to it. */
  noun: string;
}

const latencyEvents: readonly LatencyEvent[] = [
  {
    index: 19,
    label: 'restart',
    name: 'Metrics collector restarted',
    noun: 'the metrics collector restart',
  },
  { index: 37, label: 'deploy', name: 'Deployed api 4.12', noun: 'the api 4.12 deploy' },
];

export interface LatencySeries {
  current: (number | null)[];
  previous: number[];
  events: readonly LatencyEvent[];
}

export function initialLatency(): LatencySeries {
  const random = seeded(23);
  const current: (number | null)[] = [];
  const previous: number[] = [];
  for (let index = 0; index < latencySamples; index += 1) {
    const value = latencyAt(index, random);
    current.push(missingSamples.has(index) ? null : value);
    previous.push(Math.round(108 + 34 * Math.sin(index / 6.5 + 0.5) + 14 * random()));
  }
  return { current, previous, events: latencyEvents };
}

export function stepLatency(series: LatencySeries, random = Math.random): LatencySeries {
  const last = [...series.current].reverse().find((value) => value !== null) ?? 140;
  const next = Math.round(
    Math.min(latencyScaleMax - 20, Math.max(60, last + (random() - 0.5) * 34)),
  );
  const prevLast = series.previous[series.previous.length - 1] ?? 120;
  const prevNext = Math.round(
    Math.min(latencyScaleMax - 30, Math.max(60, prevLast + (random() - 0.5) * 20)),
  );
  return {
    current: [...series.current.slice(1), next],
    previous: [...series.previous.slice(1), prevNext],
    events: series.events
      .map((event) => ({ ...event, index: event.index - 1 }))
      .filter((event) => event.index >= 0),
  };
}

/** The forecast's horizon: 4 hours of 30-minute samples (wave 2, E3). */
export const forecastSamples = 8;
/** The forecast's shift is today's mean difference from yesterday over this many samples. */
const forecastWindow = 12;

/**
 * Same time yesterday, shifted by today's mean difference from yesterday over the last
 * 6 hours (E3). Yesterday at `now + k` samples is today's sample `k - 1`, 24 hours earlier.
 * Without at least half the window's readings there is no forecast.
 */
export function forecastLatency(series: LatencySeries) {
  const last = series.current.length - 1;
  const differences: number[] = [];
  for (let index = last - forecastWindow + 1; index <= last; index += 1) {
    const value = series.current[index];
    if (value !== null && value !== undefined) differences.push(value - series.previous[index]!);
  }
  if (differences.length < forecastWindow / 2) return null;
  const shift = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const values = Array.from({ length: forecastSamples }, (_, step) => {
    const yesterday = series.current[step];
    return yesterday === null || yesterday === undefined ? null : Math.round(yesterday + shift);
  });
  return { shift, values };
}

/* Heatmap: events per hour this week. "Now" is Friday 15:00. */
export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const weekdayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export const nowCell = { day: 4, hour: 15 } as const;
/** Lower bounds of the five gray steps. */
export const activitySteps = [0, 10, 20, 35, 50] as const;

export function isFutureCell(day: number, hour: number) {
  return day > nowCell.day || (day === nowCell.day && hour > nowCell.hour);
}

export function initialActivity() {
  const random = seeded(41);
  const weekdayLoad = [0.86, 1, 0.94, 0.9, 0.74, 0.2, 0.16];
  return weekdays.map((_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      if (isFutureCell(day, hour)) return null;
      const shape =
        Math.exp(-((hour - 10) ** 2) / 6) +
        0.8 * Math.exp(-((hour - 15) ** 2) / 5) -
        0.25 * Math.exp(-((hour - 12.5) ** 2) / 1.2);
      const value = Math.max(0, Math.round(62 * weekdayLoad[day]! * shape + 6 * random()));
      return day === nowCell.day && hour === nowCell.hour ? Math.round(value * 0.55) : value;
    }),
  );
}

export function activityStep(value: number) {
  let step = 0;
  activitySteps.forEach((bound, index) => {
    if (value >= bound) step = index;
  });
  return step;
}

/* Histogram: session length in 30 second bins up to 60 minutes. */
export const sessionBins = 120;
export const sessionBinMinutes = 0.5;

function sampleSessionMinutes(random: () => number, typical = 11) {
  // Log-normal around the typical length with a long tail.
  const normal = (random() + random() + random() + random() - 2) * 1.2;
  return Math.exp(Math.log(typical) + 0.72 * normal);
}

function sessionsFrom(seed: number, count: number, typical: number) {
  const random = seeded(seed);
  const bins = new Array<number>(sessionBins).fill(0);
  let latest = 0;
  for (let index = 0; index < count; index += 1) {
    const bin = Math.floor(sampleSessionMinutes(random, typical) / sessionBinMinutes);
    if (bin < sessionBins) {
      bins[bin]! += 1;
      latest = bin;
    }
  }
  return { bins, latest };
}

export function initialSessions() {
  return sessionsFrom(7, 1400, 11);
}

/** Last week's sessions, for the mirrored comparison (wave 2, H2). Finished: it never changes. */
export function lastWeekSessions() {
  return sessionsFrom(19, 1310, 10.2).bins;
}

export function stepSessions(series: { bins: number[]; latest: number }, random = Math.random) {
  const bins = [...series.bins];
  let latest = series.latest;
  const arrivals = 3 + Math.floor(random() * 4);
  for (let index = 0; index < arrivals; index += 1) {
    const bin = Math.floor(sampleSessionMinutes(random) / sessionBinMinutes);
    if (bin < sessionBins) {
      bins[bin]! += 1;
      latest = bin;
    }
  }
  return { bins, latest };
}

export function formatMinutes(minutes: number) {
  return Number.isInteger(minutes) ? `${minutes}` : minutes.toFixed(1);
}

/* Meter: October cloud spend against its budget, read on Oct 20 of 31 days. */
export interface SpendReading {
  /** Month-to-date spend in USD; null while unknown. */
  spent: number | null;
  /** The budget in USD. Without a positive budget there is nothing to measure against. */
  budget: number | null;
  /** An alert threshold in USD, drawn as a dashed reference when set. */
  alert?: number;
  /** Days elapsed and days in the period; the projection runs only while the period does. */
  day: number;
  days: number;
  month: string;
}

export const octoberSpend: SpendReading = {
  spent: 3720,
  budget: 6000,
  alert: 5400,
  day: 20,
  days: 31,
  month: 'Oct',
};

/** The simulation never runs spend past this share of the budget. */
export const spendCeiling = 1.25;

export function stepSpend(reading: SpendReading, random = Math.random): SpendReading {
  if (reading.spent === null || reading.budget === null) return reading;
  const next = Math.min(reading.budget * spendCeiling, reading.spent + 40 + random() * 120);
  return { ...reading, spent: Math.round(next) };
}

/* Share strip: storage in use by kind, in TB. Not the ring's 68%. */
export interface SharePart {
  id: string;
  name: string;
  size: number;
  /** Takes a plural verb in the summary. */
  plural: boolean;
}

export const storageKinds: readonly SharePart[] = [
  { id: 'media', name: 'Media', size: 1.02, plural: false },
  { id: 'backups', name: 'Backups', size: 0.69, plural: true },
  { id: 'documents', name: 'Documents', size: 0.45, plural: true },
  { id: 'logs', name: 'Logs', size: 0.31, plural: true },
  { id: 'other', name: 'Other', size: 0.01, plural: false },
];

/**
 * Whole strokes per part by the largest-remainder method, so the strip always totals `count`
 * strokes. Shares are never negative.
 */
export function wholeShares(sizes: readonly number[], count: number) {
  if (process.env.NODE_ENV !== 'production' && sizes.some((size) => size < 0)) {
    throw new Error('A share strip part cannot be negative.');
  }
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (!(total > 0)) return sizes.map(() => 0);
  const exact = sizes.map((size) => (size / total) * count);
  const whole = exact.map(Math.floor);
  let left = count - whole.reduce((sum, value) => sum + value, 0);
  exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach(({ index }) => {
      if (left <= 0) return;
      whole[index]! += 1;
      left -= 1;
    });
  return whole;
}
