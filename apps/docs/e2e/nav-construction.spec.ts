import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const finishes = [
  { name: 'Su light', theme: 'su', mode: 'light' },
  { name: 'Su dark', theme: 'su', mode: 'dark' },
] as const;

async function chooseFinish(page: Page, finish: (typeof finishes)[number]) {
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: finish.mode === 'light' ? 'Light' : 'Dark' })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-zao-theme', finish.theme);
  await expect(page.locator('html')).toHaveAttribute('data-zao-mode', finish.mode);
  await page.evaluate(async () => document.fonts.ready);
}

async function openDocs(page: Page, finish: (typeof finishes)[number]) {
  await page.goto('/components/card?style=quiet-instrument');
  await chooseFinish(page, finish);
  const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
  // Finish switching transitions link colors; compare against the completed finish.
  await nav.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
  return nav;
}

async function translation(part: Locator) {
  return part.evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { x: matrix.m41, y: matrix.m42 };
  });
}

async function expectTranslation(part: Locator, y: number) {
  await expect
    .poll(async () => {
      const value = await translation(part);
      return Math.abs(value.x) < 0.1 && Math.abs(value.y - y) < 0.1;
    })
    .toBe(true);
}

async function linkBounds(nav: Locator) {
  return nav.getByRole('link').evaluateAll((links) =>
    links.map((link) => {
      const { x, y, width, height } = link.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );
}

async function captureNavigation(page: Page, name: string) {
  const pagePath = test.info().outputPath(`${name}-page.png`);
  await page.screenshot({ path: pagePath });
  await test.info().attach(`${name} page`, { path: pagePath, contentType: 'image/png' });
  const navPath = test.info().outputPath(`${name}-navigation.png`);
  await page.locator('.docs-nav-aside').screenshot({ path: navPath });
  await test.info().attach(`${name} navigation`, { path: navPath, contentType: 'image/png' });
}

async function expectArtworkInsideViewport(figure: Locator) {
  const bounds = await figure.evaluate((node) => {
    const viewport = node.getBoundingClientRect();
    const shapes = Array.from(
      node.querySelectorAll('path, polygon, polyline, line, rect, circle, ellipse'),
    ).map((shape) => {
      const rect = shape.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    return {
      left: viewport.left,
      right: viewport.right,
      top: viewport.top,
      bottom: viewport.bottom,
      shapes,
    };
  });
  expect(bounds.shapes.length).toBeGreaterThan(0);
  for (const shape of bounds.shapes) {
    expect(shape.left).toBeGreaterThanOrEqual(bounds.left - 0.5);
    expect(shape.right).toBeLessThanOrEqual(bounds.right + 0.5);
    expect(shape.top).toBeGreaterThanOrEqual(bounds.top - 0.5);
    expect(shape.bottom).toBeLessThanOrEqual(bounds.bottom + 0.5);
  }
}

async function expectCompactHeading(section: Locator) {
  const heading = section.locator('.docs-nav-section-heading');
  const figure = await heading.locator('svg.docs-nav-figure').boundingBox();
  const label = await heading.locator('p').boundingBox();
  if (!figure || !label) throw new Error('Each nav section needs visible artwork and a title.');
  const alignment = await heading.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      right: bounds.right - Number.parseFloat(style.paddingRight),
      bottom: bounds.bottom,
    };
  });
  const link = await section
    .getByRole('link')
    .first()
    .evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        textLeft: bounds.left + Number.parseFloat(style.paddingLeft),
        top: bounds.top,
        textTop: bounds.top + Number.parseFloat(style.paddingTop),
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingBottom: Number.parseFloat(style.paddingBottom),
      };
    });
  expect(figure.width).toBe(48);
  expect(figure.height).toBe(40);
  expect(label.x).toBeCloseTo(link.textLeft, 1);
  expect(figure.x - label.x - label.width).toBeGreaterThanOrEqual(11.9);
  expect(figure.x + figure.width).toBeCloseTo(alignment.right, 1);
  expect(label.y + label.height).toBeCloseTo(figure.y + figure.height, 1);
  expect(link.top - alignment.bottom).toBeCloseTo(8, 1);
  expect(link.paddingTop).toBe(6);
  expect(link.paddingBottom).toBe(6);
  expect(link.textTop - label.y - label.height).toBeCloseTo(14, 1);
}

