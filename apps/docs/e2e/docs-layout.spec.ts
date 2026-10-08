import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const finishes = [
  { name: 'Su light', theme: 'su', mode: 'light' },
  { name: 'Su dark', theme: 'su', mode: 'dark' },
] as const;

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The docs layout element needs visible bounds.');
  return box;
}

async function openTable(page: Page) {
  await page.goto('/components/table?style=quiet-instrument');
  await expect(page.getByRole('heading', { level: 1, name: 'Table', exact: true })).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);
}

async function chooseFinish(page: Page, finish: (typeof finishes)[number]) {
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: finish.mode === 'light' ? 'Light' : 'Dark' })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-zao-theme', finish.theme);
  await expect(page.locator('html')).toHaveAttribute('data-zao-mode', finish.mode);
}

async function scrollbarPaint(region: Locator) {
  return region.evaluate((node) => {
    const hovered = node.matches(':hover');
    const style = getComputedStyle(node);
    const scrollbar = getComputedStyle(node, '::-webkit-scrollbar');
    const thumb = getComputedStyle(node, '::-webkit-scrollbar-thumb');
    const sample = document.createElement('span');
    sample.style.position = 'absolute';
    sample.style.pointerEvents = 'none';
    sample.style.backgroundColor = 'var(--zao-color-border-default)';
    node.append(sample);
    const expected = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return {
      thumb: thumb.backgroundColor,
      native: style.scrollbarColor,
      width: scrollbar.width,
      height: scrollbar.height,
      gutter: style.scrollbarGutter,
      reserved: (node as HTMLElement).offsetWidth - node.clientWidth,
      expected,
      hovered,
      hoveredAfterProbe: node.matches(':hover'),
      finePointer: matchMedia('(hover: hover) and (pointer: fine)').matches,
      supportsWebKit: CSS.supports('selector(::-webkit-scrollbar)'),
      resolvedToken: style.getPropertyValue('--zao-color-border-default').trim(),
    };
  });
}

function transparentThumb(paint: Awaited<ReturnType<typeof scrollbarPaint>>) {
  return (
    paint.thumb === 'rgba(0, 0, 0, 0)' &&
    (paint.native === 'auto' || paint.native === 'rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)')
  );
}

async function capturePage(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function captureScrollbar(region: Locator, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await region.screenshot({ path });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function expectForegroundThumb(region: Locator) {
  const expected = await scrollbarPaint(region);
  await expect
    .poll(() => scrollbarPaint(region))
    .toMatchObject({
      hovered: true,
      hoveredAfterProbe: true,
      finePointer: true,
      supportsWebKit: expected.supportsWebKit,
      expected: expected.expected,
      resolvedToken: expected.resolvedToken,
      ...(expected.native === 'auto'
        ? { thumb: expected.expected, native: 'auto' }
        : { native: `${expected.expected} rgba(0, 0, 0, 0)` }),
    });
}

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return;
  await capturePage(page, 'layout-failure').catch(() => {});
  const regions = page.locator('.docs-scroll-region');
  const diagnostics = await Promise.all((await regions.all()).map(scrollbarPaint));
  await info.attach('scrollbar-diagnostics', {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json',
  });
});

