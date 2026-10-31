import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const finishes = [
  { name: 'Su light', mode: 'Light' },
  { name: 'Su dark', mode: 'Dark' },
] as const;

const charts = [
  {
    slug: 'share',
    title: 'Storage by kind',
    series: 'storage.by_kind',
    unit: 'TB',
    next: 'ArrowRight',
    first: /^Media · 1\.02 TB · 41\.1%$/,
    second: /^Backups · 0\.69 TB · 27\.8%$/,
    live: false,
  },
  {
    slug: 'meter',
    title: 'Cloud spend, October',
    series: 'budget.spend',
    unit: 'USD',
    next: 'ArrowRight',
    first: /^Used · \$3,720 · 62%$/,
    second: /^Left · \$2,280 · 38%$/,
    live: true,
  },
  {
    slug: 'bar',
    title: 'Calls by region',
    series: 'calls.by_region',
    unit: 'calls',
    next: 'ArrowRight',
    first: /^us-w · 318 calls · \+70 vs avg$/,
    second: /^us-e · 276 calls · \+28 vs avg$/,
    live: true,
  },
  {
    slug: 'line',
    title: 'p95 latency, last 24 hours',
    series: 'latency.p95',
    unit: 'ms',
    next: 'ArrowRight',
    first: /^−23\.5 h · \d+ ms · prev \d+ ms$/,
    second: /^−23 h · \d+ ms · prev \d+ ms$/,
    live: true,
  },
  {
    slug: 'heatmap',
    title: 'Events per hour',
    series: 'events.by_hour',
    unit: 'events',
    next: 'ArrowDown',
    first: /^mon 00:00 · \d+ events$/,
    second: /^tue 00:00 · \d+ events$/,
    live: true,
  },
  {
    slug: 'histogram',
    title: 'Session length',
    series: 'session.length',
    unit: 'sessions',
    next: 'ArrowRight',
    first: /^0–[\d.]+ min · \d+ sessions$/,
    second: /^[\d.]+–[\d.]+ min · \d+ sessions$/,
    live: true,
  },
] as const;

