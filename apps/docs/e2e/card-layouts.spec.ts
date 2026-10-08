import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const studies = [
  { name: 'ZAO baseline', realQuietInstrument: false },
  { name: 'real Quiet instrument', realQuietInstrument: true },
] as const;

const viewports = [
  { name: 'wide', width: 1280, height: 900 },
  { name: 'small phone', width: 320, height: 900 },
] as const;

const sampleWidths = [640, 480] as const;

const layouts = [
  { label: 'Split', value: 'split', actions: ['Review settings', 'Manage storage'] },
  { label: 'Stacked', value: 'stacked', actions: ['Review settings', 'Manage storage'] },
  { label: 'Compact', value: 'compact', actions: ['Review workspace'] },
  { label: 'Media', value: 'media', actions: ['View study', 'Open drawing'] },
] as const;

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function openCardPage(page: Page, realQuietInstrument: boolean) {
  await page.goto(
    realQuietInstrument ? '/components/card?style=quiet-instrument' : '/components/card',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Card' })).toBeVisible();
  if (realQuietInstrument) {
    await page.addStyleTag({
      content: await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      ),
    });
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await settle(page.locator('.study').first());
}

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function expectContained(
  inner: Awaited<ReturnType<typeof bounds>>,
  outer: Awaited<ReturnType<typeof bounds>>,
) {
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - 0.5);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - 0.5);
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + 0.5);
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + 0.5);
}

async function expectNoHorizontalOverflow(element: Locator) {
  expect(await element.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
}

async function expectKeyboardScrollAccess(sample: Locator, viewportWidth: number) {
  await expect(sample).toHaveAttribute('tabindex', '0');
  const metrics = await sample.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  }));
  if (viewportWidth === 320) {
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  }
  await sample.focus();
  await expect(sample).toBeFocused();
  if (metrics.scrollWidth > metrics.clientWidth) {
    await sample.evaluate((node) => node.scrollTo({ left: 0, behavior: 'instant' }));
    await sample.press('ArrowRight');
    await expect.poll(() => sample.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    await sample.evaluate((node) => node.scrollTo({ left: 0, behavior: 'instant' }));
  }
}

async function expectCompleteMedia(media: Locator, card: Locator) {
  await expect(media).toBeVisible();
  await expect(media).toHaveAccessibleName('Joinery construction');
  expectContained(await bounds(media), await bounds(media.locator('..')));
  expectContained(await bounds(media), await bounds(card));

  const drawing = await media.evaluate((node) => {
    const svg = node as SVGSVGElement;
    const viewBox = svg.viewBox.baseVal;
    const svgMatrix = svg.getScreenCTM()!;
    const shapes = [
      ...svg.querySelectorAll<SVGGeometryElement>(
        'path, rect, circle, ellipse, line, polyline, polygon',
      ),
    ]
      .filter((shape) => !shape.closest('defs, clipPath, mask, symbol'))
      .map((shape) => {
        const css = getComputedStyle(shape);
        const box = shape.getBBox();
        const matrix = shape.getScreenCTM()!;
        const relativeMatrix = svgMatrix.inverse().multiply(matrix);
        const scale = Math.hypot(matrix.a, matrix.b);
        const halfStroke =
          css.stroke === 'none'
            ? 0
            : parseFloat(css.strokeWidth) /
              (css.vectorEffect === 'non-scaling-stroke' ? scale : 1) /
              2;
        const corners = [
          [box.x - halfStroke, box.y - halfStroke],
          [box.x + box.width + halfStroke, box.y - halfStroke],
          [box.x - halfStroke, box.y + box.height + halfStroke],
          [box.x + box.width + halfStroke, box.y + box.height + halfStroke],
        ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(relativeMatrix));
        return {
          left: Math.min(...corners.map((point) => point.x)),
          top: Math.min(...corners.map((point) => point.y)),
          right: Math.max(...corners.map((point) => point.x)),
          bottom: Math.max(...corners.map((point) => point.y)),
        };
      });
    return {
      viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height },
      shapes,
    };
  });
  expect(drawing.viewBox.width).toBeGreaterThan(0);
  expect(drawing.viewBox.height).toBeGreaterThan(0);
  expect(drawing.shapes.length).toBeGreaterThan(0);
  for (const shape of drawing.shapes) {
    expect(shape.left).toBeGreaterThanOrEqual(drawing.viewBox.x);
    expect(shape.top).toBeGreaterThanOrEqual(drawing.viewBox.y);
    expect(shape.right).toBeLessThanOrEqual(drawing.viewBox.x + drawing.viewBox.width);
    expect(shape.bottom).toBeLessThanOrEqual(drawing.viewBox.y + drawing.viewBox.height);
  }
}

