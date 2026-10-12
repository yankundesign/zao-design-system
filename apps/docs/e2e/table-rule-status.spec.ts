import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Check, Play, Prohibition, WarningTriangle } from 'iconoir-react';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { studyRuleCount } from './study-paint';

const modes = ['light', 'dark'] as const;
const directions = ['ltr', 'rtl'] as const;
const paints = ['published Su', 'real Quiet instrument'] as const;
const widths = [1440, 360] as const;
type Mode = (typeof modes)[number];
type Direction = (typeof directions)[number];
type Paint = (typeof paints)[number];

const glyphs = {
  Ready: renderToStaticMarkup(createElement(Check)),
  Running: renderToStaticMarkup(createElement(Play)),
  'Needs review': renderToStaticMarkup(createElement(WarningTriangle)),
  Blocked: renderToStaticMarkup(createElement(Prohibition)),
};

async function openTable(page: Page, mode: Mode, direction: Direction, paint: Paint) {
  await page.addInitScript((value) => {
    const apply = () => {
      if (!document.documentElement) return false;
      document.documentElement.dir = value;
      return true;
    };
    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect();
      });
      observer.observe(document, { childList: true });
    }
  }, direction);
  const css =
    paint === 'real Quiet instrument'
      ? await readFile(
          new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
          'utf8',
        )
      : '';
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
  await page.goto('/components/table');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  await expect(study).toHaveAttribute('data-study', 'quiet-instrument');
  const role = expect.poll(() => studyRuleCount(page));
  if (paint === 'real Quiet instrument') await role.toBeGreaterThan(0);
  else await role.toBe(0);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  const specimen = study.locator('[data-zao-specimen="table"]');
  const frame = specimen.locator('[data-zao-component="table"]');
  const scroll = specimen.getByRole('region', {
    name: 'Recent requests scroll area',
    exact: true,
  });
  const table = specimen.getByRole('table', { name: 'Recent requests', exact: true });
  await frame.scrollIntoViewIfNeeded();
  return { study, specimen, frame, scroll, table };
}
type Handles = Awaited<ReturnType<typeof openTable>>;

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function box(element: Locator) {
  const bounds = await element.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
}

async function rules({ frame }: Handles) {
  return frame.evaluate((node) => {
    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    };
    const scroll = node.querySelector('[data-zao-slot="scroll-area"]')!;
    const table = node.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const frameCss = getComputedStyle(node);
    const separatorCss = getComputedStyle(rows[1]!);
    const scrollCss = getComputedStyle(scroll);
    return {
      frame: rect(node),
      scroll: rect(scroll),
      table: rect(table),
      first: rect(rows[0]!),
      second: rect(rows[1]!),
      borderLeft: parseFloat(frameCss.borderLeftWidth),
      borderRight: parseFloat(frameCss.borderRightWidth),
      canvas: frameCss.backgroundColor,
      ruleColor: separatorCss.borderBlockStartColor,
      ruleStyle: separatorCss.borderBlockStartStyle,
      ruleWidth: parseFloat(separatorCss.borderBlockStartWidth),
      clientWidth: scroll.clientWidth,
      scrollWidth: scroll.scrollWidth,
      scrollLeft: scroll.scrollLeft,
      direction: scrollCss.direction,
      gutter: scrollCss.scrollbarGutter,
      borderCollapse: getComputedStyle(table).borderCollapse,
    };
  });
}

async function expectRulePaint(page: Page, reading: Awaited<ReturnType<typeof rules>>) {
  // The first body's lower separator is the second row's collapsed border-block-start.
  // Inspect its actual clipped paint, so a short native row cannot pass on width metadata alone.
  const image = await page.screenshot({
    clip: {
      x: reading.scroll.x,
      y: reading.second.y - 2,
      width: reading.scroll.width,
      height: 4,
    },
  });
  const coverage = await page.evaluate(
    async ({ png, canvasColor }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const sample = (x: number, y: number) => {
        const index = (y * canvas.width + x) * 4;
        return [...pixels.slice(index, index + 3)];
      };
      const distance = (a: number[], b: number[]) =>
        Math.max(...a.map((value, index) => Math.abs(value - b[index]!)));
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = colorCanvas.height = 1;
      const color = colorCanvas.getContext('2d')!;
      color.fillStyle = canvasColor;
      color.fillRect(0, 0, 1, 1);
      const backing = [...color.getImageData(0, 0, 1, 1).data].slice(0, 3);
      const center = Math.floor(canvas.width / 2);
      const column = Array.from({ length: canvas.height }, (_, y) => sample(center, y));
      const ink = column.sort((a, b) => distance(b, backing) - distance(a, backing))[0]!;
      const uncovered: number[] = [];
      for (let x = 0; x < canvas.width; x++) {
        if (
          !Array.from({ length: canvas.height }, (_, y) => sample(x, y)).some(
            (pixel) => distance(pixel, ink) <= 2,
          )
        ) {
          uncovered.push(x);
        }
      }
      return {
        width: canvas.width,
        ink,
        backing,
        contrastFromBacking: distance(ink, backing),
        uncovered,
      };
    },
    { png: image.toString('base64'), canvasColor: reading.canvas },
  );
  expect(coverage.width).toBeCloseTo(reading.clientWidth, 0);
  expect(coverage.contrastFromBacking).toBeGreaterThan(0);
  expect(coverage.uncovered).toEqual([]);
}

