import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { studyRuleCount } from './study-paint';
import { expectFocusBrackets } from './focus-mark';

const modes = ['light', 'dark'] as const;
const directions = ['ltr', 'rtl'] as const;
const paints = ['published Su', 'real Quiet instrument'] as const;
type Mode = (typeof modes)[number];
type Direction = (typeof directions)[number];
type Paint = (typeof paints)[number];

async function configure(page: Page, direction: Direction, paint: Paint) {
  await page.addInitScript((value) => {
    const apply = () => {
      if (!document.documentElement) return false;
      document.documentElement.dir = value;
      return true;
    };
    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect();
      });
      observer.observe(document, { childList: true });
    }
  }, direction);
  const css =
    paint === 'real Quiet instrument'
      ? await readFile(
          new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
          'utf8',
        )
      : '';
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
}

async function open(page: Page, component: string, mode: Mode, paint: Paint) {
  await page.goto(`/components/${component}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('[data-preview-style] .study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  const role = expect.poll(() => studyRuleCount(page));
  if (paint === 'real Quiet instrument') await role.toBeGreaterThan(0);
  else await role.toBe(0);
  await page.evaluate(() => document.fonts.ready);
  const anatomy = page.locator(`[data-anatomy-kind="${component}"]`);
  if (await anatomy.count()) await expect(anatomy).toHaveAttribute('data-anatomy-ready', 'true');
  await study.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  return study;
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function box(element: Locator) {
  return element.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return {
      x: bounds.x + window.scrollX,
      y: bounds.y + window.scrollY,
      width: bounds.width,
      height: bounds.height,
    };
  });
}

async function height(element: Locator, expected: number) {
  await element.scrollIntoViewIfNeeded();
  await expect(element).toBeVisible();
  expect((await box(element)).height).toBe(expected);
}

async function geometry(container: Locator) {
  return container.evaluate((node) =>
    [
      ...node.querySelectorAll(
        '[data-zao-field-frame], [data-zao-slot="label"], button[data-zao-component="button"]',
      ),
    ].map((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        x: bounds.x + window.scrollX,
        y: bounds.y + window.scrollY,
        width: bounds.width,
        height: bounds.height,
      };
    }),
  );
}

async function tabGeometry(list: Locator) {
  return list.evaluate((node) => {
    const origin = node.getBoundingClientRect();
    return [...node.querySelectorAll('[role="tab"]')].map((tab) => {
      const bounds = tab.getBoundingClientRect();
      return {
        x: bounds.x - origin.x,
        y: bounds.y - origin.y,
        width: bounds.width,
        height: bounds.height,
      };
    });
  });
}

async function outsideFocus(target: Locator) {
  await expect(target).toBeFocused();
  await settle(target);
  // Button and Switch draw focus brackets outside the part (finish plan V12).
  if (await target.evaluate((node) => node.classList.contains('focus-brackets'))) {
    await expectFocusBrackets(target);
    return;
  }
  const outline = await target.evaluate((node) => {
    const nativeStyle = getComputedStyle(node);
    // The approved Quiet Combobox puts the outside outline around its input group.
    const owner =
      nativeStyle.outlineStyle === 'none' ? node.closest('[data-zao-field-frame]') : node;
    const style = getComputedStyle(owner ?? node);
    return {
      visible: node.matches(':focus-visible'),
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
      offset: parseFloat(style.outlineOffset),
      color: style.outlineColor,
    };
  });
  expect(outline.visible).toBe(true);
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThan(0);
  expect(outline.offset).toBeGreaterThan(0);
  expect(outline.color).not.toBe('rgba(0, 0, 0, 0)');
}

async function mixedForm(page: Page, mode: Mode, paint: Paint) {
  const study = await open(page, 'text-field', mode, paint);
  const family = study.getByRole('form', { name: 'Workspace settings', exact: true });
  const frames = family.locator('[data-zao-field-frame]');
  await expect(frames).toHaveCount(3);
  for (const frame of await frames.all()) await height(frame, 34);
  const save = family.getByRole('button', { name: 'Save changes', exact: true });
  await height(save, 34);
  const face = save.locator('[data-zao-slot="face"]');
  await expect(face).toHaveCSS('padding-inline-start', '16px');
  await expect(face).toHaveCSS('padding-inline-end', '16px');
  await expect(face).toHaveCSS('padding-block-start', '8px');
  await expect(face).toHaveCSS('padding-block-end', '8px');
  expect(await face.evaluate((node) => parseFloat(getComputedStyle(node).lineHeight))).toBeCloseTo(
    18,
    3,
  );
  return { study, family, save };
}

for (const paint of paints)
  for (const mode of modes)
    for (const direction of directions) {
      test(`${paint}, ${mode}, ${direction}: one 34px default preserves 28px and 40px sizes and the 32px fen step`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await configure(page, direction, paint);
        const { study } = await mixedForm(page, mode, paint);
        const utilities = await study.evaluate((node) => {
          const measurements: Record<string, number> = {};
          for (const className of ['h-control', 'h-button', 'h-8']) {
            const sample = document.createElement('div');
            sample.className = className;
            sample.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none';
            node.append(sample);
            measurements[className] = sample.getBoundingClientRect().height;
            sample.remove();
          }
          return {
            measurements,
            control: getComputedStyle(node).getPropertyValue('--zao-size-control-md').trim(),
            button: getComputedStyle(node).getPropertyValue('--zao-size-button-default').trim(),
            space: getComputedStyle(node).getPropertyValue('--zao-space-8').trim(),
          };
        });
        expect(utilities).toEqual({
          measurements: { 'h-control': 34, 'h-button': 34, 'h-8': 32 },
          control: '34px',
          button: '34px',
          space: '32px',
        });

        for (const component of ['text-field', 'select', 'combobox']) {
          const fields = await open(page, component, mode, paint);
          const sizes = fields.locator('[data-zao-specimen="field-sizes"] [data-zao-field-frame]');
          for (const [index, expected] of [28, 34, 40].entries())
            await height(sizes.nth(index), expected);
          for (const disabled of await fields
            .locator('[data-zao-field-frame][data-zao-disabled]')
            .all())
            await height(disabled, 34);
        }

        const buttons = (await open(page, 'button', mode, paint)).locator(
          '[data-zao-specimen="button"]',
        );
        for (const [label, expected] of [
          ['Small', 28],
          ['Default', 34],
          ['Large', 40],
        ] as const)
          await height(buttons.getByRole('button', { name: label, exact: true }), expected);
        await height(buttons.getByRole('button', { name: 'Unavailable', exact: true }), 34);

        const icons = (await open(page, 'icon-button', mode, paint)).locator(
          '[data-zao-specimen="icon-button"]',
        );
        for (const [label, expected] of [
          ['Search workspaces', 28],
          ['Open workspace settings', 34],
          ['Add member', 40],
        ] as const) {
          const icon = icons.getByRole('button', { name: label, exact: true });
          await height(icon, expected);
          expect((await box(icon)).width).toBe(expected);
        }

        const tabs = (await open(page, 'tabs', mode, paint)).locator('[data-zao-specimen="tabs"]');
        for (const tab of await tabs.getByRole('tab').all()) await height(tab, 34);
        const vertical = page.getByRole('tablist', { name: 'Account sections' });
        for (const tab of await vertical.getByRole('tab').all()) await height(tab, 34);

        const menu = (await open(page, 'menu', mode, paint)).locator('[data-zao-specimen="menu"]');
        const trigger = menu.getByRole('button', { name: 'Workspace actions', exact: true });
        await height(trigger, 34);
        await trigger.click();
        const popup = menu.getByRole('menu');
        await expect(popup).toBeVisible();
        await settle(popup);
        for (const item of await popup.getByRole('menuitem').all()) {
          await height(item, 34);
          await expect(item).toHaveCSS('min-height', '34px');
        }
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();

        const dialog = (await open(page, 'dialog', mode, paint))
          .locator('[data-zao-specimen="dialog"]')
          .first();
        const opener = dialog.getByRole('button', { name: 'Review access', exact: true });
        await height(opener, 34);
        await opener.click();
        const panel = dialog.getByRole('dialog', { name: 'Review workspace access', exact: true });
        for (const action of await panel.getByRole('button').all()) await height(action, 34);
        await page.keyboard.press('Escape');
        await expect(opener).toBeFocused();

        const table = (await open(page, 'table', mode, paint)).locator(
          '[data-zao-specimen="table"]',
        );
        for (const label of ['Compare selected', 'Table actions'])
          await height(table.getByRole('button', { name: label, exact: true }), 28);
      });

      test(`${paint}, ${mode}, ${direction}: default native targets, labels, neighboring controls and outside keyboard focus stay fixed`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: direction === 'rtl' ? 360 : 1440, height: 1000 });
        await configure(page, direction, paint);
        const { family, save } = await mixedForm(page, mode, paint);
        await family.scrollIntoViewIfNeeded();
        await settle(family);
        const baseline = await geometry(family);
        const input = family.getByRole('textbox', { name: 'Workspace name', exact: true });
        const combo = family.getByRole('combobox', { name: 'Workspace', exact: true });
        const select = family.getByRole('combobox', { name: 'Region', exact: true });
        await page.keyboard.press('Tab');
        for (const target of [input, combo, select, save]) {
          await target.scrollIntoViewIfNeeded();
          await target.focus();
          await outsideFocus(target);
          await settle(family);
          expect(await geometry(family)).toEqual(baseline);
          // Focus can mount the Combobox pocket; dismiss it before the next native target.
          await page.keyboard.press('Escape');
        }
        await save.scrollIntoViewIfNeeded();
        await save.hover();
        await settle(family);
        expect(await geometry(family)).toEqual(baseline);
        const hit = await save.boundingBox();
        expect(hit).not.toBeNull();
        await page.mouse.move(hit!.x + 1, hit!.y + hit!.height - 1);
        await page.mouse.down();
        // Mouse uses the native :active pose; the data marker is for keyboard and touch.
        await expect.poll(() => save.evaluate((node) => node.matches(':active'))).toBe(true);
        await settle(family);
        expect(await geometry(family)).toEqual(baseline);
        await page.mouse.up();
        await settle(family);
        expect(await geometry(family)).toEqual(baseline);

        const tabs = (await open(page, 'tabs', mode, paint)).locator('[data-zao-specimen="tabs"]');
        const list = tabs.getByRole('tablist', { name: 'Workspace views' });
        const overview = list.getByRole('tab', { name: 'Overview', exact: true });
        const archive = list.getByRole('tab', { name: 'Archive', exact: true });
        await overview.scrollIntoViewIfNeeded();
        await settle(list);
        // Measure native targets against their rail, independent of Anatomy reflow above it.
        const initial = await tabGeometry(list);
        await page.keyboard.press('Tab');
        await overview.focus();
        await outsideFocus(overview);
        await page.keyboard.down('Space');
        await settle(list);
        expect(await tabGeometry(list)).toEqual(initial);
        await page.keyboard.up('Space');
        // Native scroll-into-view is allowed in the narrow tab rail; snapshot after it.
        await archive.scrollIntoViewIfNeeded();
        await settle(list);
        const disabledTargets = await tabGeometry(list);
        await archive.hover();
        await expect(archive).toBeDisabled();
        await settle(list);
        expect(await tabGeometry(list)).toEqual(disabledTargets);
      });
    }

for (const mode of modes)
  for (const protection of ['reduced motion', 'forced colors'] as const) {
    test(`${mode}, ${protection}: shared defaults retain native focus, stationary targets and disabled state`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 1000 });
      await page.emulateMedia({
        reducedMotion: protection === 'reduced motion' ? 'reduce' : 'no-preference',
        forcedColors: protection === 'forced colors' ? 'active' : 'none',
      });
      await configure(page, 'rtl', 'real Quiet instrument');
      const { family, save } = await mixedForm(page, mode, 'real Quiet instrument');
      await family.scrollIntoViewIfNeeded();
      await settle(family);
      const initial = await geometry(family);
      await page.keyboard.press('Tab');
      await save.focus();
      await outsideFocus(save);
      await page.keyboard.down('Space');
      await settle(family);
      expect(await geometry(family)).toEqual(initial);
      await page.keyboard.up('Space');
      if (protection === 'reduced motion') {
        const duration = await save
          .locator('[data-zao-slot="face"]')
          .evaluate((node) => getComputedStyle(node).transitionDuration);
        expect(duration.split(',').every((part) => parseFloat(part) <= 0.00001)).toBe(true);
      }
      const buttons = (await open(page, 'button', mode, 'real Quiet instrument')).locator(
        '[data-zao-specimen="button"]',
      );
      const disabled = buttons.getByRole('button', { name: 'Unavailable', exact: true });
      await height(disabled, 34);
      await expect(disabled).toBeDisabled();
      const disabledBefore = await box(disabled);
      await disabled.hover();
      await settle(disabled);
      expect(await box(disabled)).toEqual(disabledBefore);
    });
  }
