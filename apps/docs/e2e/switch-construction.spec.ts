import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { expectFocusBrackets } from './focus-mark';
import { smallSeat } from './construction-values';

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
  await expect(page.locator('[data-anatomy-kind="switch"]')).toHaveAttribute(
    'data-anatomy-ready',
    'true',
  );
  const form = page
    .locator('[data-preview-style] .study')
    .getByRole('form', { name: 'Notification settings' });
  await form.scrollIntoViewIfNeeded();
  await form.getByRole('switch', { name: 'Email updates' }).scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await settle(form);
  return form;
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
    await email.scrollIntoViewIfNeeded();
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
    // Press seats the face onto its base, a small rest depth back along the axis.
    expect(seated.x).toBe(on.x - smallSeat);
    expect(seated.y).toBe(on.y + smallSeat);
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
    await disabled.scrollIntoViewIfNeeded();
    await settle(disabled);
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
  await email.scrollIntoViewIfNeeded();
  await email.focus();
  await settle(email);
  const housing = await bounds(email);
  const rest = await bounds(face);
  await expectFocusBrackets(email);
  await page.keyboard.down('Space');
  await settle(email);
  expect((await bounds(face)).y).toBe(rest.y + smallSeat);
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

type SwitchSlideProbe = HTMLElement & {
  slideProbe?: {
    outgoing: Animation | null;
    beforePointer?: { currentTimeMs: number; durationMs: number; progress: number | null };
    cancelledElapsedMs?: number;
    reverseKeyframes?: ComputedKeyframe[];
  };
};

