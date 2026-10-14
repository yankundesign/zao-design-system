/** Shared serializable role vocabulary for the docs server page and its client tuner. */
export const motionRoles = [
  'lift',
  'seat',
  'slide',
  'reveal',
  'reveal-exit',
  'hold',
  'impress',
] as const;
export type MotionRole = (typeof motionRoles)[number];
export type MotionValues = Record<MotionRole, { duration: number; easing: string }>;