async function openChart(page: Page, slug: string, mode: 'Light' | 'Dark' = 'Light') {
  await page.goto(`/charts/${slug}`);
  await page.getByRole('radio', { name: mode, exact: true }).click();
  await page.mouse.move(0, 0);
  // The preview's chart; a States section below may hold more of the same kind.
  return page.locator(`section[aria-label$="chart preview"] figure[data-zao-chart="${slug}"]`);
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
  // Grouped by question (C1): the three "how much of a whole?" charts come first.
  const order = [
    ['Overview', '/charts'],
    ['Ring', '/charts/ring'],
    ['Share strip', '/charts/share'],
    ['Meter', '/charts/meter'],
    ['Bar', '/charts/bar'],
    ['Line', '/charts/line'],
    ['Heatmap', '/charts/heatmap'],
    ['Histogram', '/charts/histogram'],
  ] as const;
  await expect(section.getByRole('link')).toHaveText(order.map(([label]) => label));
  for (const [label, href] of order) {
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
  await expect(gallery).toHaveCount(7);
  for (const slug of ['share', 'meter', 'bar', 'line', 'heatmap', 'histogram']) {
    const item = page.locator(`[data-zao-gallery-item="${slug}"]`);
    await expect(item.locator(`figure[data-zao-chart="${slug}"]`)).toHaveCount(1);
    await expect(item.getByRole('switch', { name: 'Simulate live updates' })).toHaveCount(0);
    await expect(item.getByRole('button', { name: 'Show data' })).toHaveCount(0);
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
  for (const chart of charts.filter((chart) => chart.live)) {
    const figure = await openChart(page, chart.slug);
    const live = figure.getByRole('switch', { name: 'Simulate live updates', exact: true });
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
    for (const path of [
      '',
      '/ring',
      '/share',
      '/meter',
      '/bar',
      '/line',
      '/heatmap',
      '/histogram',
    ]) {
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

/* Charts wave 1: shared parts, Meter and Share strip. */

const pages = [
  { slug: 'ring', title: 'Storage use', rows: 2 },
  { slug: 'share', title: 'Storage by kind', rows: 5 },
  { slug: 'meter', title: 'Cloud spend, October', rows: 5 },
  { slug: 'bar', title: 'Calls by region', rows: 6 },
  { slug: 'line', title: 'p95 latency, last 24 hours', rows: 48 },
  { slug: 'heatmap', title: 'Events per hour', rows: 7 },
  { slug: 'histogram', title: 'Session length', rows: null },
] as const;

/** The page's main preview; a second form may have its own preview below it (wave 2). */
function preview(page: Page) {
  return page.locator('section[aria-label$="chart preview"]');
}

/** The preview's chart root: a figure for framed charts, the study for the ring. */
function previewRoot(page: Page, slug: string) {
  return slug === 'ring'
    ? page.locator('section[aria-label$="chart preview"] [data-zao-slot="storage-study"]')
    : page.locator(`section[aria-label$="chart preview"] figure[data-zao-chart="${slug}"]`);
}

test('dashed references start and end on a whole dash', async ({ browser, baseURL }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 320, height: 800 },
  ]) {
    const context = await browser.newContext({ baseURL, viewport });
    const page = await context.newPage();
    try {
      for (const slug of ['meter', 'bar', 'line', 'histogram']) {
        await page.goto(`/charts/${slug}`);
        const references = previewRoot(page, slug).locator(
          '[data-zao-slot="chart-reference"][stroke-dasharray]',
        );
        expect(await references.count()).toBeGreaterThan(0);
        const fits = await references.evaluateAll((nodes) =>
          nodes.map((node) => {
            const [dash, gap] = node.getAttribute('stroke-dasharray')!.split(' ').map(Number);
            const length = (node as SVGGeometryElement).getTotalLength();
            const count = Math.round((length + gap!) / (dash! + gap!));
            return { length, gap: gap!, filled: count * dash! + (count - 1) * gap! };
          }),
        );
        for (const fit of fits) {
          expect(Math.abs(fit.filled - fit.length)).toBeLessThan(0.5);
          if (fit.length > 40) {
            expect(fit.gap).toBeGreaterThanOrEqual(2.5);
            expect(fit.gap).toBeLessThanOrEqual(3.5);
          }
        }
      }
    } finally {
      await context.close();
    }
  }
});

for (const finish of finishes) {
  test(`${finish.name}: every chart opens its numbers in Table without moving the plot`, async ({
    page,
  }) => {
    for (const chart of pages) {
      await openChart(page, chart.slug, finish.mode);
      const root = previewRoot(page, chart.slug);
      const plot = root.locator(chart.slug === 'ring' ? 'svg' : '.chart-plot').first();
      const before = await plot.boundingBox();
      const show = root.getByRole('button', { name: 'Show data', exact: true });
      await expect(show).toHaveAttribute('aria-expanded', 'false');
      await show.click();
      const hide = root.getByRole('button', { name: 'Hide data', exact: true });
      await expect(hide).toHaveAttribute('aria-expanded', 'true');
      const table = root.getByRole('table', { name: `${chart.title} data`, exact: true });
      await expect(table).toBeVisible();
      expect(await plot.boundingBox()).toEqual(before);
      const rows = table.locator('tbody tr');
      if (chart.rows) await expect(rows).toHaveCount(chart.rows);

      // One row per datum: each datum's name carries its row's name and value.
      if (['share', 'bar', 'line', 'histogram'].includes(chart.slug)) {
        const cells = await rows.evaluateAll((nodes) =>
          nodes.map((row) => [...row.children].map((cell) => cell.textContent!.toLowerCase())),
        );
        const names = await root
          .locator('[data-zao-slot="chart-datum"]')
          .evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute('aria-label')!.toLowerCase()),
          );
        expect(names).toHaveLength(cells.length);
        names.forEach((name, index) => {
          expect(name).toContain(cells[index]![0]!);
          expect(name).toContain(cells[index]![1]!);
        });
      }

      const accessibility = await new AxeBuilder({ page })
        .include('section[aria-label$="chart preview"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await hide.click();
      await expect(table).toHaveCount(0);
    }
  });
}

test('a loading chart is a drawing: structure only, no marks and no numbers', async ({ page }) => {
  for (const chart of pages) {
    await openChart(page, chart.slug);
    const root = previewRoot(page, chart.slug);
    const marks = root.locator(
      '[data-zao-slot="chart-mark"], [data-zao-slot="storage-mark"], [data-zao-slot="chart-accent"], [data-zao-slot="indicator"], [data-chart-ink="data"]',
    );
    const markCount = await marks.count();
    expect(markCount).toBeGreaterThan(0);
    const readout = root.locator(
      '[data-zao-slot="chart-readout"], [data-zao-slot="storage-detail"]',
    );
    const resting = await readout.textContent();
    const plot = root.locator(chart.slug === 'ring' ? 'svg' : '.chart-plot').first();

    // Toggle first: clicking scrolls the controls into view, and boxes are viewport-relative.
    await preview(page).getByRole('switch', { name: 'Keep loading', exact: true }).click();
    const box = await plot.boundingBox();
    await preview(page).getByRole('button', { name: 'Reload readings', exact: true }).click();
    await expect(root).toHaveAttribute('aria-busy', 'true');
    await expect(root).toHaveAttribute('data-zao-drawing', '');
    await expect(marks).toHaveCount(0);
    await expect(root.getByRole('status')).toHaveText(/^Loading .+/);
    await expect(root.getByRole('button', { name: 'Show data', exact: true })).toBeDisabled();
    await expect(root.locator('[data-zao-slot="chart-datum"]')).toHaveCount(0);
    const text = await root
      .locator(
        '[data-zao-slot="chart-summary"], [data-zao-slot="chart-readout"], [data-zao-slot="storage-detail"], .figure-mark',
      )
      .allTextContents();
    expect(text.join(' ')).not.toMatch(/\d/);
    // The drawing keeps the plot's box, so building never moves layout. The ring's drawn
    // reading swaps digits for figure spaces, which may fall back to a font a fraction of a
    // pixel narrower, so its centered row may shift by less than a pixel.
    const drawn = (await plot.boundingBox())!;
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(drawn[key] - box![key])).toBeLessThan(1);
    }

    await preview(page).getByRole('switch', { name: 'Keep loading', exact: true }).click();
    await expect(root).not.toHaveAttribute('aria-busy', 'true');
    await expect(marks).toHaveCount(markCount);
    await expect(readout).toHaveText(resting!);
    await expect(root).not.toHaveAttribute('data-zao-building', '');
  }
});

