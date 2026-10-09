import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const modes = ['light', 'dark'] as const;
type Mode = (typeof modes)[number];

async function openStudy(page: Page, mode: Mode) {
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
  await page.goto('/components/dialog');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('.study').first();
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
  const specimen = study.locator('[data-zao-specimen="dialog"]').first();
  const trigger = specimen.getByRole('button', { name: 'Review access', exact: true });
  const popup = specimen.getByRole('dialog', { name: 'Review workspace access', exact: true });
  const backdrop = specimen.locator('[data-zao-slot="backdrop"]').first();
  return { study, specimen, trigger, popup, backdrop };
}

async function box(element: Locator) {
  const bounds = await element.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function framePaint(popup: Locator) {
  return popup.evaluate((node) => {
    const style = getComputedStyle(node);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const pixel = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const resolve = (value: string) => {
      const sample = document.createElement('span');
      sample.style.cssText =
        'position:fixed;visibility:hidden;width:0;height:0;pointer-events:none';
      sample.style.backgroundColor = value;
      node.append(sample);
      const color = getComputedStyle(sample).backgroundColor;
      sample.remove();
      return pixel(color);
    };
    const shadow = style.boxShadow;
    const shadowColor = shadow.match(/^[a-z-]+\([^)]*\)/i)?.[0] ?? '';
    const shadowLengths = shadow
      .replace(/^[a-z-]+\([^)]*\)/i, '')
      .match(/-?\d+(?:\.\d+)?px/g)
      ?.map(parseFloat);
    return {
      fill: pixel(style.backgroundColor),
      border: pixel(style.borderTopColor),
      surface: resolve('var(--zao-color-bg-surface)'),
      borderToken: resolve('var(--zao-color-border-subtle)'),
      shadedToken: resolve('var(--zao-construction-side)'),
      shadowColor: shadowColor ? pixel(shadowColor) : null,
      shadow,
      shadowLengths,
      tokens: {
        contact: parseFloat(style.getPropertyValue('--zao-depth-contact')),
        x: Number(style.getPropertyValue('--zao-depth-axis-x')),
        y: Number(style.getPropertyValue('--zao-depth-axis-y')),
        hairline: parseFloat(style.getPropertyValue('--zao-stroke-hairline')),
      },
      text: ['title', 'description'].map((slot) => {
        const part = node.querySelector(`[data-zao-slot="${slot}"]`)!;
        return { slot, color: pixel(getComputedStyle(part).color) };
      }),
    };
  });
}

function contrast(first: number[], second: number[]) {
  const luminance = (color: number[]) =>
    color.slice(0, 3).reduce((sum, channel, index) => {
      const value = channel / 255;
      const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
    }, 0);
  const [lower, upper] = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (upper! + 0.05) / (lower! + 0.05);
}

