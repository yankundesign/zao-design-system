import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function openSwitch(page: Page, theme: 'su' = 'su', mode: 'light' | 'dark' = 'light') {
  await page.goto('/components/switch');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark' })
    .click();
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.addStyleTag({ content: css });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return page.getByRole('form', { name: 'Notification settings' });
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
  test(`${finish.theme} ${finish.mode}: a joined face travels inside a fixed housing and labels activate once`, async ({
    page,
  }, testInfo) => {
    const form = await openSwitch(page, finish.theme, finish.mode);
    const email = form.getByRole('switch', { name: 'Email updates' });
    const face = email.locator('[data-zao-slot="face"]');
    const label = form.getByText('Email updates', { exact: true });
    await settle(form);
    const housing = await bounds(email);
    const labelBox = await bounds(label);
    const on = await bounds(face);
    await page.screenshot({ path: testInfo.outputPath('switch.png') });
    expect(housing.width).toBe(40);
    expect(housing.height).toBe(24);
    expect(on.width).toBe(16);
    expect(on.height).toBe(16);
    await expect(email).toHaveCSS('border-radius', '0px');
    await expect(face).toHaveCSS('border-radius', '0px');
    const fill = await face.evaluate((node) => getComputedStyle(node).backgroundColor);
    await email.hover();
    await settle(email);
    expect(await bounds(face)).toEqual(on);
    expect(await bounds(email)).toEqual(housing);
    await expect(face).not.toHaveCSS('background-color', fill);

    await page.mouse.down();
    await settle(email);
    const seated = await bounds(face);
    expect(seated.x).toBe(on.x);
    expect(seated.y).toBe(on.y + 1);
    expect(await bounds(email)).toEqual(housing);
    await expect(email).toBeChecked();
    await page.mouse.up();
    await expect(email).not.toBeChecked();
    await settle(email);
    const off = await bounds(face);
    expect(off.x).toBe(on.x - 16);
    expect(off.y).toBe(on.y);
    expect(off.x - housing.x).toBe(housing.x + housing.width - (on.x + on.width));
    expect(await bounds(label)).toEqual(labelBox);

    expect(
      await form.evaluate((node) => Object.fromEntries(new FormData(node as HTMLFormElement))),
    ).toEqual({ 'email-updates': 'off', 'activity-alerts': 'off' });
    await label.click();
    await expect(email).toBeChecked();
    await settle(email);
    expect(await bounds(face)).toEqual(on);
    expect(await bounds(email)).toEqual(housing);
    expect(
      await form.evaluate((node) => Object.fromEntries(new FormData(node as HTMLFormElement))),
    ).toEqual({ 'email-updates': 'on', 'activity-alerts': 'off' });
    const activity = form.getByRole('switch', { name: 'Activity alerts' });
    await form.getByText('Activity alerts', { exact: true }).click();
    await expect(activity).toBeChecked();

    const disabled = form.getByRole('switch', { name: 'Locked setting' });
    const disabledPose = await bounds(disabled.locator('[data-zao-slot="face"]'));
    await disabled.hover();
    await page.mouse.down();
    await settle(disabled);
    expect(await bounds(disabled.locator('[data-zao-slot="face"]'))).toEqual(disabledPose);
    await page.mouse.up();
    await form.getByText('Locked setting', { exact: true }).click({ force: true });
    await expect(disabled).toBeChecked();
    await expect(disabled).toBeDisabled();
    expect(
      (await new AxeBuilder({ page }).include('[data-zao-specimen="switch"]').analyze()).violations,
    ).toEqual([]);
  });
}

test('keyboard press seats only the face, retains the outside focus outline, and clears on blur', async ({
  page,
}) => {
  const form = await openSwitch(page);
  const email = form.getByRole('switch', { name: 'Email updates' });
  const face = email.locator('[data-zao-slot="face"]');
  await page.keyboard.press('Tab');
  await email.focus();
  await settle(email);
  const housing = await bounds(email);
  const rest = await bounds(face);
  await expect(email).toHaveCSS('outline-style', 'solid');
  await page.keyboard.down('Space');
  await settle(email);
  expect((await bounds(face)).y).toBe(rest.y + 1);
  expect(await bounds(email)).toEqual(housing);
  await expect(email).toBeFocused();
  await page.keyboard.up('Space');
  await expect(email).not.toBeChecked();
  await settle(email);

  await page.keyboard.down('Space');
  await expect(email).toHaveAttribute('data-zao-pressed', '');
  await form.getByRole('switch', { name: 'Activity alerts' }).focus();
  await expect(email).not.toHaveAttribute('data-zao-pressed');
  await page.keyboard.up('Space');
  await expect(email).not.toBeChecked();
  await email.hover();
  await page.mouse.down();
  await page.mouse.move(housing.x - 8, housing.y - 8);
  await expect(email).not.toHaveAttribute('data-zao-pressed');
  await page.mouse.up();
  await expect(email).not.toBeChecked();
});