async function expectStatusGlyphs(table: Locator, forced = false) {
  const statuses = table.locator('tbody [data-zao-slot="status"]');
  await expect(statuses).toHaveCount(6);
  const readings = await statuses.evaluateAll(
    (nodes, { expected, forced }) => {
      const primitives = (svg: Element) =>
        [...svg.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse')].map(
          (shape) => ({
            tag: shape.localName,
            attributes: [...shape.attributes]
              .map(({ name, value }) => [name, value])
              .sort(([a], [b]) => a!.localeCompare(b!)),
          }),
        );
      return nodes.map((node) => {
        const word = node.textContent!.trim();
        const svg = node.querySelector('svg')!;
        const css = getComputedStyle(node);
        const glyphCss = getComputedStyle(svg);
        const expectedSvg = new DOMParser().parseFromString(
          expected[word as keyof typeof expected],
          'image/svg+xml',
        ).documentElement;
        const bounds = svg.getBoundingClientRect();
        const probe = document.createElement('span');
        probe.style.forcedColorAdjust = 'none';
        probe.style.color = forced ? 'CanvasText' : css.getPropertyValue('--zao-color-fg-default');
        document.body.append(probe);
        const foreground = getComputedStyle(probe).color;
        probe.remove();
        return {
          word,
          mark: svg.getAttribute('data-zao-status-glyph'),
          ariaHidden: svg.getAttribute('aria-hidden'),
          focusable: svg.getAttribute('focusable'),
          tabIndex: (svg as SVGElement).tabIndex,
          color: css.color,
          foreground,
          glyphColor: glyphCss.color,
          fill: svg.getAttribute('fill'),
          stroke: [...svg.querySelectorAll('[stroke]')].map(
            (shape) => getComputedStyle(shape).stroke,
          ),
          actual: primitives(svg),
          expected: primitives(expectedSvg),
          width: bounds.width,
          height: bounds.height,
          size: parseFloat(css.getPropertyValue('--zao-space-4')),
          gap: parseFloat(css.columnGap),
          expectedGap: parseFloat(css.getPropertyValue('--zao-space-1')),
        };
      });
    },
    { expected: glyphs, forced },
  );
  expect(readings.map((reading) => reading.word).sort()).toEqual(
    ['Ready', 'Running', 'Needs review', 'Blocked', 'Ready', 'Needs review'].sort(),
  );
  expect(new Set(readings.map((reading) => reading.color)).size).toBe(1);
  const distinct = new Map<string, string>();
  for (const reading of readings) {
    expect(reading.mark).toBe(reading.word);
    expect(reading.ariaHidden).toBe('true');
    expect(reading.focusable).toBe('false');
    expect(reading.tabIndex).toBe(-1);
    expect(reading.color).toBe(reading.foreground);
    expect(reading.glyphColor).toBe(reading.color);
    expect(reading.stroke.every((stroke) => stroke === reading.color)).toBe(true);
    expect(reading.fill).toBe('none');
    expect(reading.actual).toEqual(reading.expected);
    expect(reading.width).toBe(reading.size);
    expect(reading.height).toBe(reading.size);
    expect(reading.gap).toBe(reading.expectedGap);
    distinct.set(reading.word, JSON.stringify(reading.actual));
  }
  expect(new Set(distinct.values()).size).toBe(4);
  await expect(table.getByRole('img')).toHaveCount(0);
  for (const [word, count] of [
    ['Ready', 2],
    ['Running', 1],
    ['Needs review', 2],
    ['Blocked', 1],
  ] as const) {
    await expect(table.getByRole('cell', { name: word, exact: true })).toHaveCount(count);
  }
}

