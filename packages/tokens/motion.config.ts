/**
 * Motion inputs for each finish.
 *
 * Motion is derived, not picked (finish plan V5, V6, Oct 11):
 *
 * - Curves come from the Song roof-fold rule, 举折. Raise the ridge, then fold: the purlin
 *   below the ridge drops one tenth of the rise below the straight chord, and each purlin
 *   further down drops half as much as the one above, measured from a new chord each time.
 *   The roof profile from eave to ridge is the exit curve; turned 180° it is the enter curve.
 * - Durations come from the timber grades in `src/base/grade.tokens.json`: a grade's 材
 *   height in 寸 times `gradeUnit`.
 *
 * Change a number here, run `pnpm motion`, and `src/motion/<finish>.generated.tokens.json`
 * is regenerated.
 */

export interface MotionInput {
  /** Rafters across the whole hall (both slopes). Even, at least 4. Ten is a 十架椽 hall. */
  rafters: number;
  /** Milliseconds per 寸 of 材 height. */
  gradeUnit: number;
  /** Discrete ink bands for safety holds and seal impressions. */
  bands: { hold: number; impress: number };
}

export const motion: Record<'su' | 'yu', MotionInput> = {
  su: { rafters: 10, gradeUnit: 30, bands: { hold: 4, impress: 3 } },
  // Completeness entry so every finish ships the same motion tokens; not Yu design work.
  yu: { rafters: 10, gradeUnit: 30, bands: { hold: 4, impress: 3 } },
};
