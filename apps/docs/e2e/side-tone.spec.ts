import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const studies = [
  { name: 'published Su', realQuietInstrument: false },
  { name: 'real Quiet instrument', realQuietInstrument: true },
] as const;
const modes = ['light', 'dark'] as const;
const buttonLabels = ['Save changes', 'Review details', 'Cancel'] as const;
type SidePaint = 'button' | 'switch' | 'shadow';
type Pose = 'rest' | 'hover' | 'press';

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

async function openSurface(
  page: Page,
  component: string,
  realQuietInstrument: boolean,
  mode: 'light' | 'dark',
) {
  // Serve no study paint for the published case, even when the local docs server
  // normally exposes the real study instead of the small E2E identity fixture.
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await page.goto(`/components/${component}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  if (realQuietInstrument) {
    await page.addStyleTag({
      content: await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      ),
    });
  }
  await page.evaluate(() => document.fonts.ready);
  const island = page.locator('.study').first();
  await expect(island).toHaveAttribute('data-zao-mode', mode);
  await page.mouse.move(0, 0);
  await settle(island);
  return island;
}

async function documentBoxes(elements: Locator) {
  return elements.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
    }),
  );
}

async function paints(surface: Locator, faceSelector: string | null, sidePaint: SidePaint) {
  return surface.evaluate(
    (root, options) => {
      const face = options.faceSelector ? root.querySelector(options.faceSelector)! : root;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      const rgba = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      const faceStyle = getComputedStyle(face);
      let sideColor: string | null;
      let baseColor: string | null = null;
      let sideNode: Element = root;
      let shadow = 'none';
      if (options.sidePaint === 'button') {
        sideColor = getComputedStyle(root, '::after').backgroundColor;
        baseColor = getComputedStyle(root, '::before').backgroundColor;
      } else if (options.sidePaint === 'switch') {
        sideNode = root.querySelector(':scope > [data-zao-slot="thumb"]')!;
        sideColor = getComputedStyle(sideNode).backgroundColor;
      } else {
        shadow = faceStyle.boxShadow;
        // Chromium resolves mixed colors to rgb(), color(srgb ...), or oklch().
        sideColor = shadow === 'none' ? null : (shadow.match(/^[a-z-]+\([^)]*\)/i)?.[0] ?? null);
      }
      // Resolve the inherited shared result as a real paint value. The fixed,
      // zero-size probe contributes no content, focus target, or layout box.
      const probe = document.createElement('span');
      probe.style.cssText =
        'position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;background-color:var(--zao-construction-side)';
      sideNode.append(probe);
      const sharedColor = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        face: rgba(faceStyle.backgroundColor),
        surface: rgba(getComputedStyle(root).getPropertyValue('--zao-color-bg-surface')),
        side: sideColor === null ? null : rgba(sideColor),
        base: baseColor === null ? null : rgba(baseColor),
        shared: rgba(sharedColor),
        source: { face: faceStyle.backgroundColor, side: sideColor, shared: sharedColor, shadow },
      };
    },
    { faceSelector, sidePaint },
  );
}

function expectShaded(
  reading: Awaited<ReturnType<typeof paints>>,
  description: string,
  sideHidden = false,
) {
  expect(reading.face[3], `${description}: the visible face is opaque`).toBe(255);
  expect(reading.shared[3], `${description}: the shared shaded result is opaque`).toBe(255);
  for (const channel of [0, 1, 2]) {
    const expected = Math.round(reading.face[channel]! * 0.8);
    // Normalize through the browser's actual sRGB paint conversion. One 8-bit
    // level covers rounding a face before multiplication versus after mixing.
    expect(
      Math.abs(reading.shared[channel]! - expected),
      `${description}: shared channel ${channel}; ${JSON.stringify(reading.source)}`,
    ).toBeLessThanOrEqual(1);
  }
  if (sideHidden) {
    expect(reading.side, `${description}: seated tabs expose no side shadow`).toBeNull();
    return;
  }
  expect(reading.side, `${description}: rendered side paint exists`).not.toBeNull();
  expect(reading.side).toEqual(reading.shared);
  if (reading.base) expect(reading.base).toEqual(reading.shared);
}

async function pose(page: Page, target: Locator, frame: Locator, state: Pose) {
  if (state === 'rest') await page.mouse.move(0, 0);
  else await target.hover();
  if (state === 'press') await page.mouse.down();
  await settle(frame);
}

function contrast(first: number[], second: number[]) {
  const luminance = (color: number[]) =>
    color.slice(0, 3).reduce((sum, channel, index) => {
      const value = channel / 255;
      const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
    }, 0);
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1]! + 0.05) / (values[0]! + 0.05);
}

for (const study of studies) {
  for (const mode of modes) {
    test(`${study.name}, ${mode}: Button sides stay visible and joined to their fixed bases`, async ({
      page,
    }) => {
      const island = await openSurface(page, 'button', study.realQuietInstrument, mode);
      const specimen = island.locator('[data-zao-specimen="button"]').first();
      const targets = specimen.locator('button');
      await targets.first().scrollIntoViewIfNeeded();
      const layout = await documentBoxes(targets);
      for (const label of buttonLabels) {
        const button = specimen.getByRole('button', { name: label, exact: true });
        for (const state of ['rest', 'hover', 'press'] as const) {
          try {
            await pose(page, button, specimen, state);
            const reading = await paints(button, ':scope > [data-zao-slot="face"]', 'button');
            if (label === 'Cancel' && state === 'rest') {
              expect(reading.face[3], 'quiet rest has no filled face').toBe(0);
              expect(reading.side?.[3], 'quiet rest has no shaded side').toBe(0);
              expect(reading.base?.[3], 'quiet rest has no visible base').toBe(0);
            } else if (mode === 'dark' && label !== 'Save changes') {
              expect(reading.side?.[3], 'the joined edge is opaque').toBe(255);
              expect(reading.base, 'base and joined side use one continuous tone').toEqual(
                reading.side,
              );
              // A decorative depth cue, not the identifying control perimeter.
              // Keep meaningful separation on surface backing, including the storage Card.
              expect(
                contrast(reading.side!, reading.surface),
                `${label}, ${state}: surface separation`,
              ).toBeGreaterThanOrEqual(1.4);
              expect(contrast(reading.side!, reading.surface)).toBeGreaterThan(
                contrast(reading.shared, reading.surface),
              );
              // The pressed face is seated on the base, hiding its joined side.
              if (state !== 'press') {
                expect(
                  contrast(reading.side!, reading.face),
                  `${label}, ${state}: face separation`,
                ).toBeGreaterThanOrEqual(1.4);
              }
            } else {
              expectShaded(reading, `${label}, ${state}`);
            }
            expect(await documentBoxes(targets)).toEqual(layout);
          } finally {
            if (state === 'press') await page.mouse.up();
          }
        }
      }
    });

    test(`${study.name}, ${mode}: on and off Switch faces shade the joined thumb without moving native targets`, async ({
      page,
    }) => {
      const island = await openSurface(page, 'switch', study.realQuietInstrument, mode);
      const specimen = island.getByRole('form', { name: 'Notification settings' });
      const targets = specimen.locator('[data-zao-component="switch"], label');
      const layout = await documentBoxes(targets);
      for (const label of ['Email updates', 'Activity alerts']) {
        const control = specimen.getByRole('switch', { name: label });
        for (const state of ['rest', 'hover', 'press'] as const) {
          try {
            await pose(page, control, specimen, state);
            expectShaded(
              await paints(
                control,
                ':scope > [data-zao-slot="thumb"] > [data-zao-slot="face"]',
                'switch',
              ),
              `${label}, ${state}`,
            );
            expect(await documentBoxes(targets)).toEqual(layout);
          } finally {
            if (state === 'press') await page.mouse.up();
          }
        }
      }
    });

    test(`${study.name}, ${mode}: the secondary Tabs face shades its contact and preserves seated geometry`, async ({
      page,
    }) => {
      const island = await openSurface(page, 'tabs', study.realQuietInstrument, mode);
      const list = island.getByRole('tablist', { name: 'Overview views', exact: true });
      const selected = list.getByRole('tab', { name: 'Summary', exact: true });
      const indicator = list.locator(':scope > [data-zao-slot="indicator"]');
      const targets = list.locator('[role="tab"]');
      const layout = await documentBoxes(targets);
      for (const state of ['rest', 'hover', 'press'] as const) {
        try {
          await pose(page, selected, list, state);
          expectShaded(await paints(indicator, null, 'shadow'), state, state === 'press');
          expect(await documentBoxes(targets)).toEqual(layout);
          await expect(selected).toHaveAttribute('aria-selected', 'true');
        } finally {
          if (state === 'press') await page.mouse.up();
        }
      }
    });

    test(`${study.name}, ${mode}: the open Menu uses its actual floating face for a shaded crisp contact`, async ({
      page,
    }) => {
      const island = await openSurface(page, 'menu', study.realQuietInstrument, mode);
      const specimen = island.locator('[data-zao-specimen="menu"]').first();
      const trigger = specimen.getByRole('button', { name: 'Workspace actions', exact: true });
      const triggerBox = await documentBoxes(trigger);
      await trigger.click();
      const popup = specimen.locator('[data-zao-slot="popup"]');
      await expect(popup).toBeVisible();
      await settle(popup);
      expectShaded(await paints(popup, null, 'shadow'), 'Menu open contact');
      const shadow = await popup.evaluate((node) => getComputedStyle(node).boxShadow);
      const distances = shadow
        .replace(/^[a-z-]+\([^)]*\)/i, '')
        .match(/[-+]?\d*\.?\d+px/g)!
        .map(parseFloat);
      expect(distances, 'one contact offset, zero blur, zero spread').toEqual([-1, 1, 0, 0]);
      expect(await documentBoxes(trigger)).toEqual(triggerBox);
      await page.keyboard.press('Escape');
      await expect(popup).toBeHidden();
      expect(await documentBoxes(trigger)).toEqual(triggerBox);
    });

    test(`${study.name}, ${mode}: Card keeps one visible contact, square corners, and passive content at every contact depth`, async ({
      page,
    }) => {
      const island = await openSurface(page, 'card', study.realQuietInstrument, mode);
      const panel = island.getByRole('tabpanel', { name: 'Split', exact: true });
      const card = panel.locator('[data-zao-component="card"]').first();
      const targets = panel.locator(
        '[data-zao-card-width], [data-zao-component="card"], button, h3',
      );
      const layout = await documentBoxes(targets);
      const frame = () =>
        card.evaluate((node) => {
          const front = getComputedStyle(node);
          const probe = document.createElement('span');
          probe.style.cssText =
            'position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;color:var(--zao-color-border-subtle)';
          node.append(probe);
          const subtleBorder = getComputedStyle(probe).color;
          probe.remove();
          return {
            frontBorder: front.borderColor,
            subtleBorder,
            frontRadius: front.borderRadius,
            stroke: parseFloat(front.getPropertyValue('--zao-stroke-hairline')),
            frontStroke: parseFloat(front.borderTopWidth),
            contact: parseFloat(front.getPropertyValue('--zao-depth-contact')),
            axisX: parseFloat(front.getPropertyValue('--zao-depth-axis-x')),
            axisY: parseFloat(front.getPropertyValue('--zao-depth-axis-y')),
            shadowDistances: [...front.boxShadow.matchAll(/(-?\d*\.?\d+)px/g)].map((match) =>
              Number(match[1]),
            ),
            beforeContent: getComputedStyle(node, '::before').content,
            afterContent: getComputedStyle(node, '::after').content,
            shadow: front.boxShadow,
            transform: front.transform,
            tabIndex: (node as HTMLElement).tabIndex,
          };
        });
      const expectShadedFrame = (reading: Awaited<ReturnType<typeof frame>>) => {
        expect(reading.frontBorder).toBe(reading.subtleBorder);
        expect(reading.frontRadius).toBe('0px');
        expect(reading.frontStroke).toBe(reading.stroke);
        expect(reading.shadowDistances, 'one contact offset, zero blur, zero spread').toEqual([
          -reading.axisX * reading.contact || 0,
          -reading.axisY * reading.contact || 0,
          0,
          0,
        ]);
        expect(reading.beforeContent, 'no rear outline').toBe('none');
        expect(reading.afterContent, 'no second decorative outline').toBe('none');
        expect(reading.shadow).not.toBe('none');
        expect(reading.transform).toBe('none');
        expect(reading.tabIndex).toBe(-1);
      };
      const expectContactTone = async (description: string) => {
        // Both fixed-width samples need a legible contact against the near-black face.
        for (const sample of await panel.locator('[data-zao-component="card"]').all()) {
          const reading = await paints(sample, null, 'shadow');
          if (mode === 'light') {
            expectShaded(reading, description);
          } else {
            expect(reading.side?.[3], `${description}: contact is opaque`).toBe(255);
            expect(
              contrast(reading.side!, reading.face),
              `${description}: face separation`,
            ).toBeGreaterThanOrEqual(1.4);
            expect(
              contrast(reading.side!, reading.surface),
              `${description}: surface separation`,
            ).toBeGreaterThan(contrast(reading.shared, reading.surface));
          }
        }
      };
      const rest = await frame();
      expectShadedFrame(rest);
      await expectContactTone('Card rest contact');
      for (const state of ['hover', 'press'] as const) {
        try {
          await pose(page, card, panel, state);
          expect(await frame()).toEqual(rest);
          await expectContactTone(`Card ${state} contact`);
          expect(await documentBoxes(targets)).toEqual(layout);
        } finally {
          if (state === 'press') await page.mouse.up();
        }
      }
      await page.mouse.move(0, 0);
      for (const contact of [0, 4]) {
        await island.evaluate((node, value) => {
          node.style.setProperty('--zao-depth-contact', `${value}px`);
        }, contact);
        await settle(panel);
        expectShadedFrame(await frame());
        await expectContactTone(`Card ${contact}px contact`);
        expect(await documentBoxes(targets)).toEqual(layout);
      }
    });
  }
}