for (const width of [1440, 1920, 768, 360]) {
  test(`${width}px: docs use the available canvas and keep content within its columns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await openTable(page);
    const main = page.getByRole('main');
    const shell = page.locator('.docs-shell').filter({ has: main });
    const headerShell = page.locator('body > header .docs-shell');
    const bodyBox = await bounds(page.locator('body'));
    const available = bodyBox.width;
    const nativeGutter = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement, '::-webkit-scrollbar').width),
    );
    expect(bodyBox.x).toBeCloseTo(0, 1);
    expect(width - available).toBeGreaterThanOrEqual(0);
    expect(width - available).toBeLessThanOrEqual(nativeGutter);
    const gutter = width >= 768 ? 32 : 16;
    const shellBox = await bounds(shell);
    const headerBox = await bounds(headerShell);
    const mainBox = await bounds(main);
    expect(shellBox.x).toBeCloseTo(0, 1);
    expect(shellBox.width).toBeCloseTo(available, 1);
    expect(headerBox.x).toBeCloseTo(0, 1);
    expect(headerBox.width).toBeCloseTo(available, 1);
    expect(available - mainBox.x - mainBox.width).toBeCloseTo(gutter, 1);
    const logo = await bounds(page.locator('body > header').getByRole('link', { name: 'ZAO 造' }));
    expect(logo.x).toBeCloseTo(gutter, 1);

    if (width >= 768) {
      const sidebar = await bounds(page.locator('.docs-nav-aside'));
      expect(sidebar.x).toBeCloseTo(gutter, 1);
      expect(sidebar.width).toBeCloseTo(180, 1);
      expect(mainBox.x - sidebar.x - sidebar.width).toBeCloseTo(32, 1);
      expect(mainBox.width).toBeCloseTo(available - gutter * 2 - 180 - 32, 1);
      await expect(page.getByRole('navigation', { name: 'Docs', exact: true })).toHaveCount(1);
    } else {
      expect(mainBox.x).toBeCloseTo(gutter, 1);
      expect(mainBox.width).toBeCloseTo(available - gutter * 2, 1);
      await expect(page.getByRole('navigation', { name: 'Docs', exact: true })).toHaveCount(0);
      await expect(page.locator('.docs-nav-aside summary')).toBeVisible();
    }

    const prose = main.locator(':scope > div > header');
    const proseBox = await bounds(prose);
    const proseLimit = await prose.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).maxWidth),
    );
    expect(proseBox.width).toBeLessThanOrEqual(proseLimit + 0.5);
    if (width >= 1440) expect(proseBox.width).toBeLessThan(mainBox.width);
    const preview = await bounds(main.locator('.study'));
    expect(preview.width).toBeCloseTo(mainBox.width, 1);

    const sections = main.locator('.docs-detail-section');
    await expect(sections).toHaveCount(4);
    const contentStarts: number[] = [];
    for (const section of await sections.all()) {
      const heading = await bounds(section.locator(':scope > h2'));
      const content = await bounds(section.locator(':scope > :not(h2)'));
      expect(heading.x).toBeCloseTo(mainBox.x, 1);
      expect(content.x + content.width).toBeLessThanOrEqual(mainBox.x + mainBox.width + 0.5);
      if (width >= 1440) {
        expect(heading.width).toBeCloseTo(180, 1);
        expect(content.x).toBeGreaterThanOrEqual(heading.x + heading.width);
        expect(content.y).toBeCloseTo(heading.y, 1);
        contentStarts.push(content.x);
      } else if (width === 360) {
        expect(content.x).toBeCloseTo(heading.x, 1);
        expect(content.y).toBeGreaterThanOrEqual(heading.y + heading.height);
      }
    }
    for (const start of contentStarts) expect(start).toBeCloseTo(contentStarts[0]!, 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await capturePage(page, `docs-${width}`);
  });
}

for (const finish of finishes) {
  test(`${finish.name}: the sidebar reveals its scrollbar without changing geometry`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await openTable(page);
    await chooseFinish(page, finish);
    const region = page.locator('.docs-nav-desktop.docs-scroll-region');
    await page.mouse.move(0, 0);
    const before = await bounds(region);
    const rest = await scrollbarPaint(region);
    await captureScrollbar(region, 'sidebar-scrollbar-rest');
    expect(transparentThumb(rest)).toBe(true);
    expect(rest.gutter).toContain('stable');
    expect(await region.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await region.hover();
    await captureScrollbar(region, 'sidebar-scrollbar-hover');
    await expectForegroundThumb(region);
    const hover = await scrollbarPaint(region);
    expect(hover.width).toBe(rest.width);
    expect(hover.height).toBe(rest.height);
    expect(hover.reserved).toBe(rest.reserved);
    expect(await bounds(region)).toEqual(before);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => region.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page.mouse.move(0, 0);
    await expect.poll(async () => transparentThumb(await scrollbarPaint(region))).toBe(true);

    const mainBefore = await bounds(page.getByRole('main'));
    await page.getByRole('heading', { level: 1, name: 'Table', exact: true }).hover();
    expect(await bounds(page.getByRole('main'))).toEqual(mainBefore);
  });
}

test('horizontal code scrolling stays inside its region and preserves page geometry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openTable(page);
  const example = page.locator('.docs-detail-section').filter({
    has: page.getByRole('heading', { name: 'Example', exact: true }),
  });
  const region = example.locator('.docs-scroll-region');
  await region.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const before = await bounds(region);
  const rest = await scrollbarPaint(region);
  await captureScrollbar(region, 'code-scrollbar-rest');
  expect(transparentThumb(rest)).toBe(true);
  expect(await region.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await region.hover();
  await captureScrollbar(region, 'code-scrollbar-hover');
  await expectForegroundThumb(region);
  await page.mouse.wheel(300, 0);
  await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  expect(await bounds(region)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test.describe('touch scrolling', () => {
  test.use({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });

  test('code and page retain native scrollbar treatment and contained scroll ranges', async ({
    page,
  }) => {
    await openTable(page);
    expect(
      await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches),
    ).toBe(false);
    const example = page.locator('.docs-detail-section').filter({
      has: page.getByRole('heading', { name: 'Example', exact: true }),
    });
    const region = example.locator('.docs-scroll-region');
    const styles = await region.evaluate((node) => {
      const css = getComputedStyle(node);
      return { color: css.scrollbarColor, width: css.scrollbarWidth, gutter: css.scrollbarGutter };
    });
    expect(styles).toEqual({ color: 'auto', width: 'auto', gutter: 'auto' });
    const range = await region.evaluate((node) => {
      node.scrollLeft = node.scrollWidth;
      return { position: node.scrollLeft, content: node.scrollWidth, visible: node.clientWidth };
    });
    expect(range.content).toBeGreaterThan(range.visible);
    expect(range.position).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
