import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openTable(page: Page) {
  await page.goto('/components/table?style=quiet-instrument');
  await expect(page.getByRole('heading', { level: 1, name: 'Table', exact: true })).toBeVisible();
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.addStyleTag({ content: css });
  await page.evaluate(async () => document.fonts.ready);
  return page.locator('[data-zao-specimen="table"]');
}

test('Table is linked from docs and exposes native headers and sorting', async ({ page }) => {
  await page.goto('/components/button');
  await page
    .getByRole('navigation', { name: 'Docs' })
    .getByRole('link', { name: 'Table', exact: true })
    .click();
  const preview = await openTable(page);
  const table = preview.getByRole('table', { name: 'Recent requests', exact: true });
  await expect(table).toHaveCount(1);
  await expect(preview.getByRole('grid')).toHaveCount(0);
  await expect(table.locator('tbody tr')).toHaveCount(6);
  const itemsHeader = table.getByRole('columnheader').filter({ hasText: 'Items' });
  const columnWidths = await table
    .locator('thead th')
    .evaluateAll((heads) => heads.map((head) => head.getBoundingClientRect().width));
  await table.getByRole('button', { name: 'Sort by items, ascending' }).click();
  await expect(itemsHeader).toHaveAttribute('aria-sort', 'ascending');
  expect(
    await table
      .locator('thead th')
      .evaluateAll((heads) => heads.map((head) => head.getBoundingClientRect().width)),
  ).toEqual(columnWidths);
  let counts = await table
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) => Number(row.children[4]!.textContent?.replaceAll(',', ''))),
    );
  expect(counts).toEqual([...counts].sort((a, b) => a - b));
  await table.getByRole('button', { name: 'Sort by items, descending' }).click();
  await expect(itemsHeader).toHaveAttribute('aria-sort', 'descending');
  counts = await table
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) => Number(row.children[4]!.textContent?.replaceAll(',', ''))),
    );
  expect(counts).toEqual([...counts].sort((a, b) => b - a));
});

test('selection survives sorting and compare reflects the selected records', async ({ page }) => {
  const preview = await openTable(page);
  const all = preview.getByRole('checkbox', { name: 'Select all requests', exact: true });
  await expect(
    preview.getByRole('button', { name: 'Compare selected', exact: true }),
  ).toBeDisabled();
  await preview.getByRole('checkbox', { name: 'Select Access review', exact: true }).check();
  await expect(all).toBeChecked({ indeterminate: true });
  await preview.getByRole('checkbox', { name: 'Select Usage summary', exact: true }).check();
  await preview.getByRole('button', { name: 'Sort by items, ascending' }).click();
  await expect(
    preview.getByRole('checkbox', { name: 'Select Access review', exact: true }),
  ).toBeChecked();
  await expect(
    preview.getByRole('checkbox', { name: 'Select Usage summary', exact: true }),
  ).toBeChecked();
  await expect(preview.getByRole('status')).toContainText('2 of 6 requests selected');
  await preview.getByRole('button', { name: 'Compare selected', exact: true }).click();
  await expect(
    preview.getByRole('heading', { name: 'Selected requests', exact: true }),
  ).toBeVisible();
  await expect(preview.getByText('1,108', { exact: false }).last()).toBeVisible();
  await all.check();
  await expect(all).toBeChecked();
  await expect(preview.getByRole('status')).toContainText('6 of 6 requests selected');
  await preview.getByRole('button', { name: 'Table actions', exact: true }).click();
  await preview.getByRole('menuitem', { name: 'Clear selection', exact: true }).click();
  await expect(all).not.toBeChecked();
  await expect(preview.getByRole('status')).toContainText('0 of 6 requests selected');
  await expect(
    preview.getByRole('button', { name: 'Compare selected', exact: true }),
  ).toBeDisabled();
});

test('keyboard can select, sort, and dismiss the attached Menu', async ({ page }) => {
  const preview = await openTable(page);
  const checkbox = preview.getByRole('checkbox', { name: 'Select Access review', exact: true });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  const sort = preview.getByRole('button', { name: 'Sort by request, ascending' });
  await sort.focus();
  await page.keyboard.press('Enter');
  await expect(preview.getByRole('columnheader').filter({ hasText: 'Request' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  const trigger = preview.getByRole('button', { name: 'Table actions', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(preview.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(preview.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('narrow Table scrolls within its frame and keeps every column', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  const preview = await openTable(page);
  const scroll = preview.getByRole('region', { name: 'Recent requests scroll area', exact: true });
  await expect(scroll).toHaveAttribute('tabindex', '0');
  const sizes = await scroll.evaluate((node) => ({
    width: node.clientWidth,
    content: node.scrollWidth,
  }));
  expect(sizes.content).toBeGreaterThan(sizes.width);
  const documentFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(documentFits).toBe(true);
  await expect(preview.getByRole('columnheader').filter({ hasText: 'Status' })).toHaveCount(1);
  await scroll.focus();
  await page.keyboard.press('End');
  await expect(scroll).toBeFocused();
});

for (const finish of [
  { name: 'Su light', theme: 'su', mode: 'light' },
  { name: 'Su dark', theme: 'su', mode: 'dark' },
] as const) {
  test(`${finish.name}: Table stays stationary and retains accessible contrast`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const preview = await openTable(page);
    await page
      .getByRole('radiogroup', { name: 'Mode' })
      .getByRole('radio', { name: finish.mode === 'light' ? 'Light' : 'Dark' })
      .click();
    await expect(page.locator('.study')).toHaveAttribute('data-zao-theme', finish.theme);
    await expect(page.locator('.study')).toHaveAttribute('data-zao-mode', finish.mode);
    const row = preview
      .getByRole('table', { name: 'Recent requests', exact: true })
      .locator('tbody tr')
      .first();
    const before = await row.boundingBox();
    await row.hover();
    expect(await row.boundingBox()).toEqual(before);
    await expect.poll(() => row.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
    const hoverResult = await new AxeBuilder({ page })
      .include('[data-zao-specimen="table"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(hoverResult.violations).toEqual([]);
    await preview.getByRole('checkbox', { name: 'Select all requests', exact: true }).check();
    const result = await new AxeBuilder({ page })
      .include('[data-zao-specimen="table"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
