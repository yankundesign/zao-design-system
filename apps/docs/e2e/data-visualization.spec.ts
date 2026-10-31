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
    await page.getByRole('switch', { name: 'Keep loading', exact: true }).click();
    const box = await plot.boundingBox();
    await page.getByRole('button', { name: 'Reload readings', exact: true }).click();
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

    await page.getByRole('switch', { name: 'Keep loading', exact: true }).click();
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
  await page.getByRole('switch', { name: 'Keep loading', exact: true }).click();
  await page.getByRole('button', { name: 'Reload readings', exact: true }).click();
  await expect(root).toHaveAttribute('aria-busy', 'true');
  await page.getByRole('switch', { name: 'Keep loading', exact: true }).click();
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
  await page.getByRole('switch', { name: 'Keep loading', exact: true }).click();
  await page.getByRole('button', { name: 'Reload readings', exact: true }).click();
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
