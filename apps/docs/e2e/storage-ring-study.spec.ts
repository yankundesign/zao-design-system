import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const finishes = [
  { name: 'Su light', theme: 'su', mode: 'light' },
  { name: 'Su dark', theme: 'su', mode: 'dark' },
] as const;

async function openRing(page: Page, theme: 'su' = 'su', mode: 'light' | 'dark' = 'light') {
  await page.goto('/components/card');

  await page.getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true }).click();
  await page.addStyleTag({
    content: await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    ),
  });
  await page.mouse.move(0, 0);
  return page.locator('[data-zao-slot="storage-study"]').first();
}

async function coordinates(ring: Locator) {
  return ring
    .locator('[data-zao-slot="storage-mark"]')
    .evaluateAll((marks) =>
      marks.map((mark) => ['x1', 'y1', 'x2', 'y2'].map((name) => mark.getAttribute(name))),
    );
}

async function expectReading(ring: Locator, used: number) {
  await expect(
    ring.getByRole('img', { name: `Storage use at ${used} percent`, exact: true }),
  ).toBeVisible();
  await expect(ring.locator('.figure-mark').getByText(`${used}%`, { exact: true })).toBeVisible();
  await expect(ring.getByText(`${100 - used}% available`, { exact: true })).toBeVisible();
  await expect(ring.locator('[data-zao-slot="storage-mark"][data-state="used"]')).toHaveCount(used);
  await expect(ring.locator('[data-zao-slot="storage-mark"][data-state="available"]')).toHaveCount(
    100 - used,
  );
}

for (const finish of finishes) {
  test(`${finish.name}: inspect and select meaningful storage regions without moving the data`, async ({
    page,
  }) => {
    const ring = await openRing(page, finish.theme, finish.mode);
    const chart = ring.locator('[data-zao-slot="storage-chart"]');
    const originalCoordinates = await coordinates(ring);
    const detail = ring.locator('[data-zao-slot="storage-detail"]');
    await expectReading(ring, 68);
    await expect(ring.getByText('Illustrative data', { exact: true })).toHaveCount(0);
    await expect(ring.getByRole('button', { name: 'Simulate increase', exact: true })).toHaveCount(
      0,
    );
    await expect(ring.getByRole('checkbox', { name: 'Particle feedback' })).toHaveCount(0);

    await chart.hover({ position: { x: 115, y: 64 } });
    await expect(ring).toHaveAttribute('data-inspection', 'used');
    await expect(detail).toHaveText('Used capacity: 68 of 100 parts.');
    await chart.hover({ position: { x: 13, y: 64 } });
    await expect(ring).toHaveAttribute('data-inspection', 'available');
    await expect(detail).toHaveText('Available capacity: 32 of 100 parts.');

    const used = ring.getByRole('button', { name: 'Inspect used capacity', exact: true });
    const available = ring.getByRole('button', { name: 'Inspect available capacity', exact: true });
    await used.focus();
    await expect(used).toBeFocused();
    await expect(ring).toHaveAttribute('data-inspection', 'used');
    await page.keyboard.press('Enter');
    await expect(used).toHaveAttribute('aria-pressed', 'true');
    await expect(ring.getByRole('status')).toHaveText('Selected used capacity: 68%.');
    await page.mouse.move(0, 0);
    await page.getByRole('radio', { name: 'Light', exact: true }).focus();
    await expect(ring).toHaveAttribute('data-inspection', 'used');

    await available.focus();
    await page.keyboard.press('Space');
    await expect(available).toHaveAttribute('aria-pressed', 'true');
    await expect(used).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Escape');
    await expect(available).toBeFocused();
    await expect(available).toHaveAttribute('aria-pressed', 'false');
    await expect(ring).toHaveAttribute('data-inspection', 'none');
    await expect(detail).toHaveText('Total capacity: 100 parts.');
    expect(await coordinates(ring)).toEqual(originalCoordinates);

    for (const control of [used, available]) {
      const box = await control.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    }
    const accessibility = await new AxeBuilder({ page })
      .include('[data-zao-slot="storage-study"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test('reduced motion keeps inspection while removing the tracing animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ring = await openRing(page);
  await ring.getByRole('button', { name: 'Inspect available capacity', exact: true }).focus();
  await expect(ring.locator('[data-zao-slot="storage-detail"]')).toHaveText(
    'Available capacity: 32 of 100 parts.',
  );
  await expect(ring.locator('[data-zao-slot="storage-inspection-guide"]')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expectReading(ring, 68);
  await expect(ring.locator('[data-zao-slot="storage-mark"]').first()).toHaveCSS(
    'transition-property',
    'none',
  );
  // Global reduced-motion control transitions finish on the next browser frame.
  await expect
    .poll(() => ring.evaluate((node) => node.getAnimations({ subtree: true }).length))
    .toBe(0);
});

test('touch inspection works on a small screen and the guideline is reachable from Card', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 320, height: 800 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await page.goto('/components/card');
    // The docs comparison keeps fixed sample widths in its named scroll regions.
    const ring = page.locator('[data-zao-slot="storage-study"]').first();
    const available = ring.getByRole('button', { name: 'Inspect available capacity', exact: true });
    await available.tap();
    await expect(available).toHaveAttribute('aria-pressed', 'true');
    await expect(ring.locator('[data-zao-slot="storage-detail"]')).toHaveText(
      'Available capacity: 32 of 100 parts.',
    );
    expect(await ring.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('link', { name: 'Read the data visualization guideline' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Data visualization', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'First study: storage ring', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    await context.close();
  }
});
