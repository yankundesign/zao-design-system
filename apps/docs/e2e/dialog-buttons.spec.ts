import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const modes = ['light', 'dark'] as const;
const sizes = [
  { name: 'small', height: 28 },
  { name: 'default', height: 34 },
  { name: 'large', height: 40 },
] as const;
type Mode = (typeof modes)[number];
type Variant = 'primary' | 'secondary' | 'quiet';

async function openDialogPage(page: Page, mode: Mode) {
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  // Serve the actual study through its stylesheet route; the shared server's
  // identity fixture does not exercise Su's current component paint.
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
  await page.goto('/components/dialog');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  await expect
    .poll(() =>
      study.evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--zao-color-border-field').trim(),
      ),
    )
    .not.toBe('');
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  return study.locator('[data-zao-specimen="dialog"]').first();
}

function face(button: Locator) {
  return button.locator(':scope > [data-zao-slot="face"]');
}

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const animations = node
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
}

async function assertButton(button: Locator, variant: Variant, height: number) {
  await expect(button).toHaveAttribute('data-zao-component', 'button');
  await expect(button).toHaveAttribute('data-zao-variant', variant);
  expect(await button.evaluate((node) => node.tagName)).toBe('BUTTON');
  await expect(button.locator('button')).toHaveCount(0);
  await expect(face(button)).toHaveCount(1);
  expect((await bounds(button)).height).toBe(height);
  expect((await bounds(face(button))).height).toBe(height);
  await expect(face(button)).toHaveCSS('font-size', '14px');
  expect(
    await face(button).evaluate((node) => parseFloat(getComputedStyle(node).lineHeight)),
  ).toBeCloseTo(18, 3);
}

async function keyboardFocus(page: Page, button: Locator, previous?: Locator) {
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  // Modal focus guards redirect asynchronously. Finish their backward wrap
  // before sending the forward Tab that enters the target with keyboard focus.
  if (previous) await expect(previous).toBeFocused();
  else await expect(button).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style', 'solid');
  await expect(button).toHaveCSS('outline-width', '2px');
  await expect(button).toHaveCSS('outline-offset', '2px');
}

async function pointerFeedback(
  page: Page,
  button: Locator,
  cancelAt: { x: number; y: number },
  reducedMotion = false,
) {
  await page.mouse.move(0, 0);
  await settle(button);
  const shell = await bounds(button);
  const resting = await bounds(face(button));
  const tokens = await button.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      x: Number(style.getPropertyValue('--zao-depth-axis-x')),
      y: Number(style.getPropertyValue('--zao-depth-axis-y')),
      lift: parseFloat(style.getPropertyValue('--zao-depth-lift')),
      contact: parseFloat(style.getPropertyValue('--zao-depth-contact')),
    };
  });
  const restFill = await face(button).evaluate((node) => getComputedStyle(node).backgroundColor);
  await button.hover();
  await settle(button);
  const hovered = await bounds(face(button));
  expect(await bounds(button)).toEqual(shell);
  expect(hovered.x - resting.x).toBeCloseTo(reducedMotion ? 0 : tokens.x * tokens.lift, 2);
  expect(hovered.y - resting.y).toBeCloseTo(reducedMotion ? 0 : tokens.y * tokens.lift, 2);
  const hoverFill = await face(button).evaluate((node) => getComputedStyle(node).backgroundColor);
  if (reducedMotion) {
    expect(hoverFill).not.toBe(restFill);
    await expect(face(button)).toHaveCSS('transform', 'none');
    await expect(face(button)).toHaveCSS('transition-property', 'none');
    expect(await button.evaluate((node) => getComputedStyle(node, '::after').display)).toBe('none');
  }
  await page.mouse.down();
  await settle(button);
  const pressed = await bounds(face(button));
  expect(await bounds(button)).toEqual(shell);
  expect(pressed.x - resting.x).toBeCloseTo(reducedMotion ? 0 : -tokens.x * tokens.contact, 2);
  expect(pressed.y - resting.y).toBeCloseTo(reducedMotion ? 0 : -tokens.y * tokens.contact, 2);
  expect(await face(button).evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
    hoverFill,
  );
  // Release away from the native target so its actual dialog action is canceled.
  // Close-button cancellation points stay inside the popup to avoid dismissal.
  await page.mouse.move(cancelAt.x, cancelAt.y);
  await page.mouse.up();
  await settle(button);
  expect(await bounds(button)).toEqual(shell);
  expect(await bounds(face(button))).toEqual(resting);
  await expect(button).not.toHaveAttribute('data-zao-pressed', '');
}

