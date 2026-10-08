import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const variants = [
  { variant: 'primary', label: 'Save changes' },
  { variant: 'secondary', label: 'Review details' },
  { variant: 'quiet', label: 'Cancel' },
] as const;

const studies = [
  { name: 'ZAO baseline', realQuietInstrument: false },
  { name: 'real Quiet instrument', realQuietInstrument: true },
] as const;

async function openButtonPage(page: Page, realQuietInstrument: boolean) {
  await page.goto(
    realQuietInstrument ? '/components/button?style=quiet-instrument' : '/components/button',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
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
  await page.mouse.move(0, 0);
  const specimen = page.locator('[data-zao-specimen="button"]').first();
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

async function expectContinuousSide(
  button: Locator,
  fixedBase?: { x: number; y: number; width: number; height: number },
) {
  const state = await button.evaluate((element) => {
    const shell = element.getBoundingClientRect();
    const face = element.querySelector<HTMLElement>(':scope > [data-zao-slot="face"]')!;
    const faceBox = face.getBoundingClientRect();
    const base = getComputedStyle(element, '::before');
    const side = getComputedStyle(element, '::after');
    const baseOffset = new DOMMatrixReadOnly(base.transform);
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
      base: {
        x: shell.x + parseFloat(base.left) + baseOffset.m41,
        y: shell.y + parseFloat(base.top) + baseOffset.m42,
        width: parseFloat(base.width),
        height: parseFloat(base.height),
      },
      side: {
        x: shell.x + parseFloat(side.left),
        y: shell.y + parseFloat(side.top),
        width: parseFloat(side.width),
        height: parseFloat(side.height),
        clip: side.clipPath,
        content: side.content,
        pointerEvents: side.pointerEvents,
        shadow: side.boxShadow,
      },
    };
  });
  const shadowLayers =
    state.face.shadow === 'none'
      ? []
      : state.face.shadow.replace(/[a-z-]+\([^)]*\)/gi, 'color').split(',');
  expect(shadowLayers.filter((layer) => !/\binset\b/.test(layer))).toHaveLength(0);
  const sideLayers = state.side.shadow.replace(/[a-z-]+\([^)]*\)/gi, 'color').split(',');
  expect(sideLayers).toHaveLength(1);
  expect(sideLayers[0]).not.toContain('inset');
  const sideShadow = sideLayers[0]!.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?px/gi)!.map(parseFloat);
  expect(sideShadow).toHaveLength(4);
  expect(sideShadow.slice(0, 3)).toEqual([0, 0, 0]);
  const paintSpread = sideShadow[3]!;
  expect(paintSpread).toBeGreaterThan(0);
  expect(state.side.pointerEvents).toBe('none');
  expect(state.side.content).not.toBe('none');
  for (const coordinate of ['x', 'y', 'width', 'height'] as const) {
    expect(state.side[coordinate]).toBeCloseTo(state.shell[coordinate], 2);
  }
  if (!fixedBase) expect(state.shell.scrollWidth).toBe(state.shell.clientWidth);
  if (fixedBase) expect(state.base).toEqual(fixedBase);

  const coordinates = state.side.clip.match(/calc\([^)]*\)|[-+]?\d*\.?\d+(?:e[-+]?\d+)?(?:px|%)/gi);
  expect(coordinates).toHaveLength(12);
  const points = coordinates!.map((coordinate, index) => {
    const axis = index % 2 === 0 ? state.side.width : state.side.height;
    const origin = index % 2 === 0 ? state.side.x : state.side.y;
    return (
      origin +
      [...coordinate.matchAll(/([-+]?\s*\d*\.?\d+(?:e[-+]?\d+)?)\s*(px|%)/gi)].reduce(
        (sum, term) =>
          sum + parseFloat(term[1]!.replace(/\s/g, '')) * (term[2] === '%' ? axis / 100 : 1),
        0,
      )
    );
  });
  // Measure the front against the rendered face and the rear against the actual fixed base.
  const expected = [
    state.face.x,
    state.face.y,
    state.face.x + state.face.width,
    state.face.y,
    state.face.x + state.face.width,
    state.face.y + state.face.height,
    state.base.x + state.base.width,
    state.base.y + state.base.height,
    state.base.x,
    state.base.y + state.base.height,
    state.base.x,
    state.base.y,
  ];
  for (const [index, coordinate] of points.entries()) {
    expect(coordinate).toBeCloseTo(expected[index]!, 2);
    const origin = index % 2 === 0 ? state.side.x : state.side.y;
    const size = index % 2 === 0 ? state.side.width : state.side.height;
    const extension = Math.max(origin - coordinate, coordinate - origin - size, 0);
    expect(extension).toBeLessThanOrEqual(paintSpread + 0.005);
  }
  return state.base;
}

