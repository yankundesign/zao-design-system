import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function openTabs(page: Page, theme: 'su' = 'su', mode: 'light' | 'dark' = 'light') {
  await page.goto('/components/tabs');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', {
      name: mode === 'light' ? 'Light' : 'Dark',
    })
    .click();
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.addStyleTag({ content: css });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return page.locator('[data-zao-specimen="tabs"]').first();
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

for (const finish of [
  { theme: 'su', mode: 'light' },
  { theme: 'su', mode: 'dark' },
] as const) {
  test(`${finish.theme} ${finish.mode}: centered ruler feedback keeps targets and selection steady`, async ({
    page,
  }) => {
    const preview = await openTabs(page, finish.theme, finish.mode);
    const list = preview.getByRole('tablist', { name: 'Workspace views' });
    const overview = list.getByRole('tab', { name: 'Overview' });
    const activity = list.getByRole('tab', { name: 'Activity' });
    const line = list.locator('[data-zao-slot="selection-line"]');
    const rail = list.locator(':scope > [data-zao-slot="rail"]');
    await settle(list);
    const rest = await bounds(overview);
    const marker = await bounds(line);
    const guide = await bounds(rail);
    expect(marker.height).toBe(2);
    expect(marker.y + marker.height / 2).toBeCloseTo(guide.y + guide.height / 2, 2);
    expect(marker.x + marker.width / 2).toBeCloseTo(rest.x + rest.width / 2, 2);

    await activity.hover();
    await settle(list);
    expect(await bounds(line)).toEqual(marker);
    expect((await bounds(activity.locator('[data-zao-slot="tick"]'))).height).toBe(8);
    await expect(overview).toHaveAttribute('aria-selected', 'true');

    await overview.hover();
    await page.mouse.down();
    await settle(list);
    const pressed = await bounds(line);
    expect(pressed.height).toBe(1);
    expect(pressed.y + pressed.height / 2).toBeCloseTo(guide.y + guide.height / 2, 2);
    expect(await bounds(overview)).toEqual(rest);
    await page.mouse.up();

    await activity.click();
    await settle(list);
    const active = await bounds(activity);
    const moved = await bounds(line);
    expect(moved.x + moved.width / 2).toBeCloseTo(active.x + active.width / 2, 2);
    expect(moved.y + moved.height / 2).toBeCloseTo(guide.y + guide.height / 2, 2);
    await expect(preview.getByRole('tabpanel', { name: 'Activity', exact: true })).toContainText(
      'Recent activity',
    );
  });
}

test('secondary tabs retain nested selection and seat only the decorative face on keyboard press', async ({
  page,
}) => {
  const preview = await openTabs(page);
  const secondary = preview.getByRole('tablist', { name: 'Overview views' });
  const members = secondary.getByRole('tab', { name: 'Members' });
  const indicator = secondary.locator(':scope > [data-zao-slot="indicator"]');
  await expect(
    secondary.locator('[data-zao-slot="rail"], [data-zao-slot="selection-line"]'),
  ).toHaveCount(0);
  await members.click();
  await members.focus();
  await settle(secondary);
  const target = await bounds(members);
  const face = await bounds(indicator);
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(face[key]).toBeCloseTo(target[key], 2);
  }
  await page.keyboard.down('Space');
  await settle(secondary);
  expect((await bounds(indicator)).y).toBeCloseTo(face.y + 1, 2);
  expect(await bounds(members)).toEqual(target);
  await expect(members).toBeFocused();
  await page.keyboard.up('Space');
  await settle(secondary);
  expect(await bounds(indicator)).toEqual(face);

  const primary = preview.getByRole('tablist', { name: 'Workspace views' });
  await primary.getByRole('tab', { name: 'Activity' }).click();
  await expect(secondary).toBeHidden();
  await primary.getByRole('tab', { name: 'Overview' }).click();
  await expect(members).toHaveAttribute('aria-selected', 'true');
  await expect(preview.getByRole('tabpanel', { name: 'Members 12' })).toContainText(
    'Workspace members',
  );
});

