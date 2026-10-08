import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const exhibitionSelector = '[data-zao-overview-exhibition]';
const quietCssUrl = new URL(
  '../../../explorations/su-studies/quiet-instrument/style.css',
  import.meta.url,
);

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

async function chooseMode(page: Page, mode: 'light' | 'dark' | 'system') {
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode[0]!.toUpperCase() + mode.slice(1), exact: true })
    .click();
}

async function openExhibition(page: Page, realCss = false, mode: 'light' | 'dark' = 'light') {
  await page.goto('/');
  const exhibition = page.locator(exhibitionSelector);
  await expect(exhibition).toBeVisible();
  await chooseMode(page, mode);
  if (realCss) await page.addStyleTag({ content: await readFile(quietCssUrl, 'utf8') });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.mouse.move(0, 0);
  await settle(exhibition);
  return exhibition;
}

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

test('overview server-renders one curated Card and its scoped study stylesheet', async ({
  request,
  page,
}) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain('data-zao-overview-exhibition');
  expect(html).toContain('data-study="quiet-instrument"');
  expect(html).toContain('/api/style-studies/quiet-instrument/css?v=');

  const exhibition = await openExhibition(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(exhibition.locator('[data-zao-specimen="card"]')).toHaveCount(1);
  await expect(exhibition.locator('[data-zao-slot="storage-study"]')).toHaveCount(1);
  await expect(exhibition.locator('[data-zao-card-width]')).toHaveCount(0);
  await expect(
    exhibition.getByText('Quiet instrument · Local Su study · Sample data'),
  ).toBeVisible();
  const study = exhibition.locator('.study');
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', 'light');
  await expect
    .poll(() =>
      study.evaluate((node) => getComputedStyle(node).getPropertyValue('--test-style-id').trim()),
    )
    .toBe('quiet-instrument');
  for (const shell of [page.locator('body > header'), page.locator('.docs-nav-aside')]) {
    expect(
      await shell.evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--test-style-id').trim(),
      ),
    ).toBe('');
  }
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/');

  for (const [label, path] of [
    ['Button', '/components/button'],
    ['IconButton', '/components/icon-button'],
    ['Tabs', '/components/tabs'],
    ['Switch', '/components/switch'],
    ['Menu', '/components/menu'],
    ['Card', '/components/card'],
    ['Data visualization', '/foundations/data-visualization'],
  ] as const) {
    await expect(exhibition.getByRole('link', { name: label, exact: true })).toHaveAttribute(
      'href',
      path,
    );
  }
  const main = page.getByRole('main');
  for (const [label, path] of [
    ['Color', '/foundations/color'],
    ['Typography', '/foundations/typography'],
    ['Space', '/foundations/space'],
    ['Design notes', '/foundations/design'],
  ] as const) {
    await expect(main.getByRole('link', { name: label, exact: true })).toHaveAttribute(
      'href',
      path,
    );
  }
});

