import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const studies = [
  { name: 'token fixture', realQuietInstrument: false },
  { name: 'real Quiet instrument', realQuietInstrument: true },
] as const;
const modes = ['light', 'dark'] as const;
const viewports = [
  { name: 'wide', width: 1280, height: 900 },
  { name: 'narrow', width: 360, height: 800 },
] as const;

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

async function bounds(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function openMenuPage(page: Page, realQuietInstrument: boolean, mode: 'light' | 'dark') {
  await page.goto(
    realQuietInstrument ? '/components/menu?style=quiet-instrument' : '/components/menu',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Menu' })).toBeVisible();
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
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const specimen = study.locator('[data-zao-specimen="menu"]').first();
  await specimen
    .getByRole('button', { name: 'Workspace actions', exact: true })
    .scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await settle(study);
  return specimen;
}

async function expectPaintedPopup(popup: Locator) {
  await expect(popup).toBeVisible();
  await expect(popup).toHaveCSS('opacity', '1');
  await settle(popup);
  await expect
    .poll(() =>
      popup.evaluate((node) =>
        parseFloat(getComputedStyle(node).getPropertyValue('--zao-menu-reveal-progress')),
      ),
    )
    .toBe(1);
}

async function openWithKeyboard(page: Page, trigger: Locator, popup: Locator) {
  await page.mouse.move(0, 0);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expectPaintedPopup(popup);
  await expect(
    popup.getByRole('menuitem', { name: 'Rename workspace', exact: true }),
  ).toBeFocused();
}

async function expectFitsViewport(page: Page, popup: Locator) {
  const box = await bounds(popup);
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.y).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
  const overflow = await popup.locator('[data-zao-slot="items"]').evaluate((node) => ({
    x: node.scrollWidth - node.clientWidth,
    y: node.scrollHeight - node.clientHeight,
  }));
  expect(overflow.x).toBeLessThanOrEqual(0);
  expect(overflow.y).toBeLessThanOrEqual(0);
  expect(await bounds(popup.locator('[data-zao-slot="reveal-edge"]'))).toEqual(box);
  for (const row of await popup.getByRole('menuitem').all()) {
    const rowBox = await bounds(row);
    expect(rowBox.x).toBeGreaterThanOrEqual(box.x - 0.5);
    expect(rowBox.y).toBeGreaterThanOrEqual(box.y - 0.5);
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    expect(rowBox.y + rowBox.height).toBeLessThanOrEqual(box.y + box.height + 0.5);
  }
}

async function rowBounds(rows: Locator) {
  return rows.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
}

async function scrollPosition(page: Page) {
  return page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
}

async function clickCenter(page: Page, element: Locator) {
  const box = await bounds(element);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

type PocketProbe = HTMLElement & { pocketAnimation?: Animation };

async function armPocketTransition(root: Locator, phase: 'open' | 'close') {
  await root.evaluate((node, nextPhase) => {
    const probe = node as PocketProbe;
    delete probe.pocketAnimation;
    delete probe.dataset.pocketCaptured;
    probe.dataset.pocketArmed = nextPhase;
    if (probe.dataset.pocketListener) return;
    probe.dataset.pocketListener = 'ready';
    probe.addEventListener('transitionrun', (event) => {
      if (!probe.dataset.pocketArmed || event.propertyName !== '--zao-menu-reveal-progress') {
        return;
      }
      const popup = event.target;
      if (!(popup instanceof HTMLElement) || popup.dataset.zaoSlot !== 'popup') return;
      const animation = popup
        .getAnimations()
        .find(
          (candidate) =>
            'transitionProperty' in candidate &&
            candidate.transitionProperty === '--zao-menu-reveal-progress',
        );
      if (!animation) return;
      animation.pause();
      probe.pocketAnimation = animation;
      probe.dataset.pocketCaptured = probe.dataset.pocketArmed;
      delete probe.dataset.pocketArmed;
    });
  }, phase);
}

function clipInsets(clipPath: string, width: number, height: number) {
  const values = clipPath.match(/calc\([^)]*\)|[-+]?\d*\.?\d+(?:e[-+]?\d+)?(?:px|%)/gi);
  if (!values?.length) throw new Error(`Expected an inset clip, received ${clipPath}`);
  const tokens = [
    values[0]!,
    values[1] ?? values[0]!,
    values[2] ?? values[0]!,
    values[3] ?? values[1] ?? values[0]!,
  ];
  return tokens.map((token, index) =>
    [...token.matchAll(/([-+]?\s*\d*\.?\d+(?:e[-+]?\d+)?)\s*(px|%)/gi)].reduce(
      (sum, term) =>
        sum +
        parseFloat(term[1]!.replace(/\s/g, '')) *
          (term[2] === '%' ? (index % 2 === 0 ? height : width) / 100 : 1),
      0,
    ),
  );
}

async function pocketState(popup: Locator) {
  const state = await popup.evaluate((node) => {
    const css = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      clipPath: css.clipPath,
      opacity: css.opacity,
      transform: css.transform,
      progress: parseFloat(css.getPropertyValue('--zao-menu-reveal-progress')),
      outset: parseFloat(css.getPropertyValue('--zao-space-1')),
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  });
  return { ...state, insets: clipInsets(state.clipPath, state.box.width, state.box.height) };
}

async function scrubPocket(
  root: Locator,
  popup: Locator,
  phase: 'open' | 'close',
  visibleFraction = 0.5,
) {
  await expect(root).toHaveAttribute('data-pocket-captured', phase);
  const timing = await root.evaluate(async (node, currentPhase) => {
    const animation = (node as PocketProbe).pocketAnimation!;
    await animation.ready;
    const duration = animation.effect!.getTiming().duration;
    if (typeof duration !== 'number' || duration <= 0) {
      throw new Error('Pocket reveal must expose a finite CSS transition.');
    }
    const popup = node.querySelector<HTMLElement>('[data-zao-slot="popup"]')!;
    const cssDuration = getComputedStyle(popup)
      .getPropertyValue(
        currentPhase === 'open' ? '--zao-motion-duration-base' : '--zao-motion-duration-fast',
      )
      .trim();
    return {
      duration,
      expected: parseFloat(cssDuration) * (cssDuration.endsWith('ms') ? 1 : 1000),
      transitionProperties: popup
        .getAnimations()
        .map((candidate) =>
          'transitionProperty' in candidate ? candidate.transitionProperty : 'other',
        ),
    };
  }, phase);
  expect(timing.duration).toBeCloseTo(timing.expected, 2);
  expect(timing.transitionProperties).toEqual(['--zao-menu-reveal-progress']);
  let low = 0;
  let high = 1;
  let state = await pocketState(popup);
  for (let step = 0; step < 12; step += 1) {
    const fraction = (low + high) / 2;
    await root.evaluate((node, time) => {
      (node as PocketProbe).pocketAnimation!.currentTime = time;
    }, timing.duration * fraction);
    state = await pocketState(popup);
    const visible = 1 - (state.insets[0]! + state.insets[2]!) / state.box.height;
    if (Math.abs(visible - visibleFraction) < 0.005) break;
    if (
      (phase === 'open' && visible < visibleFraction) ||
      (phase === 'close' && visible > visibleFraction)
    ) {
      low = fraction;
    } else {
      high = fraction;
    }
  }
  expect(1 - (state.insets[0]! + state.insets[2]!) / state.box.height).toBeCloseTo(
    visibleFraction,
    2,
  );
  return state;
}

async function finishPocket(root: Locator) {
  await root.evaluate(async (node) => {
    const animation = (node as PocketProbe).pocketAnimation!;
    animation.play();
    await animation.finished;
  });
}

async function expectFullPocket(popup: Locator) {
  const state = await pocketState(popup);
  expect(state.opacity).toBe('1');
  expect(state.transform).toBe('none');
  expect(state.outset).toBeGreaterThan(0);
  expect(state.progress).toBeCloseTo(1, 2);
  for (const inset of state.insets) expect(inset).toBeCloseTo(-state.outset, 2);
}

async function expectLeadingEdge(
  popup: Locator,
  side: 'bottom' | 'top',
  state: Awaited<ReturnType<typeof pocketState>>,
) {
  const edge = popup.locator('[data-zao-slot="reveal-edge"]');
  await expect(edge).toHaveAttribute('aria-hidden', 'true');
  await expect(edge).toHaveCSS('pointer-events', 'none');
  const carrier = await edge.evaluate((node) => {
    const css = getComputedStyle(node);
    const lip = getComputedStyle(node, '::after');
    const rect = node.getBoundingClientRect();
    return {
      y: rect.y,
      height: rect.height,
      translation: new DOMMatrixReadOnly(css.transform).m42,
      lipHeight: parseFloat(lip.height),
      lipFill: lip.backgroundColor,
    };
  });
  expect(carrier.lipHeight).toBeGreaterThan(0);
  expect(carrier.lipHeight).toBeLessThanOrEqual(state.outset);
  expect(carrier.lipFill).not.toBe('rgba(0, 0, 0, 0)');
  const direction = side === 'bottom' ? -1 : 1;
  expect(carrier.translation).toBeCloseTo(direction * (1 - state.progress) * carrier.height, 2);
  const lipPosition = side === 'bottom' ? carrier.y + carrier.height : carrier.y;
  const boundary =
    side === 'bottom'
      ? state.box.y + state.box.height - state.insets[2]!
      : state.box.y + state.insets[0]!;
  const gap = side === 'bottom' ? boundary - lipPosition : lipPosition - boundary;
  expect(gap).toBeGreaterThanOrEqual(-0.5);
  expect(gap).toBeLessThanOrEqual(state.outset + carrier.lipHeight);
}

async function savePocketScreenshot(page: Page, trigger: Locator, popup: Locator, name: string) {
  const directory = fileURLToPath(
    new URL('../../../explorations/snapshots/private/menu-pocket-20261006/', import.meta.url),
  );
  await mkdir(directory, { recursive: true });
  const anchor = await bounds(trigger);
  const panel = await bounds(popup);
  const viewport = page.viewportSize()!;
  const x = Math.max(0, Math.min(anchor.x, panel.x) - 16);
  const y = Math.max(0, Math.min(anchor.y, panel.y) - 16);
  await page.screenshot({
    path: `${directory}/${name}.png`,
    clip: {
      x,
      y,
      width:
        Math.min(viewport.width, Math.max(anchor.x + anchor.width, panel.x + panel.width) + 16) - x,
      height:
        Math.min(viewport.height, Math.max(anchor.y + anchor.height, panel.y + panel.height) + 16) -
        y,
    },
  });
}

for (const study of studies) {
  for (const mode of modes) {
    for (const viewport of viewports) {
      test(`${study.name}, ${mode}, ${viewport.name}: Menu keeps construction, navigation, and collision behavior coherent`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const specimen = await openMenuPage(page, study.realQuietInstrument, mode);
        const root = specimen.locator('[data-zao-component="menu"]');
        const trigger = root.getByRole('button', { name: 'Workspace actions', exact: true });
        const face = trigger.locator(':scope > [data-zao-slot="face"]');
        const indicator = trigger.locator('[data-zao-slot="menu-indicator"]');
        const popup = root.locator('[data-zao-slot="popup"]');
        const first = popup.getByRole('menuitem', { name: 'Rename workspace', exact: true });
        const copy = popup.getByRole('menuitem', { name: 'Copy workspace ID', exact: true });
        const disabled = popup.getByRole('menuitem', { name: 'Archive workspace', exact: true });

        expect(await trigger.evaluate((node) => node.tagName)).toBe('BUTTON');
        await expect(trigger).toHaveAttribute('type', 'button');
        await expect(trigger).toHaveAttribute('data-zao-component', 'button');
        await expect(trigger).toHaveAttribute('data-zao-variant', 'secondary');
        await expect(trigger.locator('button')).toHaveCount(0);
        await expect(root.locator('button')).toHaveCount(1);
        const shellBefore = await bounds(trigger);
        const faceBefore = await bounds(face);
        expect(shellBefore.height).toBeCloseTo(34, 2);
        expect(faceBefore.height).toBeCloseTo(34, 2);
        const { lineHeight, ...type } = await face.evaluate((node) => {
          const css = getComputedStyle(node);
          return {
            size: css.fontSize,
            weight: css.fontWeight,
            lineHeight: css.lineHeight,
            horizontalPadding: css.paddingLeft,
            verticalPadding: css.paddingTop,
          };
        });
        expect(parseFloat(lineHeight)).toBeCloseTo(18, 2);
        expect(type).toEqual({
          size: '14px',
          weight: '500',
          horizontalPadding: '16px',
          verticalPadding: '8px',
        });
        const closedFill = await face.evaluate((node) => getComputedStyle(node).backgroundColor);
        const closedIndicator = await indicator.evaluate(
          (node) => getComputedStyle(node).transform,
        );
        await trigger.evaluate((node) => {
          node.dataset.nativeClicks = '0';
          node.addEventListener('click', () => {
            node.dataset.nativeClicks = String(Number(node.dataset.nativeClicks) + 1);
          });
        });
        await root.evaluate((node) => {
          node.dataset.actionClicks = '0';
          node.addEventListener('click', (event) => {
            const item =
              event.target instanceof Element
                ? event.target.closest('[data-zao-slot="item"]')
                : null;
            if (item && !item.hasAttribute('data-disabled')) {
              node.dataset.actionClicks = String(Number(node.dataset.actionClicks) + 1);
            }
          });
        });

        await trigger.hover();
        await settle(root);
        expect(await bounds(trigger)).toEqual(shellBefore);
        const liftedFace = await bounds(face);
        expect(liftedFace.x - faceBefore.x).toBeCloseTo(2, 2);
        expect(liftedFace.y - faceBefore.y).toBeCloseTo(-2, 2);
        await page.mouse.click(shellBefore.x + 1, shellBefore.y + shellBefore.height - 1);
        await expect(trigger).toHaveAttribute('data-native-clicks', '1');
        await expectPaintedPopup(popup);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(await bounds(trigger)).toEqual(shellBefore);
        expect(await face.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
          closedFill,
        );
        expect(await indicator.evaluate((node) => getComputedStyle(node).transform)).not.toBe(
          closedIndicator,
        );
        await expectFitsViewport(page, popup);
        const rows = popup.getByRole('menuitem');
        await expect(rows).toHaveCount(3);
        await expect(popup.getByRole('separator')).toHaveCount(1);
        await expect(disabled).toBeDisabled();
        const rowsBefore = await rowBounds(rows);
        const copyFill = await copy.evaluate((node) => getComputedStyle(node).backgroundColor);
        await copy.hover();
        await expect(copy).toHaveAttribute('data-highlighted', '');
        expect(await copy.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
          copyFill,
        );
        expect(await copy.evaluate((node) => getComputedStyle(node, '::before').opacity)).toBe('1');
        await popup.press('Home');
        await expect(first).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(copy).toBeFocused();
        expect(await rowBounds(rows)).toEqual(rowsBefore);
        for (const row of await rows.all()) {
          await expect(row).toHaveCSS('transform', 'none');
          await expect(row).toHaveCSS('transition-duration', '0s');
        }
        await page.keyboard.press('Enter');
        await expect(root).toHaveAttribute('data-action-clicks', '1');
        await expect(specimen.getByText('Copied workspace ID.', { exact: true })).toBeVisible();
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();

        await openWithKeyboard(page, trigger, popup);
        await disabled.click({ force: true });
        await expectPaintedPopup(popup);
        await expect(root).toHaveAttribute('data-action-clicks', '1');
        await expect(specimen.getByText('Copied workspace ID.', { exact: true })).toBeVisible();
        expect(await disabled.evaluate((node) => getComputedStyle(node, '::before').opacity)).toBe(
          '0',
        );
        await page.keyboard.press('Escape');
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await openWithKeyboard(page, trigger, popup);
        await first.click();
        await expect(root).toHaveAttribute('data-action-clicks', '2');
        await expect(
          specimen.getByText('Rename workspace selected.', { exact: true }),
        ).toBeVisible();
        await expect(popup).toHaveCount(0);
        await openWithKeyboard(page, trigger, popup);
        const outside = page
          .getByRole('radiogroup', { name: 'Mode' })
          .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true });
        await outside.click();
        await expect(popup).toHaveCount(0);
        await expect(outside).toBeFocused();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(root).toHaveAttribute('data-action-clicks', '2');

        // Move only this specimen anchor to exercise Base UI's real viewport collision handling.
        await root.evaluate((node) => {
          node.style.position = 'fixed';
          node.style.left = '16px';
          node.style.bottom = '8px';
          node.style.zIndex = '50';
        });
        await openWithKeyboard(page, trigger, popup);
        await expect(popup).toHaveAttribute('data-side', 'top');
        await expectFitsViewport(page, popup);
        const flipped = await bounds(popup);
        const fixedTrigger = await bounds(trigger);
        expect(flipped.y + flipped.height).toBeLessThanOrEqual(fixedTrigger.y + 0.5);
        await page.keyboard.press('Escape');
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openWithKeyboard(page, trigger, popup);
        await expect(popup).toHaveCSS('transform', 'none');
        await expect(popup).toHaveCSS('transition-property', 'none');
        const reducedShell = await bounds(trigger);
        await trigger.hover();
        await expect(face).toHaveCSS('transform', 'none');
        expect(await bounds(trigger)).toEqual(reducedShell);
        await page.keyboard.press('Escape');
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();
      });
    }
  }
}