async function assertInstant(element: Locator) {
  await expect(element).toHaveCSS('transition-property', 'none');
  await expect(element).toHaveCSS('animation-name', 'none');
  const motion = await element.evaluate((node) => ({
    duration: parseFloat(getComputedStyle(node).transitionDuration),
    animations: node.getAnimations().length,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  expect(motion.animations).toBe(0);
  // The existing global reduced-motion reset forces 0.01ms with !important.
  // No transition property or animation name is present, so nothing animates.
  expect(motion.duration).toBeLessThanOrEqual(motion.reduced ? 0.00001 : 0);
}

async function keyboardOutline(page: Page, button: Locator, previous?: Locator) {
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  if (previous) await expect(previous).toBeFocused();
  else await expect(button).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style', 'solid');
  await expect(button).toHaveCSS('outline-width', '2px');
  await expect(button).toHaveCSS('outline-offset', '2px');
}

async function twoFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

for (const mode of modes) {
  test(`Quiet ${mode}: Dialog uses a square shaded frame and the approved canvas veil`, async ({
    page,
  }) => {
    const { trigger, popup, backdrop } = await openStudy(page, mode);
    await expect(page.getByText(/Its own styling is still open for study/)).toHaveCount(0);
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(popup).not.toHaveClass(/\bmaterial-overlay\b/);
    await expect(popup).toHaveCSS('border-radius', '0px');
    await expect(popup).toHaveCSS('border-style', 'solid');
    await expect(popup).toHaveCSS('opacity', '1');
    await expect(popup).toHaveCSS('transform', 'none');
    await expect(popup).toHaveCSS('clip-path', 'none');
    await expect(popup).toHaveCSS('backdrop-filter', 'none');
    await expect(popup.locator('[data-zao-slot="reveal-edge"]')).toHaveCount(0);
    for (const part of [popup, backdrop]) await assertInstant(part);
    const reading = await framePaint(popup);
    expect(reading.fill).toEqual(reading.surface);
    expect(reading.fill[3]).toBe(255);
    expect(reading.border).toEqual(reading.borderToken);
    expect(parseFloat(await popup.evaluate((node) => getComputedStyle(node).borderTopWidth))).toBe(
      reading.tokens.hairline,
    );
    expect(reading.shadowLengths).toEqual([
      -reading.tokens.x * reading.tokens.contact,
      -reading.tokens.y * reading.tokens.contact,
      0,
      0,
    ]);
    expect(reading.shadowColor).toEqual(reading.shadedToken);
    for (const channel of [0, 1, 2]) {
      expect(
        Math.abs(reading.shadedToken[channel]! - Math.round(reading.fill[channel]! * 0.8)),
      ).toBeLessThanOrEqual(1);
    }
    for (const text of reading.text) {
      expect(contrast(text.color, reading.fill), `${text.slot} contrast`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    await expect(backdrop).toHaveCSS('opacity', '0.8');
    await expect(backdrop).toHaveCSS('backdrop-filter', 'none');
    const backdropColors = await backdrop.evaluate((node) => {
      const sample = document.createElement('span');
      sample.style.backgroundColor = 'var(--zao-color-bg-canvas)';
      node.append(sample);
      const result = [
        getComputedStyle(node).backgroundColor,
        getComputedStyle(sample).backgroundColor,
      ];
      sample.remove();
      return result;
    });
    expect(backdropColors[0]).toBe(backdropColors[1]);
    const { violations } = await new AxeBuilder({ page })
      .include('[data-zao-specimen="dialog"] [data-zao-component="dialog"][data-zao-slot="popup"]')
      .analyze();
    expect(
      violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
    ).toEqual([]);
  });

  test(`Quiet ${mode}: reduced transparency makes the canvas veil opaque without changing the Dialog`, async ({
    page,
  }) => {
    const { study, trigger, popup, backdrop } = await openStudy(page, mode);
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(backdrop).toHaveCSS('opacity', '0.8');
    const bounds = await box(popup);
    const frame = await framePaint(popup);
    await study.evaluate((node) => node.setAttribute('data-zao-transparency', 'reduced'));
    await expect(backdrop).toHaveCSS('opacity', '1');
    await expect(popup).toHaveCSS('opacity', '1');
    for (const part of [popup, backdrop]) await assertInstant(part);
    expect(await box(popup)).toEqual(bounds);
    const reduced = await framePaint(popup);
    expect(reduced.fill).toEqual(frame.fill);
    expect(reduced.shadow).toBe(frame.shadow);
    await study.evaluate((node) => node.removeAttribute('data-zao-transparency'));
    await expect(backdrop).toHaveCSS('opacity', '0.8');
  });

  test(`Quiet ${mode}: Dialog keeps modal keyboard dismissal, focus return and scroll locking`, async ({
    page,
  }) => {
    const { trigger, popup } = await openStudy(page, mode);
    await keyboardOutline(page, trigger);
    await page.keyboard.press('Enter');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveAccessibleDescription(
      'Approving gives the three invited members access to North workspace.',
    );
    const cancel = popup.getByRole('button', { name: 'Cancel', exact: true });
    const approve = popup.getByRole('button', { name: 'Approve access', exact: true });
    await cancel.focus();
    await page.keyboard.press('Tab');
    await expect(approve).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(approve).toBeFocused();
    const lockedScroll = await page.evaluate(() => scrollY);
    await page.mouse.move(2, 2);
    await page.mouse.wheel(0, 400);
    await twoFrames(page);
    expect(await page.evaluate(() => scrollY)).toBe(lockedScroll);
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(lockedScroll);
    await trigger.click();
    await expect(popup).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`Quiet ${mode}: the Dialog plane stays stationary while its explicit Button actions respond`, async ({
    page,
  }) => {
    const { trigger, popup } = await openStudy(page, mode);
    await trigger.click();
    await expect(popup).toBeVisible();
    await page.mouse.move(0, 0);
    await settle(popup);
    const plane = await box(popup);
    const frame = await framePaint(popup);
    await popup.locator('[data-zao-slot="title"]').hover();
    expect(await box(popup)).toEqual(plane);
    expect((await framePaint(popup)).shadow).toBe(frame.shadow);
    for (const label of ['Cancel', 'Approve access']) {
      const button = popup.getByRole('button', { name: label, exact: true });
      const face = button.locator(':scope > [data-zao-slot="face"]');
      await page.mouse.move(0, 0);
      await settle(popup);
      const target = await box(button);
      const resting = await box(face);
      await button.hover();
      await settle(popup);
      expect(await box(popup)).toEqual(plane);
      expect(await box(button)).toEqual(target);
      const lifted = await box(face);
      expect(lifted.x - resting.x).toBeCloseTo(2, 2);
      expect(lifted.y - resting.y).toBeCloseTo(-2, 2);
      await page.mouse.down();
      await settle(popup);
      expect(await box(popup)).toEqual(plane);
      expect(await box(button)).toEqual(target);
      const seated = await box(face);
      expect(seated.x - resting.x).toBeCloseTo(-1, 2);
      expect(seated.y - resting.y).toBeCloseTo(1, 2);
      await page.mouse.move(plane.x + 8, plane.y + 8);
      await page.mouse.up();
      await expect(popup).toBeVisible();
      await settle(popup);
      expect(await box(popup)).toEqual(plane);
      expect(await box(button)).toEqual(target);
      expect(await box(face)).toEqual(resting);
      expect((await framePaint(popup)).shadow).toBe(frame.shadow);
    }
  });

  for (const reducedMotion of [false, true]) {
    test(`Quiet ${mode}, ${reducedMotion ? 'reduced' : 'normal'} motion: repeated Dialog opening and dismissal stays instant`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
      const { study, trigger, popup, backdrop } = await openStudy(page, mode);
      await study.evaluate((node) => {
        (node as HTMLElement).dataset.dialogMotionEvents = '0';
        const record = (event: Event) => {
          const target = event.target as HTMLElement;
          if (
            target.matches(
              '[data-zao-component="dialog"][data-zao-slot="popup"], [data-zao-slot="backdrop"]',
            )
          ) {
            (node as HTMLElement).dataset.dialogMotionEvents = String(
              Number((node as HTMLElement).dataset.dialogMotionEvents) + 1,
            );
          }
        };
        node.addEventListener('transitionrun', record);
        node.addEventListener('animationstart', record);
      });
      let firstBounds: Awaited<ReturnType<typeof box>> | undefined;
      for (let cycle = 0; cycle < 3; cycle++) {
        await trigger.click();
        await expect(popup).toBeVisible();
        await expect(popup).toHaveCSS('opacity', '1');
        await expect(popup).toHaveCSS('transform', 'none');
        await expect(popup).toHaveCSS('clip-path', 'none');
        await expect(backdrop).toHaveCSS('opacity', '0.8');
        for (const part of [popup, backdrop]) await assertInstant(part);
        const current = await box(popup);
        if (firstBounds) expect(current).toEqual(firstBounds);
        else firstBounds = current;
        await page.keyboard.press('Escape');
        await expect(popup).toHaveCount(0);
        await expect(backdrop).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
      await expect(study).toHaveAttribute('data-dialog-motion-events', '0');
    });
  }

  test(`Quiet ${mode}: forced colors preserve the Dialog boundary, readable content and outside focus`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const { trigger, popup } = await openStudy(page, mode);
    await keyboardOutline(page, trigger);
    await page.keyboard.press('Enter');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS('border-style', 'solid');
    await expect(popup).toHaveCSS('border-width', '1px');
    const reading = await framePaint(popup);
    expect(contrast(reading.border, reading.fill)).toBeGreaterThanOrEqual(3);
    for (const text of reading.text) {
      expect(
        contrast(text.color, reading.fill),
        `${text.slot} in forced colors`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    const cancel = popup.getByRole('button', { name: 'Cancel', exact: true });
    const approve = popup.getByRole('button', { name: 'Approve access', exact: true });
    await keyboardOutline(page, cancel, approve);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test(`Quiet ${mode}: a narrow RTL Dialog fits its viewport and keeps long content and actions reachable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 360 });
    const { study, specimen, trigger, popup } = await openStudy(page, mode);
    await study.evaluate((node) => node.setAttribute('dir', 'rtl'));
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS('direction', 'rtl');
    const bounds = await box(popup);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(360);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    // Expand existing prose to exercise overflow without adding a Dialog API or
    // changing its frame. The viewport remains the existing scroll container.
    await popup.locator('[data-zao-slot="description"]').evaluate((node) => {
      node.textContent = `${node.textContent} `.repeat(6).trim();
    });
    const viewport = specimen.locator('[data-zao-slot="viewport"]').first();
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollHeight - node.clientHeight))
      .toBeGreaterThan(0);
    const cancel = popup.getByRole('button', { name: 'Cancel', exact: true });
    const approve = popup.getByRole('button', { name: 'Approve access', exact: true });
    await keyboardOutline(page, approve, cancel);
    const actionBounds = await box(approve);
    expect(actionBounds.y).toBeGreaterThanOrEqual(0);
    expect(actionBounds.y + actionBounds.height).toBeLessThanOrEqual(360);
    expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await viewport.evaluate((node) => {
      node.scrollTop = 0;
    });
    const titleBounds = await box(popup.locator('[data-zao-slot="title"]'));
    expect(titleBounds.y).toBeGreaterThanOrEqual(0);
    expect(titleBounds.y + titleBounds.height).toBeLessThanOrEqual(360);
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