test('rapid reversal preserves immediate checked state and continues from the moving face', async ({
  page,
}) => {
  const form = await openSwitch(page);
  const email = form.getByRole('switch', { name: 'Email updates' });
  const face = email.locator('[data-zao-slot="face"]');
  await settle(email);
  const on = await bounds(face);
  // Lengthen only this probe so the interrupted transition can be measured reliably.
  await email.evaluate((node) => node.style.setProperty('--zao-motion-duration-base', '2s'));
  await email.click();
  await expect(email).not.toBeChecked();
  await expect.poll(async () => (await bounds(face)).x).toBeLessThan(on.x - 1);
  const midway = await bounds(face);
  expect(midway.x).toBeGreaterThan(on.x - 16);
  await email.click();
  await expect(email).toBeChecked();
  const reversing = await bounds(face);
  expect(reversing.x).toBeGreaterThan(on.x - 16);
  await settle(email);
  expect((await bounds(face)).x).toBe(on.x);
});

test('reduced motion keeps press feedback without depth movement and changes endpoints immediately', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const form = await openSwitch(page);
  const email = form.getByRole('switch', { name: 'Email updates' });
  const thumb = email.locator('[data-zao-slot="thumb"]');
  const face = email.locator('[data-zao-slot="face"]');
  await email.focus();
  const rest = await bounds(face);
  const fill = await face.evaluate((node) => getComputedStyle(node).backgroundColor);
  await page.keyboard.down('Space');
  expect(await bounds(face)).toEqual(rest);
  await expect(face).not.toHaveCSS('background-color', fill);
  await page.keyboard.up('Space');
  await expect(email).not.toBeChecked();
  expect((await bounds(face)).x).toBe(rest.x - 16);
  for (const part of [thumb, face]) {
    // ZAO's shared reduced-motion floor is 0.01ms.
    expect(
      await part.evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
    ).toBeLessThanOrEqual(0.00001);
  }
});

test('RTL, a narrow setting list, and forced colors retain readable endpoints and focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const form = await openSwitch(page);
  await form.evaluate((node) => node.setAttribute('dir', 'rtl'));
  const email = form.getByRole('switch', { name: 'Email updates' });
  const face = email.locator('[data-zao-slot="face"]');
  await settle(email);
  const on = await bounds(face);
  await email.click();
  await settle(email);
  expect((await bounds(face)).x).toBe(on.x + 16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.keyboard.press('Tab');
  await email.focus();
  await expect(email).toHaveCSS('outline-style', 'solid');
  const offFill = await email.evaluate((node) => getComputedStyle(node).backgroundColor);
  await page.keyboard.press('Space');
  await expect(email).toBeChecked();
  await settle(email);
  expect((await bounds(face)).x).toBe(on.x);
  await expect(email).not.toHaveCSS('background-color', offFill);
  await expect(face).toHaveCSS('border-style', 'solid');
});

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('held input seats the face, release toggles once, and cancellation restores the pose', async ({
    page,
  }) => {
    const form = await openSwitch(page);
    const email = form.getByRole('switch', { name: 'Email updates' });
    const face = email.locator('[data-zao-slot="face"]');
    await email.scrollIntoViewIfNeeded();
    await settle(email);
    const housing = await bounds(email);
    const rest = await bounds(face);
    const touch = await page.context().newCDPSession(page);
    const touchPoints = [{ x: housing.x + housing.width / 2, y: housing.y + housing.height / 2 }];
    try {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
      await expect(email).toHaveAttribute('data-zao-pressed', '');
      await settle(email);
      expect((await bounds(face)).y).toBe(rest.y + 1);
      expect(await bounds(email)).toEqual(housing);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(email).not.toBeChecked();
      await settle(email);
      const off = await bounds(face);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
      await expect(email).toHaveAttribute('data-zao-pressed', '');
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await expect(email).not.toHaveAttribute('data-zao-pressed');
      await settle(email);
      await expect(email).not.toBeChecked();
      expect(await bounds(face)).toEqual(off);
    } finally {
      await touch.detach();
    }
  });
});
