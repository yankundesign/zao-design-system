import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const actionLabels = ['Add workspace', 'Open settings', 'Copy workspace ID'] as const;

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

async function openSpecimen(page: Page, study = false) {
  await page.goto('/components/icon-button' + (study ? '?style=quiet-instrument' : ''));
  await expect(page.getByRole('heading', { level: 1, name: 'IconButton' })).toBeVisible();
  if (study) {
    await page.addStyleTag({
      content: await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      ),
    });
  }
  const specimen = page.locator('[data-zao-specimen="icon-button"]');
  await page.mouse.move(0, 0);
  await settle(specimen);
  return specimen;
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
  test(`${finish.theme} ${finish.mode}: IconButton has square targets, Iconoir artwork, and accessible labels`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page);
    await page
      .getByRole('radiogroup', { name: 'Mode' })
      .getByRole('radio', { name: finish.mode === 'light' ? 'Light' : 'Dark' })
      .click();
    await expect(page.locator('.study')).toHaveAttribute('data-zao-theme', finish.theme);
    for (const [label, targetSize, iconSize] of [
      ['Search workspaces', 28, 16],
      ['Open workspace settings', 34, 16],
      ['Add member', 40, 20],
    ] as const) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const box = await bounds(button);
      expect(box.width).toBe(targetSize);
      expect(box.height).toBe(targetSize);
      const icon = button.locator('svg');
      await expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).toHaveAttribute('focusable', 'false');
      await expect(icon).toHaveCSS('width', `${iconSize}px`);
      await expect(icon).toHaveCSS('height', `${iconSize}px`);
    }
    const action = specimen.getByRole('button', { name: 'Open settings', exact: true });
    await action.hover();
    // Base UI tooltips are visual labels; the native button owns the accessible name.
    const tooltip = specimen
      .locator('[data-zao-slot="tooltip"]')
      .filter({ hasText: /^Open settings$/ });
    await expect(tooltip).toBeVisible();
    expect(
      await tooltip.evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--zao-color-bg-canvas').trim(),
      ),
    ).toBe(
      await action.evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--zao-color-bg-canvas').trim(),
      ),
    );
    const accessibility = await new AxeBuilder({ page }).include('.study').analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