for (const study of studies) {
  for (const viewport of viewports) {
    test(`${study.name}, ${viewport.name}: Card layouts switch accessibly and keep their contents usable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openCardPage(page, study.realQuietInstrument);

      const selector = page.getByRole('tablist', { name: 'Card layout', exact: true });
      await expect(selector).toBeVisible();
      await expect(selector.getByRole('tab')).toHaveCount(4);
      const split = selector.getByRole('tab', { name: 'Split', exact: true });
      const stacked = selector.getByRole('tab', { name: 'Stacked', exact: true });
      const compact = selector.getByRole('tab', { name: 'Compact', exact: true });
      await expect(split).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel', { name: 'Split', exact: true })).toBeVisible();

      await split.focus();
      await page.keyboard.press('ArrowRight');
      await expect(stacked).toBeFocused();
      await expect(stacked).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel', { name: 'Stacked', exact: true })).toBeVisible();
      await page.keyboard.press('ArrowRight');
      await expect(compact).toBeFocused();
      await expect(compact).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('ArrowLeft');
      await expect(stacked).toBeFocused();
      await expect(stacked).toHaveAttribute('aria-selected', 'true');

      await expectNoHorizontalOverflow(selector);
      if (viewport.width === 320) {
        const first = await bounds(split);
        const last = await bounds(selector.getByRole('tab', { name: 'Media', exact: true }));
        expect(last.y).toBeGreaterThan(first.y);
      }

      for (const layout of layouts) {
        const tab = selector.getByRole('tab', { name: layout.label, exact: true });
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        const activePanel = page.getByRole('tabpanel', { name: layout.label, exact: true });
        await expect(activePanel).toBeVisible();
        await expect(activePanel).toHaveAttribute('data-zao-card-layout', layout.value);
        await expect(page.getByRole('tabpanel')).toHaveCount(1);
        await settle(activePanel);

        await expect(activePanel.getByRole('region')).toHaveCount(2);
        await expectNoHorizontalOverflow(activePanel);
        for (const width of sampleWidths) {
          const sample = activePanel.getByRole('region', {
            name: `${layout.label} card at ${width} pixels`,
            exact: true,
          });
          await expect(sample).toBeVisible();
          await expect(sample).toHaveAttribute('data-zao-card-width', String(width));
          await expectKeyboardScrollAccess(sample, viewport.width);
          const card = sample.locator('[data-zao-component="card"]');
          await expect(card).toHaveCount(1);
          expect((await bounds(card)).width).toBeCloseTo(width, 2);
          expect(await card.evaluate((node) => node.tagName)).toBe('DIV');
          expect(await card.getAttribute('tabindex')).toBeNull();
          await expectNoHorizontalOverflow(card);
          if (layout.value === 'split' || layout.value === 'stacked') {
            const data = card.locator('[data-zao-slot="card-data"]');
            await expect(data).toHaveCount(1);
            await expect(data).not.toHaveClass(/\bbg-sunken\b/);
            await expect(data).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
            expectContained(await bounds(data), await bounds(card));
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);

          if (layout.value === 'media') {
            await expectCompleteMedia(card.locator('svg[data-zao-slot="card-media"]'), card);
          }

          await expect(card.locator('.card-foot').getByRole('button')).toHaveCount(
            layout.actions.length,
          );
          for (const label of layout.actions) {
            const action = card.getByRole('button', { name: label, exact: true });
            await expect(action).toBeVisible();
            expect(await action.evaluate((node) => node.tagName)).toBe('BUTTON');
            expectContained(await bounds(action), await bounds(card));
            await action.evaluate((node) => {
              node.dataset.layoutActivations = '0';
              node.addEventListener('click', () => {
                node.dataset.layoutActivations = String(Number(node.dataset.layoutActivations) + 1);
              });
            });
            await action.focus();
            await expect(action).toBeFocused();
            await expect(action).toBeInViewport();
            await expect(card).not.toBeFocused();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Space');
            await expect(action).toHaveAttribute('data-layout-activations', '2');
          }
        }
      }
    });
  }
}
