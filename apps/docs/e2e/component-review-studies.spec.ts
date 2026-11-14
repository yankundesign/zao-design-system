import { expect, test } from '@playwright/test';

/*
 * The private studies for the component review's wave 2 gates. These cases only keep the page
 * working while Yankun compares the options; delete a case with its section once its gate is
 * decided.
 */

test('the studies page shows each open gate with today beside the proposal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/studies/component-review');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Studies to choose from' }),
  ).toBeVisible();
  const studies = page.locator('[data-cr-study]');
  await expect(studies).toHaveCount(6);
  for (const study of await studies.all()) {
    expect(await study.locator('[data-cr-option]').count()).toBeGreaterThanOrEqual(2);
  }
  // Unlisted: the docs nav does not link to it.
  await expect(page.locator('nav a[href="/studies/component-review"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('hold to approve records only a completed hold, by pointer or keyboard', async ({ page }) => {
  await page.goto('/studies/component-review');
  const gate = page.locator('[data-cr-study="CR18 · G1"] [data-cr-option]').nth(1);
  const action = gate.getByRole('button', { name: 'Hold to remove 14 seats' });
  await action.scrollIntoViewIfNeeded();
  const record = gate.locator('.cr-gate-record');

  // A short press approves nothing.
  await action.hover();
  await page.mouse.down();
  await expect(gate.locator('.cr-gate-row')).toHaveAttribute('data-cr-holding', '');
  await page.mouse.up();
  await expect(gate.locator('.cr-gate-row')).not.toHaveAttribute('data-cr-holding', '');
  await expect(record).toHaveCount(0);

  // A completed hold records the decision and moves focus to it.
  await page.mouse.down();
  await expect(record).toContainText('Removed 14 seats');
  await page.mouse.up();
  await expect(record).toBeFocused();
  await expect(gate.locator('.cr-seal')).toHaveAttribute('data-cr-printed', '');

  await gate.getByRole('button', { name: 'Reset', exact: true }).click();
  await action.focus();
  await page.keyboard.down('Space');
  await expect(record).toContainText('Removed 14 seats');
  await page.keyboard.up('Space');
});

test('a dragged Switch face settles on the nearer end, and a press still toggles', async ({
  page,
}) => {
  await page.goto('/studies/component-review');
  const control = page
    .locator('[data-cr-study="CR9"] [data-cr-option]')
    .nth(1)
    .locator('.switch-construction');
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + 12, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 18, y, { steps: 3 });
  await page.mouse.up();
  await expect(control).not.toHaveAttribute('data-checked', '');

  await page.mouse.move(box.x + 12, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, y, { steps: 4 });
  await page.mouse.up();
  await expect(control).toHaveAttribute('data-checked', '');

  await control.click();
  await expect(control).not.toHaveAttribute('data-checked', '');
});
