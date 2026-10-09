import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const studies = [
  { name: 'ZAO baseline', realQuietInstrument: false },
  { name: 'real Quiet instrument', realQuietInstrument: true },
] as const;

const viewports = [
  { name: 'wide', width: 1280, height: 900 },
  { name: 'narrow', width: 360, height: 900 },
  { name: 'small phone', width: 320, height: 900 },
] as const;

const sampleWidths = [640, 480] as const;

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const animations = node
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
}

async function openCardPage(page: Page, realQuietInstrument: boolean) {
  await page.goto(
    realQuietInstrument ? '/components/card?style=quiet-instrument' : '/components/card',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Card' })).toBeVisible();
  if (realQuietInstrument) {
    const css = await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    );
    await page.addStyleTag({ content: css });
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.mouse.move(0, 0);
  const panel = page.getByRole('tabpanel', { name: 'Split', exact: true });
  await settle(panel);
  return panel;
}

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function documentBounds(element: Locator) {
  return element.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    let x = rect.x + window.scrollX;
    let y = rect.y + window.scrollY;
    for (
      let parent = node.parentElement;
      parent && parent !== document.body && parent !== document.documentElement;
      parent = parent.parentElement
    ) {
      x += parent.scrollLeft;
      y += parent.scrollTop;
    }
    return {
      x,
      y,
      width: rect.width,
      height: rect.height,
    };
  });
}

function expectContained(
  inner: Awaited<ReturnType<typeof bounds>>,
  outer: Awaited<ReturnType<typeof bounds>>,
) {
  // Allow subpixel rounding while keeping every edge inside its containing surface.
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - 0.5);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - 0.5);
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + 0.5);
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + 0.5);
}

