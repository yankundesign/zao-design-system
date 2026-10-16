import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/*
 * Side planes (finish plan V2, Oct 11). A lifted part shows the gap between its face and its
 * fixed base as two planes toward the depth axis, each drawn in two flat bands (叠晕). Every
 * band is a shade of the part's own semantic face: light faces step toward black, dark faces
 * toward white, and solid seal faces always toward black. In both modes a plane's far band is
 * darker than its near band, and the bottom plane is only slightly darker than the side plane,
 * so it never reads as a detached shadow. Native targets and layout never move.
 */

const studies = [
  { name: 'published Su', realQuietInstrument: false },
  { name: 'real Quiet instrument', realQuietInstrument: true },
] as const;
const modes = ['light', 'dark'] as const;
const buttonLabels = ['Save changes', 'Review details', 'Cancel'] as const;
type Pose = 'rest' | 'hover' | 'press';
type Mode = (typeof modes)[number];

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
  mode: Mode,
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
  const anatomy = page.locator(`[data-anatomy-kind="${component}"]`);
  if (await anatomy.count()) await expect(anatomy).toHaveAttribute('data-anatomy-ready', 'true');
  const island = page.locator('[data-preview-style] .study').first();
  await expect(island).toHaveAttribute('data-zao-mode', mode);
  await island.scrollIntoViewIfNeeded();
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

