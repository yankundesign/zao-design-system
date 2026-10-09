import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const contexts = [
  { name: 'published Su light', study: false, mode: 'light' },
  { name: 'published Su dark', study: false, mode: 'dark' },
  { name: 'Quiet instrument light', study: true, mode: 'light' },
  { name: 'Quiet instrument dark', study: true, mode: 'dark' },
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

async function openSpecimen(page: Page, context: (typeof contexts)[number]) {
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await page.goto('/components/button');
  await expect(page.getByRole('heading', { level: 1, name: 'Button', exact: true })).toBeVisible();
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: context.mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  if (context.study) {
    await page.addStyleTag({
      content: await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      ),
    });
  }
  await page.evaluate(() => document.fonts.ready);
  const specimen = page.locator('[data-zao-specimen="button"]');
  await expect(page.locator('.study').first()).toHaveAttribute('data-zao-mode', context.mode);
  await page.mouse.move(0, 0);
  await settle(specimen);
  return specimen;
}

function face(button: Locator) {
  return button.locator(':scope > [data-zao-slot="face"]');
}

async function documentBox(element: Locator) {
  return element.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
  });
}

async function clickTarget(page: Page, button: Locator) {
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

for (const context of contexts) {
  test(`${context.name}: icon content stays decorative and follows shared size tokens`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, context);
    for (const [label, slots] of [
      ['Create workspace', ['leading-icon']],
      ['Open report', ['trailing-icon']],
      ['Read guide', ['trailing-action']],
      ['Export report', ['leading-icon', 'trailing-icon', 'trailing-action']],
    ] as const) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      await expect(button).toHaveAccessibleName(label);
      await expect(button.locator('svg')).toHaveCount(slots.length);
      await expect(button.getByRole('button')).toHaveCount(0);
      for (const slot of slots) {
        const icon = button.locator(`[data-zao-slot="${slot}"] > svg`);
        await expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        await expect(icon).toHaveAttribute('focusable', 'false');
        await expect(icon).toHaveCSS('width', '16px');
        await expect(icon).toHaveCSS('height', '16px');
      }
    }
    for (const [label, height, iconSize] of [
      ['Small', 28, 16],
      ['Default', 34, 16],
      ['Large', 40, 20],
    ] as const) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      expect((await documentBox(button)).height).toBe(height);
      await expect(button.locator('[data-zao-slot="leading-icon"] > svg')).toHaveCSS(
        'width',
        `${iconSize}px`,
      );
      await expect(button.locator('[data-zao-slot="leading-icon"] > svg')).toHaveCSS(
        'height',
        `${iconSize}px`,
      );
    }
  });

  test(`${context.name}: block width and far-edge action alignment work on a narrow canvas`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const specimen = await openSpecimen(page, context);
    const blockExample = specimen.locator('[data-zao-button-example="block"]');
    const button = blockExample.getByRole('button', { name: 'Continue setup', exact: true });
    const parent = await documentBox(blockExample);
    const target = await documentBox(button);
    expect(target.width).toBeCloseTo(parent.width, 2);
    expect(target.x).toBeCloseTo(parent.x, 2);
    const content = await documentBox(button.locator('[data-zao-slot="button-content"]'));
    const action = await documentBox(button.locator('[data-zao-slot="trailing-action"]'));
    expect(content.x - target.x).toBeCloseTo(16, 2);
    expect(target.x + target.width - action.x - action.width).toBeCloseTo(16, 2);
    expect(content.x + content.width).toBeLessThanOrEqual(action.x);
    const overflow = await specimen.evaluate((node) => ({
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      'Button content and live regions stay inside the document viewport',
    ).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
    const longLabel = specimen.getByRole('button', {
      name: 'Review preferences',
      exact: true,
    });
    await expect(longLabel).toHaveAccessibleName('Review preferences');
    expect((await documentBox(longLabel)).width).toBeLessThanOrEqual(parent.width);

    await page
      .locator('.study')
      .first()
      .evaluate((node) => node.setAttribute('dir', 'rtl'));
    await settle(specimen);
    expect(await documentBox(button)).toEqual(target);
    const rtlContent = await documentBox(button.locator('[data-zao-slot="button-content"]'));
    const rtlAction = await documentBox(button.locator('[data-zao-slot="trailing-action"]'));
    expect(target.x + target.width - rtlContent.x - rtlContent.width).toBeCloseTo(16, 2);
    expect(rtlAction.x - target.x).toBeCloseTo(16, 2);
    expect(rtlAction.x + rtlAction.width).toBeLessThanOrEqual(rtlContent.x);
  });

  test(`${context.name}: danger preserves the secondary frame and uses semantic danger ink`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, context);
    const danger = specimen.getByRole('button', { name: 'Delete workspace', exact: true });
    const secondary = specimen.getByRole('button', { name: 'Review details', exact: true });
    const paint = async (button: Locator) =>
      face(button).evaluate((node) => {
        const css = getComputedStyle(node);
        return {
          background: css.backgroundColor,
          border: css.boxShadow,
          radius: css.borderRadius,
          color: css.color,
        };
      });
    const reference = await paint(secondary);
    const actual = await paint(danger);
    expect(actual).toMatchObject({
      background: reference.background,
      border: reference.border,
      radius: reference.radius,
    });
    const semanticInk = await danger.evaluate((node) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--zao-color-danger-text)';
      node.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(actual.color).toBe(semanticInk);
  });

  test(`${context.name}: controlled loading retains focus and width while blocking activation and submit`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, context);
    const form = specimen.locator('[data-zao-button-demo="loading"]');
    const save = form.getByRole('button', { name: 'Save draft', exact: true });
    const complete = specimen.getByRole('button', { name: 'Complete demo', exact: true });
    const announcement = form.locator('[data-zao-slot="loading-announcement"]');
    await expect(announcement).toHaveCount(1);
    await expect(announcement).toHaveAttribute('aria-live', 'polite');
    await expect(announcement).toHaveText('');
    await announcement.evaluate((node) =>
      node.setAttribute('data-test-mounted-before-loading', ''),
    );
    await form.evaluate((node) => {
      node.dataset.nativeSubmissions = '0';
      node.addEventListener('submit', () => {
        node.dataset.nativeSubmissions = String(Number(node.dataset.nativeSubmissions) + 1);
      });
    });
    await form.getByRole('textbox', { name: 'Draft name', exact: true }).fill('Workspace draft');
    await save.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await settle(specimen);
    const targetBefore = await documentBox(save);
    const faceBefore = await documentBox(face(save));
    const neighborBefore = await documentBox(complete);
    await save.focus();
    await page.keyboard.down('Enter');
    await expect(save).toHaveAttribute('data-zao-loading', '');
    await expect(save).toHaveAttribute('aria-disabled', 'true');
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await expect(save).not.toHaveAttribute('data-zao-pressed', '');
    await page.keyboard.up('Enter');
    await settle(specimen);
    await expect(save).toBeFocused();
    expect(await save.evaluate((node) => (node as HTMLButtonElement).disabled)).toBe(false);
    await expect(save).toHaveAccessibleName('Save draft');
    await expect(announcement).toHaveAttribute('data-test-mounted-before-loading', '');
    await expect(announcement).toHaveAttribute('role', 'status');
    expect(await documentBox(save)).toEqual(targetBefore);
    expect(await documentBox(face(save))).toEqual(faceBefore);
    expect(await documentBox(complete)).toEqual(neighborBefore);
    await expect(
      save.locator('[data-zao-slot="leading-icon"] > [data-zao-slot="spinner"]'),
    ).toBeVisible();
    await expect(specimen.getByRole('status').filter({ hasText: /^Saving draft\.$/ })).toHaveText(
      'Saving draft.',
    );
    const outline = await save.evaluate((node) => {
      const css = getComputedStyle(node);
      return { style: css.outlineStyle, width: parseFloat(css.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThan(0);

    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await clickTarget(page, save);
    await save.evaluate((node) => (node as HTMLButtonElement).click());
    await settle(specimen);
    expect(await documentBox(face(save))).toEqual(faceBefore);
    await expect(save).not.toHaveAttribute('data-zao-pressed', '');
    await form.getByRole('textbox', { name: 'Draft name', exact: true }).press('Enter');
    await expect(form).toHaveAttribute('data-demo-clicks', '1');
    await expect(form).toHaveAttribute('data-demo-submissions', '1');
    await expect(form).toHaveAttribute('data-native-submissions', '1');

    await complete.click();
    await expect(save).not.toHaveAttribute('data-zao-loading', '');
    await expect(save).not.toHaveAttribute('aria-busy', 'true');
    await expect(save).toBeEnabled();
    await expect(save.locator('[data-zao-slot="spinner"]')).toHaveCount(0);
    await expect(announcement).toHaveText('');
    await expect(announcement).toHaveAttribute('data-test-mounted-before-loading', '');
    expect(await documentBox(save)).toEqual(targetBefore);
    await page.mouse.move(0, 0);
    await save.focus();
    await page.keyboard.press('Space');
    await expect(form).toHaveAttribute('data-demo-clicks', '2');
    await expect(form).toHaveAttribute('data-demo-submissions', '2');
    await expect(form).toHaveAttribute('data-native-submissions', '2');
    await expect(save).toHaveAttribute('data-zao-loading', '');
    await complete.click();
  });

  test(`${context.name}: loading chooses one slot, keeps its name and preserves native disabled`, async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, context);
    for (const [label, slot, iconCount] of [
      ['Save report', null, 1],
      ['Sync workspace', 'leading-icon', 3],
      ['Open summary', 'trailing-icon', 2],
      ['Delete draft', 'trailing-action', 1],
    ] as const) {
      const button = specimen.getByRole('button', { name: label, exact: true });
      await expect(button).toHaveAccessibleName(label);
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      const spinner = button.locator('[data-zao-slot="spinner"]');
      await expect(spinner).toHaveCount(1);
      await expect(spinner).toHaveAttribute('aria-hidden', 'true');
      await expect(spinner).toHaveAttribute('focusable', 'false');
      await expect(button.locator('svg')).toHaveCount(iconCount);
      await expect(spinner).toHaveCSS('animation-duration', '1s');
      await expect(spinner).toHaveCSS('animation-timing-function', 'linear');
      await expect(spinner).toHaveCSS('animation-iteration-count', 'infinite');
      if (slot) {
        await expect(
          button.locator(`[data-zao-slot="${slot}"] > [data-zao-slot="spinner"]`),
        ).toHaveCount(1);
        await expect(button.locator('[data-zao-slot="button-label"]')).toHaveCSS('opacity', '1');
      } else {
        await expect(button.locator('[data-zao-slot="button-label"]')).toHaveCSS('opacity', '0');
        const target = await documentBox(face(button));
        const indicator = await documentBox(spinner);
        expect(indicator.x + indicator.width / 2).toBeCloseTo(target.x + target.width / 2, 2);
        expect(indicator.y + indicator.height / 2).toBeCloseTo(target.y + target.height / 2, 2);
      }
    }
    const defaultAnnouncements = specimen.getByRole('status').filter({ hasText: /^Loading$/ });
    expect(await defaultAnnouncements.count()).toBeGreaterThanOrEqual(4);
    const disabled = specimen.getByRole('button', { name: 'Unavailable sync', exact: true });
    await expect(disabled).toBeDisabled();
    expect(await disabled.evaluate((node) => (node as HTMLButtonElement).disabled)).toBe(true);
    await disabled.focus();
    await expect(disabled).not.toBeFocused();
    const before = await documentBox(face(disabled));
    await clickTarget(page, disabled);
    await settle(specimen);
    expect(await documentBox(face(disabled))).toEqual(before);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const spinner of await specimen.locator('[data-zao-slot="spinner"]').all()) {
      await expect(spinner).toBeVisible();
      await expect(spinner).toHaveCSS('animation-name', 'none');
      await expect.poll(() => spinner.evaluate((node) => node.getAnimations().length)).toBe(0);
    }
  });
}