for (const study of studies) {
  for (const viewport of viewports) {
    test(`${study.name}, ${viewport.name}: Card keeps one complete storage readout and stays passive`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const panel = await openCardPage(page, study.realQuietInstrument);
      for (const width of sampleWidths) {
        const sample = panel.getByRole('region', {
          name: `Split card at ${width} pixels`,
          exact: true,
        });
        const card = sample.locator('[data-zao-component="card"]');
        expect((await bounds(card)).width).toBeCloseTo(width, 2);
        const figure = card.getByRole('img', { name: 'Storage use at 68 percent', exact: true });
        const chart = figure.locator('[data-zao-slot="storage-chart"]');

        await expect(
          card.getByRole('heading', { name: 'North workspace', exact: true }),
        ).toBeVisible();
        await expect(card.getByText('Operational', { exact: true })).toBeVisible();
        await expect(card.getByText('68%', { exact: true })).toHaveCount(1);
        await expect(card.getByText('68%', { exact: true })).toBeVisible();
        await expect(figure).toHaveCount(1);
        await expect(chart).toBeVisible();
        expect(await chart.evaluate((element) => element.tagName.toLowerCase())).toBe('svg');

        const marks = chart.locator('[data-zao-slot="storage-mark"]');
        await expect(marks).toHaveCount(100);
        await expect(
          chart.locator('[data-zao-slot="storage-mark"][data-state="used"]'),
        ).toHaveCount(68);
        await expect(
          chart.locator('[data-zao-slot="storage-mark"][data-state="available"]'),
        ).toHaveCount(32);
        const inks = await marks.evaluateAll((nodes) => {
          const strokes = (state: string) => [
            ...new Set(
              nodes
                .filter((node) => node.getAttribute('data-state') === state)
                .map((node) => getComputedStyle(node).stroke),
            ),
          ];
          return { used: strokes('used'), available: strokes('available') };
        });
        for (const stroke of [...inks.used, ...inks.available]) {
          expect(stroke).not.toBe('none');
        }
        for (const stroke of inks.used) {
          expect(inks.available).not.toContain(stroke);
        }

        const gauge = await chart.evaluate((element) => {
          const svg = element as SVGSVGElement;
          const viewBox = svg.viewBox.baseVal;
          const shapes = [...svg.querySelectorAll<SVGGeometryElement>('circle, line, rect')].map(
            (shape) => {
              const box = shape.getBBox();
              const css = getComputedStyle(shape);
              const matrix = shape.getScreenCTM();
              const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
              const halfStroke =
                css.stroke === 'none'
                  ? 0
                  : parseFloat(css.strokeWidth) /
                    (css.vectorEffect === 'non-scaling-stroke' ? scale : 1) /
                    2;
              return {
                tag: shape.tagName,
                left: box.x - halfStroke,
                top: box.y - halfStroke,
                right: box.x + box.width + halfStroke,
                bottom: box.y + box.height + halfStroke,
                stroke: css.stroke,
                fill: css.fill,
                strokeWidth: parseFloat(css.strokeWidth),
                strokeOpacity: parseFloat(css.strokeOpacity),
                length: shape.getTotalLength(),
              };
            },
          );
          return {
            viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height },
            shapes,
          };
        });
        expect(gauge.viewBox.width).toBeGreaterThan(0);
        expect(gauge.viewBox.height).toBeGreaterThan(0);
        expect(gauge.shapes.length).toBeGreaterThanOrEqual(100);
        for (const shape of gauge.shapes) {
          expect(shape.length).toBeGreaterThan(0);
          if (shape.stroke !== 'none') {
            expect(shape.strokeWidth).toBeGreaterThan(0);
            expect(shape.strokeOpacity).toBeGreaterThan(0);
          } else {
            expect(shape.fill).not.toBe('none');
          }
          expect(shape.left).toBeGreaterThanOrEqual(gauge.viewBox.x);
          expect(shape.top).toBeGreaterThanOrEqual(gauge.viewBox.y);
          expect(shape.right).toBeLessThanOrEqual(gauge.viewBox.x + gauge.viewBox.width);
          expect(shape.bottom).toBeLessThanOrEqual(gauge.viewBox.y + gauge.viewBox.height);
        }

        expectContained(await bounds(chart), await bounds(figure));
        expectContained(await bounds(figure), await bounds(card));
        const readout = figure.locator('.figure-mark');
        await expect(readout.getByText('Storage used', { exact: true })).toBeVisible();
        expectContained(await bounds(readout), await bounds(figure));
        for (const label of ['68%', 'Storage used']) {
          expectContained(
            await bounds(readout.getByText(label, { exact: true })),
            await bounds(readout),
          );
        }
        const copyBox = await bounds(card.locator('.card-copy'));
        const figureBox = await bounds(figure);
        // Oct 9: the chart's mono series row leads the data column, level with the copy.
        const studyBox = await bounds(card.locator('[data-zao-slot="storage-study"]'));
        expectContained(figureBox, studyBox);
        if (width === 640) {
          expect(figureBox.x).toBeGreaterThan(copyBox.x + copyBox.width);
          expect(studyBox.y).toBeCloseTo(copyBox.y, 2);
        } else {
          expect(figureBox.y).toBeGreaterThanOrEqual(copyBox.y + copyBox.height);
        }
        const overflow = await card.evaluate((element) => ({
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);

        expect(await card.evaluate((element) => element.tagName)).toBe('DIV');
        expect(await card.getAttribute('tabindex')).toBeNull();
        // Hover may scroll the page or the fixed-width sample; normalize both.
        const before = await documentBounds(card);
        await card.hover({ position: { x: before.width / 2, y: before.height / 2 } });
        await settle(sample);
        expect(await documentBounds(card)).toEqual(before);
        await expect(card).not.toBeFocused();
      }
    });

    test(`${study.name}, ${viewport.name}: both samples keep bottom actions contained and activate natively`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const panel = await openCardPage(page, study.realQuietInstrument);
      for (const width of sampleWidths) {
        const sample = panel.getByRole('region', {
          name: `Split card at ${width} pixels`,
          exact: true,
        });
        const card = sample.locator('[data-zao-component="card"]');
        expect((await bounds(card)).width).toBeCloseTo(width, 2);
        const footer = card.locator('.card-foot');
        const review = footer.getByRole('button', { name: 'Review settings', exact: true });
        const manage = footer.getByRole('button', { name: 'Manage storage', exact: true });

        for (const button of [review, manage]) {
          await expect(button).toBeVisible();
          expect(await button.evaluate((element) => element.tagName)).toBe('BUTTON');
          const box = await bounds(button);
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
          expectContained(box, await bounds(footer));
          expectContained(box, await bounds(card));
        }
        await expect(review).toHaveAttribute('data-zao-variant', 'secondary');
        await expect(manage).toHaveAttribute('data-zao-variant', 'primary');

        const reviewBox = await bounds(review);
        const manageBox = await bounds(manage);
        expect(manageBox.y).toBeCloseTo(reviewBox.y, 2);
        const overflow = await footer.evaluate((element) => ({
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

        await review.focus();
        await expect(review).toBeFocused();
        await expect(card).not.toBeFocused();
        await page.keyboard.press('Tab');
        await expect(manage).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(review).toBeFocused();

        for (const button of [review, manage]) {
          await button.evaluate((element) => {
            element.dataset.cardActivations = '0';
            element.addEventListener('click', () => {
              element.dataset.cardActivations = String(Number(element.dataset.cardActivations) + 1);
            });
          });
          await button.focus();
          await page.keyboard.press('Enter');
          await page.keyboard.press('Space');
          await expect(button).toHaveAttribute('data-card-activations', '2');
        }
      }
    });
  }
}
