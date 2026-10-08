import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function openProgress(page: Page, theme: 'su', mode: 'light' | 'dark') {
  await page.goto('/components/progress');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark' })
    .click();
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.addStyleTag({ content: css });
  await page.evaluate(() => document.fonts.ready);
  return page.locator('[data-zao-specimen="progress"]');
}

async function geometry(progress: Locator) {
  return progress.evaluate((node) => {
    const track = node.querySelector<HTMLElement>('[data-zao-slot="track"]')!;
    const face = node.querySelector<HTMLElement>('[data-zao-slot="indicator"]')!;
    const trackBox = track.getBoundingClientRect();
    const faceBox = face.getBoundingClientRect();
    return {
      track: {
        x: trackBox.x + scrollX,
        y: trackBox.y + scrollY,
        width: trackBox.width,
        height: trackBox.height,
      },
      face: {
        x: faceBox.x + scrollX,
        y: faceBox.y + scrollY,
        width: faceBox.width,
        height: faceBox.height,
      },
      ratio: faceBox.width / trackBox.width,
      radius: getComputedStyle(track).borderRadius,
    };
  });
}

for (const finish of [
  { theme: 'su', mode: 'light' },
  { theme: 'su', mode: 'dark' },
] as const) {
  test(`${finish.theme} ${finish.mode}: the composed face preserves the complete quantitative span`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    const specimen = await openProgress(page, finish.theme, finish.mode);
    await expect(specimen.getByText('Illustrative task readings')).toBeVisible();
    for (const [name, value, maximum, ratio] of [
      ['Upload files', '68', '100', 0.68],
      ['Prepare workspace', '100', '100', 1],
      ['Start backup', '0', '100', 0],
      ['Transfer archive', '34.2', '50', 0.684],
    ] as const) {
      const progress = specimen.getByRole('progressbar', { name });
      await expect(progress).toHaveAttribute('aria-valuenow', value);
      await expect(progress).toHaveAttribute('aria-valuemax', maximum);
      const resting = await geometry(progress);
      expect(resting.ratio).toBeCloseTo(ratio, 3);
      expect(resting.radius).toBe('0px');
      expect(resting.track.height).toBe(8);
      await progress.hover();
      expect(await geometry(progress)).toEqual(resting);
      expect(await progress.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(
        0,
      );
    }
    await expect(specimen.getByText('32% remaining')).toBeVisible();
    await expect(specimen.getByText('Of 50 MB total · 15.8 MB remaining')).toBeVisible();
    await expect(specimen.getByRole('progressbar', { name: 'Transfer archive' })).toHaveAttribute(
      'aria-valuetext',
      '34.2 of 50 megabytes transferred',
    );
    const accessibility = await new AxeBuilder({ page })
      .include('[data-zao-specimen="progress"]')
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('progress.png') });
  });
}

test('narrow RTL readings retain their span with reduced motion and forced colors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  const specimen = await openProgress(page, 'su', 'light');
  await specimen.evaluate((node) => node.setAttribute('dir', 'rtl'));
  const progress = specimen.getByRole('progressbar', { name: 'Upload files' });
  const resting = await geometry(progress);
  expect(resting.ratio).toBeCloseTo(0.68, 3);
  expect(resting.face.x + resting.face.width).toBeCloseTo(resting.track.x + resting.track.width, 2);
  const face = progress.locator('[data-zao-slot="indicator"]');
  await expect(face).toHaveCSS('transition-property', 'none');
  const colors = await progress.evaluate((node) => {
    const track = node.querySelector<HTMLElement>('[data-zao-slot="track"]')!;
    const indicator = node.querySelector<HTMLElement>('[data-zao-slot="indicator"]')!;
    return [getComputedStyle(track).backgroundColor, getComputedStyle(indicator).backgroundColor];
  });
  expect(colors[0]).not.toBe(colors[1]);
  expect(await specimen.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('an interrupted width update keeps its fixed reference and respects finish motion', async ({
  page,
}) => {
  const specimen = await openProgress(page, 'su', 'light');
  const progress = specimen.getByRole('progressbar', { name: 'Upload files' });
  const resting = await geometry(progress);
  const update = await progress.evaluate(async (node) => {
    const track = node.querySelector<HTMLElement>('[data-zao-slot="track"]')!;
    const face = node.querySelector<HTMLElement>('[data-zao-slot="indicator"]')!;
    const css = getComputedStyle(face);
    const finish = getComputedStyle(node);
    const timing = {
      actual: css.transitionDuration,
      expected: finish.getPropertyValue('--zao-motion-duration-base').trim(),
    };
    face.style.width = '100%';
    await new Promise((resolve) => setTimeout(resolve, 40));
    const changing = face.getBoundingClientRect().width;
    face.style.width = '20%';
    const reversing = face.getBoundingClientRect().width;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(face.getAnimations().map((animation) => animation.finished));
    return {
      timing,
      changing,
      reversing,
      destination: face.getBoundingClientRect().width / track.getBoundingClientRect().width,
    };
  });
  const seconds = (duration: string) =>
    duration.endsWith('ms') ? parseFloat(duration) / 1000 : parseFloat(duration);
  expect(seconds(update.timing.actual)).toBe(seconds(update.timing.expected));
  expect(update.changing).toBeGreaterThan(resting.face.width);
  expect(update.reversing).toBeCloseTo(update.changing, 2);
  expect(update.destination).toBeCloseTo(0.2, 3);
  expect((await geometry(progress)).track).toEqual(resting.track);
});