test('with reduced motion a chart builds at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openChart(page, 'bar');
  const root = previewRoot(page, 'bar');
  await preview(page).getByRole('switch', { name: 'Keep loading', exact: true }).click();
  await preview(page).getByRole('button', { name: 'Reload readings', exact: true }).click();
  await expect(root).toHaveAttribute('aria-busy', 'true');
  await preview(page).getByRole('switch', { name: 'Keep loading', exact: true }).click();
  await expect(root).not.toHaveAttribute('aria-busy', 'true');
  expect(await root.getAttribute('data-zao-building')).toBeNull();
});

test('forced colors draw a loading chart’s structure in CanvasText', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await openChart(page, 'histogram');
  const root = previewRoot(page, 'histogram');
  const canvasText = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await preview(page).getByRole('switch', { name: 'Keep loading', exact: true }).click();
  await preview(page).getByRole('button', { name: 'Reload readings', exact: true }).click();
  await expect(root).toHaveAttribute('aria-busy', 'true');
  await expect(root.locator('[data-zao-slot="chart-ruler"]')).toHaveCSS('stroke', canvasText);
});

test('the meter measures against its limit and states every edge case', async ({ page }) => {
  await openChart(page, 'meter');
  const meter = previewRoot(page, 'meter');
  await expect(
    meter.getByRole('meter', { name: 'Cloud spend, October against its budget', exact: true }),
  ).toHaveAttribute('aria-valuetext', '62% used · $2,280 left');
  await expect(meter.locator('[data-zao-slot="chart-summary"]')).toHaveText(
    '$3,720 spent, 62% of the $6,000 budget. At the month-to-date rate, spend reaches $5,766 by Oct 31 and crosses the $5,400 alert on Oct 30.',
  );
  await expect(meter.locator('[data-zao-slot="chart-projection"]')).toHaveCount(1);
  await expect(meter.getByText('alert $5,400', { exact: true })).toBeVisible();
  await expect(meter.locator('[data-zao-slot="indicator"]')).toHaveCSS('transition-duration', '0s');

  const state = (name: string) => page.locator(`[data-zao-meter-state="${name}"] figure`);
  const width = async (name: string, slot: string) =>
    (await state(name).locator(`[data-zao-slot="${slot}"]`).boundingBox())!.width;
  for (const [name, readout] of [
    ['zero', '0% used · $6,000 left'],
    ['fractional', '21% used · $4,765.44 left'],
    ['full', '100% used · $0 left'],
    ['over', 'Over by $310'],
    ['no-budget', 'No budget set'],
  ] as const) {
    await expect(state(name).locator('[data-zao-slot="chart-readout"]')).toHaveText(readout);
  }
  expect(await width('zero', 'indicator')).toBe(0);
  expect(
    Math.abs((await width('full', 'indicator')) - (await width('full', 'track'))),
  ).toBeLessThan(1);
  expect(
    Math.abs((await width('over', 'indicator')) - (await width('over', 'track'))),
  ).toBeLessThan(1);
  await expect(state('over').locator('[data-zao-slot="chart-over"]')).toHaveCount(1);
  await expect(state('unknown')).toHaveAttribute('aria-busy', 'true');
  await expect(state('unknown').locator('[data-zao-slot="indicator"]')).toHaveCount(0);
  expect(
    await state('unknown').locator('[data-zao-slot="chart-readout"]').textContent(),
  ).not.toMatch(/\d/);
  await expect(state('no-budget')).not.toHaveAttribute('aria-busy', 'true');
  await expect(state('no-budget').locator('[data-zao-slot="indicator"]')).toHaveCount(0);
});