async function expectFineDrawing(figure: Locator) {
  await expect(figure).toHaveAttribute('focusable', 'false');
  await expect(figure).not.toHaveAttribute('filter');
  await expect(figure.locator('text, filter, foreignObject, a, [tabindex], [filter]')).toHaveCount(
    0,
  );
  await expect(figure).toHaveCSS('filter', 'none');
  await expect(figure).toHaveCSS('box-shadow', 'none');
  const strokes = await figure
    .locator('path, polygon, polyline, line, rect, circle, ellipse')
    .evaluateAll((shapes) =>
      shapes.map((shape) => {
        const style = getComputedStyle(shape);
        return {
          vectorEffect: style.vectorEffect,
          join: style.strokeLinejoin,
          width: Number.parseFloat(style.strokeWidth),
          filter: style.filter,
        };
      }),
    );
  expect(strokes.length).toBeGreaterThan(0);
  for (const stroke of strokes) {
    expect(stroke.vectorEffect).toBe('non-scaling-stroke');
    expect(stroke.join).toBe('round');
    expect(stroke.width).toBeGreaterThan(0);
    expect(stroke.width).toBeLessThanOrEqual(1);
    expect(stroke.filter).toBe('none');
  }
}

for (const finish of finishes) {
  test(`${finish.name}: section artwork responds without moving labels or targets`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    const nav = await openDocs(page, finish);
    await expect(nav).toHaveCount(1);
    const sections = nav.locator('[data-nav-section]');
    await expect(sections).toHaveCount(4);
    for (const section of await sections.all()) {
      const figure = section.locator('svg.docs-nav-figure');
      await expect(figure).toHaveAttribute('aria-hidden', 'true');
      await expect(section.getByRole('img')).toHaveCount(0);
      await expectCompactHeading(section);
      await expectFineDrawing(figure);
      await expectArtworkInsideViewport(figure);
    }

    await page.mouse.move(0, 0);
    await captureNavigation(page, 'rest');
    for (const section of await sections.all()) {
      const figure = section.locator('svg.docs-nav-figure');
      const part = figure.locator('.docs-nav-figure-part');
      const link = section.getByRole('link').first();
      await page.mouse.move(0, 0);
      await expectTranslation(part, 0);
      const before = await linkBounds(nav);
      for (const bounds of before) {
        expect(bounds.height).toBeGreaterThanOrEqual(24);
        expect(bounds.width).toBeGreaterThanOrEqual(24);
      }
      const figureBox = await figure.boundingBox();
      const muted = await figure.evaluate((node) => getComputedStyle(node).color);
      const foreground = await nav
        .locator('[aria-current="page"]')
        .evaluate((node) => getComputedStyle(node).color);
      expect(muted).not.toBe(foreground);

      await link.hover();
      await expectTranslation(part, -4);
      await expect
        .poll(() => figure.evaluate((node) => getComputedStyle(node).color))
        .toBe(foreground);
      expect(await linkBounds(nav)).toEqual(before);
      expect(await figure.boundingBox()).toEqual(figureBox);
      await expectArtworkInsideViewport(figure);
      await captureNavigation(page, `${await section.getAttribute('data-nav-section')}-open`);
      const timing = await part.evaluate((node) => {
        const style = getComputedStyle(node);
        const token = style.getPropertyValue('--zao-motion-duration-fast').trim();
        const seconds = (value: string) =>
          value.endsWith('ms') ? Number.parseFloat(value) / 1000 : Number.parseFloat(value);
        return {
          property: style.transitionProperty,
          durations: style.transitionDuration.split(',').map((value) => seconds(value.trim())),
          expected: seconds(token),
        };
      });
      expect(timing.property).toContain('transform');
      expect(timing.durations).toContain(timing.expected);

      await page.mouse.move(0, 0);
      await expectTranslation(part, 0);
      await expect.poll(() => figure.evaluate((node) => getComputedStyle(node).color)).toBe(muted);
      await page.keyboard.press('Tab');
      await link.focus();
      await expect(link).toBeFocused();
      expect(await link.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
      await expectTranslation(part, -4);
      expect(await linkBounds(nav)).toEqual(before);
      const outline = await link.evaluate((node) => {
        const style = getComputedStyle(node);
        return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThan(0);
      await page.keyboard.press('Shift+Tab');
      await expectTranslation(part, 0);
      expect(await linkBounds(nav)).toEqual(before);
    }

    const accessibility = await new AxeBuilder({ page }).include('.docs-nav-aside').analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test(`${finish.name}: reduced motion keeps the figure still and retains foreground feedback`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const nav = await openDocs(page, finish);
    const section = nav.locator('[data-nav-section="foundations"]');
    const figure = section.locator('svg.docs-nav-figure');
    const part = figure.locator('.docs-nav-figure-part');
    const link = section.getByRole('link', { name: 'Color', exact: true });
    const before = await linkBounds(nav);
    const foreground = await nav
      .locator('[aria-current="page"]')
      .evaluate((node) => getComputedStyle(node).color);

    await link.hover();
    await expectTranslation(part, 0);
    await expect
      .poll(() => figure.evaluate((node) => getComputedStyle(node).color))
      .toBe(foreground);
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await link.focus();
    await expectTranslation(part, 0);
    await expect
      .poll(() => figure.evaluate((node) => getComputedStyle(node).color))
      .toBe(foreground);
    expect(await linkBounds(nav)).toEqual(before);
  });
}

test('docs routes mark only their exact current page', async ({ page }) => {
  for (const route of ['/', '/components/button']) {
    await page.goto(route);
    const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
    const current = nav.locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    expect(
      await current.evaluate((node) => new URL((node as HTMLAnchorElement).href).pathname),
    ).toBe(route);
    for (const part of await nav.locator('.docs-nav-figure-part').all()) {
      await expectTranslation(part, 0);
    }
  }
});

test('navigation retains the Su study only for components and design notes', async ({ page }) => {
  await page.goto('/components/button?style=quiet-instrument');
  const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
  for (const destination of [
    {
      name: 'Card',
      path: '/components/card',
      linkStyle: 'quiet-instrument',
      style: 'quiet-instrument',
    },
    {
      name: 'Design notes',
      path: '/foundations/design',
      linkStyle: 'quiet-instrument',
      style: 'quiet-instrument',
    },
    { name: 'Color', path: '/foundations/color', linkStyle: null, style: null },
    { name: 'Button', path: '/components/button', linkStyle: null, style: 'quiet-instrument' },
  ]) {
    const link = nav.getByRole('link', { name: destination.name, exact: true });
    expect(
      await link.evaluate((node) =>
        new URL((node as HTMLAnchorElement).href).searchParams.get('style'),
      ),
    ).toBe(destination.linkStyle);
    await link.click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(destination.path);
    await expect.poll(() => new URL(page.url()).searchParams.get('style')).toBe(destination.style);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  }
});

for (const finish of finishes) {
  test(`${finish.name}: short desktop navigation scrolls every link into view with room for keyboard focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto('/components/card');
    await chooseFinish(page, finish);
    const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
    const scroll = page.locator('.docs-nav-desktop');
    const scrollSizes = await scroll.evaluate((node) => ({
      visible: node.clientHeight,
      total: node.scrollHeight,
      overflow: getComputedStyle(node).overflowY,
    }));
    expect(scrollSizes.total).toBeGreaterThan(scrollSizes.visible);
    expect(scrollSizes.overflow).toBe('auto');
    const links = nav.getByRole('link');
    await page.keyboard.press('Tab');
    await links.first().focus();
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index);
      if (index > 0) await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      await expect(link).toBeInViewport();
      const clearance = await link.evaluate((node) => {
        const port = node.closest('.docs-nav-desktop')!;
        const viewport = port.getBoundingClientRect();
        const bounds = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const outline =
          Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
        return {
          top: bounds.top - outline - viewport.top,
          bottom: viewport.bottom - bounds.bottom - outline,
          left: bounds.left - outline - viewport.left,
          right: viewport.right - bounds.right - outline,
        };
      });
      for (const space of Object.values(clearance)) expect(space).toBeGreaterThanOrEqual(-0.5);
    }
    await expect(links.last()).toHaveText('Histogram');
    expect(await scroll.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    const aside = await page.locator('.docs-nav-aside').boundingBox();
    if (!aside) throw new Error('The desktop docs navigation must have visible bounds.');
    expect(aside.y + aside.height).toBeLessThanOrEqual(500);
    await captureNavigation(page, 'short-desktop-bottom');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test.describe('mobile docs navigation', () => {
  test.use({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });

  for (const finish of finishes) {
    test(`${finish.name}: native disclosure exposes one Docs nav and closes after a route change`, async ({
      page,
    }) => {
      await page.goto('/components/card?style=quiet-instrument');
      await chooseFinish(page, finish);
      const details = page.locator('.docs-nav-aside details');
      const summary = details.locator('summary');
      await expect(summary).toHaveText('Browse docs · Components / Card');
      await expect(page.getByRole('navigation', { name: 'Docs', exact: true })).toHaveCount(0);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Card', exact: true }),
      ).toBeInViewport();

      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(details).toHaveAttribute('open', '');
      const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
      await expect(nav).toHaveCount(1);
      await expect(nav.getByRole('link', { name: 'Card', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
      for (const part of await nav.locator('.docs-nav-figure-part').all()) {
        await expectTranslation(part, 0);
      }
      for (const section of await nav.locator('[data-nav-section]').all()) {
        await expectCompactHeading(section);
        await expectFineDrawing(section.locator('svg.docs-nav-figure'));
        await expectArtworkInsideViewport(section.locator('svg.docs-nav-figure'));
      }
      await captureNavigation(page, 'mobile-expanded');
      await nav.getByRole('link', { name: 'Button', exact: true }).tap();
      await expect.poll(() => new URL(page.url()).pathname).toBe('/components/button');
      await expect
        .poll(() => new URL(page.url()).searchParams.get('style'))
        .toBe('quiet-instrument');
      await expect(summary).toHaveText('Browse docs · Components / Button');
      await expect(details).not.toHaveAttribute('open');
      await expect(page.getByRole('navigation', { name: 'Docs', exact: true })).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  }
});