for (const mode of modes) {
  test(`Quiet ${mode}: default Dialog buttons share Button and preserve modal keyboard behavior`, async ({
    page,
  }) => {
    const specimen = await openDialogPage(page, mode);
    const trigger = specimen.getByRole('button', { name: 'Review access', exact: true });
    await assertButton(trigger, 'secondary', 34);
    await expect(trigger).toHaveAttribute('data-zao-size', 'default');
    await keyboardFocus(page, trigger);
    await page.keyboard.press('Enter');
    const dialog = specimen.getByRole('dialog', { name: 'Review workspace access', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(
      'Approving gives the three invited members access to North workspace.',
    );
    await expect
      .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
    const approve = dialog.getByRole('button', { name: 'Approve access', exact: true });
    await assertButton(cancel, 'quiet', 34);
    await assertButton(approve, 'primary', 34);

    await cancel.focus();
    await page.keyboard.press('Tab');
    await expect(approve).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(approve).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(cancel).toBeFocused();
    const { violations } = await new AxeBuilder({ page })
      .include('[data-zao-specimen="dialog"] [data-zao-component="dialog"][data-zao-slot="popup"]')
      .analyze();
    expect(
      violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
    ).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await approve.click();
    await expect(dialog).toHaveCount(0);
    await expect(
      specimen.getByText('Approved access for 3 members.', { exact: true }),
    ).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  for (const size of sizes) {
    test(`Quiet ${mode}: ${size.name} Dialog Trigger and Close use ${size.height}px Button targets`, async ({
      page,
    }) => {
      await openDialogPage(page, mode);
      const row = page.locator(
        `[data-zao-specimen="dialog-sizes"] [data-zao-dialog-size="${size.name}"]`,
      );
      const trigger = row.getByRole('button', { name: `Review ${size.name} access`, exact: true });
      const disabled = row.getByRole('button', {
        name: `Unavailable ${size.name} review`,
        exact: true,
      });
      await assertButton(trigger, 'secondary', size.height);
      await expect(trigger).toHaveAttribute('data-zao-size', size.name);
      await assertButton(disabled, 'secondary', size.height);
      await expect(disabled).toBeDisabled();
      await disabled.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(disabled);
      const disabledShell = await bounds(disabled);
      const disabledFace = await bounds(face(disabled));
      await disabled.hover();
      await settle(disabled);
      expect(await bounds(disabled)).toEqual(disabledShell);
      expect(await bounds(face(disabled))).toEqual(disabledFace);
      await page.mouse.click(
        disabledShell.x + disabledShell.width / 2,
        disabledShell.y + disabledShell.height / 2,
      );
      await expect(row.getByRole('dialog')).toHaveCount(0);
      await expect(disabled).not.toBeFocused();

      await trigger.click();
      const dialog = row.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const cancel = dialog.getByRole('button', { name: `Cancel ${size.name}`, exact: true });
      const approve = dialog.getByRole('button', { name: `Approve ${size.name}`, exact: true });
      await assertButton(cancel, 'quiet', size.height);
      await assertButton(approve, 'primary', size.height);
      await expect(cancel).toHaveAttribute('data-zao-size', size.name);
      await expect(approve).toHaveAttribute('data-zao-size', size.name);
      await cancel.click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }

  test(`Quiet ${mode}: Dialog actions retain Button's stationary targets and connected press feedback`, async ({
    page,
  }) => {
    const specimen = await openDialogPage(page, mode);
    const trigger = specimen.getByRole('button', { name: 'Review access', exact: true });
    await trigger.scrollIntoViewIfNeeded();
    const triggerBox = await bounds(trigger);
    await pointerFeedback(page, trigger, {
      x: triggerBox.x + triggerBox.width + 24,
      y: triggerBox.y,
    });
    await expect(specimen.getByRole('dialog')).toHaveCount(0);
    await trigger.click();
    const dialog = specimen.getByRole('dialog', { name: 'Review workspace access', exact: true });
    await expect(dialog).toBeVisible();
    const popupBox = await bounds(dialog);
    for (const label of ['Cancel', 'Approve access']) {
      const button = dialog.getByRole('button', { name: label, exact: true });
      await pointerFeedback(page, button, { x: popupBox.x + 8, y: popupBox.y + 8 });
      await expect(dialog).toBeVisible();
      await keyboardFocus(
        page,
        button,
        dialog.getByRole('button', {
          name: label === 'Cancel' ? 'Approve access' : 'Cancel',
          exact: true,
        }),
      );
    }
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test(`Quiet ${mode}: reduced motion keeps Dialog Button fill feedback and outside keyboard outlines`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const specimen = await openDialogPage(page, mode);
    const trigger = specimen.getByRole('button', { name: 'Review access', exact: true });
    await trigger.scrollIntoViewIfNeeded();
    const triggerBox = await bounds(trigger);
    await pointerFeedback(
      page,
      trigger,
      { x: triggerBox.x + triggerBox.width + 24, y: triggerBox.y },
      true,
    );
    await keyboardFocus(page, trigger);
    await page.keyboard.press('Space');
    const dialog = specimen.getByRole('dialog', { name: 'Review workspace access', exact: true });
    await expect(dialog).toBeVisible();
    const popupBox = await bounds(dialog);
    for (const label of ['Cancel', 'Approve access']) {
      const button = dialog.getByRole('button', { name: label, exact: true });
      await pointerFeedback(page, button, { x: popupBox.x + 8, y: popupBox.y + 8 }, true);
      await keyboardFocus(
        page,
        button,
        dialog.getByRole('button', {
          name: label === 'Cancel' ? 'Approve access' : 'Cancel',
          exact: true,
        }),
      );
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
