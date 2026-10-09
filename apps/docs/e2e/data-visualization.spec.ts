import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const finishes = [
  { name: 'Su light', mode: 'Light' },
  { name: 'Su dark', mode: 'Dark' },
] as const;

const charts = [
  {
    slug: 'bar',
    title: 'Calls by region',
    series: 'calls.by_region',
    unit: 'calls',
    next: 'ArrowRight',
    first: /^us-w · 318 calls · \+70 vs avg$/,
    second: /^us-e · 276 calls · \+28 vs avg$/,
  },
  {
    slug: 'line',
    title: 'p95 latency, last 24 hours',
    series: 'latency.p95',
    unit: 'ms',
    next: 'ArrowRight',
    first: /^−23\.5 h · \d+ ms · prev \d+ ms$/,
    second: /^−23 h · \d+ ms · prev \d+ ms$/,
  },
  {
    slug: 'heatmap',
    title: 'Events per hour',
    series: 'events.by_hour',
    unit: 'events',
    next: 'ArrowDown',
    first: /^mon 00:00 · \d+ events$/,
    second: /^tue 00:00 · \d+ events$/,
  },
  {
    slug: 'histogram',
    title: 'Session length',
    series: 'session.length',
    unit: 'sessions',
    next: 'ArrowRight',
    first: /^0–[\d.]+ min · \d+ sessions$/,
    second: /^[\d.]+–[\d.]+ min · \d+ sessions$/,
  },
] as const;

async function openChart(page: Page, slug: string, mode: 'Light' | 'Dark' = 'Light') {
  await page.goto(`/charts/${slug}`);
  await page.getByRole('radio', { name: mode, exact: true }).click();
  await page.mouse.move(0, 0);
  return page.locator(`figure[data-zao-chart="${slug}"]`);
}

/** Quantitative geometry only; inspection may change ink, never position or length. */
async function geometry(figure: Locator) {
  return figure
    .locator('[data-zao-slot="chart-mark"], [data-zao-slot="chart-mark"] *')
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        ['x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'd'].map((name) =>
          node.getAttribute(name),
        ),
      ),
    );
}