test('every exhibit follows light, dark, and system preferences without changing the overview URL', async ({
  page,
}) => {
  const exhibition = await openExhibition(page);
  const study = exhibition.locator('.study');
  await chooseMode(page, 'dark');
  await expect(study).toHaveAttribute('data-zao-mode', 'dark');
  await page.reload();
  await expect(study).toHaveAttribute('data-zao-mode', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.emulateMedia({ colorScheme: 'dark' });
  await chooseMode(page, 'system');
  await expect(page.locator('html')).not.toHaveAttribute('data-zao-mode');
  await expect(study).toHaveAttribute('data-zao-mode', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(study).toHaveAttribute('data-zao-mode', 'light');
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/');
});

test('Card actions reach live settings and inspection; save and reset share local state', async ({
  page,
}) => {
  const exhibition = await openExhibition(page, true);
  const card = exhibition.locator('[data-zao-specimen="card"]');
  const actions = exhibition.getByRole('region', { name: 'Actions', exact: true });
  const settings = exhibition.getByRole('region', { name: 'Settings', exact: true });
  const email = settings.getByRole('switch', { name: 'Email updates', exact: true });
  const status = actions.getByRole('status');
  const actionsHeight = (await bounds(actions)).height;
  expect((await bounds(status)).height).toBeGreaterThanOrEqual(24);
  await expect(email).toBeChecked();
  await card.getByRole('button', { name: 'Review settings', exact: true }).click();
  await expect(email).toBeFocused();
  await page.keyboard.press('Space');
  await expect(email).not.toBeChecked();
  const save = actions.getByRole('button', { name: 'Save changes', exact: true });
  await save.focus();
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Saved email updates: off.');
  expect((await bounds(actions)).height).toBeCloseTo(actionsHeight, 1);
  await settings.getByText('Email updates', { exact: true }).click();
  await expect(email).toBeChecked();
  await actions.getByRole('button', { name: 'Reset changes', exact: true }).click();
  await expect(email).not.toBeChecked();
  await expect(status).toHaveText('Reset changes.');
  await card.getByRole('button', { name: 'Inspect storage', exact: true }).click();
  await expect(
    card.getByRole('button', { name: 'Inspect used capacity', exact: true }),
  ).toBeFocused();
  await expect(card.locator('[data-zao-slot="storage-detail"]')).toHaveText(
    'Used capacity: 68 of 100 parts.',
  );
});

test('navigation panels expose the same workspace and current setting through keyboard selection', async ({
  page,
}) => {
  const exhibition = await openExhibition(page, true);
  const navigation = exhibition.getByRole('region', { name: 'Navigation', exact: true });
  const summary = navigation.getByRole('tab', { name: 'Summary', exact: true });
  await expect(summary).toHaveAttribute('aria-selected', 'true');
  await expect(navigation.getByRole('tabpanel', { name: 'Summary', exact: true })).toContainText(
    'North workspace',
  );
  await summary.focus();
  await page.keyboard.press('ArrowRight');
  await expect(navigation.getByRole('tab', { name: 'Members', exact: true })).toBeFocused();
  await expect(navigation.getByRole('tabpanel', { name: 'Members', exact: true })).toContainText(
    '12 active members',
  );
  await page.keyboard.press('ArrowRight');
  const settingsPanel = navigation.getByRole('tabpanel', { name: 'Settings', exact: true });
  await expect(settingsPanel).toContainText('Email updates are on.');
  await exhibition
    .getByRole('region', { name: 'Settings', exact: true })
    .getByRole('switch', { name: 'Email updates', exact: true })
    .click();
  await expect(settingsPanel).toContainText('Email updates are off.');
});

test('Menu and IconButton retain dismissal, focus, and meaningful actions inside the exhibition', async ({
  page,
}) => {
  const exhibition = await openExhibition(page, true);
  const actions = exhibition.getByRole('region', { name: 'Actions', exact: true });
  const settings = exhibition.getByRole('region', { name: 'Settings', exact: true });
  const email = settings.getByRole('switch', { name: 'Email updates', exact: true });
  const icon = actions.getByRole('button', { name: 'Review settings', exact: true });
  await page.keyboard.press('Tab');
  await icon.focus();
  const tooltip = actions.locator('[data-zao-slot="tooltip"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('Review settings');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await expect(icon).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(email).toBeFocused();
  await page.keyboard.press('Space');
  await expect(email).not.toBeChecked();
  await actions.getByRole('button', { name: 'Save changes', exact: true }).click();

  const trigger = settings.getByRole('button', { name: 'Workspace actions', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = settings.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(
    menu.getByRole('menuitem', { name: 'Archive workspace', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await menu.getByRole('menuitem', { name: 'Reset defaults', exact: true }).click();
  await expect(email).toBeChecked();
  await expect(actions.getByRole('status')).toHaveText('Reset defaults.');
  await email.click();
  await trigger.click();
  await menu.getByRole('menuitem', { name: 'Reset changes', exact: true }).click();
  await expect(email).toBeChecked();
  await expect(actions.getByRole('status')).toHaveText('Reset changes.');
});

test('reduced-motion storage inspection preserves the quantitative reading and geometry', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const exhibition = await openExhibition(page, true);
  const ring = exhibition.locator('[data-zao-slot="storage-study"]');
  const chart = ring.locator('[data-zao-slot="storage-chart"]');
  const original = await bounds(chart);
  await expect(ring.getByRole('img', { name: 'Storage use at 68 percent' })).toBeVisible();
  await expect(ring.getByText('32% available', { exact: true })).toBeVisible();
  await expect(ring.locator('[data-zao-slot="storage-mark"][data-state="used"]')).toHaveCount(68);
  await expect(ring.locator('[data-zao-slot="storage-mark"][data-state="available"]')).toHaveCount(
    32,
  );
  const available = ring.getByRole('button', { name: 'Inspect available capacity', exact: true });
  await available.focus();
  await page.keyboard.press('Space');
  await expect(available).toHaveAttribute('aria-pressed', 'true');
  await expect(ring.locator('[data-zao-slot="storage-detail"]')).toHaveText(
    'Available capacity: 32 of 100 parts.',
  );
  await expect(ring.locator('[data-zao-slot="storage-inspection-guide"]')).toHaveCSS(
    'animation-name',
    'none',
  );
  expect(await bounds(chart)).toEqual(original);
  await page.keyboard.press('Escape');
  await expect(available).toBeFocused();
  await expect(ring).toHaveAttribute('data-inspection', 'none');
});

test('touch operates settings and storage inspection in the narrow overview', async ({
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
    const exhibition = await openExhibition(page, true);
    const email = exhibition
      .getByRole('region', { name: 'Settings', exact: true })
      .getByRole('switch', { name: 'Email updates', exact: true });
    await email.tap();
    await expect(email).not.toBeChecked();
    const ring = exhibition.locator('[data-zao-slot="storage-study"]');
    await ring.getByRole('button', { name: 'Inspect available capacity', exact: true }).tap();
    await expect(ring.locator('[data-zao-slot="storage-detail"]')).toHaveText(
      'Available capacity: 32 of 100 parts.',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

for (const width of [1440, 768, 360, 320]) {
  test(`${width}px: the live collection, focus targets, and open Menu fit the overview`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const exhibition = await openExhibition(page, true);
    const main = await bounds(page.getByRole('main'));
    if (width === 1440) {
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      const card = await bounds(exhibition.locator('[data-zao-component="card"]'));
      expect(card.y + card.height).toBeLessThanOrEqual(1000);
    }
    for (const element of [
      exhibition.locator('[data-zao-component="card"]'),
      exhibition.locator('[data-zao-slot="storage-chart"]'),
      exhibition.getByRole('region', { name: 'Actions', exact: true }),
      exhibition.getByRole('region', { name: 'Navigation', exact: true }),
      exhibition.getByRole('region', { name: 'Settings', exact: true }),
    ]) {
      const box = await bounds(element);
      expect(box.x).toBeGreaterThanOrEqual(main.x - 0.5);
      expect(box.x + box.width).toBeLessThanOrEqual(main.x + main.width + 0.5);
    }
    const email = exhibition
      .getByRole('region', { name: 'Settings', exact: true })
      .getByRole('switch', { name: 'Email updates', exact: true });
    await page.keyboard.press('Tab');
    await email.focus();
    const focus = await email.evaluate((node) => {
      const css = getComputedStyle(node);
      return { style: css.outlineStyle, width: parseFloat(css.outlineWidth) };
    });
    expect(focus.style).not.toBe('none');
    expect(focus.width).toBeGreaterThan(0);
    const settings = exhibition.getByRole('region', { name: 'Settings', exact: true });
    await settings.getByRole('button', { name: 'Workspace actions', exact: true }).click();
    const menu = settings.getByRole('menu');
    await expect(menu).toBeVisible();
    await settle(menu);
    const popup = await bounds(menu);
    expect(popup.x).toBeGreaterThanOrEqual(-0.5);
    expect(popup.x + popup.width).toBeLessThanOrEqual(width + 0.5);
    expect(popup.y).toBeGreaterThanOrEqual(-0.5);
    expect(popup.y + popup.height).toBeLessThanOrEqual(1000.5);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    for (const mode of ['light', 'dark'] as const) {
      await chooseMode(page, mode);
      await expect(exhibition.locator('.study')).toHaveAttribute('data-zao-mode', mode);
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle(exhibition);
      const screenshot = test.info().outputPath(`overview-${width}-${mode}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      await test
        .info()
        .attach(`overview-${width}-${mode}`, { path: screenshot, contentType: 'image/png' });
    }
  });
}

for (const mode of ['light', 'dark'] as const) {
  test(`Su ${mode}: the overview has no accessibility violations with the real study CSS`, async ({
    page,
  }) => {
    const exhibition = await openExhibition(page, true, mode);
    const study = exhibition.locator('.study');
    await expect(study).toHaveAttribute('data-zao-mode', mode);
    if (mode === 'light') {
      const canvas = await page
        .locator('body')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      await expect(study).toHaveCSS('background-color', canvas);
    }
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
    ).toEqual([]);
  });
}
