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

export function initialLatency() {
  const random = seeded(23);
  const current: (number | null)[] = [];
  const previous: number[] = [];
  for (let index = 0; index < latencySamples; index += 1) {
    const value = latencyAt(index, random);
    current.push(missingSamples.has(index) ? null : value);
    previous.push(Math.round(108 + 34 * Math.sin(index / 6.5 + 0.5) + 14 * random()));
  }
  return { current, previous };
}

export function stepLatency(
  series: { current: (number | null)[]; previous: number[] },
  random = Math.random,
) {
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
  };
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

function sampleSessionMinutes(random: () => number) {
  // Log-normal around 12 minutes with a long tail.
  const normal = (random() + random() + random() + random() - 2) * 1.2;
  return Math.exp(Math.log(11) + 0.72 * normal);
}

export function initialSessions() {
  const random = seeded(7);
  const bins = new Array<number>(sessionBins).fill(0);
  let latest = 0;
  for (let index = 0; index < 1400; index += 1) {
    const bin = Math.floor(sampleSessionMinutes(random) / sessionBinMinutes);
    if (bin < sessionBins) {
      bins[bin]! += 1;
      latest = bin;
    }
  }
  return { bins, latest };
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
