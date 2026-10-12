import type { Page } from '@playwright/test';

/**
 * How many rules the Quiet instrument study stylesheet applied to the page. Since the Oct 11
 * color promotion the study declares no custom properties of its own, so a published-only run
 * is recognized by its empty study sheet rather than by a missing color role.
 */
export function studyRuleCount(page: Page) {
  return page.evaluate(() =>
    Array.from(document.styleSheets)
      .filter((sheet) => sheet.href?.includes('/api/style-studies/quiet-instrument/css'))
      .reduce((total, sheet) => total + sheet.cssRules.length, 0),
  );
}