test('the share strip draws one stroke per point and names every part', async ({
  browser,
  baseURL,
}) => {
  const strokes = (root: Locator) =>
    root
      .locator('[data-zao-slot="chart-mark"]')
      .evaluateAll((nodes) =>
        nodes.reduce((sum, node) => sum + (node.getAttribute('d')!.match(/V/g) ?? []).length, 0),
      );
  const page = await browser.newPage({ baseURL, viewport: { width: 1280, height: 900 } });
  try {
    await openChart(page, 'share');
    const strip = previewRoot(page, 'share');
    expect(await strokes(strip)).toBe(100);
    await expect(strip.locator('[data-zao-slot="chart-scale"]')).toHaveText(
      '1 stroke = 1% · 2.48 TB',
    );
    const labels = strip.locator('.chart-label');
    await expect(labels).toHaveText([
      'media 41%',
      'backups 28%',
      'documents 18%',
      'logs 13%',
      'other <1%',
    ]);
    const boxes = await labels.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().toJSON() as DOMRect),
    );
    boxes.forEach((a, i) =>
      boxes.slice(i + 1).forEach((b) => {
        const apart =
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect(apart).toBe(true);
      }),
    );

    // The part under one stroke stays reachable by keyboard.
    await strip.locator('[data-zao-slot="chart-datum"][tabindex="0"]').focus();
    await page.keyboard.press('End');
    await expect(strip.locator('[data-zao-slot="chart-readout"]')).toHaveText(
      'Other · 0.01 TB · 0.4%',
    );

    const twoParts = page.locator('[data-zao-share-state="two-parts"] figure');
    expect(await strokes(twoParts)).toBe(100);
    await expect(page.locator('[data-zao-share-state="unknown"] figure')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  } finally {
    await page.close();
  }

  const narrow = await browser.newPage({ baseURL, viewport: { width: 320, height: 800 } });
  try {
    await narrow.goto('/charts/share');
    const strip = previewRoot(narrow, 'share');
    await expect(strip.locator('[data-zao-slot="chart-scale"]')).toHaveText(
      '1 stroke = 2% · 2.48 TB',
    );
    expect(await strokes(strip)).toBe(50);
    await expect(strip.locator('[data-zao-slot="chart-labels"] li')).toHaveText([
      'media 41%',
      'backups 28%',
      'documents 18%',
      'logs 13%',
      'other <1%',
    ]);
  } finally {
    await narrow.close();
  }
});

/* Charts wave 2: prism bars, line events and forecast, histogram percentiles and comparison. */

const forms = [
  { slug: 'bar', form: 'prism', kind: 'bar-prism', marks: '[data-zao-slot="chart-mark"]' },
  {
    slug: 'line',
    form: 'forecast',
    kind: 'line-forecast',
    marks: '[data-zao-slot="chart-mark"], [data-zao-slot="chart-forecast"]',
  },
  {
    slug: 'histogram',
    form: 'compare',
    kind: 'histogram-compare',
    marks: '[data-zao-slot="chart-mark"]',
  },
] as const;

/** A second form's section and its chart, below the main preview. */
function formSection(page: Page, form: string) {
  return page.locator(`[data-zao-chart-form="${form}"]`);
}

function formChart(page: Page, form: string, kind: string) {
  return formSection(page, form).locator(`figure[data-zao-chart="${kind}"]`);
}

/** The prisms' front faces, which carry the readings; planes come and go with inspection. */
async function prismFaces(figure: Locator) {
  return figure
    .locator('[data-zao-slot="chart-prism-face"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d')));
}

/** Wait out finite animations, such as the colors easing after a mode switch. */
async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const animations = node
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
}

