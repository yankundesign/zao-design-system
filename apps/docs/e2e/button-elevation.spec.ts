import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { expectFocusBrackets } from './focus-mark';
import { seat } from './construction-values';

const variants = [
  { variant: 'primary', label: 'Save changes' },
  { variant: 'secondary', label: 'Review details' },
  { variant: 'quiet', label: 'Cancel' },
  { variant: 'danger', label: 'Delete workspace' },
] as const;

const studies = [
  { name: 'ZAO baseline light', realQuietInstrument: false, mode: 'light' },
  { name: 'ZAO baseline dark', realQuietInstrument: false, mode: 'dark' },
  { name: 'real Quiet instrument light', realQuietInstrument: true, mode: 'light' },
  { name: 'real Quiet instrument dark', realQuietInstrument: true, mode: 'dark' },
] as const;

async function openButtonPage(page: Page, realQuietInstrument: boolean, mode: 'light' | 'dark') {
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await page.goto(
    realQuietInstrument ? '/components/button?style=quiet-instrument' : '/components/button',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  if (realQuietInstrument) {
    // The configured E2E study fixture only identifies the study. Exercise its real overrides too.
    const css = await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    );
    await page.addStyleTag({ content: css });
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(page.locator('[data-anatomy-kind="button"]')).toHaveAttribute(
    'data-anatomy-ready',
    'true',
  );
  const study = page.locator('[data-preview-style] .study').first();
  const specimen = study.locator('[data-zao-specimen="button"]').first();
  await specimen.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await settle(specimen);
  return specimen;
}

function face(button: Locator) {
  return button.locator(':scope > [data-zao-slot="face"]');
}

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

/** Measure the actual reading, including text nodes without a label wrapper. */
async function inkBounds(button: Locator) {
  return face(button).evaluate((element) => {
    const readings: Array<{
      kind: 'text' | 'icon';
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    const record = (kind: 'text' | 'icon', box: DOMRect) => {
      if (box.width && box.height) {
        readings.push({ kind, x: box.x, y: box.y, width: box.width, height: box.height });
      }
    };
    const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = text.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      record('text', range.getBoundingClientRect());
    }
    for (const icon of element.querySelectorAll('svg')) {
      record('icon', icon.getBoundingClientRect());
    }
    return readings;
  });
}

function expectInkTravel(
  current: Awaited<ReturnType<typeof inkBounds>>,
  resting: Awaited<ReturnType<typeof inkBounds>>,
  x: number,
  y: number,
) {
  expect(resting.length).toBeGreaterThan(0);
  expect(current).toHaveLength(resting.length);
  for (const [index, reading] of current.entries()) {
    const start = resting[index]!;
    expect(reading.kind).toBe(start.kind);
    expect(reading.x - start.x).toBeCloseTo(x, 2);
    expect(reading.y - start.y).toBeCloseTo(y, 2);
    expect(reading.width).toBeCloseTo(start.width, 2);
    expect(reading.height).toBeCloseTo(start.height, 2);
  }
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

async function observeClicks(button: Locator) {
  await button.evaluate((element) => {
    element.dataset.elevationActivations = '0';
    element.addEventListener('click', () => {
      element.dataset.elevationActivations = String(
        Number(element.dataset.elevationActivations) + 1,
      );
    });
  });
}

/**
 * The side slot paints two planes (finish plan V2): ::before across the axis's x component and
 * ::after across its y component. Each is a quad from the face's trailing edge to the fixed
 * base's matching edge; the base sits a rest depth behind the native box along the axis.
 */
async function expectContinuousSide(
  button: Locator,
  fixedBase?: { x: number; y: number; width: number; height: number },
  { resting = !fixedBase }: { resting?: boolean } = {},
) {
  const state = await button.evaluate((element) => {
    const shell = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    const face = element.querySelector<HTMLElement>(':scope > [data-zao-slot="face"]')!;
    const side = element.querySelector<HTMLElement>(':scope > [data-zao-slot="side"]')!;
    const faceBox = face.getBoundingClientRect();
    const sideBox = side.getBoundingClientRect();
    const plane = (which: '::before' | '::after') => {
      const style = getComputedStyle(side, which);
      return {
        x: sideBox.x + parseFloat(style.left),
        y: sideBox.y + parseFloat(style.top),
        width: parseFloat(style.width),
        height: parseFloat(style.height),
        clip: style.clipPath,
        content: style.content,
        pointerEvents: style.pointerEvents,
        gradient: style.backgroundImage,
      };
    };
    const rest = parseFloat(css.getPropertyValue('--zao-plane-rest'));
    const axisX = Number(css.getPropertyValue('--zao-depth-axis-x'));
    const axisY = Number(css.getPropertyValue('--zao-depth-axis-y'));
    return {
      shell: {
        x: shell.x,
        y: shell.y,
        width: shell.width,
        height: shell.height,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      },
      face: {
        x: faceBox.x,
        y: faceBox.y,
        width: faceBox.width,
        height: faceBox.height,
        shadow: getComputedStyle(face).boxShadow,
      },
      side: { x: sideBox.x, y: sideBox.y, width: sideBox.width, height: sideBox.height },
      base: {
        x: shell.x - axisX * rest,
        y: shell.y - axisY * rest,
        width: shell.width,
        height: shell.height,
      },
      rest,
      x: plane('::before'),
      y: plane('::after'),
    };
  });
  const shadowLayers =
    state.face.shadow === 'none'
      ? []
      : state.face.shadow.replace(/[a-z-]+\([^)]*\)/gi, 'color').split(',');
  expect(shadowLayers.filter((layer) => !/\binset\b/.test(layer))).toHaveLength(0);
  // The side slot covers the native box exactly and never takes input.
  for (const coordinate of ['x', 'y', 'width', 'height'] as const) {
    expect(state.side[coordinate]).toBeCloseTo(state.shell[coordinate], 2);
  }
  // At rest nothing overflows the native box; a lifted face is transformed paint.
  if (resting) expect(state.shell.scrollWidth).toBe(state.shell.clientWidth);
  if (fixedBase) expect(state.base).toEqual(fixedBase);

  const corners = (plane: typeof state.x) => {
    expect(plane.content).not.toBe('none');
    expect(plane.pointerEvents).toBe('none');
    const coordinates = plane.clip.match(/calc\([^)]*\)|[-+]?\d*\.?\d+(?:e[-+]?\d+)?(?:px|%)/gi);
    expect(coordinates).toHaveLength(8);
    return coordinates!.map((coordinate, index) => {
      const axis = index % 2 === 0 ? plane.width : plane.height;
      const origin = index % 2 === 0 ? plane.x : plane.y;
      return (
        origin +
        [...coordinate.matchAll(/([-+]?\s*\d*\.?\d+(?:e[-+]?\d+)?)\s*(px|%)/gi)].reduce(
          (sum, term) =>
            sum + parseFloat(term[1]!.replace(/\s/g, '')) * (term[2] === '%' ? axis / 100 : 1),
          0,
        )
      );
    });
  };
  const { face, base } = state;
  // Today's axis runs up and to the right, so the planes show on the left and bottom.
  const expected = {
    x: [face.x, face.y, face.x, face.y + face.height, base.x, base.y + base.height, base.x, base.y],
    y: [
      face.x,
      face.y + face.height,
      face.x + face.width,
      face.y + face.height,
      base.x + base.width,
      base.y + base.height,
      base.x,
      base.y + base.height,
    ],
  };
  for (const which of ['x', 'y'] as const) {
    for (const [index, coordinate] of corners(state[which]).entries()) {
      expect(coordinate, `${which} plane point ${index}`).toBeCloseTo(expected[which][index]!, 2);
    }
    // Two hard-stopped bands per plane (叠晕), never a blur.
    expect(state[which].gradient).toMatch(/^linear-gradient\(/);
  }
  return state.base;
}

for (const study of studies) {
  test(`${study.name}: Button keeps its reference geometry and a stable edge hit area`, async ({
    page,
  }) => {
    const specimen = await openButtonPage(page, study.realQuietInstrument, study.mode);

    for (const [index, { label, variant }] of variants.entries()) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
      const neighbor = specimen.getByRole('button', {
        name: variants[(index + 1) % variants.length]!.label,
        exact: true,
      });
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(specimen);

      const shellBefore = await bounds(button);
      const faceBefore = await bounds(buttonFace);
      const inkBefore = await inkBounds(button);
      const neighborBefore = await bounds(neighbor);
      const neighborFaceBefore = await bounds(face(neighbor));
      expect(shellBefore.height).toBeCloseTo(34, 2);
      expect(faceBefore.height).toBeCloseTo(34, 2);

      const typography = await buttonFace.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          fontFamily: css.fontFamily,
          fontSize: parseFloat(css.fontSize),
          fontWeight: css.fontWeight,
          lineHeight: parseFloat(css.lineHeight),
          paddingTop: parseFloat(css.paddingTop),
          paddingBottom: parseFloat(css.paddingBottom),
          paddingLeft: parseFloat(css.paddingLeft),
          paddingRight: parseFloat(css.paddingRight),
          borderRadius: css.borderRadius,
        };
      });
      expect(typography.fontFamily).toContain('Geist');
      expect(typography.fontSize).toBe(14);
      expect(typography.fontWeight).toBe('500');
      expect(typography.lineHeight).toBeCloseTo(18, 2);
      expect(typography.paddingTop).toBe(8);
      expect(typography.paddingBottom).toBe(8);
      expect(typography.paddingLeft).toBe(16);
      expect(typography.paddingRight).toBe(16);
      // One faceted leading corner (V4); the native box keeps square corners.
      expect(typography.borderRadius).toBe('0px 5px 0px 0px');
      const restBase = await expectContinuousSide(button);

      await observeClicks(button);
      // This point is inside the resting button but outside its displaced face.
      const edge = { x: shellBefore.x + 1, y: shellBefore.y + shellBefore.height - 1 };
      await page.mouse.move(edge.x, edge.y);
      await settle(specimen);

      const faceAfter = await bounds(buttonFace);
      expect(faceAfter.x - faceBefore.x).toBeCloseTo(2, 2);
      expect(faceAfter.y - faceBefore.y).toBeCloseTo(-2, 2);
      expectInkTravel(await inkBounds(button), inkBefore, 2, -2);
      expect(faceAfter.width).toBe(faceBefore.width);
      expect(faceAfter.height).toBe(faceBefore.height);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(neighbor)).toEqual(neighborBefore);
      expect(await bounds(face(neighbor))).toEqual(neighborFaceBefore);
      expect(await button.evaluate((element) => element.matches(':hover'))).toBe(true);
      // A quiet action shows its planes only once lifted; the others keep the resting base.
      const fixedBase = await expectContinuousSide(button, undefined, { resting: false });
      if (variant !== 'quiet') expect(fixedBase).toEqual(restBase);

      const hoverBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await page.mouse.down();
      await settle(specimen);
      const pressedFace = await bounds(buttonFace);
      expect(pressedFace.x - faceBefore.x).toBeCloseTo(-seat, 2);
      expect(pressedFace.y - faceBefore.y).toBeCloseTo(seat, 2);
      expectInkTravel(await inkBounds(button), inkBefore, -seat, seat);
      for (const coordinate of ['x', 'y', 'width', 'height'] as const) {
        expect(pressedFace[coordinate]).toBeCloseTo(fixedBase[coordinate], 2);
      }
      expect(await bounds(button)).toEqual(shellBefore);
      await expectContinuousSide(button, fixedBase);
      await expect(button).toHaveAttribute('data-elevation-activations', '0');
      await expect
        .poll(() => buttonFace.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(hoverBackground);

      await page.mouse.up();
      await expect(button).toHaveAttribute('data-elevation-activations', '1');
      await settle(specimen);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(buttonFace)).toEqual(faceAfter);
      expectInkTravel(await inkBounds(button), inkBefore, 2, -2);
      expect(await button.evaluate((element) => element.matches(':hover'))).toBe(true);
      await expectContinuousSide(button, fixedBase);
    }

    expect(await bounds(specimen.getByRole('button', { name: 'Small', exact: true }))).toEqual(
      expect.objectContaining({ height: 28 }),
    );
    expect(await bounds(specimen.getByRole('button', { name: 'Large', exact: true }))).toEqual(
      expect.objectContaining({ height: 40 }),
    );
  });

  test(`${study.name}: releasing a pointer press outside cancels the action and restores rest`, async ({
    page,
  }) => {
    const specimen = await openButtonPage(page, study.realQuietInstrument, study.mode);

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(specimen);
      const shellBefore = await bounds(button);
      const faceBefore = await bounds(buttonFace);
      const restBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await observeClicks(button);

      await button.hover();
      await page.mouse.down();
      await settle(specimen);
      const pressedFace = await bounds(buttonFace);
      expect(pressedFace.x - faceBefore.x).toBeCloseTo(-seat, 2);
      expect(pressedFace.y - faceBefore.y).toBeCloseTo(seat, 2);

      await page.mouse.move(shellBefore.x - 8, shellBefore.y + shellBefore.height + 8);
      await settle(specimen);
      expect(await button.evaluate((element) => element.matches(':hover'))).toBe(false);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(buttonFace)).toEqual(faceBefore);
      await expect(buttonFace).toHaveCSS('background-color', restBackground);
      await page.mouse.up();
      await expect(button).toHaveAttribute('data-elevation-activations', '0');
      expect(await bounds(buttonFace)).toEqual(faceBefore);
    }
  });

  test(`${study.name}: disabled Button faces stay still and cannot activate`, async ({ page }) => {
    const specimen = await openButtonPage(page, study.realQuietInstrument, study.mode);
    await expect(specimen.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      // Exercise native disabled styling for each existing variant without adding a docs specimen.
      await button.evaluate((element) => {
        (element as HTMLButtonElement).disabled = true;
      });
      await expect(button).toBeDisabled();
      await observeClicks(button);
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(specimen);
      const shellBefore = await bounds(button);
      const faceBefore = await bounds(face(button));

      await page.mouse.move(
        shellBefore.x + shellBefore.width / 2,
        shellBefore.y + shellBefore.height / 2,
      );
      await settle(specimen);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(face(button))).toEqual(faceBefore);

      await page.mouse.click(
        shellBefore.x + shellBefore.width / 2,
        shellBefore.y + shellBefore.height / 2,
      );
      await expect(button).toHaveAttribute('data-elevation-activations', '0');
      await expect(button).not.toBeFocused();
    }
  });

  test(`${study.name}: reduced motion removes elevation while hover feedback remains`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const specimen = await openButtonPage(page, study.realQuietInstrument, study.mode);

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(specimen);
      const shellBefore = await bounds(button);
      const faceBefore = await bounds(buttonFace);
      const restBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await observeClicks(button);

      await button.hover();
      await settle(specimen);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(buttonFace)).toEqual(faceBefore);
      expect(
        await button.evaluate((element) => {
          const css = getComputedStyle(element);
          return {
            offset: css.getPropertyValue('--zao-face-offset').trim(),
            transition: css.transitionProperty,
          };
        }),
      ).toEqual({ offset: '0px', transition: 'none' });
      await expect
        .poll(() => buttonFace.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(restBackground);

      const hoverBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await page.mouse.down();
      await settle(specimen);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(buttonFace)).toEqual(faceBefore);
      await expect
        .poll(() => buttonFace.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(hoverBackground);
      await page.mouse.up();
      await settle(specimen);
      await expect(button).toHaveAttribute('data-elevation-activations', '1');
      await expect(buttonFace).toHaveCSS('background-color', hoverBackground);
      expect(await bounds(buttonFace)).toEqual(faceBefore);

      await page.mouse.move(0, 0);
      await settle(specimen);
      await button.focus();
      await page.keyboard.down('Space');
      await settle(specimen);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(buttonFace)).toEqual(faceBefore);
      await expect
        .poll(() => buttonFace.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(restBackground);
      await page.keyboard.up('Space');
      await settle(specimen);
      await expect(button).toHaveAttribute('data-elevation-activations', '2');
      await expect(buttonFace).toHaveCSS('background-color', restBackground);
    }
  });

  test(`${study.name}: all Button variants retain keyboard activation and visible focus`, async ({
    page,
  }) => {
    const specimen = await openButtonPage(page, study.realQuietInstrument, study.mode);
    await page.keyboard.press('Tab');

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
      await button.scrollIntoViewIfNeeded();
      await settle(specimen);
      const shellBefore = await bounds(button);
      const faceBefore = await bounds(buttonFace);
      const restBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await observeClicks(button);
      await button.focus();
      await expect(button).toBeFocused();
      expect(await button.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
      await expectFocusBrackets(button);

      for (const [key, heldActivations, releasedActivations] of [
        ['Space', '0', '1'],
        ['Enter', '2', '2'],
      ] as const) {
        await page.keyboard.down(key);
        await settle(specimen);
        const pressedFace = await bounds(buttonFace);
        expect(pressedFace.x - faceBefore.x).toBeCloseTo(-seat, 2);
        expect(pressedFace.y - faceBefore.y).toBeCloseTo(seat, 2);
        expect(await bounds(button)).toEqual(shellBefore);
        await expect(button).toHaveAttribute('data-elevation-activations', heldActivations);
        await expect
          .poll(() => buttonFace.evaluate((element) => getComputedStyle(element).backgroundColor))
          .not.toBe(restBackground);
        await page.keyboard.up(key);
        await settle(specimen);
        await expect(button).toHaveAttribute('data-elevation-activations', releasedActivations);
        expect(await bounds(buttonFace)).toEqual(faceBefore);
      }

      // Leaving a held keyboard press clears its visual state and cancels Space activation.
      await page.keyboard.down('Space');
      await settle(specimen);
      await button.evaluate((element) => (element as HTMLButtonElement).blur());
      await settle(specimen);
      expect(await bounds(buttonFace)).toEqual(faceBefore);
      await expect(buttonFace).toHaveCSS('background-color', restBackground);
      await page.keyboard.up('Space');
      await expect(button).toHaveAttribute('data-elevation-activations', '2');
      await button.focus();
      expect(await bounds(button)).toEqual(shellBefore);
    }

    await page.keyboard.press('Tab');
    await expect(specimen.getByRole('button', { name: 'Small', exact: true })).toBeFocused();
  });

  test.describe(`${study.name}: touch`, () => {
    test.use({ hasTouch: true, isMobile: true });

    test('a held touch seats the face; release activates once and cancellation restores rest', async ({
      page,
    }) => {
      const specimen = await openButtonPage(page, study.realQuietInstrument, study.mode);
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
      const touch = await page.context().newCDPSession(page);

      try {
        for (const { label } of variants) {
          const button = specimen.getByRole('button', { name: label, exact: true });
          const buttonFace = face(button);
          await button.scrollIntoViewIfNeeded();
          await settle(specimen);
          const shellBefore = await bounds(button);
          const faceBefore = await bounds(buttonFace);
          const restBackground = await buttonFace.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          );
          await observeClicks(button);

          // A trusted touch sequence can be held across frames, unlike locator.tap().
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [
              {
                x: shellBefore.x + shellBefore.width / 2,
                y: shellBefore.y + shellBefore.height / 2,
              },
            ],
          });
          await expect
            .poll(async () => {
              const pressedFace = await bounds(buttonFace);
              return pressedFace.x - faceBefore.x;
            })
            .toBeCloseTo(-seat, 2);
          await settle(specimen);
          const pressedFace = await bounds(buttonFace);
          expect(pressedFace.x - faceBefore.x).toBeCloseTo(-seat, 2);
          expect(pressedFace.y - faceBefore.y).toBeCloseTo(seat, 2);
          expect(await bounds(button)).toEqual(shellBefore);
          await expect(button).toHaveAttribute('data-elevation-activations', '0');
          await expect
            .poll(() => buttonFace.evaluate((element) => getComputedStyle(element).backgroundColor))
            .not.toBe(restBackground);

          await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await expect(button).toHaveAttribute('data-elevation-activations', '1');
          await settle(specimen);
          expect(await bounds(button)).toEqual(shellBefore);
          await expect.poll(() => bounds(buttonFace)).toEqual(faceBefore);
          await expect(buttonFace).toHaveCSS('background-color', restBackground);

          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [
              {
                x: shellBefore.x + shellBefore.width / 2,
                y: shellBefore.y + shellBefore.height / 2,
              },
            ],
          });
          await expect
            .poll(async () => {
              const pressedFace = await bounds(buttonFace);
              return pressedFace.x - faceBefore.x;
            })
            .toBeCloseTo(-seat, 2);
          // A browser-owned gesture cancellation must clear the pose without another click.
          await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
          await settle(specimen);
          expect(await bounds(button)).toEqual(shellBefore);
          await expect.poll(() => bounds(buttonFace)).toEqual(faceBefore);
          await expect(buttonFace).toHaveCSS('background-color', restBackground);
          await expect(button).toHaveAttribute('data-elevation-activations', '1');
        }
      } finally {
        await touch.detach();
      }
    });
  });
}