test('the Charts section lists every chart after Components', async ({ page }) => {
  await page.goto('/charts');
  const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
  const sections = nav.locator('[data-nav-section]');
  await expect(sections.last()).toHaveAttribute('data-nav-section', 'charts');
  const section = nav.locator('[data-nav-section="charts"]');
  for (const [label, href] of [
    ['Overview', '/charts'],
    ['Ring', '/charts/ring'],
    ['Bar', '/charts/bar'],
    ['Line', '/charts/line'],
    ['Heatmap', '/charts/heatmap'],
    ['Histogram', '/charts/histogram'],
  ] as const) {
    await expect(section.getByRole('link', { name: label, exact: true })).toHaveAttribute(
      'href',
      href,
    );
  }
  await expect(section.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.locator('[data-zao-slot="chart-rules"] li')).toHaveCount(5);
  const gallery = page.locator('[data-zao-gallery-item]');
  await expect(gallery).toHaveCount(5);
  for (const slug of ['bar', 'line', 'heatmap', 'histogram']) {
    const item = page.locator(`[data-zao-gallery-item="${slug}"]`);
    await expect(item.locator(`figure[data-zao-chart="${slug}"]`)).toHaveCount(1);
    await expect(item.getByRole('switch', { name: 'Simulate live updates' })).toHaveCount(0);
  }
  await expect(
    page.locator('[data-zao-gallery-item="ring"] [data-zao-slot="storage-study"]'),
  ).toHaveCount(1);
  await page.getByRole('link', { name: 'Open heatmap chart', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Heatmap', exact: true })).toBeVisible();
});

for (const finish of finishes) {
  for (const chart of charts) {
    test(`${finish.name}: ${chart.slug} names, inspects, and selects without moving data`, async ({
      page,
    }) => {
      const figure = await openChart(page, chart.slug, finish.mode);
      await expect(figure).toHaveCount(1);
      await expect(figure.getByText(chart.title, { exact: true })).toBeVisible();
      await expect(figure.locator('[data-zao-slot="chart-series"]')).toHaveText(chart.series);
      await expect(figure.locator('[data-zao-slot="chart-unit"]')).toHaveText(chart.unit);
      await expect(figure.getByText('Illustrative data', { exact: true })).toBeVisible();
      await expect(figure.locator('[data-zao-slot="chart-summary"]')).not.toBeEmpty();
      await expect(figure.locator('[data-zao-slot="chart-accent"]')).toHaveCount(1);
      const readout = figure.locator('[data-zao-slot="chart-readout"]');
      const resting = await readout.textContent();
      const original = await geometry(figure);

      // One tab stop: only the roving datum is in the tab order.
      await expect(figure.locator('[data-zao-slot="chart-datum"][tabindex="0"]')).toHaveCount(1);
      await figure.locator('[data-zao-slot="chart-datum"][tabindex="0"]').focus();
      await expect(readout).toHaveText(chart.first);
      await page.keyboard.press(chart.next);
      await expect(readout).toHaveText(chart.second);
      await page.keyboard.press('Enter');
      await expect(
        figure.locator('[data-zao-slot="chart-datum"][aria-pressed="true"]'),
      ).toHaveCount(1);
      await expect(figure.getByRole('status')).toHaveText(/^Selected .+\.$/);
      expect(await geometry(figure)).toEqual(original);

      await page.keyboard.press('Escape');
      await expect(
        figure.locator('[data-zao-slot="chart-datum"][aria-pressed="true"]'),
      ).toHaveCount(0);
      await expect(readout).toHaveText(resting!);
      await expect(figure.getByRole('status')).toHaveText('Selection cleared.');

      // Keyboard focus keeps its datum inspected; leave the chart before testing hover.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await expect(readout).toHaveText(resting!);
      const plot = await figure.locator('.chart-plot').boundingBox();
      await page.mouse.move(plot!.x + plot!.width * 0.6, plot!.y + plot!.height * 0.3);
      await expect(readout).not.toHaveText(resting!);
      await page.mouse.move(0, 0);
      await expect(readout).toHaveText(resting!);

      const accessibility = await new AxeBuilder({ page })
        .include(`figure[data-zao-chart="${chart.slug}"]`)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
    });
  }
}

test('live simulation is off by default, updates discretely, and stops when switched off', async ({
  page,
}) => {
  for (const chart of charts) {
    const figure = await openChart(page, chart.slug);
    const live = page.getByRole('switch', { name: 'Simulate live updates', exact: true });
    await expect(live).not.toBeChecked();
    const svg = figure.locator('svg').first();
    const readout = figure.locator('[data-zao-slot="chart-readout"]');
    const reading = async () => `${await readout.textContent()}|${await svg.innerHTML()}`;
    const before = await reading();
    await page.waitForTimeout(1200);
    expect(await reading()).toBe(before);

    await live.click();
    await expect(live).toBeChecked();
    await expect.poll(reading, { timeout: 5000 }).not.toBe(before);
    expect(await figure.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);

    await live.click();
    await expect(live).not.toBeChecked();
    const stopped = await reading();
    await page.waitForTimeout(1500);
    expect(await reading()).toBe(stopped);
  }
});

test('the ring page keeps the storage study and links back to Card', async ({ page }) => {
  await page.goto('/charts/ring');
  const ring = page.locator('[data-zao-slot="storage-study"]');
  await expect(ring).toHaveCount(1);
  await expect(ring.locator('[data-zao-slot="storage-mark"]')).toHaveCount(100);
  await expect(ring.locator('[data-zao-slot="storage-mark"][data-state="used"]')).toHaveCount(68);
  await expect(ring.getByText('storage.used', { exact: true })).toBeVisible();
  await expect(ring.getByText('1 mark = 1 part', { exact: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Simulate live updates' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Card page', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Card', exact: true })).toBeVisible();
});

test('narrow screens fit every chart page and merge histogram bins instead of crowding', async ({
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
    for (const path of ['', '/ring', '/bar', '/line', '/heatmap', '/histogram']) {
      await page.goto(`/charts${path}`);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    const histogram = page.locator('figure[data-zao-chart="histogram"]');
    await expect(histogram.locator('[data-zao-slot="chart-scale"]')).toHaveText(/^(1|2) min bins$/);
    const pitch = await histogram.locator('[data-zao-slot="chart-datum"]').evaluateAll((nodes) => {
      const [a, b] = nodes.map((node) => node.getBoundingClientRect().left);
      return b! - a!;
    });
    expect(pitch).toBeGreaterThanOrEqual(3);

    const plot = histogram.locator('.chart-plot');
    const box = await plot.boundingBox();
    await page.touchscreen.tap(box!.x + box!.width * 0.25, box!.y + box!.height * 0.5);
    await expect(
      histogram.locator('[data-zao-slot="chart-datum"][aria-pressed="true"]'),
    ).toHaveCount(1);
  } finally {
    await context.close();
  }
});