/** Boxes in page pixels, for checking that labels and lines keep apart. */
async function boxes(locator: Locator) {
  return locator.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().toJSON() as DOMRect),
  );
}

function apart(a: DOMRect, b: DOMRect) {
  return a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
}

test('the prism form is flat at rest and shows depth only on the inspected bar', async ({
  browser,
  baseURL,
}) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 320, height: 800 },
  ]) {
    const page = await browser.newPage({ baseURL, viewport });
    try {
      await page.goto('/charts/bar');
      const prism = formChart(page, 'prism', 'bar-prism');
      const prisms = prism.locator('[data-zao-prism]');
      await expect(prisms).toHaveCount(6);
      // At rest every bar is a flat front face: no planes and no plane outlines.
      await expect(
        prism.locator(
          '[data-zao-slot="chart-prism-top"], [data-zao-slot="chart-prism-side"], [data-zao-slot="chart-prism-edges"]',
        ),
      ).toHaveCount(0);
      const faces = await prisms.evaluateAll((nodes) =>
        nodes.map((node) => {
          const face = (
            node.querySelector('[data-zao-slot="chart-prism-face"]') as SVGGraphicsElement
          ).getBBox();
          return {
            value: Number(node.querySelector('.chart-label')!.textContent!.replace(/,/g, '')),
            left: face.x,
            height: face.height,
            bottom: face.y + face.height,
          };
        }),
      );
      // Front faces stand on one baseline at true height.
      expect(new Set(faces.map((face) => face.bottom)).size).toBe(1);
      const scale = faces[0]!.height / faces[0]!.value;
      for (const face of faces) {
        expect(Math.abs(face.height - face.value * scale)).toBeLessThan(1);
      }
      // The reference stays in the front plane: drawn after every prism.
      expect(
        await prism.evaluate((figure) => {
          const reference = figure.querySelector('[data-zao-slot="chart-reference"]')!;
          const prisms = figure.querySelectorAll('[data-zao-prism]');
          return Boolean(
            prisms[prisms.length - 1]!.compareDocumentPosition(reference) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          );
        }),
      ).toBe(true);

      // Inspecting a bar shows its depth alone: one shared depth, clear of the next face,
      // and the readings never move.
      const original = await prismFaces(prism);
      await prism.locator('[data-zao-slot="chart-datum"][tabindex="0"]').focus();
      const depths: number[] = [];
      for (let index = 0; index < faces.length; index += 1) {
        if (index) await page.keyboard.press('ArrowRight');
        const raised = prism.locator('[data-zao-prism][data-depth="shown"]');
        await expect(raised).toHaveCount(1);
        await expect(prisms.nth(index)).toHaveAttribute('data-depth', 'shown');
        const side = await prisms
          .nth(index)
          .locator('[data-zao-slot="chart-prism-side"]')
          .evaluate((node) => {
            const box = (node as SVGGraphicsElement).getBBox();
            return { x: box.x, width: box.width };
          });
        depths.push(side.width);
        if (index < faces.length - 1) {
          expect(side.x + side.width).toBeLessThan(faces[index + 1]!.left);
        }
        expect(await prismFaces(prism)).toEqual(original);
      }
      expect(new Set(depths).size).toBe(1);
      expect(depths[0]).toBeGreaterThanOrEqual(4);
      await page.keyboard.press('Escape');
      await expect(prism.locator('[data-zao-prism][data-depth="shown"]')).toHaveCount(0);

      // One bar is built: the lead at rest, the selected one after Enter, the lead after Escape.
      const built = prism.locator('[data-zao-prism][data-state="built"]');
      await expect(built).toHaveCount(1);
      await expect(built.locator('.chart-label').first()).toHaveText('412');
      await expect(prism.locator('[data-zao-slot="chart-accent"]')).toHaveCount(1);
      const [accent] = await boxes(prism.locator('[data-zao-slot="chart-accent"]'));
      const [label] = await boxes(built.locator('.chart-label').first());
      expect(accent!.right).toBeLessThanOrEqual(label!.left);
      await page.keyboard.press('Home');
      await page.keyboard.press('Enter');
      await expect(built.locator('.chart-label').first()).toHaveText('318');
      await expect(built).toHaveAttribute('data-depth', 'shown');
      expect(await prismFaces(prism)).toEqual(original);
      await page.keyboard.press('Escape');
      await expect(built.locator('.chart-label').first()).toHaveText('412');

      // Pointer hover shows the hovered bar's depth, and leaving flattens it again.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const plot = await prism.locator('.chart-plot').boundingBox();
      await page.mouse.move(plot!.x + plot!.width * 0.9, plot!.y + plot!.height * 0.5);
      await expect(prisms.last()).toHaveAttribute('data-depth', 'shown');
      await expect(prism.locator('[data-zao-prism][data-depth="shown"]')).toHaveCount(1);
      expect(await prismFaces(prism)).toEqual(original);
      await page.mouse.move(0, 0);
      await expect(prism.locator('[data-zao-prism][data-depth="shown"]')).toHaveCount(0);
    } finally {
      await page.close();
    }
  }
});