for (const study of [false, true]) {
  const context = study ? 'Quiet instrument' : 'Baseline';

  test(`${context}: face lifts and seats while targets and neighboring buttons stay fixed`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, study);
    for (const [index, label] of actionLabels.entries()) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const face = button.locator(':scope > [data-zao-slot="face"]');
      const neighbor = specimen.getByRole('button', {
        name: actionLabels[(index + 1) % actionLabels.length],
        exact: true,
      });
      await page.mouse.move(0, 0);
      await settle(specimen);
      const targetBefore = await bounds(button);
      const faceBefore = await bounds(face);
      const neighborBefore = await bounds(neighbor);
      await page.mouse.move(targetBefore.x + 1, targetBefore.y + targetBefore.height - 1);
      await settle(specimen);
      const hovered = await bounds(face);
      expect(hovered.x - faceBefore.x).toBeCloseTo(2, 2);
      expect(hovered.y - faceBefore.y).toBeCloseTo(-2, 2);
      expect(await bounds(button)).toEqual(targetBefore);
      expect(await bounds(neighbor)).toEqual(neighborBefore);
      await page.mouse.down();
      await settle(specimen);
      const pressed = await bounds(face);
      expect(pressed.x - faceBefore.x).toBeCloseTo(-1, 2);
      expect(pressed.y - faceBefore.y).toBeCloseTo(1, 2);
      expect(await bounds(button)).toEqual(targetBefore);
      await page.mouse.up();
      await settle(specimen);
      expect(await bounds(face)).toEqual(hovered);
    }
    await expect(specimen.getByText('Copied workspace ID.', { exact: true })).toBeVisible();
    await page.mouse.move(0, 0);
    const disabled = specimen.getByRole('button', { name: 'Delete workspace', exact: true });
    const disabledFace = disabled.locator('[data-zao-slot="face"]');
    const resting = await bounds(disabledFace);
    await disabled.hover();
    await settle(specimen);
    await expect(disabled).toBeDisabled();
    expect(await bounds(disabledFace)).toEqual(resting);
    await expect(specimen.locator('[data-zao-slot="tooltip"]')).toHaveCount(0);
    await page.mouse.down();
    await page.mouse.up();
    await expect(specimen.getByText('Deleted workspace.', { exact: true })).toHaveCount(0);
  });

  test(`${context}: tooltip works with hover and keyboard, stays hoverable, and dismisses on Escape`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, study);
    const button = specimen.getByRole('button', { name: 'Open settings', exact: true });
    const tooltip = specimen
      .locator('[data-zao-slot="tooltip"]')
      .filter({ hasText: /^Open settings$/ });
    await page.keyboard.press('Tab');
    await specimen.getByRole('button', { name: 'Add workspace', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await expect(tooltip).toBeVisible();
    const outline = await button.evaluate((node) => {
      const css = getComputedStyle(node);
      return { style: css.outlineStyle, width: parseFloat(css.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await expect(button).toBeFocused();
    const targetBefore = await bounds(button);
    const face = button.locator('[data-zao-slot="face"]');
    const faceBefore = await bounds(face);
    await page.keyboard.down('Space');
    await settle(specimen);
    expect((await bounds(face)).x - faceBefore.x).toBeCloseTo(-1, 2);
    expect(await bounds(button)).toEqual(targetBefore);
    await expect(specimen.getByText('Opened settings.', { exact: true })).toHaveCount(0);
    await page.keyboard.up('Space');
    await expect(specimen.getByText('Opened settings.', { exact: true })).toBeVisible();
    await settle(specimen);
    expect(await bounds(face)).toEqual(faceBefore);
    await page.keyboard.press('Enter');
    await expect(button).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      specimen.getByRole('button', { name: 'Copy workspace ID', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      specimen.getByRole('button', { name: 'Search workspaces', exact: true }),
    ).toBeFocused();

    await button.hover();
    await expect(tooltip).toBeVisible();
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
  });

  test(`${context}: reduced motion keeps the face still with visible press feedback`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const specimen = await openSpecimen(page, study);
    const button = specimen.getByRole('button', { name: 'Open settings', exact: true });
    const face = button.locator('[data-zao-slot="face"]');
    const before = await bounds(face);
    const background = await face.evaluate((node) => getComputedStyle(node).backgroundColor);
    await button.hover();
    expect(await bounds(face)).toEqual(before);
    await expect(face).toHaveCSS('transition-property', 'none');
    await page.mouse.down();
    expect(await bounds(face)).toEqual(before);
    await expect(face).not.toHaveCSS('background-color', background);
    await page.mouse.up();
  });

  test.describe(`${context}: touch`, () => {
    test.use({ hasTouch: true, isMobile: true });
    test('a held touch seats the icon face and cancellation restores its resting pose', async ({
      page,
    }) => {
      const specimen = await openSpecimen(page, study);
      const button = specimen.getByRole('button', { name: 'Open settings', exact: true });
      const face = button.locator('[data-zao-slot="face"]');
      const targetBefore = await bounds(button);
      const faceBefore = await bounds(face);
      const touch = await page.context().newCDPSession(page);
      try {
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: targetBefore.x + 17, y: targetBefore.y + 17 }],
        });
        await expect.poll(async () => (await bounds(face)).x - faceBefore.x).toBeCloseTo(-1, 2);
        expect(await bounds(button)).toEqual(targetBefore);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await expect.poll(() => bounds(face)).toEqual(faceBefore);
        await expect(specimen.getByText('Opened settings.', { exact: true })).toHaveCount(0);
        await button.tap();
        await expect(specimen.getByText('Opened settings.', { exact: true })).toBeVisible();
        await expect(specimen.locator('[data-zao-slot="tooltip"]')).toHaveCount(0);
      } finally {
        await touch.detach();
      }
    });
  });
}