for (const study of studies) {
  test(`${study.name}: Button keeps its reference geometry and a stable edge hit area`, async ({
    page,
  }) => {
    const specimen = await openButtonPage(page, study.realQuietInstrument);

    for (const [index, { label }] of variants.entries()) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
      const neighbor = specimen.getByRole('button', {
        name: variants[(index + 1) % variants.length]!.label,
        exact: true,
      });
      await page.mouse.move(0, 0);
      await settle(specimen);

      const shellBefore = await bounds(button);
      const faceBefore = await bounds(buttonFace);
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
      expect(typography.borderRadius).toBe('0px');
      const fixedBase = await expectContinuousSide(button);

      await observeClicks(button);
      // This point is inside the resting button but outside its displaced face.
      const edge = { x: shellBefore.x + 1, y: shellBefore.y + shellBefore.height - 1 };
      await page.mouse.move(edge.x, edge.y);
      await settle(specimen);

      const faceAfter = await bounds(buttonFace);
      expect(faceAfter.x - faceBefore.x).toBeCloseTo(2, 2);
      expect(faceAfter.y - faceBefore.y).toBeCloseTo(-2, 2);
      expect(faceAfter.width).toBe(faceBefore.width);
      expect(faceAfter.height).toBe(faceBefore.height);
      expect(await bounds(button)).toEqual(shellBefore);
      expect(await bounds(neighbor)).toEqual(neighborBefore);
      expect(await bounds(face(neighbor))).toEqual(neighborFaceBefore);
      expect(await button.evaluate((element) => element.matches(':hover'))).toBe(true);
      await expectContinuousSide(button, fixedBase);

      const hoverBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await page.mouse.down();
      await settle(specimen);
      const pressedFace = await bounds(buttonFace);
      expect(pressedFace.x - faceBefore.x).toBeCloseTo(-1, 2);
      expect(pressedFace.y - faceBefore.y).toBeCloseTo(1, 2);
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
    const specimen = await openButtonPage(page, study.realQuietInstrument);

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
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
      expect(pressedFace.x - faceBefore.x).toBeCloseTo(-1, 2);
      expect(pressedFace.y - faceBefore.y).toBeCloseTo(1, 2);

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
    const specimen = await openButtonPage(page, study.realQuietInstrument);
    await expect(specimen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      // Exercise native disabled styling for each existing variant without adding a docs specimen.
      await button.evaluate((element) => {
        (element as HTMLButtonElement).disabled = true;
      });
      await expect(button).toBeDisabled();
      await observeClicks(button);
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
    const specimen = await openButtonPage(page, study.realQuietInstrument);

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
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
          const side = getComputedStyle(element, '::after');
          return { display: side.display, transition: side.transitionProperty };
        }),
      ).toEqual({ display: 'none', transition: 'none' });
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
    const specimen = await openButtonPage(page, study.realQuietInstrument);
    await page.keyboard.press('Tab');

    for (const { label } of variants) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      const buttonFace = face(button);
      const shellBefore = await bounds(button);
      const faceBefore = await bounds(buttonFace);
      const restBackground = await buttonFace.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await observeClicks(button);
      await button.focus();
      await expect(button).toBeFocused();
      expect(await button.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
      const outline = await button.evaluate((element) => {
        const css = getComputedStyle(element);
        return { style: css.outlineStyle, width: parseFloat(css.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThan(0);

      for (const [key, heldActivations, releasedActivations] of [
        ['Space', '0', '1'],
        ['Enter', '2', '2'],
      ] as const) {
        await page.keyboard.down(key);
        await settle(specimen);
        const pressedFace = await bounds(buttonFace);
        expect(pressedFace.x - faceBefore.x).toBeCloseTo(-1, 2);
        expect(pressedFace.y - faceBefore.y).toBeCloseTo(1, 2);
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
      const specimen = await openButtonPage(page, study.realQuietInstrument);
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
      const touch = await page.context().newCDPSession(page);

      try {
        for (const { label } of variants) {
          const button = specimen.getByRole('button', { name: label, exact: true });
          const buttonFace = face(button);
          await button.scrollIntoViewIfNeeded();
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
            .toBeCloseTo(-1, 2);
          await settle(specimen);
          const pressedFace = await bounds(buttonFace);
          expect(pressedFace.x - faceBefore.x).toBeCloseTo(-1, 2);
          expect(pressedFace.y - faceBefore.y).toBeCloseTo(1, 2);
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
            .toBeCloseTo(-1, 2);
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