test('line events tick the ruler and are named in the readout and data view', async ({ page }) => {
  const figure = await openChart(page, 'line');
  const ticks = figure.locator('[data-zao-slot="chart-event"]');
  await expect(ticks).toHaveCount(2);
  const datums = figure.locator('[data-zao-slot="chart-datum"]');
  const tickBoxes = await boxes(ticks);
  for (const [index, name] of [
    [19, 'Metrics collector restarted'],
    [37, 'Deployed api 4.12'],
  ] as const) {
    await expect(datums.nth(index)).toHaveAttribute('aria-label', new RegExp(`, ${name}$`));
    const datum = (await datums.nth(index).boundingBox())!;
    const center = datum.x + datum.width / 2;
    expect(tickBoxes.some((tick) => Math.abs(tick.left + tick.width / 2 - center) < 1)).toBe(true);
  }
  // Event labels keep to their lane: clear of each other and of the time labels.
  const labels = await boxes(figure.locator('[data-zao-slot="chart-event-label"] .chart-label'));
  expect(labels).toHaveLength(2);
  const others = await boxes(figure.locator('.chart-plot > svg > .chart-label'));
  labels.forEach((label, index) => {
    labels.slice(index + 1).forEach((other) => expect(apart(label, other)).toBe(true));
    others.forEach((other) => expect(apart(label, other)).toBe(true));
  });

  await expect(figure.locator('[data-zao-slot="chart-summary"]')).toContainText(
    'It rose after the api 4.12 deploy 5 hours ago.',
  );
  await datums.first().focus();
  await page.keyboard.press('End');
  for (let step = 0; step < 10; step += 1) await page.keyboard.press('ArrowLeft');
  await expect(figure.locator('[data-zao-slot="chart-readout"]')).toHaveText(
    '−5 h · 122 ms · prev 114 ms · deploy',
  );
  await page.keyboard.press('Escape');
  await figure.getByRole('button', { name: 'Show data', exact: true }).click();
  const table = figure.getByRole('table', { name: 'p95 latency, last 24 hours data' });
  await expect(table.locator('thead th').last()).toHaveText('Event');
  await expect(table.locator('tbody tr').nth(37)).toContainText('Deployed api 4.12');
});

test('the forecast is drawn after "now" from its stated method', async ({ page }) => {
  await page.goto('/charts/line');
  const forecast = formChart(page, 'forecast', 'line-forecast');
  const squares = forecast.locator('[data-zao-slot="chart-forecast"]');
  await expect(squares).toHaveCount(8);
  await expect(forecast.locator('[data-zao-slot="chart-scale"]')).toHaveText(
    '30 min samples · 4 h forecast',
  );
  await expect(forecast.locator('[data-zao-slot="chart-summary"]')).toContainText(
    "The forecast follows yesterday's curve, shifted by today's average difference over the last 6 hours, and stays between 137 and 178 ms through +4 h.",
  );
  // Hollow squares after "now"; the trace and the previous period stop at "now".
  const layout = await forecast.evaluate((figure) => {
    const box = (selector: string) =>
      (figure.querySelector(selector) as SVGGraphicsElement).getBBox();
    const now = box('[data-zao-slot="chart-accent"]');
    const squares = [...figure.querySelectorAll('[data-zao-slot="chart-forecast"]')];
    return {
      now: now.x + now.width / 2,
      trace: box('[data-zao-slot="chart-mark"]').x + box('[data-zao-slot="chart-mark"]').width,
      prior:
        box('[data-zao-slot="chart-reference"]').x + box('[data-zao-slot="chart-reference"]').width,
      squares: squares.map((square) => (square as SVGGraphicsElement).getBBox().x),
      fills: squares.map((square) => square.getAttribute('fill')),
    };
  });
  expect(layout.trace).toBeLessThanOrEqual(layout.now + 1);
  expect(layout.prior).toBeLessThanOrEqual(layout.now + 1);
  layout.squares.forEach((x) => expect(x).toBeGreaterThan(layout.now));
  expect(new Set(layout.fills)).toEqual(new Set(['none']));

  const datums = forecast.locator('[data-zao-slot="chart-datum"]');
  await expect(datums).toHaveCount(56);
  await expect(datums.nth(50)).toHaveAttribute('aria-label', '+1.5 h: forecast 153 ms');
  await datums.first().focus();
  await page.keyboard.press('End');
  const readout = forecast.locator('[data-zao-slot="chart-readout"]');
  await expect(readout).toHaveText('+4 h · forecast 175 ms');
  await page.keyboard.press('Escape');

  const section = formSection(page, 'forecast');
  await section.getByRole('switch', { name: 'Keep loading', exact: true }).click();
  await section.getByRole('button', { name: 'Reload readings', exact: true }).click();
  await expect(forecast).toHaveAttribute('aria-busy', 'true');
  await expect(squares).toHaveCount(0);
});