for (const paint of paints)
  for (const mode of modes)
    for (const direction of directions) {
      for (const width of widths) {
        test(`${paint}, ${mode}, ${direction}, ${width}px: row rule reaches both frame edges at each scroll endpoint`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 900 });
          const handles = await openTable(page, mode, direction, paint);
          await expectStatusGlyphs(handles.table);
          await expect(handles.scroll).toHaveAttribute('tabindex', '0');
          const initial = await rules(handles);
          expect(initial.direction).toBe(direction);
          expect(initial.gutter).toBe('auto');
          expect(initial.borderCollapse).toBe('collapse');
          expect(initial.scroll.x).toBeCloseTo(initial.frame.x + initial.borderLeft, 2);
          expect(initial.scroll.x + initial.scroll.width).toBeCloseTo(
            initial.frame.x + initial.frame.width - initial.borderRight,
            2,
          );
          expect(initial.first.width).toBeCloseTo(initial.table.width, 2);
          if (width === 1440) expect(initial.table.width).toBeCloseTo(initial.scroll.width, 2);
          else expect(initial.scrollWidth).toBeGreaterThan(initial.clientWidth);
          for (const end of ['start', 'end'] as const) {
            await handles.scroll.evaluate((node, value) => {
              node.scrollLeft =
                value === 'start'
                  ? 0
                  : (getComputedStyle(node).direction === 'rtl' ? -1 : 1) * node.scrollWidth;
            }, end);
            await settle(handles.table);
            const reading = await rules(handles);
            expect(reading.ruleStyle).toBe('solid');
            expect(reading.ruleWidth).toBe(1);
            expect(reading.first.x).toBeLessThanOrEqual(reading.scroll.x);
            expect(reading.first.x + reading.first.width).toBeGreaterThanOrEqual(
              reading.scroll.x + reading.scroll.width,
            );
            if (width === 360) {
              expect(Math.abs(reading.scrollLeft)).toBeCloseTo(
                end === 'start' ? 0 : reading.scrollWidth - reading.clientWidth,
                0,
              );
            }
            await expectRulePaint(page, reading);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);
        });
      }

      test(`${paint}, ${mode}, ${direction}: neutral words and decorative glyphs preserve native sorting, selection and forced-color reading`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const { specimen, table, scroll } = await openTable(page, mode, direction, paint);
        expect(await table.evaluate((node) => node.tagName)).toBe('TABLE');
        await expect(specimen.getByRole('grid')).toHaveCount(0);
        await expect(table.locator('caption')).toContainText('Six operations requests');
        await expect(table.locator('thead th[scope="col"]')).toHaveCount(6);
        await expect(table.locator('tbody th[scope="row"]')).toHaveCount(6);
        await expectStatusGlyphs(table);
        const access = table.getByRole('row').filter({ hasText: 'Access review' });
        const target = await box(access);
        await access.hover();
        await settle(table);
        expect(await box(access)).toEqual(target);
        await page.mouse.move(0, 0);
        const checkbox = table.getByRole('checkbox', { name: 'Select Access review', exact: true });
        await checkbox.focus();
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
        await expect(checkbox).toHaveCSS('outline-style', 'solid');
        expect(await box(access)).toEqual(target);
        await table.getByRole('checkbox', { name: 'Select Usage summary', exact: true }).check();
        await expect(
          table.getByRole('checkbox', { name: 'Select all requests', exact: true }),
        ).toBeChecked({
          indeterminate: true,
        });
        const columns = await table
          .locator('thead th')
          .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
        const sort = table.getByRole('button', { name: 'Sort by items, ascending', exact: true });
        await sort.focus();
        await page.keyboard.press('Enter');
        await expect(table.getByRole('columnheader').filter({ hasText: 'Items' })).toHaveAttribute(
          'aria-sort',
          'ascending',
        );
        const counts = await table
          .locator('tbody tr')
          .evaluateAll((rows) =>
            rows.map((row) => Number(row.children[4]!.textContent!.replaceAll(',', ''))),
          );
        expect(counts).toEqual([...counts].sort((a, b) => a - b));
        expect(
          await table
            .locator('thead th')
            .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width)),
        ).toEqual(columns);
        await expect(checkbox).toBeChecked();
        await expect(
          table.getByRole('checkbox', { name: 'Select Usage summary', exact: true }),
        ).toBeChecked();
        await expect(specimen.getByRole('status')).toContainText(
          '2 of 6 requests selected · Sorted by Items, ascending',
        );
        await expect(
          specimen.getByRole('button', { name: 'Compare selected', exact: true }),
        ).toBeEnabled();
        await expectStatusGlyphs(table);
        await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
        await settle(table);
        await expectStatusGlyphs(table, true);
        const selected = await box(access);
        await access.hover();
        expect(await box(access)).toEqual(selected);
        expect(await access.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
        await scroll.focus();
        await expect(scroll).toBeFocused();
        await expect(scroll).toHaveCSS('outline-style', 'solid');
        await expect(scroll).toHaveCSS('outline-offset', '2px');
      });
    }
