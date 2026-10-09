import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const fields = ['text-field', 'select', 'combobox'] as const;
const modes = ['light', 'dark'] as const;
type Field = (typeof fields)[number];
type Mode = (typeof modes)[number];
type Pixel = number[];

async function openStudy(page: Page, field: Field, mode: Mode, realStudy = true) {
  const css = realStudy
    ? await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      )
    : '';
  // The shared browser server uses an identity fixture. Serve the actual study
  // through its stylesheet route so these checks exercise its current colors.
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
  await page.goto(`/components/${field}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  if (realStudy) {
    await expect
      .poll(() =>
        study.evaluate((node) =>
          getComputedStyle(node).getPropertyValue('--zao-color-border-field').trim(),
        ),
      )
      .not.toBe('');
  }
  await page.evaluate(() => document.fonts.ready);
  await clearFocus(page);
  return study;
}

async function clearFocus(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
}

async function settle(frame: Locator) {
  await frame.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function paint(frame: Locator) {
  return frame.evaluate((node) => {
    const style = getComputedStyle(node);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const pixel = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const token = (name: string) => {
      const sample = document.createElement('span');
      sample.style.position = 'absolute';
      sample.style.color = style.getPropertyValue(name);
      node.parentElement!.append(sample);
      const color = getComputedStyle(sample).color;
      sample.remove();
      return pixel(color);
    };
    return {
      edge: pixel(style.borderTopColor),
      fill: pixel(style.backgroundColor),
      canvas: token('--zao-color-bg-canvas'),
      surface: token('--zao-color-bg-surface'),
      tokens: {
        rest: token('--zao-color-border-field'),
        invalid: token('--zao-color-border-field-invalid'),
        emphasis: token('--zao-color-border-strong'),
        disabledEdge: token('--zao-color-border-subtle'),
        disabledFill: token('--zao-color-bg-field-disabled'),
        publishedRest: token('--zao-color-border-default'),
        publishedInvalid: token('--zao-color-danger-border'),
        publishedDisabledFill: token('--zao-color-bg-sunken'),
      },
    };
  });
}

type Paint = Awaited<ReturnType<typeof paint>>;

function contrast(foreground: Pixel, background: Pixel) {
  const luminance = (color: Pixel) => {
    const channels = color.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function assertEnabledEdge(reading: Paint) {
  // Canvas conversion measures the browser's 8-bit sRGB paint, including OKLCH
  // outputs, without depending on a color library or a rounded CSS hex label.
  for (const backing of ['canvas', 'surface'] as const) {
    expect(reading.edge[3], 'field edge is opaque').toBe(255);
    expect(reading[backing][3], `${backing} is opaque`).toBe(255);
    expect(contrast(reading.edge, reading[backing]), `edge on ${backing}`).toBeGreaterThanOrEqual(
      3,
    );
  }
}

function assertInvalidEdge(normal: Paint, invalid: Paint) {
  assertEnabledEdge(invalid);
  for (const backing of ['canvas', 'surface'] as const) {
    expect(
      contrast(invalid.edge, invalid[backing]),
      `invalid edge is no weaker than rest on ${backing}`,
    ).toBeGreaterThanOrEqual(contrast(normal.edge, normal[backing]));
  }
}

async function nativeGeometry(frame: Locator) {
  return frame.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const root = node.closest('[data-zao-component]')!.getBoundingClientRect();
    const style = getComputedStyle(node);
    // Select's existing focus wrapper can move in the document. Compare the
    // native frame's dimensions and its position within the field itself.
    return {
      width: bounds.width,
      height: bounds.height,
      xWithinField: bounds.x - root.x,
      yWithinField: bounds.y - root.y,
      borderWidth: style.borderWidth,
      padding: style.padding,
      transform: style.transform,
      radius: style.borderRadius,
    };
  });
}

function targetFor(frame: Locator, field: Field) {
  return field === 'combobox' ? frame.locator('[data-zao-slot="input"]') : frame;
}

async function keyboardFocus(page: Page, target: Locator) {
  // Seed the position, then enter with the native Tab sequence. This final
  // keyboard action exercises :focus-visible rather than pointer focus.
  await target.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
}

async function assertOutline(frame: Locator, field: Field) {
  await expect(frame).toHaveCSS('outline-style', 'solid');
  await expect(frame).toHaveCSS('outline-width', '2px');
  await expect(frame).toHaveCSS('outline-offset', '2px');
  if (field === 'combobox') {
    await expect(targetFor(frame, field)).toHaveCSS('outline-style', 'none');
  }
}

for (const mode of modes) {
  test(`published Su ${mode}: field utility fallbacks retain the existing palette roles`, async ({
    page,
  }) => {
    for (const field of fields) {
      const study = await openStudy(page, field, mode, false);
      expect(
        await study.evaluate((node) => {
          const style = getComputedStyle(node);
          return [
            '--zao-color-border-field',
            '--zao-color-border-field-invalid',
            '--zao-color-bg-field-disabled',
          ].map((name) => style.getPropertyValue(name).trim());
        }),
      ).toEqual(['', '', '']);
      const specimen = study.locator(`[data-zao-specimen="${field}"]`);
      const normal = specimen
        .locator('[data-zao-field-frame]:not([data-zao-invalid], [data-zao-disabled])')
        .first();
      const invalid = specimen.locator('[data-zao-field-frame][data-zao-invalid]').first();
      const disabled = specimen.locator('[data-zao-field-frame][data-zao-disabled]').first();
      await settle(normal);
      const resting = await paint(normal);
      const error = await paint(invalid);
      const muted = await paint(disabled);
      expect(resting.edge).toEqual(resting.tokens.publishedRest);
      expect(error.edge).toEqual(error.tokens.publishedInvalid);
      expect(muted.fill).toEqual(muted.tokens.publishedDisabledFill);
      // Color remains local to the study. These inherited published defaults do
      // not gain a new minimum until their separate color promotion decision.
    }
  });

  for (const field of fields) {
    test(`Quiet ${mode}, ${field}: field edges meet contrast and preserve every state`, async ({
      page,
    }) => {
      const study = await openStudy(page, field, mode);
      const specimen = study.locator(`[data-zao-specimen="${field}"]`);
      const normal = specimen
        .locator('[data-zao-field-frame]:not([data-zao-invalid], [data-zao-disabled])')
        .first();
      const invalid = specimen.locator('[data-zao-field-frame][data-zao-invalid]').first();
      const disabled = specimen.locator('[data-zao-field-frame][data-zao-disabled]').first();

      await normal.scrollIntoViewIfNeeded();
      await clearFocus(page);
      await settle(normal);
      const geometry = await nativeGeometry(normal);
      const resting = await paint(normal);
      expect(resting.edge).toEqual(resting.tokens.rest);
      assertEnabledEdge(resting);

      await normal.hover();
      await settle(normal);
      const hovered = await paint(normal);
      expect(hovered.edge).toEqual(hovered.tokens.emphasis);
      expect(hovered.fill).toEqual(resting.fill);
      expect(await nativeGeometry(normal)).toEqual(geometry);

      await page.mouse.move(0, 0);
      await keyboardFocus(page, targetFor(normal, field));
      await settle(normal);
      const focused = await paint(normal);
      expect(focused.edge).toEqual(focused.tokens.emphasis);
      expect(focused.fill).toEqual(resting.fill);
      await assertOutline(normal, field);
      expect(await nativeGeometry(normal)).toEqual(geometry);

      await invalid.scrollIntoViewIfNeeded();
      await clearFocus(page);
      await settle(invalid);
      const invalidGeometry = await nativeGeometry(invalid);
      const error = await paint(invalid);
      expect(error.edge).toEqual(error.tokens.invalid);
      assertInvalidEdge(resting, error);

      await invalid.hover();
      await settle(invalid);
      expect((await paint(invalid)).edge).toEqual(error.edge);
      expect(await nativeGeometry(invalid)).toEqual(invalidGeometry);
      await page.mouse.move(0, 0);
      await keyboardFocus(page, targetFor(invalid, field));
      await settle(invalid);
      expect((await paint(invalid)).edge).toEqual(error.edge);
      await assertOutline(invalid, field);
      await expect(targetFor(invalid, field)).toHaveAttribute('aria-invalid', 'true');
      expect(await nativeGeometry(invalid)).toEqual(invalidGeometry);

      await disabled.scrollIntoViewIfNeeded();
      await clearFocus(page);
      await settle(disabled);
      const disabledGeometry = await nativeGeometry(disabled);
      const muted = await paint(disabled);
      expect(muted.edge).toEqual(muted.tokens.disabledEdge);
      expect(muted.fill).toEqual(muted.tokens.disabledFill);
      expect({ edge: muted.edge, fill: muted.fill }).not.toEqual({
        edge: resting.edge,
        fill: resting.fill,
      });
      await expect(targetFor(disabled, field)).toBeDisabled();
      await disabled.hover();
      await settle(disabled);
      const disabledHovered = await paint(disabled);
      expect(disabledHovered.edge).toEqual(muted.edge);
      expect(disabledHovered.fill).toEqual(muted.fill);
      expect(await nativeGeometry(disabled)).toEqual(disabledGeometry);

      // Probe only the CSS state combination. Base UI still owns native disabled
      // behavior; an invalid enclosure retains its error edge when also muted.
      await invalid.evaluate((node) => node.setAttribute('data-zao-disabled', ''));
      try {
        await clearFocus(page);
        await settle(invalid);
        const disabledInvalid = await paint(invalid);
        expect(disabledInvalid.edge).toEqual(error.edge);
        expect(disabledInvalid.fill).toEqual(disabledInvalid.tokens.disabledFill);
      } finally {
        await invalid.evaluate((node) => node.removeAttribute('data-zao-disabled'));
      }
    });

    test(`Quiet ${mode}, ${field}: restoring the old colors fails the field-edge contract`, async ({
      page,
    }) => {
      const study = await openStudy(page, field, mode);
      const specimen = study.locator(`[data-zao-specimen="${field}"]`);
      const normal = specimen
        .locator('[data-zao-field-frame]:not([data-zao-invalid], [data-zao-disabled])')
        .first();
      const invalid = specimen.locator('[data-zao-field-frame][data-zao-invalid]').first();
      const disabled = specimen.locator('[data-zao-field-frame][data-zao-disabled]').first();
      await settle(normal);
      const approvedNormal = await paint(normal);
      assertEnabledEdge(approvedNormal);
      assertInvalidEdge(approvedNormal, await paint(invalid));

      // Restore historical roles only on this island. The real CSS selectors and
      // component paint paths remain active, making this a regression witness.
      await study.evaluate((node, currentMode) => {
        const island = node as HTMLElement;
        island.style.setProperty(
          '--zao-color-border-field',
          currentMode === 'light'
            ? 'var(--zao-color-border-default)'
            : 'var(--zao-color-border-subtle)',
        );
        island.style.setProperty(
          '--zao-color-border-field-invalid',
          'var(--zao-color-danger-border)',
        );
        island.style.setProperty('--zao-color-bg-field-disabled', 'var(--zao-color-bg-sunken)');
      }, mode);
      await settle(normal);
      await settle(invalid);
      await settle(disabled);
      const oldNormal = await paint(normal);
      const oldInvalid = await paint(invalid);
      if (mode === 'light') {
        for (const backing of ['canvas', 'surface'] as const) {
          expect(contrast(oldInvalid.edge, oldInvalid[backing])).toBeLessThan(3);
          expect(contrast(oldInvalid.edge, oldInvalid[backing])).toBeLessThan(
            contrast(oldNormal.edge, oldNormal[backing]),
          );
        }
      } else {
        for (const backing of ['canvas', 'surface'] as const) {
          expect(contrast(oldNormal.edge, oldNormal[backing])).toBeLessThan(3);
        }
        const oldDisabled = await paint(disabled);
        expect({ edge: oldDisabled.edge, fill: oldDisabled.fill }).toEqual({
          edge: oldNormal.edge,
          fill: oldNormal.fill,
        });
      }
    });
  }

  test(`Quiet ${mode}: Fields together uses the same resting, hover and keyboard boundaries`, async ({
    page,
  }) => {
    for (const pageField of fields) {
      const study = await openStudy(page, pageField, mode);
      const family = study.locator('[data-zao-specimen="field-family"]');
      const restPaint: Paint[] = [];
      for (const field of fields) {
        const frame = family.locator(`[data-zao-component="${field}"] [data-zao-field-frame]`);
        await frame.scrollIntoViewIfNeeded();
        await clearFocus(page);
        await settle(frame);
        const geometry = await nativeGeometry(frame);
        const resting = await paint(frame);
        restPaint.push(resting);
        expect(resting.edge).toEqual(resting.tokens.rest);
        assertEnabledEdge(resting);

        await frame.hover();
        await settle(frame);
        expect((await paint(frame)).edge).toEqual(resting.tokens.emphasis);
        expect(await nativeGeometry(frame)).toEqual(geometry);
        await page.mouse.move(0, 0);
        await keyboardFocus(page, targetFor(frame, field));
        await settle(frame);
        expect((await paint(frame)).edge).toEqual(resting.tokens.emphasis);
        await assertOutline(frame, field);
        expect(await nativeGeometry(frame)).toEqual(geometry);
      }
      for (const reading of restPaint.slice(1)) {
        expect(reading.edge).toEqual(restPaint[0]!.edge);
        expect(reading.fill).toEqual(restPaint[0]!.fill);
      }
    }
  });
}