test('the histogram marks p50, p95 and p99 with labels that never collide', async ({
  browser,
  baseURL,
}) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 320, height: 800 },
  ]) {
    const page = await browser.newPage({ baseURL, viewport });
    try {
      await page.goto('/charts/histogram');
      const figure = previewRoot(page, 'histogram');
      const references = figure.locator('[data-zao-slot="chart-reference"]');
      await expect(references).toHaveCount(3);
      expect(
        await references.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-percentile')),
        ),
      ).toEqual(['p50', 'p95', 'p99']);
      await expect(figure.locator('[data-zao-slot="chart-summary"]')).toContainText(
        viewport.width > 320
          ? 'Half of sessions end within 11.5 minutes, 95% within 26 and 99% within 35.'
          : /^Half of sessions end within [\d.]+ minutes, 95% within [\d.]+ and 99% within [\d.]+\./,
      );
      if (viewport.width > 320) {
        await expect(figure.locator('[data-zao-slot="chart-reference-label"]')).toHaveText([
          'p50 11.5 min',
          'p95 26 min',
          'p99 35 min',
        ]);
        // Each line sits at its bin's upper edge: p50 at 11.5 minutes ends bin 22.
        const datum = (await figure
          .locator('[data-zao-slot="chart-datum"]')
          .nth(22)
          .boundingBox())!;
        const [p50] = await boxes(references.first());
        expect(Math.abs(p50!.left + p50!.width / 2 - (datum.x + datum.width))).toBeLessThan(1);
      }
      // Labels never touch each other, and never cross another reference's line.
      const labels = await figure
        .locator('[data-zao-slot="chart-reference-label"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            name: node.getAttribute('data-percentile'),
            box: node.getBoundingClientRect().toJSON() as DOMRect,
          })),
        );
      expect(labels.length).toBeGreaterThanOrEqual(1);
      const lines = await references.evaluateAll((nodes) =>
        nodes.map((node) => ({
          name: node.getAttribute('data-percentile'),
          box: node.getBoundingClientRect().toJSON() as DOMRect,
        })),
      );
      labels.forEach((label, index) => {
        labels.slice(index + 1).forEach((other) => expect(apart(label.box, other.box)).toBe(true));
        lines
          .filter((line) => line.name !== label.name)
          .forEach((line) => expect(apart(label.box, line.box)).toBe(true));
      });
    } finally {
      await page.close();
    }
  }
});