test('vertical manual navigation, RTL, and narrow strips preserve access and marker alignment', async ({
  page,
}) => {
  const preview = await openTabs(page);
  const vertical = page.getByRole('tablist', { name: 'Account sections' });
  const profile = vertical.getByRole('tab', { name: 'Profile' });
  const security = vertical.getByRole('tab', { name: 'Security' });
  await profile.focus();
  await page.keyboard.press('ArrowDown');
  await expect(security).toBeFocused();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(security).toHaveAttribute('aria-selected', 'true');
  await settle(vertical);
  const vLine = await bounds(vertical.locator('[data-zao-slot="selection-line"]'));
  const vRail = await bounds(vertical.locator(':scope > [data-zao-slot="rail"]'));
  expect(vLine.x + vLine.width / 2).toBeCloseTo(vRail.x + vRail.width / 2, 2);

  await preview.evaluate((node) => node.setAttribute('dir', 'rtl'));
  const primary = preview.getByRole('tablist', { name: 'Workspace views' });
  const overview = primary.getByRole('tab', { name: 'Overview' });
  const activity = primary.getByRole('tab', { name: 'Activity' });
  await overview.focus();
  await activity.click();
  await expect(activity).toBeFocused();
  await expect(activity).toHaveAttribute('aria-selected', 'true');
  await settle(primary);
  const marker = await bounds(primary.locator('[data-zao-slot="selection-line"]'));
  const active = await bounds(activity);
  expect(marker.x + marker.width / 2).toBeCloseTo(active.x + active.width / 2, 2);

  await preview.evaluate((node) => node.removeAttribute('dir'));
  await page.setViewportSize({ width: 320, height: 800 });
  await overview.focus();
  await page.keyboard.press('End');
  const archive = primary.getByRole('tab', { name: 'Archive' });
  await expect(archive).toBeFocused();
  const viewport = primary.locator('..');
  const view = await bounds(viewport);
  const last = await bounds(archive);
  expect(last.x).toBeGreaterThanOrEqual(view.x);
  expect(last.x + last.width).toBeLessThanOrEqual(view.x + view.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reduced motion changes selection immediately, and secondary grids follow the selected row', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const preview = await openTabs(page);
  const primary = preview.getByRole('tablist', { name: 'Workspace views' });
  await primary.getByRole('tab', { name: 'Permissions' }).click();
  const durations = await primary
    .locator(
      '[data-zao-slot="indicator"], [data-zao-slot="selection-line"], [data-zao-slot="tick"]',
    )
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).transitionDuration));
  expect(
    durations.every((value) => value.split(',').every((part) => parseFloat(part) <= 0.00001)),
  ).toBe(true);

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/components/card');
  const layouts = page.getByRole('tablist', { name: 'Card layout' });
  const media = layouts.getByRole('tab', { name: 'Media' });
  await media.click();
  await settle(layouts);
  const face = await bounds(layouts.locator(':scope > [data-zao-slot="indicator"]'));
  const target = await bounds(media);
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(face[key]).toBeCloseTo(target[key], 2);
  }
  await expect(
    layouts.locator('[data-zao-slot="rail"], [data-zao-slot="selection-line"]'),
  ).toHaveCount(0);
});

test('initial tab panels acquire their accessible names without input', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const component of ['card', 'tabs'] as const) {
    await page.goto(`/components/${component}?style=quiet-instrument`);
    await expect(
      page.getByRole('tabpanel', {
        name: component === 'card' ? 'Split' : 'Overview',
        exact: true,
      }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test.describe('touch feedback', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('held input and cancellation restore both treatments without moving their targets', async ({
    page,
  }) => {
    const preview = await openTabs(page);
    const touch = await page.context().newCDPSession(page);
    try {
      for (const name of ['Workspace views', 'Overview views']) {
        const list = preview.getByRole('tablist', { name });
        const selected = list.getByRole('tab', { selected: true });
        await selected.scrollIntoViewIfNeeded();
        await settle(list);
        const target = await bounds(selected);
        const indicator = list.locator(':scope > [data-zao-slot="indicator"]');
        const face = await bounds(indicator);
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: target.x + target.width / 2, y: target.y + target.height / 2 }],
        });
        await expect(selected).toHaveAttribute('data-zao-pressed', '');
        await settle(list);
        if (name === 'Workspace views') {
          expect((await bounds(list.locator('[data-zao-slot="selection-line"]'))).height).toBe(1);
        } else {
          expect((await bounds(indicator)).y).toBeCloseTo(face.y + 1, 2);
        }
        expect(await bounds(selected)).toEqual(target);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await expect(selected).not.toHaveAttribute('data-zao-pressed');
        await settle(list);
        expect(await bounds(selected)).toEqual(target);
        await expect(selected).toHaveAttribute('aria-selected', 'true');
      }
    } finally {
      await touch.detach();
    }
  });
});