test('ordinary Buttons do not add live regions or widen horizontal Card scrollers', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/components/card');
  await expect(page.getByRole('heading', { level: 1, name: 'Card', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const scroller = page.getByRole('region', { name: 'Split card at 640 pixels', exact: true });
  // The storage chart owns a separate readout announcement; ordinary Buttons add none.
  await expect(scroller.locator('[data-zao-slot="loading-announcement"]')).toHaveCount(0);
  const sizes = await scroller.evaluate((node) => ({
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(sizes.scrollWidth).toBeGreaterThan(sizes.width);
  for (const edge of ['start', 'end'] as const) {
    await scroller.evaluate((node, side) => {
      node.scrollLeft = side === 'start' ? 0 : node.scrollWidth;
    }, edge);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `Button anatomy stays contained at the scroller's ${edge}`,
    ).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  }
});

test.describe('Button loading with touch', () => {
  test.use({ hasTouch: true, isMobile: true });
  test('touch starts once, blocks repeat activation, and resumes after host completion', async ({
    page,
  }) => {
    const specimen = await openSpecimen(page, contexts[2]);
    const form = specimen.locator('[data-zao-button-demo="loading"]');
    const save = form.getByRole('button', { name: 'Save draft', exact: true });
    const complete = specimen.getByRole('button', { name: 'Complete demo', exact: true });
    await save.scrollIntoViewIfNeeded();
    const before = await documentBox(face(save));
    await save.tap();
    await expect(save).toHaveAttribute('data-zao-loading', '');
    await settle(specimen);
    expect(await documentBox(face(save))).toEqual(before);
    const target = await save.boundingBox();
    expect(target).not.toBeNull();
    await page.touchscreen.tap(target!.x + target!.width / 2, target!.y + target!.height / 2);
    await expect(form).toHaveAttribute('data-demo-clicks', '1');
    await expect(form).toHaveAttribute('data-demo-submissions', '1');
    await expect(save).not.toHaveAttribute('data-zao-pressed', '');
    await complete.tap();
    await expect(save).toBeEnabled();
    await save.tap();
    await expect(form).toHaveAttribute('data-demo-clicks', '2');
    await expect(form).toHaveAttribute('data-demo-submissions', '2');
  });
});
