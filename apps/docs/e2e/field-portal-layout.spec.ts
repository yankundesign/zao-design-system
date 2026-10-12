import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { studyRuleCount } from './study-paint';

const modes = ['light', 'dark'] as const;
const directions = ['ltr', 'rtl'] as const;
const paints = ['published Su', 'real Quiet instrument'] as const;
const widths = [1440, 360] as const;
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

async function openPage(
  page: Page,
  field: 'text-field' | 'select' | 'combobox',
  mode: Mode,
  paint: Paint,
) {
  await page.goto(`/components/${field}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  await expect(study).toHaveAttribute('data-study', 'quiet-instrument');
  const role = expect.poll(() => studyRuleCount(page));
  if (paint === 'real Quiet instrument') await role.toBeGreaterThan(0);
  else await role.toBe(0);
  await page.evaluate(() => document.fonts.ready);
  if (field === 'text-field') {
    await expect(page.locator('[data-anatomy-kind="text-field"]')).toHaveAttribute(
      'data-anatomy-ready',
      'true',
    );
  }
  await page.mouse.move(0, 0);
  return study;
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function geometry(container: Locator) {
  return container.evaluate((node) => {
    const elements = node.querySelectorAll(
      '[data-zao-component="text-field"], [data-zao-component="select"], [data-zao-component="combobox"], [data-zao-field-frame], [data-zao-slot="form-row"], [data-zao-slot="label"], [data-zao-slot="input"], [data-zao-slot="trigger"], [data-zao-slot="clear-space"], [data-zao-slot="description"], [data-zao-slot="error"], button[data-zao-component="button"]',
    );
    return [...elements].map((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        component: element.getAttribute('data-zao-component'),
        slot: element.getAttribute('data-zao-slot'),
        x: bounds.x + window.scrollX,
        y: bounds.y + window.scrollY,
        width: bounds.width,
        height: bounds.height,
      };
    });
  });
}

async function expectStationary(
  container: Locator,
  reference: Awaited<ReturnType<typeof geometry>>,
) {
  await settle(container);
  expect(await geometry(container)).toEqual(reference);
}

async function values(family: Locator) {
  return family.evaluate((node) => Object.fromEntries(new FormData(node as HTMLFormElement)));
}

async function expectPortal(root: Locator) {
  const portal = root.locator(':scope > [data-zao-slot="portal"]');
  await expect(portal).toHaveCSS('display', 'contents');
  await expect(portal).not.toHaveAttribute('role', /.+/);
  await expect(root.locator('[data-zao-slot="popup"]').locator('..')).toHaveCSS(
    'position',
    'absolute',
  );
  expect(await portal.evaluate((node) => node.getBoundingClientRect().height)).toBe(0);
  return portal;
}

async function escape(page: Page, root: Locator, returnTarget: Locator) {
  await page.keyboard.press('Escape');
  await expect(root.locator('[data-zao-slot="popup"]')).not.toBeVisible();
  await expect(returnTarget).toBeFocused();
}

for (const paint of paints)
  for (const mode of modes)
    for (const direction of directions) {
      for (const width of widths) {
        test(`${paint}, ${mode}, ${direction}, ${width}px: mixed form roots and targets stay fixed through native focus and field popups`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 1000 });
          await configure(page, direction, paint);
          const study = await openPage(page, 'text-field', mode, paint);
          const family = study.getByRole('form', { name: 'Workspace settings', exact: true });
          await family.scrollIntoViewIfNeeded();
          await settle(family);
          const baseline = await geometry(family);
          const workspaceName = family.getByRole('textbox', {
            name: 'Workspace name',
            exact: true,
          });
          const combo = family.locator('[data-zao-component="combobox"]');
          const comboInput = combo.getByRole('combobox', { name: 'Workspace', exact: true });
          const comboTrigger = combo.getByRole('button', {
            name: 'Open Workspace options',
            exact: true,
          });
          const select = family.locator('[data-zao-component="select"]');
          const selectTrigger = select.getByRole('combobox', { name: 'Region', exact: true });
          const save = family.getByRole('button', { name: 'Save changes', exact: true });
          expect(await values(family)).toEqual({
            workspaceName: 'North workspace',
            workspace: 'north',
            region: 'west',
          });

          await workspaceName.focus();
          await expectStationary(family, baseline);
          const visited: string[] = [];
          for (let step = 0; step < 10; step++) {
            await page.keyboard.press('Tab');
            await expectStationary(family, baseline);
            const focus = await family.evaluate((node) => {
              const active = document.activeElement;
              if (!active || !node.contains(active)) return 'outside form';
              return `${active.closest('[data-zao-component]')?.getAttribute('data-zao-component')}:${active.getAttribute('data-zao-slot')}`;
            });
            visited.push(focus);
            expect(focus).not.toBe('outside form');
            if (await save.evaluate((node) => node === document.activeElement)) break;
          }
          await expect(save).toBeFocused();
          expect(visited).toContain('combobox:input');
          expect(visited).toContain('select:trigger');
          await page.keyboard.press('Shift+Tab');
          await expect(selectTrigger).toBeFocused();
          await expectStationary(family, baseline);

          await page.keyboard.press('ArrowDown');
          await expect(select.locator('[data-zao-slot="popup"]')).toBeVisible();
          const portal = await expectPortal(select);
          await expectStationary(family, baseline);

          // Restore the previous generic wrapper to prove the native regression catches its flex gap.
          const before = await geometry(family);
          const gap = await select.evaluate((node) => parseFloat(getComputedStyle(node).rowGap));
          expect(gap).toBe(4);
          const positioner = select.locator('[data-zao-slot="popup"]').locator('..');
          const beforePositioner = await positioner.boundingBox();
          const beforeRoot = before.find((reading) => reading.component === 'select')!;
          const beforeSave = before.find((reading) => reading.component === 'button')!;
          await portal.evaluate((node) => node.classList.remove('contents'));
          await expect(portal).toHaveCSS('display', 'block');
          await settle(family);
          const previous = await geometry(family);
          expect(previous).not.toEqual(before);
          expect(previous.find((reading) => reading.component === 'select')!.height).toBeCloseTo(
            beforeRoot.height + gap,
            2,
          );
          expect(previous.find((reading) => reading.component === 'button')!.y).toBeCloseTo(
            beforeSave.y + gap,
            2,
          );
          expect(await positioner.boundingBox()).toEqual(beforePositioner);
          await portal.evaluate((node) => node.classList.add('contents'));
          await expectStationary(family, baseline);
          await escape(page, select, selectTrigger);
          await expectStationary(family, baseline);

          await comboInput.focus();
          await page.keyboard.press('ArrowDown');
          await expect(combo.locator('[data-zao-slot="popup"]')).toBeVisible();
          await expectPortal(combo);
          await expect(comboInput).toBeFocused();
          await expectStationary(family, baseline);
          await escape(page, combo, comboInput);
          await expectStationary(family, baseline);

          await selectTrigger.click();
          await expect(select.locator('[data-zao-slot="popup"]')).toBeVisible();
          await expectStationary(family, baseline);
          await select.getByRole('option', { name: 'Central', exact: true }).click();
          await expect(select.locator('[data-zao-slot="popup"]')).not.toBeVisible();
          await expect(selectTrigger).toBeFocused();
          await expect(select.locator('[data-zao-slot="value"]')).toHaveText('Central');
          await expectStationary(family, baseline);

          await comboTrigger.click();
          await expect(combo.locator('[data-zao-slot="popup"]')).toBeVisible();
          await expectStationary(family, baseline);
          await combo.getByRole('option', { name: 'East workspace', exact: true }).click();
          await expect(combo.locator('[data-zao-slot="popup"]')).not.toBeVisible();
          await expect(comboInput).toBeFocused();
          await expect(comboInput).toHaveValue('East workspace');
          await expectStationary(family, baseline);

          await comboInput.fill('West');
          await expect(
            combo.getByRole('option', { name: 'West workspace', exact: true }),
          ).toBeVisible();
          await expectStationary(family, baseline);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          await expect(comboInput).toHaveValue('West workspace');
          await expect(combo.locator('[data-zao-slot="popup"]')).not.toBeVisible();
          await expect(comboInput).toBeFocused();
          await expectStationary(family, baseline);

          await page.mouse.move(0, 0);
          await selectTrigger.focus();
          await page.keyboard.press('ArrowDown');
          await expect(select.locator('[data-zao-slot="popup"]')).toBeVisible();
          await expect(select.getByRole('option', { name: 'Central', exact: true })).toBeFocused();
          await page.keyboard.press('End');
          await expect(select.getByRole('option', { name: 'East', exact: true })).toBeFocused();
          await expectStationary(family, baseline);
          await page.keyboard.press('Enter');
          await expect(select.locator('[data-zao-slot="value"]')).toHaveText('East');
          await expect(selectTrigger).toBeFocused();
          await expectStationary(family, baseline);
          expect(await values(family)).toEqual({
            workspaceName: 'North workspace',
            workspace: 'west',
            region: 'east',
          });

          await page.emulateMedia({ reducedMotion: 'reduce' });
          await comboInput.focus();
          await page.keyboard.press('ArrowDown');
          await expect(combo.locator('[data-zao-slot="popup"]')).toBeVisible();
          await expectStationary(family, baseline);
          await escape(page, combo, comboInput);
          await expectStationary(family, baseline);
          await save.focus();
          await page.keyboard.press('Enter');
          await expect(family.getByRole('status')).toHaveText('Saved changes for North workspace.');
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
        });
      }

      test(`${paint}, ${mode}, ${direction}: description and error roots retain their geometry and accessible relationships`, async ({
        page,
      }) => {
        await configure(page, direction, paint);
        for (const field of ['select', 'combobox'] as const) {
          const study = await openPage(page, field, mode, paint);
          const specimen = study.locator(`[data-zao-specimen="${field}"]`);
          await specimen.scrollIntoViewIfNeeded();
          await settle(specimen);
          const baseline = await geometry(specimen);
          for (const slot of ['description', 'error'] as const) {
            const root = specimen
              .locator(`[data-zao-component="${field}"]:has([data-zao-slot="${slot}"])`)
              .first();
            const target = root.locator(
              `[data-zao-slot="${field === 'select' ? 'trigger' : 'input'}"]`,
            );
            await target.focus();
            await expectStationary(specimen, baseline);
            if (slot === 'error') await expect(target).toHaveAttribute('aria-invalid', 'true');
            const ids = (await target.getAttribute('aria-describedby'))!.split(' ');
            for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toBeVisible();
            await page.keyboard.press('ArrowDown');
            await expect(root.locator('[data-zao-slot="popup"]')).toBeVisible();
            await expectPortal(root);
            await expectStationary(specimen, baseline);
            await escape(page, root, target);
            await expectStationary(specimen, baseline);
          }
        }
      });
    }