/** Reads a part's face and the four plane bands its plane host paints. */
async function planes(root: Locator, faceSelector: string | null, hostSelector: string | null) {
  return root.evaluate(
    (node, options) => {
      const face = options.faceSelector ? node.querySelector(options.faceSelector)! : node;
      const host = options.hostSelector ? node.querySelector(options.hostSelector)! : node;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      const rgba = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      // Resolve each band as real paint through a zero-size probe inside the host, so the
      // probe inherits the host's face, mode and seal.
      const resolve = (value: string) => {
        const probe = document.createElement('span');
        probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;background-color:${value}`;
        host.append(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return rgba(color);
      };
      const hostStyle = getComputedStyle(host);
      const pseudo = (which: '::before' | '::after') => {
        const style = getComputedStyle(host, which);
        return {
          content: style.content,
          gradient: style.backgroundImage.startsWith('linear-gradient('),
          clipped: style.clipPath.startsWith('polygon('),
        };
      };
      return {
        face: rgba(getComputedStyle(face).backgroundColor),
        surface: rgba(hostStyle.getPropertyValue('--zao-color-bg-surface')),
        xNear: resolve('var(--zao-plane-x-near)'),
        xFar: resolve('var(--zao-plane-x-far)'),
        yNear: resolve('var(--zao-plane-y-near)'),
        yFar: resolve('var(--zao-plane-y-far)'),
        side: resolve('var(--zao-construction-side)'),
        rest: Number.parseFloat(hostStyle.getPropertyValue('--zao-plane-rest')),
        offset: Number.parseFloat(hostStyle.getPropertyValue('--zao-face-offset')),
        before: pseudo('::before'),
        after: pseudo('::after'),
        shadow: getComputedStyle(face).boxShadow,
      };
    },
    { faceSelector, hostSelector },
  );
}

type Planes = Awaited<ReturnType<typeof planes>>;

function luminance(color: number[]) {
  return color.slice(0, 3).reduce((sum, channel, index) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
  }, 0);
}

function contrast(first: number[], second: number[]) {
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1]! + 0.05) / (values[0]! + 0.05);
}

/**
 * The banded planes: drawn, opaque, shades of the face in the mode's direction, far bands
 * darker than near bands, and a bottom plane close to the side plane.
 */
function expectBanded(reading: Planes, description: string, toward: 'black' | 'white') {
  expect(reading.face[3], `${description}: the visible face is opaque`).toBe(255);
  for (const which of ['before', 'after'] as const) {
    expect(reading[which].content, `${description}: ${which} plane`).not.toBe('none');
    expect(reading[which].gradient, `${description}: ${which} plane is banded`).toBe(true);
    expect(reading[which].clipped, `${description}: ${which} plane is a polygon`).toBe(true);
  }
  const face = luminance(reading.face);
  for (const band of ['xNear', 'xFar', 'yNear', 'yFar'] as const) {
    expect(reading[band][3], `${description}: ${band} is opaque`).toBe(255);
    if (toward === 'black') {
      expect(
        luminance(reading[band]),
        `${description}: ${band} is darker than the face`,
      ).toBeLessThan(face);
    } else {
      expect(
        luminance(reading[band]),
        `${description}: ${band} is lighter than the face`,
      ).toBeGreaterThan(face);
    }
  }
  expect(luminance(reading.xFar), `${description}: side far band`).toBeLessThan(
    luminance(reading.xNear),
  );
  expect(luminance(reading.yFar), `${description}: bottom far band`).toBeLessThan(
    luminance(reading.yNear),
  );
  expect(
    contrast(reading.yFar, reading.xFar),
    `${description}: the bottom stays close to the side, never a detached shadow`,
  ).toBeLessThan(1.25);
  expect(reading.side, `${description}: the single side tone is the near side band`).toEqual(
    reading.xNear,
  );
}

async function pose(page: Page, target: Locator, frame: Locator, state: Pose) {
  await target.scrollIntoViewIfNeeded();
  if (state === 'rest') await page.mouse.move(0, 0);
  else await target.hover();
  if (state === 'press') await page.mouse.down();
  await settle(frame);
}

for (const study of studies) {
  for (const mode of modes) {
    const shade = mode === 'light' ? 'black' : 'white';

    test(`${study.name}, ${mode}: Button planes rest a control depth, lift with the face and close on press`, async ({
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
            const reading = await planes(
              button,
              ':scope > [data-zao-slot="face"]',
              ':scope > [data-zao-slot="side"]',
            );
            const description = `${label}, ${state}`;
            if (label === 'Cancel' && state === 'rest') {
              expect(reading.face[3], 'quiet rest has no filled face').toBe(0);
              expect(reading.rest, 'quiet rest has no planes').toBe(0);
            } else {
              expectBanded(reading, description, label === 'Save changes' ? 'black' : shade);
              expect(reading.rest, `${description}: control rest depth`).toBe(3);
              expect(reading.offset, `${description}: face travel`).toBe(
                state === 'rest' ? 0 : state === 'hover' ? 2 : -3,
              );
            }
            if (mode === 'dark' && label === 'Review details' && state !== 'press') {
              // Keep the construction legible against near-black surface backing.
              expect(
                contrast(reading.xNear, reading.surface),
                `${description}: side against the surface`,
              ).toBeGreaterThanOrEqual(1.2);
            }
            expect(await documentBoxes(targets)).toEqual(layout);
          } finally {
            if (state === 'press') await page.mouse.up();
          }
        }
      }
    });

    test(`${study.name}, ${mode}: on and off Switch thumbs carry banded planes without moving native targets`, async ({
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
            const reading = await planes(
              control,
              ':scope > [data-zao-slot="thumb"] > [data-zao-slot="face"]',
              ':scope > [data-zao-slot="thumb"]',
            );
            expectBanded(reading, `${label}, ${state}`, shade);
            expect(reading.rest).toBe(2);
            expect(reading.offset).toBe(state === 'press' ? -2 : 0);
            expect(await documentBoxes(targets)).toEqual(layout);
          } finally {
            if (state === 'press') await page.mouse.up();
          }
        }
      }
    });

    test(`${study.name}, ${mode}: the secondary Tabs face carries banded planes and seats on press`, async ({
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
          const reading = await planes(indicator, null, null);
          if (state === 'press') {
            expect(reading.rest, 'a seated face shows no planes').toBe(0);
          } else {
            expectBanded(reading, state, shade);
            expect(reading.rest).toBe(2);
          }
          expect(await documentBoxes(targets)).toEqual(layout);
          await expect(selected).toHaveAttribute('aria-selected', 'true');
        } finally {
          if (state === 'press') await page.mouse.up();
        }
      }
    });

    test(`${study.name}, ${mode}: the open Menu face carries banded planes in place of a drawn shadow`, async ({
      page,
    }) => {
      const island = await openSurface(page, 'menu', study.realQuietInstrument, mode);
      const specimen = island.locator('[data-zao-specimen="menu"]').first();
      const trigger = specimen.getByRole('button', { name: 'Workspace actions', exact: true });
      await trigger.scrollIntoViewIfNeeded();
      const triggerBox = await documentBoxes(trigger);
      await trigger.click();
      const popup = specimen.locator('[data-zao-slot="popup"]');
      await expect(popup).toBeVisible();
      await settle(popup);
      const reading = await planes(popup, null, null);
      expectBanded(reading, 'Menu open', shade);
      expect(reading.rest).toBe(3);
      expect(reading.shadow, 'the planes replace the material contact').toBe('none');
      expect(await documentBoxes(trigger)).toEqual(triggerBox);
      await page.keyboard.press('Escape');
      await expect(popup).toBeHidden();
      expect(await documentBoxes(trigger)).toEqual(triggerBox);
    });

    test(`${study.name}, ${mode}: Card keeps one banded base, a faceted corner, and passive content at every rest depth`, async ({
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
          const resolve = (role: string) => {
            const probe = document.createElement('span');
            probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;color:var(${role})`;
            node.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          };
          return {
            edges: {
              top: front.borderTopColor,
              right: front.borderRightColor,
              bottom: front.borderBottomColor,
              left: front.borderLeftColor,
            },
            subtleBorder: resolve('--zao-color-border-subtle'),
            strongBorder: resolve('--zao-color-border-strong'),
            radii: [
              front.borderTopLeftRadius,
              front.borderTopRightRadius,
              front.borderBottomRightRadius,
              front.borderBottomLeftRadius,
            ],
            facet: front.getPropertyValue('--zao-radius-facet').trim(),
            cornerShape: front.getPropertyValue('corner-shape'),
            stroke: parseFloat(front.getPropertyValue('--zao-stroke-hairline')),
            frontStroke: parseFloat(front.borderTopWidth),
            shadow: front.boxShadow,
            transform: front.transform,
            tabIndex: (node as HTMLElement).tabIndex,
          };
        });
      const expectFrame = (reading: Awaited<ReturnType<typeof frame>>) => {
        // Oct 15 (cards A and C): the edges facing the light are lit and the edges meeting the
        // planes are in shade, in each mode's own direction.
        const lit = mode === 'light' ? reading.subtleBorder : reading.strongBorder;
        const shaded = mode === 'light' ? reading.strongBorder : reading.subtleBorder;
        expect(reading.edges).toEqual({ top: lit, right: lit, bottom: shaded, left: shaded });
        // One faceted leading corner (V4); the other three stay square.
        expect(reading.radii).toEqual(['0px', reading.facet, '0px', '0px']);
        expect(reading.frontStroke).toBe(reading.stroke);
        expect(reading.shadow, 'the planes replace the drawn contact').toBe('none');
        expect(reading.transform).toBe('none');
        expect(reading.tabIndex).toBe(-1);
      };
      const expectSamples = async (description: string, rest: number) => {
        for (const sample of await panel.locator('[data-zao-component="card"]').all()) {
          const reading = await planes(sample, null, null);
          expect(reading.rest, `${description}: surface rest depth`).toBe(rest);
          // Card planes are darker steps of the face in both modes (Oct 15, cards C).
          if (rest > 0) expectBanded(reading, description, 'black');
        }
      };
      const rest = await frame();
      expectFrame(rest);
      await expectSamples('Card rest', 4);
      for (const state of ['hover', 'press'] as const) {
        try {
          await pose(page, card, panel, state);
          expect(await frame()).toEqual(rest);
          // Pressing the passive Card itself does not load it; only its actions do.
          await expectSamples(`Card ${state}`, 4);
          expect(await documentBoxes(targets)).toEqual(layout);
        } finally {
          if (state === 'press') await page.mouse.up();
        }
      }
      await page.mouse.move(0, 0);
      for (const depth of [0, 8]) {
        await island.evaluate((node, value) => {
          node.style.setProperty('--zao-depth-rest-surface', `${value}px`);
        }, depth);
        await settle(panel);
        expectFrame(await frame());
        await expectSamples(`Card ${depth}px rest`, depth);
        expect(await documentBoxes(targets)).toEqual(layout);
      }
    });
  }
}