test('rapid reversal preserves immediate checked state and continues from the moving face', async ({
  page,
}, testInfo) => {
  const form = await openSwitch(page);
  const email = form.getByRole('switch', { name: 'Email updates' });
  const face = email.locator('[data-zao-slot="face"]');
  await email.scrollIntoViewIfNeeded();
  await settle(email);
  const on = await bounds(face);
  const housing = await bounds(email);
  const center = { x: housing.x + housing.width / 2, y: housing.y + housing.height / 2 };
  await email.evaluate((node) => {
    const root = node as SwitchSlideProbe;
    const thumb = root.querySelector<HTMLElement>('[data-zao-slot="thumb"]')!;
    const probe = { outgoing: null as Animation | null } as NonNullable<
      SwitchSlideProbe['slideProbe']
    >;
    root.slideProbe = probe;
    root.addEventListener(
      'pointerdown',
      () => {
        if (!probe.outgoing) return;
        const timing = probe.outgoing.effect!.getComputedTiming();
        probe.beforePointer = {
          currentTimeMs: Number(probe.outgoing.currentTime),
          durationMs: Number(timing.duration),
          progress: timing.progress ?? null,
        };
      },
      true,
    );
    thumb.addEventListener('transitioncancel', (event) => {
      if (event.target === thumb && event.propertyName === 'transform')
        probe.cancelledElapsedMs = event.elapsedTime * 1000;
    });
    thumb.addEventListener('transitionrun', (event) => {
      if (!probe.outgoing || event.target !== thumb || event.propertyName !== 'transform') return;
      const reverse = thumb
        .getAnimations()
        .find(
          (animation) =>
            'transitionProperty' in animation && animation.transitionProperty === 'transform',
        );
      if (reverse && reverse !== probe.outgoing)
        probe.reverseKeyframes = (reverse.effect as KeyframeEffect).getKeyframes();
    });
  });
  await email.click();
  await expect(email).not.toBeChecked();
  const outgoing = await email.evaluate(async (node) => {
    const root = node as SwitchSlideProbe;
    const thumb = root.querySelector<HTMLElement>('[data-zao-slot="thumb"]')!;
    const deadline = performance.now() + 1_200;
    let animation: Animation | undefined;
    while (!animation && performance.now() < deadline) {
      animation = thumb
        .getAnimations()
        .find(
          (candidate) =>
            'transitionProperty' in candidate && candidate.transitionProperty === 'transform',
        );
      if (!animation) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    if (!animation) throw new Error('Switch did not start its natural slide');
    await animation.ready;
    while (performance.now() < deadline) {
      const timing = animation.effect!.getComputedTiming();
      if (typeof timing.progress === 'number' && timing.progress > 0.05 && timing.progress < 1) {
        root.slideProbe!.outgoing = animation;
        const css = getComputedStyle(thumb);
        const role = css.getPropertyValue('--zao-motion-duration-slide').trim();
        const rect = root.querySelector('[data-zao-slot="face"]')!.getBoundingClientRect();
        return {
          currentTimeMs: Number(animation.currentTime),
          durationMs: Number(timing.duration),
          progress: timing.progress,
          easing: animation.effect!.getTiming().easing!,
          keyframes: (animation.effect as KeyframeEffect).getKeyframes(),
          durationRoleMs: parseFloat(role) * (role.endsWith('ms') ? 1 : 1000),
          midway: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      }
      if (animation.playState === 'finished')
        throw new Error('Switch slide completed before native reversal');
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    throw new Error('Switch slide never exposed an unfinished natural frame');
  });
  const midway = outgoing.midway;
  expect(outgoing.durationMs).toBe(outgoing.durationRoleMs);
  expect(outgoing.currentTimeMs).toBeGreaterThan(0);
  expect(outgoing.currentTimeMs).toBeLessThan(outgoing.durationMs);
  expect(outgoing.progress).toBeGreaterThan(0);
  expect(outgoing.progress).toBeLessThan(1);
  expect(midway.x).toBeLessThan(on.x - 1);
  expect(midway.x).toBeGreaterThan(on.x - 16);
  // The target is fixed. Locator click's stability waits can consume a 160ms
  // slide, so reverse through native pointer input at its premeasured center.
  // No duration override, animation seeking, or playback-rate change is used.
  await page.mouse.click(center.x, center.y);
  await expect(email).toBeChecked();
  const reversing = await bounds(face);
  expect(reversing.x).toBeGreaterThan(on.x - 16);
  await settle(email);
  expect((await bounds(face)).x).toBe(on.x);
  expect(await bounds(email)).toEqual(housing);
  const reversal = await email.evaluate((node, outgoing) => {
    const probe = (node as SwitchSlideProbe).slideProbe!;
    if (!probe.reverseKeyframes || probe.cancelledElapsedMs === undefined)
      throw new Error('Native reversal did not cancel an outgoing slide and start a reverse slide');
    const fraction = probe.cancelledElapsedMs / outgoing.durationMs;
    // Su's slide role uses the faceted 举折 enter curve (finish plan V5): linear() stops.
    const eased = (x: number) => {
      const linear = outgoing.easing.match(/^linear\((.*)\)$/);
      if (linear) {
        const stops = linear[1]!.split(',').map((stop) => stop.trim().split(/\s+/));
        const points = stops.map(([output, position], index) => ({
          y: Number(output),
          x: position ? parseFloat(position) / 100 : index / (stops.length - 1),
        }));
        for (let index = 1; index < points.length; index++) {
          const start = points[index - 1]!;
          const end = points[index]!;
          if (x <= end.x) return start.y + ((end.y - start.y) * (x - start.x)) / (end.x - start.x);
        }
        return 1;
      }
      const [x1, y1, x2, y2] = outgoing.easing
        .match(/cubic-bezier\(([^)]+)\)/)![1]!
        .split(',')
        .map(Number) as [number, number, number, number];
      const curve = (t: number, a: number, b: number) =>
        3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
      let low = 0;
      let high = 1;
      for (let iteration = 0; iteration < 40; iteration++) {
        const middle = (low + high) / 2;
        if (curve(middle, x1, x2) < x) low = middle;
        else high = middle;
      }
      return curve((low + high) / 2, y1, y2);
    };
    const progress = eased(fraction);
    const from = new DOMMatrixReadOnly(String(outgoing.keyframes[0]!.transform)).m41;
    const to = new DOMMatrixReadOnly(String(outgoing.keyframes.at(-1)!.transform)).m41;
    const expectedStartPx = from + (to - from) * progress;
    const reverseStartPx = new DOMMatrixReadOnly(String(probe.reverseKeyframes[0]!.transform)).m41;
    return {
      beforePointer: probe.beforePointer!,
      cancelledElapsedMs: probe.cancelledElapsedMs,
      expectedStartPx,
      reverseStartPx,
      continuityResidualPx: reverseStartPx - expectedStartPx,
    };
  }, outgoing);
  await testInfo.attach('natural-switch-reversal.json', {
    body: JSON.stringify(
      {
        units: { geometry: 'CSS px', time: 'ms', progress: 'unitless' },
        on,
        midway,
        reversing,
        outgoing,
        reversal,
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  expect(reversal.beforePointer.currentTimeMs).toBeGreaterThan(0);
  expect(reversal.beforePointer.currentTimeMs).toBeLessThan(reversal.beforePointer.durationMs);
  expect(reversal.beforePointer.progress).toBeGreaterThan(0);
  expect(reversal.beforePointer.progress).toBeLessThan(1);
  expect(reversal.cancelledElapsedMs).toBeGreaterThan(0);
  expect(reversal.cancelledElapsedMs).toBeLessThan(outgoing.durationMs);
  expect(Math.abs(reversal.continuityResidualPx)).toBeLessThan(0.01);
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
  await email.scrollIntoViewIfNeeded();
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
      expect((await bounds(face)).y).toBe(rest.y + smallSeat);
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
