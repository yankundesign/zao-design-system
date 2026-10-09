import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const components = ['menu', 'select', 'combobox'] as const;
const modes = ['light', 'dark'] as const;
type Component = (typeof components)[number];
type Mode = (typeof modes)[number];
const highlightedNames = {
  menu: 'Copy workspace ID',
  select: 'Central',
  combobox: 'East workspace',
};
const selectedNames = { select: 'West', combobox: 'North workspace' };

async function openStudy(page: Page, component: Component, mode: Mode, real = true) {
  const css = real
    ? await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      )
    : '';
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
  await page.goto(`/components/${component}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', {
      name: mode === 'light' ? 'Light' : 'Dark',
      exact: true,
    })
    .click();
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  await expect(study).toHaveAttribute('data-study', 'quiet-instrument');
  const fieldRole = expect.poll(() =>
    study.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--zao-color-border-field').trim(),
    ),
  );
  if (real) await fieldRole.not.toBe('');
  else await fieldRole.toBe('');
  await page.evaluate(() => document.fonts.ready);
  const specimen = study.locator(`[data-zao-specimen="${component}"]`).first();
  const root = specimen.locator(`[data-zao-component="${component}"]`).first();
  const trigger = root.locator(
    `[data-zao-slot="${component === 'combobox' ? 'input' : 'trigger'}"]`,
  );
  const frame = component === 'combobox' ? root.locator('[data-zao-slot="input-group"]') : trigger;
  const popup = root.locator('[data-zao-slot="popup"]');
  const item = popup.getByRole(component === 'menu' ? 'menuitem' : 'option', {
    name: highlightedNames[component],
    exact: true,
  });
  await frame.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  return { study, specimen, root, trigger, frame, popup, item };
}
type Handles = Awaited<ReturnType<typeof openStudy>>;

async function settle(popup: Locator) {
  await expect(popup).not.toHaveAttribute('data-starting-style', '');
  await popup.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function open(page: Page, component: Component, handles: Handles, keyboard = false) {
  await page.mouse.move(0, 0);
  if (keyboard) {
    await handles.trigger.focus();
    await expect(handles.trigger).toBeFocused();
    await page.keyboard.press(component === 'menu' ? 'Enter' : 'ArrowDown');
  } else {
    await handles.root.locator('[data-zao-slot="trigger"]').click();
  }
  await expect(handles.popup).toBeVisible();
  await settle(handles.popup);
  if (keyboard) {
    for (
      let step = 0;
      step < 8 && !((await handles.item.getAttribute('data-highlighted')) === '');
      step += 1
    ) {
      await page.keyboard.press('ArrowDown');
    }
  } else await handles.item.hover();
  await expect(handles.item).toHaveAttribute('data-highlighted', '');
  await settle(handles.popup);
}

async function escape(page: Page, handles: Pick<Handles, 'trigger' | 'popup'>) {
  await page.keyboard.press('Escape');
  await expect(handles.popup).not.toBeVisible();
  await expect(handles.trigger).toBeFocused();
}

async function box(element: Locator) {
  const bounds = await element.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
}

async function rowBoxes(popup: Locator) {
  return popup.locator('[data-zao-slot="item"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const bounds = node.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    }),
  );
}

async function expectNoMark(popup: Locator, radius = '0px') {
  for (const row of await popup.locator('[data-zao-slot="item"]').all()) {
    await expect(row).toHaveClass(/menu-item-construction/);
    await expect(row).toHaveClass(/rounded-none/);
    await expect(row).toHaveCSS('border-radius', radius);
    expect(await row.evaluate((node) => getComputedStyle(node, '::before').content)).toBe('none');
    await expect(row).toHaveCSS('transform', 'none');
  }
}

async function paint(item: Locator) {
  return item.evaluate((node) => {
    const css = getComputedStyle(node);
    const popup = node.closest('[data-zao-slot="popup"]')!;
    const frame = getComputedStyle(popup);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const pixel = (...colors: string[]) => {
      context.clearRect(0, 0, 1, 1);
      for (const color of colors) {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
      }
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const resolve = (value: string, property: 'backgroundColor' | 'color') => {
      const sample = document.createElement('span');
      sample.style.cssText =
        'position:fixed;visibility:hidden;width:0;height:0;pointer-events:none;forced-color-adjust:none';
      sample.style[property] = value;
      node.append(sample);
      const color = getComputedStyle(sample)[property];
      sample.remove();
      return color;
    };
    const mark = getComputedStyle(node, '::before');
    return {
      fill: css.backgroundColor,
      hover: resolve('var(--zao-color-bg-hover)', 'backgroundColor'),
      highlight: resolve('Highlight', 'backgroundColor'),
      highlightText: resolve('HighlightText', 'color'),
      text: css.color,
      fillPixel: pixel(frame.backgroundColor, css.backgroundColor),
      popupPixel: pixel(frame.backgroundColor),
      textPixel: pixel(frame.backgroundColor, css.backgroundColor, css.color),
      mark: mark.content,
      outline: { style: css.outlineStyle, width: css.outlineWidth, offset: css.outlineOffset },
      focusVisible: node.matches(':focus-visible'),
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

async function expectSelected(handles: Handles, component: Component, label?: string) {
  if (component === 'menu') {
    await expect(handles.popup.locator('[data-zao-slot="item-indicator"]')).toHaveCount(0);
    return;
  }
  const selected = handles.popup.getByRole('option', {
    name: label ?? selectedNames[component],
    exact: true,
  });
  await expect(selected).toHaveAttribute('data-selected', '');
  await expect(selected.locator('[data-zao-slot="item-indicator"]')).toBeVisible();
  await expect(handles.popup.locator('[data-zao-slot="item-indicator"]')).toHaveCount(1);
  if (!label) await expect(handles.item.locator('[data-zao-slot="item-indicator"]')).toHaveCount(0);
}

async function expectKeyboardFocus(handles: Handles, component: Component, real = true) {
  if (component === 'combobox') {
    await expect(handles.trigger).toBeFocused();
    const targetId = await handles.item.getAttribute('id');
    expect(targetId).not.toBeNull();
    await expect(handles.trigger).toHaveAttribute('aria-activedescendant', targetId!);
    expect(await handles.item.evaluate((node) => node.matches(':focus-visible'))).toBe(false);
    const outline = real ? handles.frame : handles.trigger;
    await expect(outline).toHaveCSS('outline-style', 'solid');
    await expect(outline).toHaveCSS('outline-width', '2px');
    await expect(outline).toHaveCSS('outline-offset', '2px');
  } else {
    await expect(handles.item).toBeFocused();
    expect((await paint(handles.item)).focusVisible).toBe(true);
    await expect(handles.item).toHaveCSS('outline-style', 'solid');
    await expect(handles.item).toHaveCSS('outline-width', '2px');
    await expect(handles.item).toHaveCSS('outline-offset', '2px');
  }
}

type ClosingProbe = HTMLElement & { itemAnimation?: Animation };
async function armClosing(root: Locator) {
  await root.evaluate((node) => {
    const probe = node as ClosingProbe;
    probe.dataset.itemClosingArmed = 'true';
    probe.addEventListener('transitionrun', (event) => {
      const popup = event.target;
      if (
        probe.dataset.itemClosingArmed !== 'true' ||
        event.propertyName !== '--zao-menu-reveal-progress' ||
        !(popup instanceof HTMLElement) ||
        popup.dataset.zaoSlot !== 'popup' ||
        !popup.hasAttribute('data-ending-style')
      )
        return;
      const animation = popup
        .getAnimations()
        .find(
          (candidate) =>
            'transitionProperty' in candidate &&
            candidate.transitionProperty === '--zao-menu-reveal-progress',
        );
      if (!animation) return;
      animation.pause();
      probe.itemAnimation = animation;
      probe.dataset.itemClosing = 'paused';
      delete probe.dataset.itemClosingArmed;
    });
  });
}

async function scrubClosing(root: Locator) {
  await expect(root).toHaveAttribute('data-item-closing', 'paused');
  return root.evaluate(async (node) => {
    const animation = (node as ClosingProbe).itemAnimation!;
    await animation.ready;
    const duration = Number(animation.effect!.getTiming().duration);
    animation.currentTime = duration / 2;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const popup = node.querySelector('[data-zao-slot="popup"]')!;
    const css = getComputedStyle(popup);
    const fast = css.getPropertyValue('--zao-motion-duration-fast').trim();
    return {
      duration,
      expected: parseFloat(fast) * (fast.endsWith('ms') ? 1 : 1000),
      progress: Number(css.getPropertyValue('--zao-menu-reveal-progress')),
      transform: css.transform,
    };
  });
}

for (const mode of modes)
  for (const component of components) {
    test(`Quiet ${mode}: ${component} shares a stationary fill cue, native focus, and saved closing emphasis`, async ({
      page,
    }) => {
      const handles = await openStudy(page, component, mode);
      const nativeFrame = await box(handles.frame);
      await open(page, component, handles);
      const rows = await rowBoxes(handles.popup);
      const popupBox = await box(handles.popup);
      const pointer = await paint(handles.item);
      expect(pointer.fill).toBe(pointer.hover);
      expect(pointer.mark).toBe('none');
      expect(pointer.focusVisible).toBe(false);
      expect(await box(handles.frame)).toEqual(nativeFrame);
      await expectNoMark(handles.popup);
      await expectSelected(handles, component);
      for (const row of rows) {
        expect(row.width).toBeGreaterThanOrEqual(24);
        expect(row.height).toBeGreaterThanOrEqual(24);
      }
      const other = handles.popup.locator('[data-zao-slot="item"]').first();
      await other.hover();
      await expect(other).toHaveAttribute('data-highlighted', '');
      await handles.item.hover();
      await expect(handles.item).toHaveAttribute('data-highlighted', '');
      expect(await rowBoxes(handles.popup)).toEqual(rows);
      expect(await box(handles.popup)).toEqual(popupBox);
      await armClosing(handles.root);
      // Base UI may dismiss Menu Escape instantly; native action selection retains the reveal.
      if (component === 'menu') await handles.item.click();
      else await page.keyboard.press('Escape');
      const closing = await scrubClosing(handles.root);
      expect(closing.duration).toBe(closing.expected);
      expect(closing.progress).toBeGreaterThan(0);
      expect(closing.progress).toBeLessThan(1);
      expect(closing.transform).toBe('none');
      await expect(handles.item).toHaveAttribute('data-zao-exit-highlighted', '');
      expect((await paint(handles.item)).fill).toBe(pointer.fill);
      await expectNoMark(handles.popup);
      expect(await rowBoxes(handles.popup)).toEqual(rows);
      expect(await box(handles.popup)).toEqual(popupBox);
      await handles.root.evaluate((node) => (node as ClosingProbe).itemAnimation!.finish());
      await expect(handles.popup).not.toBeVisible();
      await expect(handles.trigger).toBeFocused();
      await open(page, component, handles, true);
      await expectKeyboardFocus(handles, component);
      await expectNoMark(handles.popup);
      const keyboard = await paint(handles.item);
      expect(keyboard.fill).toBe(pointer.fill);
      expect(keyboard.mark).toBe('none');
      expect(await rowBoxes(handles.popup)).toEqual(rows);
      await expectSelected(handles, component);
      await escape(page, handles);
    });

    test(`Quiet ${mode}: ${component} has a visible forced-color fill and excludes disabled choices`, async ({
      page,
    }) => {
      const handles = await openStudy(page, component, mode);
      await page.emulateMedia({ forcedColors: 'active' });
      await open(page, component, handles, true);
      await expectKeyboardFocus(handles, component);
      await expectNoMark(handles.popup);
      await expectSelected(handles, component);
      const highlighted = await paint(handles.item);
      expect(highlighted.fill).toBe(highlighted.highlight);
      expect(highlighted.text).toBe(highlighted.highlightText);
      expect(contrast(highlighted.fillPixel, highlighted.popupPixel)).toBeGreaterThanOrEqual(3);
      expect(contrast(highlighted.textPixel, highlighted.fillPixel)).toBeGreaterThanOrEqual(4.5);
      let disabledRoot = handles.root;
      let disabledTrigger = handles.trigger;
      let disabledPopup = handles.popup;
      if (component === 'select') {
        await escape(page, handles);
        disabledRoot = handles.specimen.locator('[data-zao-component="select"]').last();
        disabledTrigger = disabledRoot.locator('[data-zao-slot="trigger"]');
        disabledPopup = disabledRoot.locator('[data-zao-slot="popup"]');
        await disabledTrigger.click();
        await expect(disabledPopup).toBeVisible();
        await settle(disabledPopup);
      }
      const disabled = disabledPopup.locator('[data-zao-slot="item"][data-disabled]').first();
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await disabled.hover();
      expect((await paint(disabled)).fillPixel).toEqual((await paint(disabled)).popupPixel);
      expect((await paint(disabled)).mark).toBe('none');
      await expect(disabled.locator('[data-zao-slot="item-indicator"]')).toHaveCount(0);
      if (component === 'menu') {
        await page.keyboard.press('End');
        await expect(disabled).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(disabledPopup).toBeVisible();
        await expect(
          handles.specimen.getByText('Choose an action to see its result.', { exact: true }),
        ).toBeVisible();
      }
      // Guard CSS state combinations without claiming a disabled option is natively selected.
      const cascade = await disabled.evaluate((node) => {
        const popup = node.closest('[data-zao-slot="popup"]')!;
        const wasHighlighted = node.hasAttribute('data-highlighted');
        node.setAttribute('data-highlighted', '');
        node.setAttribute('data-zao-exit-highlighted', '');
        const current = {
          fill: getComputedStyle(node).backgroundColor,
          mark: getComputedStyle(node, '::before').content,
        };
        popup.setAttribute('data-ending-style', '');
        const closing = {
          fill: getComputedStyle(node).backgroundColor,
          mark: getComputedStyle(node, '::before').content,
        };
        popup.removeAttribute('data-ending-style');
        if (!wasHighlighted) node.removeAttribute('data-highlighted');
        node.removeAttribute('data-zao-exit-highlighted');
        return { current, closing };
      });
      for (const state of [cascade.current, cascade.closing]) {
        expect(state.mark).toBe('none');
        expect(state.fill).toMatch(/^rgba\([^)]*,\s*0\)$/);
      }
      await expectNoMark(disabledPopup);
      await escape(page, { trigger: disabledTrigger, popup: disabledPopup });
    });

    test(`Quiet ${mode}: ${component} preserves RTL selection placement and immediate reduced-motion feedback`, async ({
      page,
    }) => {
      const handles = await openStudy(page, component, mode);
      await handles.study.evaluate((node) => {
        (node as HTMLElement).dir = 'rtl';
      });
      await open(page, component, handles, true);
      await expectKeyboardFocus(handles, component);
      await expect(handles.item).toHaveCSS('direction', 'rtl');
      await expectNoMark(handles.popup);
      await expectSelected(handles, component);
      const rows = await rowBoxes(handles.popup);
      if (component !== 'menu') {
        const selected = handles.popup.getByRole('option', {
          name: selectedNames[component],
          exact: true,
        });
        const text = await box(selected.locator('[data-zao-slot="item-text"]'));
        const indicator = await box(selected.locator('[data-zao-slot="indicator-space"]'));
        expect(indicator.x + indicator.width / 2).toBeLessThan(text.x + text.width / 2);
      }
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await expect(handles.item).toHaveAttribute('data-highlighted', '');
      expect(await rowBoxes(handles.popup)).toEqual(rows);
      await escape(page, handles);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, component, handles, true);
      await expectKeyboardFocus(handles, component);
      await expectNoMark(handles.popup);
      const motion = await handles.popup.evaluate((node) => ({
        property: getComputedStyle(node).transitionProperty,
        progress: Number(getComputedStyle(node).getPropertyValue('--zao-menu-reveal-progress')),
        transform: getComputedStyle(node).transform,
        animations: node.getAnimations().length,
      }));
      expect(motion).toEqual({ property: 'none', progress: 1, transform: 'none', animations: 0 });
      const reduced = await paint(handles.item);
      expect(reduced.fill).toBe(reduced.hover);
      await page.keyboard.press('Enter');
      await expect(handles.popup).not.toBeVisible();
      await expect(handles.trigger).toBeFocused();
      if (component === 'menu') {
        await expect(
          handles.specimen.getByText('Copied workspace ID.', { exact: true }),
        ).toBeVisible();
      } else {
        await open(page, component, handles, true);
        await expectSelected(handles, component, highlightedNames[component]);
        await expectNoMark(handles.popup);
        await escape(page, handles);
      }
    });

    test(`published Su ${mode}: ${component} uses the shared square token without study masking`, async ({
      page,
    }) => {
      const handles = await openStudy(page, component, mode, false);
      await open(page, component, handles, true);
      await expectKeyboardFocus(handles, component, false);
      await expectNoMark(handles.popup);
      await expectSelected(handles, component);
      const rows = await rowBoxes(handles.popup);
      const frame = await box(handles.frame);
      const popup = await box(handles.popup);
      // Reuse the approved control radius to prove every row reads the same token on an island.
      await handles.root.evaluate((node) => {
        (node as HTMLElement).style.setProperty('--zao-radius-none', 'var(--zao-radius-control)');
      });
      await expectNoMark(handles.popup, '2px');
      expect(await rowBoxes(handles.popup)).toEqual(rows);
      expect(await box(handles.frame)).toEqual(frame);
      expect(await box(handles.popup)).toEqual(popup);
      await expectKeyboardFocus(handles, component, false);
      await handles.root.evaluate((node) => {
        (node as HTMLElement).style.removeProperty('--zao-radius-none');
      });
      await expectNoMark(handles.popup);
      expect(await rowBoxes(handles.popup)).toEqual(rows);
      await escape(page, handles);
    });
  }
