import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const fields = ['text-field', 'combobox', 'select'] as const;
const choices = ['combobox', 'select'] as const;
type Field = (typeof fields)[number];
const contexts = [
  { name: 'Quiet light', theme: 'su', mode: 'light', real: true },
  { name: 'Quiet dark', theme: 'su', mode: 'dark', real: true },
  { name: 'Su baseline light', theme: 'su', mode: 'light', real: false },
  { name: 'Su baseline dark', theme: 'su', mode: 'dark', real: false },
] as const;
type Context = (typeof contexts)[number];

async function settle(element: Locator) {
  // Base UI removes its opening marker after mounting; wait before reading animations.
  await expect(element).not.toHaveAttribute('data-starting-style', '');
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function openPage(page: Page, field: Field, context: Context) {
  await page.goto(`/components/${field}`);
  await page
    .getByRole('radio', { name: context.mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const study = page.locator('.study');
  await expect(study).toHaveAttribute('data-zao-mode', context.mode);
  if (context.real) {
    await page.addStyleTag({
      content: await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      ),
    });
  }
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  return study;
}

async function box(element: Locator) {
  const result = await element.boundingBox();
  expect(result).not.toBeNull();
  return result!;
}

function primary(page: Page, field: Field) {
  return page.locator(`[data-zao-specimen="${field}"] [data-zao-component="${field}"]`).first();
}

async function colorToken(element: Locator, token: string) {
  return element.evaluate((node, name) => {
    const sample = document.createElement('span');
    sample.style.color = `var(${name})`;
    sample.style.position = 'absolute';
    node.parentElement!.append(sample);
    const color = getComputedStyle(sample).color;
    sample.remove();
    return color;
  }, token);
}

type PocketProbe = HTMLElement & { fieldAnimation?: Animation };
async function arm(root: Locator, phase: 'open' | 'close') {
  await root.evaluate((node, nextPhase) => {
    const probe = node as PocketProbe;
    probe.dataset.fieldArmed = nextPhase;
    delete probe.dataset.fieldPhase;
    if (probe.dataset.fieldListener) return;
    probe.dataset.fieldListener = 'ready';
    probe.addEventListener('transitionrun', (event) => {
      if (!probe.dataset.fieldArmed || event.propertyName !== '--zao-menu-reveal-progress') return;
      const popup = event.target as HTMLElement;
      if (popup.dataset.zaoSlot !== 'popup') return;
      const animation = popup
        .getAnimations()
        .find(
          (candidate) =>
            'transitionProperty' in candidate &&
            candidate.transitionProperty === '--zao-menu-reveal-progress',
        );
      if (!animation) return;
      animation.pause();
      probe.fieldAnimation = animation;
      probe.dataset.fieldPhase = probe.dataset.fieldArmed;
      delete probe.dataset.fieldArmed;
    });
  }, phase);
}

async function scrub(root: Locator, phase: 'open' | 'close') {
  await expect(root).toHaveAttribute('data-field-phase', phase);
  return root.evaluate(async (node, nextPhase) => {
    const animation = (node as PocketProbe).fieldAnimation!;
    await animation.ready;
    const duration = Number(animation.effect!.getTiming().duration);
    animation.currentTime = duration / 2;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const popup = node.querySelector<HTMLElement>('[data-zao-slot="popup"]')!;
    const css = getComputedStyle(popup);
    const durationToken = css.getPropertyValue(
      nextPhase === 'open' ? '--zao-motion-duration-base' : '--zao-motion-duration-fast',
    );
    return {
      duration,
      expectedDuration:
        parseFloat(durationToken) * (durationToken.trim().endsWith('ms') ? 1 : 1000),
      progress: Number(css.getPropertyValue('--zao-menu-reveal-progress')),
      clip: css.clipPath,
      transform: css.transform,
      opacity: css.opacity,
    };
  }, phase);
}

async function finish(root: Locator) {
  await root.evaluate((node) => (node as PocketProbe).fieldAnimation!.finish());
}

for (const context of contexts) {
  test(`${context.name}: every field has shared sizes, a usable mixed form, and scoped finish`, async ({
    page,
  }) => {
    for (const field of fields) {
      const study = await openPage(page, field, context);
      const sizes = study.locator('[data-zao-specimen="field-sizes"] [data-zao-field-frame]');
      for (const [index, height] of [28, 34, 40].entries()) {
        expect((await box(sizes.nth(index))).height).toBe(height);
      }
      const family = study.locator('[data-zao-specimen="field-family"]');
      for (const frame of await family.locator('[data-zao-field-frame]').all()) {
        expect((await box(frame)).height).toBe(34);
        if (context.real) {
          await expect(frame).toHaveCSS('border-radius', '0px');
          await expect(frame).toHaveCSS(
            'background-color',
            await colorToken(
              frame,
              context.mode === 'light' ? '--zao-color-bg-canvas' : '--zao-color-bg-sunken',
            ),
          );
        } else {
          await expect(frame).toHaveCSS(
            'background-color',
            await colorToken(frame, '--zao-color-bg-canvas'),
          );
        }
      }
      expect((await box(family.getByRole('button', { name: 'Save changes' }))).height).toBe(34);
      await family.getByRole('textbox', { name: 'Workspace name' }).fill('Updated workspace');
      await family.getByRole('button', { name: 'Save changes' }).click();
      await expect(family.getByRole('status')).toHaveText('Saved changes for Updated workspace.');
      const formValues = await family.evaluate((node) =>
        Object.fromEntries(new FormData(node as HTMLFormElement)),
      );
      expect(formValues).toEqual({
        workspaceName: 'Updated workspace',
        workspace: 'north',
        region: 'west',
      });
    }
  });
}

for (const context of contexts.filter((item) => item.real)) {
  test(`${context.name}: hover, keyboard focus, errors, and disabled fields keep geometry fixed`, async ({
    page,
  }) => {
    for (const field of fields) {
      await openPage(page, field, context);
      const root = primary(page, field);
      const frame = root.locator('[data-zao-field-frame]');
      await frame.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(frame);
      const before = await box(frame);
      await expect(frame).toHaveCSS(
        'border-color',
        await colorToken(
          frame,
          context.real
            ? '--zao-color-border-field'
            : context.mode === 'light'
              ? '--zao-color-border-default'
              : '--zao-color-border-subtle',
        ),
      );
      await frame.hover();
      await expect(frame).toHaveCSS(
        'border-color',
        await colorToken(frame, '--zao-color-border-strong'),
      );
      expect(await box(frame)).toEqual(before);
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      const target = field === 'combobox' ? root.locator('[data-zao-slot="input"]') : frame;
      await target.focus();
      await expect(frame).toHaveCSS('outline-style', 'solid');
      await expect(frame).toHaveCSS('outline-width', '2px');
      await expect(frame).toHaveCSS('outline-offset', '2px');
      if (field === 'combobox') await expect(target).toHaveCSS('outline-style', 'none');
      expect(await box(frame)).toEqual(before);
      if (field === 'combobox') {
        const trigger = root.locator('[data-zao-slot="trigger"]');
        await trigger.focus();
        await expect(frame).toHaveCSS('outline-style', 'solid');
        await expect(trigger).toHaveCSS('outline-style', 'none');
        expect(await box(frame)).toEqual(before);
      }
      const specimen = page.locator(`[data-zao-specimen="${field}"]`);
      const invalid = specimen.locator('[data-zao-field-frame][data-zao-invalid]').first();
      const errorColor = await colorToken(
        invalid,
        context.real ? '--zao-color-border-field-invalid' : '--zao-color-danger-border',
      );
      await invalid.hover();
      await expect(invalid).toHaveCSS('border-color', errorColor);
      const invalidTarget =
        field === 'combobox' ? invalid.locator('[data-zao-slot="input"]') : invalid;
      await page.keyboard.press('Tab');
      await invalidTarget.focus();
      await expect(invalid).toHaveCSS('border-color', errorColor);
      await expect(invalid).toHaveCSS('outline-style', 'solid');
      await expect(invalidTarget).toHaveAttribute('aria-invalid', 'true');
      const descriptionIds = (await invalidTarget.getAttribute('aria-describedby'))!.split(' ');
      expect(descriptionIds.length).toBeGreaterThan(0);
      for (const id of descriptionIds) await expect(page.locator(`[id="${id}"]`)).toBeVisible();
      const disabled = specimen.locator('[data-zao-field-frame][data-zao-disabled]').first();
      await expect(disabled).toHaveCSS(
        'background-color',
        await colorToken(
          disabled,
          context.real ? '--zao-color-bg-field-disabled' : '--zao-color-bg-sunken',
        ),
      );
      if (context.mode === 'light') {
        await expect(frame).not.toHaveCSS(
          'background-color',
          await disabled.evaluate((node) => getComputedStyle(node).backgroundColor),
        );
      }
      await disabled.hover();
      await expect(disabled).toHaveCSS(
        'border-color',
        await colorToken(disabled, '--zao-color-border-subtle'),
      );
      await expect(
        field === 'combobox' ? disabled.locator('[data-zao-slot="input"]') : disabled,
      ).toBeDisabled();
      if (field === 'text-field') {
        const readOnly = specimen.getByRole('textbox', { name: 'Reference name' });
        await expect(readOnly).toHaveAttribute('readonly', '');
        await readOnly.focus();
        await page.keyboard.type('changed');
        await expect(readOnly).toHaveValue('North workspace');
      }
    }
  });

  test(`${context.name}: Combo Box clears without shifting its editable area and filters without committing unmatched text`, async ({
    page,
  }) => {
    await openPage(page, 'combobox', context);
    const root = primary(page, 'combobox');
    const input = root.locator('[data-zao-slot="input"]');
    const before = await box(input);
    const clear = root.getByRole('button', { name: 'Clear Workspace', exact: true });
    const clearBox = await box(clear);
    expect(clearBox.width).toBeGreaterThanOrEqual(24);
    expect(clearBox.height).toBeGreaterThanOrEqual(24);
    await clear.click();
    await expect(input).toHaveValue('');
    await expect(clear).toHaveCount(0);
    expect(await box(input)).toEqual(before);
    await input.fill('West');
    await expect(root.getByRole('option', { name: 'West workspace' })).toBeVisible();
    await expect(root.getByRole('option', { name: 'East workspace' })).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('West workspace');
    expect(await box(input)).toEqual(before);
    const directory = page
      .locator('[data-zao-specimen="combobox"]')
      .getByRole('combobox', { name: 'Workspace directory' });
    await directory.fill('No such workspace');
    await expect(
      page.locator('[data-zao-specimen="combobox"]').getByText('No matches found.'),
    ).toBeVisible();
    await expect(directory).not.toHaveAttribute('aria-invalid', 'true');
    await page.keyboard.press('Escape');
  });

  for (const field of choices) {
    test(`${context.name}: ${field} Pocket keeps labels stationary and selection separate from highlight`, async ({
      page,
    }) => {
      await openPage(page, field, context);
      const root = primary(page, field);
      const frame = root.locator('[data-zao-field-frame]');
      const trigger = root.locator('[data-zao-slot="trigger"]');
      const popup = root.locator('[data-zao-slot="popup"]');
      await frame.scrollIntoViewIfNeeded();
      const frameBox = await box(frame);
      await arm(root, 'open');
      await trigger.click();
      const opening = await scrub(root, 'open');
      expect(opening.duration).toBe(opening.expectedDuration);
      expect(opening.progress).toBeGreaterThan(0);
      expect(opening.progress).toBeLessThan(1);
      expect(opening.transform).toBe('none');
      expect(opening.opacity).toBe('1');
      expect(opening.clip).toContain('inset(');
      const rows = await popup.getByRole('option').all();
      const rowBoxes = await Promise.all(rows.map(box));
      await finish(root);
      await settle(popup);
      await expect(popup.getByRole('listbox')).toHaveAccessibleName(
        field === 'combobox' ? 'Workspace' : 'Region',
      );
      expect(await Promise.all(rows.map(box))).toEqual(rowBoxes);
      expect(await box(frame)).toEqual(frameBox);
      const selected = popup.getByRole('option', {
        name: field === 'combobox' ? 'North workspace' : 'West',
        exact: true,
      });
      const next = popup.getByRole('option', {
        name: field === 'combobox' ? 'East workspace' : 'Central',
        exact: true,
      });
      await next.hover();
      await expect(next).toHaveAttribute('data-highlighted', '');
      await expect(selected.locator('[data-zao-slot="item-indicator"]')).toBeVisible();
      await expect(next.locator('[data-zao-slot="item-indicator"]')).toHaveCount(0);
      const paint = await next.evaluate((node) => getComputedStyle(node).backgroundColor);
      await arm(root, 'close');
      await page.mouse.click(2, 2);
      const closing = await scrub(root, 'close');
      expect(closing.duration).toBe(closing.expectedDuration);
      await expect(next).toHaveCSS('background-color', paint);
      await finish(root);
      await expect(popup).not.toBeVisible();
      await trigger.click();
      await expect(popup).toBeVisible();
      await expect(root.locator('[data-zao-exit-highlighted]')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
    });

    test(`${context.name}: ${field} wraps, scrolls, flips, and reopens without stale presentation`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 480 });
      await openPage(page, field, context);
      const root = page
        .locator(`[data-zao-specimen="${field}"] [data-zao-component="${field}"]`)
        .last();
      const trigger = root.locator('[data-zao-slot="trigger"]');
      const popup = root.locator('[data-zao-slot="popup"]');
      await trigger.scrollIntoViewIfNeeded();
      await trigger.evaluate((node) => {
        const study = node.closest('.study') as HTMLElement;
        study.style.marginTop = `${440 - node.getBoundingClientRect().bottom}px`;
      });
      await trigger.click();
      await expect(popup).toBeVisible();
      await settle(popup);
      await expect(popup).toHaveAttribute('data-side', 'top');
      const popupBox = await box(popup);
      expect(popupBox.x).toBeGreaterThanOrEqual(0);
      expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(360);
      expect(popupBox.y).toBeGreaterThanOrEqual(0);
      expect(popupBox.y + popupBox.height).toBeLessThanOrEqual(480);
      const long = popup.locator('[data-zao-slot="item-text"]').first();
      await expect(long).toHaveCSS('white-space', 'normal');
      expect((await box(long)).height).toBeGreaterThan(20);
      const viewport = popup.locator('[data-zao-slot="viewport"]');
      const edge = popup.locator('[data-zao-slot="reveal-edge"]');
      const last = popup.getByRole('option').last();
      if (field === 'select') {
        await page.keyboard.press('End');
      } else {
        // Keep the input's native Home/End editing; navigate options with arrows.
        const input = root.locator('[data-zao-slot="input"]');
        for (let step = 0; step < 20; step++) {
          if ((await last.getAttribute('data-highlighted')) !== null) break;
          await input.press('ArrowDown');
        }
      }
      await expect(last).toHaveAttribute('data-highlighted', '');
      expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
      const lastBox = await box(last);
      const viewportBox = await box(viewport);
      expect(lastBox.y).toBeGreaterThanOrEqual(viewportBox.y);
      expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(viewportBox.y + viewportBox.height);
      await viewport.evaluate((node) => {
        node.scrollTop = 0;
      });
      const edgeBox = await box(edge);
      await viewport.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
      expect(await box(edge)).toEqual(edgeBox);
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await expect(popup).not.toBeVisible();
      await trigger.click();
      await page.mouse.click(2, 2);
      await trigger.click();
      await expect(popup).toBeVisible();
      await settle(popup);
      await expect(root.locator('[data-zao-exit-highlighted]')).toHaveCount(0);
      await page.keyboard.press('Escape');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(0);
    });
  }

  test(`${context.name}: mixed form is accessible, commits controlled choices, and stacks on narrow screens`, async ({
    page,
  }) => {
    const study = await openPage(page, 'text-field', context);
    const family = study.locator('[data-zao-specimen="field-family"]');
    const combo = family.locator('[data-zao-component="combobox"]');
    await combo.getByRole('combobox', { name: 'Workspace', exact: true }).fill('West');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const select = family.locator('[data-zao-component="select"]');
    await select.locator('[data-zao-slot="trigger"]').click();
    await settle(select.locator('[data-zao-slot="popup"]'));
    const openA11y = await new AxeBuilder({ page }).include('.study').analyze();
    expect(openA11y.violations.map(({ id }) => id)).toEqual([]);
    await page.keyboard.press('c');
    await page.keyboard.press('Enter');
    await expect(select.locator('[data-zao-slot="value"]')).toHaveText('Central');
    await expect(select.locator('[data-zao-slot="popup"]')).not.toBeVisible();
    expect(
      await family.evaluate((node) => Object.fromEntries(new FormData(node as HTMLFormElement))),
    ).toEqual({ workspaceName: 'North workspace', workspace: 'west', region: 'central' });
    const { violations } = await new AxeBuilder({ page }).include('.study').analyze();
    expect(
      violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
    ).toEqual([]);
    await page.setViewportSize({ width: 360, height: 800 });
    const frames = await family.locator('[data-zao-field-frame]').all();
    const positions = await Promise.all(frames.map(box));
    expect(positions[1]!.y).toBeGreaterThan(positions[0]!.y + positions[0]!.height);
    expect(positions[2]!.y).toBeGreaterThan(positions[1]!.y + positions[1]!.height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(0);
  });
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const field of choices) {
    test(`${field} immediately reveals the complete frame and retains keyboard selection`, async ({
      page,
    }) => {
      await openPage(page, field, contexts[0]);
      const root = primary(page, field);
      await root.locator('[data-zao-slot="trigger"]').click();
      const popup = root.locator('[data-zao-slot="popup"]');
      await expect(popup).toHaveCSS('transition-property', 'none');
      expect(
        await popup.evaluate((node) =>
          Number(getComputedStyle(node).getPropertyValue('--zao-menu-reveal-progress')),
        ),
      ).toBe(1);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(popup).not.toBeVisible();
    });
  }
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  for (const field of choices) {
    test(`${field} opens and selects through native touch targets`, async ({ page }) => {
      await openPage(page, field, contexts[0]);
      const root = primary(page, field);
      await root.locator('[data-zao-slot="trigger"]').tap();
      const popup = root.locator('[data-zao-slot="popup"]');
      await expect(popup).toBeVisible();
      await settle(popup);
      await popup
        .getByRole('option', {
          name: field === 'combobox' ? 'East workspace' : 'Central',
          exact: true,
        })
        .tap();
      await expect(popup).not.toBeVisible();
      await expect(
        root.locator(field === 'combobox' ? '[data-zao-slot="input"]' : '[data-zao-slot="value"]'),
      )[field === 'combobox' ? 'toHaveValue' : 'toHaveText'](
        field === 'combobox' ? 'East workspace' : 'Central',
      );
    });
  }
});