for (const mode of modes) {
  test(`real Quiet instrument, ${mode}: Pocket reveal clips a fixed plane from the actual anchor edge`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const specimen = await openMenuPage(page, true, mode);
    const root = specimen.locator('[data-zao-component="menu"]');
    const trigger = root.getByRole('button', { name: 'Workspace actions', exact: true });
    const popup = root.locator('[data-zao-slot="popup"]');
    const rows = popup.locator('[data-zao-slot="item"]');

    for (const side of ['bottom', 'top'] as const) {
      if (side === 'top') {
        await root.evaluate((node) => {
          node.style.position = 'fixed';
          node.style.left = '16px';
          node.style.bottom = '8px';
          node.style.zIndex = '50';
        });
      }
      const fixedScroll = await scrollPosition(page);
      const fixedTrigger = await bounds(trigger);
      await armPocketTransition(root, 'open');
      await clickCenter(page, trigger);
      const opening = await scrubPocket(root, popup, 'open');
      await expect(popup).toHaveAttribute('data-side', side);
      expect(opening.opacity).toBe('1');
      expect(opening.transform).toBe('none');
      expect(await scrollPosition(page)).toEqual(fixedScroll);
      expect(await bounds(trigger)).toEqual(fixedTrigger);
      await expectLeadingEdge(popup, side, opening);
      const fixedRows = await rowBounds(rows);
      const anchorIndex = side === 'bottom' ? 0 : 2;
      const farIndex = side === 'bottom' ? 2 : 0;
      expect(opening.insets[anchorIndex]).toBeLessThanOrEqual(0);
      expect(opening.insets[farIndex]).toBeGreaterThan(opening.box.height / 4);
      expect(opening.insets[1]).toBeCloseTo(-opening.outset, 2);
      expect(opening.insets[3]).toBeCloseTo(-opening.outset, 2);
      const hitMask = await popup.evaluate((node, direction) => {
        const rect = node.getBoundingClientRect();
        const x = rect.x + rect.width / 2;
        const contains = (y: number) => {
          const target = document.elementFromPoint(x, y);
          return target === node || (target !== null && node.contains(target));
        };
        return {
          near: contains(direction === 'bottom' ? rect.y + 4 : rect.y + rect.height - 4),
          far: contains(direction === 'bottom' ? rect.y + rect.height - 4 : rect.y + 4),
        };
      }, side);
      expect(hitMask).toEqual({ near: true, far: false });
      if (mode === 'dark' && side === 'bottom') {
        await scrubPocket(root, popup, 'open', 0.7);
        await savePocketScreenshot(page, trigger, popup, 'dark-opening-70-percent');
      }
      await finishPocket(root);
      await expectFullPocket(popup);
      expect((await pocketState(popup)).box).toEqual(opening.box);
      expect(await rowBounds(rows)).toEqual(fixedRows);
      expect(await scrollPosition(page)).toEqual(fixedScroll);
      expect(await bounds(trigger)).toEqual(fixedTrigger);
      await expectLeadingEdge(popup, side, await pocketState(popup));
      if (mode === 'dark' && side === 'bottom') {
        await savePocketScreenshot(page, trigger, popup, 'dark-open');
      }

      await armPocketTransition(root, 'close');
      await clickCenter(page, trigger);
      const closing = await scrubPocket(root, popup, 'close');
      expect(closing.opacity).toBe('1');
      expect(closing.transform).toBe('none');
      expect(closing.box).toEqual(opening.box);
      expect(await rowBounds(rows)).toEqual(fixedRows);
      expect(await scrollPosition(page)).toEqual(fixedScroll);
      expect(await bounds(trigger)).toEqual(fixedTrigger);
      await expectLeadingEdge(popup, side, closing);
      expect(closing.insets[anchorIndex]).toBeLessThanOrEqual(0);
      expect(closing.insets[farIndex]).toBeGreaterThan(closing.box.height / 4);
      await finishPocket(root);
      await expect(popup).toHaveCount(0);
      expect(await scrollPosition(page)).toEqual(fixedScroll);
      expect(await bounds(trigger)).toEqual(fixedTrigger);
    }

    if (mode === 'light') {
      await page.setViewportSize({ width: 1280, height: 100 });
      await settle(root);
      const constrainedScroll = await scrollPosition(page);
      await openWithKeyboard(page, trigger, popup);
      const items = popup.locator('[data-zao-slot="items"]');
      const edge = popup.locator('[data-zao-slot="reveal-edge"]');
      const first = popup.getByRole('menuitem', { name: 'Rename workspace', exact: true });
      const disabled = popup.getByRole('menuitem', { name: 'Archive workspace', exact: true });
      expect(await items.evaluate((node) => node.scrollHeight - node.clientHeight)).toBeGreaterThan(
        0,
      );
      const frameBefore = await bounds(popup);
      const edgeBefore = await bounds(edge);
      expect(frameBefore.x).toBeGreaterThanOrEqual(-0.5);
      expect(frameBefore.y).toBeGreaterThanOrEqual(-0.5);
      expect(frameBefore.x + frameBefore.width).toBeLessThanOrEqual(1280.5);
      expect(frameBefore.y + frameBefore.height).toBeLessThanOrEqual(100.5);
      expect(edgeBefore).toEqual(frameBefore);
      expect(
        await items.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(0);
      await page.keyboard.press('Home');
      await expect(first).toBeFocused();
      await page.keyboard.press('End');
      await expect(disabled).toBeFocused();
      await expect(disabled).toBeDisabled();
      await expect.poll(() => items.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
      expect(await bounds(popup)).toEqual(frameBefore);
      expect(await bounds(edge)).toEqual(edgeBefore);
      expect(await scrollPosition(page)).toEqual(constrainedScroll);
      const visibleItems = await bounds(items);
      const selected = await bounds(disabled);
      expect(selected.y).toBeGreaterThanOrEqual(visibleItems.y - 0.5);
      expect(selected.y + selected.height).toBeLessThanOrEqual(
        visibleItems.y + visibleItems.height + 0.5,
      );
      await page.keyboard.press('Enter');
      await expectPaintedPopup(popup);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        specimen.getByText('Choose an action to see its result.', { exact: true }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(await scrollPosition(page)).toEqual(constrainedScroll);
      await page.setViewportSize({ width: 1280, height: 900 });
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await clickCenter(page, trigger);
    await expectPaintedPopup(popup);
    await expectFullPocket(popup);
    await expect(popup).toHaveCSS('transition-property', 'none');
    expect(await popup.evaluate((node) => node.getAnimations().length)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test('real Quiet instrument, dark: native selection closes without moving scroll or the last highlighted row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const specimen = await openMenuPage(page, true, 'dark');
  const root = specimen.locator('[data-zao-component="menu"]');
  const trigger = root.getByRole('button', { name: 'Workspace actions', exact: true });
  const popup = root.locator('[data-zao-slot="popup"]');
  const rows = popup.locator('[data-zao-slot="item"]');
  const first = popup.getByRole('menuitem', { name: 'Rename workspace', exact: true });
  const copy = popup.getByRole('menuitem', { name: 'Copy workspace ID', exact: true });
  await root.evaluate((node) => {
    node.dataset.nativeSelections = '0';
    node.addEventListener('click', (event) => {
      const item =
        event.target instanceof Element ? event.target.closest('[data-zao-slot="item"]') : null;
      if (event.isTrusted && item && !item.hasAttribute('data-disabled')) {
        node.dataset.nativeSelections = String(Number(node.dataset.nativeSelections) + 1);
      }
    });
  });
  const fixedScroll = await scrollPosition(page);
  const fixedTrigger = await bounds(trigger);
  await clickCenter(page, trigger);
  await expectPaintedPopup(popup);
  await expectFullPocket(popup);
  expect(await scrollPosition(page)).toEqual(fixedScroll);
  expect(await bounds(trigger)).toEqual(fixedTrigger);

  const copyBox = await bounds(copy);
  await page.mouse.move(copyBox.x + copyBox.width / 2, copyBox.y + copyBox.height / 2);
  await expect(copy).toHaveAttribute('data-highlighted', '');
  await expect(copy).toBeFocused();
  const selectedPaint = await copy.evaluate((node) => ({
    fill: getComputedStyle(node).backgroundColor,
    indicator: getComputedStyle(node, '::before').opacity,
  }));
  const firstPaint = await first.evaluate((node) => ({
    fill: getComputedStyle(node).backgroundColor,
    indicator: getComputedStyle(node, '::before').opacity,
  }));
  expect(selectedPaint.indicator).toBe('1');
  expect(firstPaint.indicator).toBe('0');
  expect(selectedPaint.fill).not.toBe(firstPaint.fill);
  const fixedFrame = (await pocketState(popup)).box;
  const fixedRows = await rowBounds(rows);
  expect(await scrollPosition(page)).toEqual(fixedScroll);

  await armPocketTransition(root, 'close');
  await clickCenter(page, copy);
  const closing = await scrubPocket(root, popup, 'close');
  await expect(root).toHaveAttribute('data-native-selections', '1');
  await expect(specimen.getByText('Copied workspace ID.', { exact: true })).toBeVisible();
  expect(closing.opacity).toBe('1');
  expect(closing.transform).toBe('none');
  expect(closing.box).toEqual(fixedFrame);
  expect(await rowBounds(rows)).toEqual(fixedRows);
  expect(await bounds(trigger)).toEqual(fixedTrigger);
  expect(await scrollPosition(page)).toEqual(fixedScroll);
  await expect(copy).toHaveAttribute('data-zao-exit-highlighted', '');
  await expect(popup.locator('[data-zao-exit-highlighted]')).toHaveCount(1);
  expect(
    await copy.evaluate((node) => ({
      fill: getComputedStyle(node).backgroundColor,
      indicator: getComputedStyle(node, '::before').opacity,
    })),
  ).toEqual(selectedPaint);
  expect(
    await first.evaluate((node) => ({
      fill: getComputedStyle(node).backgroundColor,
      indicator: getComputedStyle(node, '::before').opacity,
    })),
  ).toEqual(firstPaint);
  await expectLeadingEdge(popup, 'bottom', closing);
  await finishPocket(root);
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(root).toHaveAttribute('data-native-selections', '1');
  expect(await bounds(trigger)).toEqual(fixedTrigger);
  expect(await scrollPosition(page)).toEqual(fixedScroll);
});