test('the comparison mirrors last week on the same bins and scale', async ({ page }) => {
  await page.goto('/charts/histogram');
  const compare = formChart(page, 'compare', 'histogram-compare');
  await expect(compare.locator('[data-zao-slot="chart-summary"]')).toHaveText(
    'Half of sessions end within 11.5 minutes this week, 1.5 minutes longer than last week.',
  );
  const readout = compare.locator('[data-zao-slot="chart-readout"]');
  await expect(readout).toHaveText('1,400 this week · 1,310 last week');
  await expect(compare.locator('[data-zao-slot="chart-accent"]')).toHaveCount(1);
  await expect(
    compare.locator('[data-zao-slot="chart-mark"][data-period="last"][data-chart-ink="data"]'),
  ).toHaveCount(0);

  // Equal counts are equal lengths: length per session is the same above and below.
  const counts = await compare.locator('[data-zao-slot="chart-datum"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const [, now, before] = node
        .getAttribute('aria-label')!
        .replace(/,(?=\d)/g, '')
        .match(/: (\d+) sessions this week, (\d+) last week$/)!;
      return [Number(now), Number(before)];
    }),
  );
  const rates = await compare.locator('[data-zao-slot="chart-mark"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      period: node.getAttribute('data-period'),
      bin: Number(node.getAttribute('data-bin')),
      length: Math.abs(Number(node.getAttribute('y2')) - Number(node.getAttribute('y1'))),
    })),
  );
  const perSession = rates.map(
    (rate) => rate.length / counts[rate.bin]![rate.period === 'this' ? 0 : 1]!,
  );
  const busiest = rates.reduce((best, rate) => (rate.length > best.length ? rate : best));
  for (const [index, rate] of rates.entries()) {
    const count = counts[rate.bin]![rate.period === 'this' ? 0 : 1]!;
    // Lengths are drawn to the scale plus half a pixel; compare against the busiest bin.
    const expected =
      ((busiest.length - 0.5) / counts[busiest.bin]![busiest.period === 'this' ? 0 : 1]!) * count +
      0.5;
    expect(Math.abs(rate.length - expected), `bin ${rate.bin} ${rate.period}`).toBeLessThan(0.01);
    expect(perSession[index]).toBeGreaterThan(0);
  }

  await compare.getByRole('button', { name: 'Show data', exact: true }).click();
  await expect(compare.getByRole('table').locator('thead th')).toHaveText([
    'Session length',
    'This week',
    'Last week',
  ]);
  await compare.getByRole('button', { name: 'Hide data', exact: true }).click();

  // Only this week updates.
  const lastWeek = () =>
    compare
      .locator('[data-zao-slot="chart-mark"][data-period="last"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('y2')));
  const before = await lastWeek();
  await compare.getByRole('switch', { name: 'Simulate live updates', exact: true }).click();
  await expect(readout).not.toHaveText('1,400 this week · 1,310 last week', { timeout: 5000 });
  await expect(readout).toHaveText(/ · 1,310 last week$/);
  expect(await lastWeek()).toEqual(before);
  await compare.getByRole('switch', { name: 'Simulate live updates', exact: true }).click();
});

for (const finish of finishes) {
  test(`${finish.name}: every second form is accessible, still, and loads as a drawing`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const form of forms) {
      await openChart(page, form.slug, finish.mode);
      const figure = formChart(page, form.form, form.kind);
      await expect(figure).toHaveCount(1);
      await settle(formSection(page, form.form));
      const accessibility = await new AxeBuilder({ page })
        .include(`[data-zao-chart-form="${form.form}"]`)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      expect(await figure.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);

      const marks = figure.locator(form.marks);
      expect(await marks.count()).toBeGreaterThan(0);
      const section = formSection(page, form.form);
      await section.getByRole('switch', { name: 'Keep loading', exact: true }).click();
      const box = await figure.locator('.chart-plot').boundingBox();
      await section.getByRole('button', { name: 'Reload readings', exact: true }).click();
      await expect(figure).toHaveAttribute('aria-busy', 'true');
      await expect(marks).toHaveCount(0);
      expect(
        (
          await figure
            .locator('[data-zao-slot="chart-summary"], [data-zao-slot="chart-readout"]')
            .allTextContents()
        ).join(' '),
      ).not.toMatch(/\d/);
      expect(await figure.locator('.chart-plot').boundingBox()).toEqual(box);
      await section.getByRole('switch', { name: 'Keep loading', exact: true }).click();
      await expect(figure).not.toHaveAttribute('aria-busy', 'true');
    }
  });
}

test('forced colors draw prisms in system colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/charts/bar');
  const prism = formChart(page, 'prism', 'bar-prism');
  const [canvasText, canvas] = await page.evaluate(() =>
    ['CanvasText', 'Canvas'].map((color) => {
      const probe = document.createElement('span');
      probe.style.color = color;
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    }),
  );
  // Inspect the built bar so its planes are drawn.
  await prism.locator('[data-zao-slot="chart-datum"][tabindex="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const built = prism.locator('[data-zao-prism][data-state="built"]');
  await expect(built).toHaveAttribute('data-depth', 'shown');
  await expect(built.locator('[data-zao-slot="chart-prism-face"]')).toHaveCSS('fill', canvasText!);
  await expect(built.locator('[data-zao-slot="chart-prism-edges"]')).toHaveCSS(
    'stroke',
    canvasText!,
  );
  await expect(built.locator('[data-zao-slot="chart-prism-top"]')).toHaveCSS('fill', canvas!);
  await expect(
    prism.locator('[data-zao-prism][data-state="rest"] [data-zao-slot="chart-prism-face"]').first(),
  ).toHaveCSS('fill', canvas!);
});
