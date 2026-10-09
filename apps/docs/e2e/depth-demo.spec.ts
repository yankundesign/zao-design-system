import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const parts = [
  'button',
  'card',
  'menu',
  'switch',
  'tabs',
  'progress',
  'composer',
  'field',
] as const;
type Part = (typeof parts)[number];

async function settle(island: Locator) {
  await island.evaluate(async (element) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function openDemo(page: Page, mode: 'light' | 'dark') {
  await page.goto('/foundations/depth');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  // The normal E2E fixture identifies this study. Exercise its real field popup rules too.
  await page.addStyleTag({
    content: await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    ),
  });
  await page.evaluate(() => document.fonts.ready);
  const island = page.locator('[data-depth-island]');
  await expect(island).toHaveAttribute('data-zao-mode', mode);
  await expect(island).toHaveAttribute('data-depth-scale', '1');
  await page.mouse.move(0, 0);
  await settle(island);
  return island;
}

async function setScale(page: Page, value: number) {
  await page.getByRole('slider', { name: 'Depth scale' }).evaluate((element, next) => {
    // Change a native range without moving focus out of an open popup.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(element, String(next));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await expect(page.locator('[data-depth-island]')).toHaveAttribute(
    'data-depth-scale',
    String(value),
  );
}

async function layout(island: Locator) {
  return island.evaluate((element) => {
    const rect = (node: Element) => {
      const box = node.getBoundingClientRect();
      return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
    };
    const fixed = [
      element,
      ...element.querySelectorAll(
        '[data-depth-part], [data-zao-component], [data-zao-field-frame], [data-zao-slot="popup"], [data-zao-slot="track"], [data-zao-slot="writing"], [role], button, textarea, label, h3, h4, p, dl, dt, dd',
      ),
    ]
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && getComputedStyle(node).visibility !== 'hidden';
      })
      .map((node) => {
        const css = getComputedStyle(node);
        return {
          box: rect(node),
          clientWidth: node.clientWidth,
          clientHeight: node.clientHeight,
          border: [
            css.borderTopWidth,
            css.borderRightWidth,
            css.borderBottomWidth,
            css.borderLeftWidth,
          ],
          padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
        };
      });
    const text: {
      value: string;
      boxes: { x: number; y: number; width: number; height: number }[];
    }[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement!;
      if (!node.textContent?.trim() || parent.closest('[aria-hidden="true"], .sr-only')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const origin = parent.closest('[data-zao-slot="face"]')?.getBoundingClientRect();
      const boxes = [...range.getClientRects()]
        .filter((box) => box.width > 0 && box.height > 0)
        .map((box) => ({
          x: origin ? box.x - origin.x : box.x + scrollX,
          y: origin ? box.y - origin.y : box.y + scrollY,
          width: box.width,
          height: box.height,
        }));
      if (boxes.length) text.push({ value: node.textContent, boxes });
    }
    const neighbors = [
      ...document.querySelectorAll('[data-depth-controls], [data-depth-result], footer'),
    ].map(rect);
    return { fixed, text, neighbors };
  });
}

async function paint(part: Locator, name: Part) {
  return part.evaluate((element, kind) => {
    const target = element.querySelector<HTMLElement>(
      kind === 'field' ? '[data-zao-component="select"]' : `[data-zao-component="${kind}"]`,
    )!;
    const style = (node: Element, pseudo?: string) => getComputedStyle(node, pseudo);
    const matrix = (value: string) => {
      const transform = new DOMMatrixReadOnly(value);
      return [transform.m41, transform.m42];
    };
    const shadow = (value: string) =>
      [...value.matchAll(/(-?\d*\.?\d+)px/g)].map((match) => Number(match[1]));
    const distance = parseFloat(style(target).getPropertyValue('--zao-depth-contact'));
    let offset: number[];
    if (kind === 'button') {
      offset = matrix(style(target, '::before').transform);
    } else if (kind === 'card') {
      offset = shadow(style(target).boxShadow).slice(0, 2);
    } else if (kind === 'switch') {
      offset = matrix(style(target.querySelector('[data-zao-slot="face"]')!).transform);
    } else if (kind === 'tabs') {
      offset = shadow(style(target.querySelector('[data-zao-slot="indicator"]')!).boxShadow).slice(
        0,
        2,
      );
    } else if (kind === 'progress') {
      offset = shadow(style(target.querySelector('[data-zao-slot="track"]')!).boxShadow).slice(
        0,
        2,
      );
    } else if (kind === 'composer') {
      offset = shadow(style(target).boxShadow).slice(0, 2);
    } else {
      offset = shadow(style(target.querySelector('[data-zao-slot="popup"]')!).boxShadow).slice(
        0,
        2,
      );
    }
    return { distance, offset };
  }, name);
}

for (const mode of ['light', 'dark'] as const) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test.describe(`Su ${mode}, motion ${reducedMotion}`, () => {
      test.use({ reducedMotion, viewport: { width: 1440, height: 1200 } });

      for (const name of parts) {
        test(`${name} follows the shared scale through paint while layout stays fixed`, async ({
          page,
        }) => {
          const island = await openDemo(page, mode);
          const part = island.locator(`[data-depth-part="${name}"]`);
          if (name === 'menu' || name === 'field') {
            await part.locator('[data-zao-slot="trigger"]').click();
            const popup = part.locator('[data-zao-slot="popup"]');
            await expect(popup).toBeVisible();
            await expect(popup).not.toHaveAttribute('data-starting-style', '');
            await page.mouse.move(0, 0);
            await settle(island);
          }
          const base = await paint(part, name);
          const before = await layout(island);
          expect(base.distance).toBeGreaterThan(0);
          expect(base.offset.some((value) => Math.abs(value) > 0)).toBe(true);

          for (const scale of [0, 4]) {
            await setScale(page, scale);
            await settle(island);
            const changed = await paint(part, name);
            expect(changed.distance).toBeCloseTo(base.distance * scale, 5);
            expect(changed.offset).toHaveLength(base.offset.length);
            for (const [index, offset] of changed.offset.entries()) {
              expect(offset).toBeCloseTo(base.offset[index]! * scale, 5);
            }
            expect(await layout(island)).toEqual(before);
          }
          const progress = island.getByRole('progressbar', { name: 'Preview file upload' });
          await expect(progress).toHaveAttribute('aria-valuenow', '68');
          const ratio = await progress.evaluate((element) => {
            const track = element.querySelector('[data-zao-slot="track"]')!.getBoundingClientRect();
            const face = element
              .querySelector('[data-zao-slot="indicator"]')!
              .getBoundingClientRect();
            return face.width / track.width;
          });
          expect(ratio).toBeCloseTo(0.68, 3);
        });
      }
    });
  }

  test(`Su ${mode}: the scale is labeled, keyboard operable, local, and resets`, async ({
    page,
  }) => {
    const island = await openDemo(page, mode);
    const slider = page.getByRole('slider', { name: 'Depth scale' });
    await expect(slider).toHaveAttribute('aria-valuetext', '1.00 times the published depth');
    const outside = await page.locator('html').evaluate((element) => {
      const css = getComputedStyle(element);
      return [
        css.getPropertyValue('--zao-depth-contact'),
        css.getPropertyValue('--zao-depth-lift'),
      ];
    });
    await slider.focus();
    await slider.press('ArrowRight');
    await expect(island).toHaveAttribute('data-depth-scale', '1.01');
    await slider.press('End');
    await expect(island).toHaveAttribute('data-depth-scale', '4');
    await expect(slider).toHaveAttribute('aria-valuetext', '4.00 times the published depth');
    await slider.press('Home');
    await expect(island).toHaveAttribute('data-depth-scale', '0');
    await page.getByRole('button', { name: 'Reset depth', exact: true }).click();
    await expect(island).toHaveAttribute('data-depth-scale', '1');
    expect(
      await page.locator('html').evaluate((element) => {
        const css = getComputedStyle(element);
        return [
          css.getPropertyValue('--zao-depth-contact'),
          css.getPropertyValue('--zao-depth-lift'),
        ];
      }),
    ).toEqual(outside);
  });

  test(`Su ${mode}: zero depth retains native states and records the lost spatial hover cue`, async ({
    page,
  }, testInfo) => {
    const island = await openDemo(page, mode);
    await setScale(page, 0);
    const approve = island.getByRole('button', { name: 'Approve preview', exact: true });
    for (const button of [
      approve,
      island.getByRole('button', { name: 'Review storage', exact: true }),
    ]) {
      const face = button.locator(':scope > [data-zao-slot="face"]');
      await page.mouse.move(0, 0);
      await settle(island);
      const resting = await face.evaluate((element) => {
        const css = getComputedStyle(element);
        return { fill: css.backgroundColor, transform: css.transform, edge: css.boxShadow };
      });
      await button.hover();
      await settle(island);
      const hovered = await face.evaluate((element) => {
        const css = getComputedStyle(element);
        return { fill: css.backgroundColor, transform: css.transform, edge: css.boxShadow };
      });
      expect(hovered).toEqual(resting);
    }
    testInfo.annotations.push({
      type: 'finding',
      description:
        'At zero depth with normal motion, primary and secondary Button lose their spatial hover cue; approved resting and hovered fills and edges are identical. The demo does not add a substitute cue.',
    });
    await approve.click();
    await expect(page.locator('[data-depth-result]')).toContainText('Approved the local preview.');
    await expect(island.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
    const setting = island.getByRole('switch', { name: 'Preview email updates' });
    await expect(setting).toBeChecked();
    await setting.click();
    await expect(setting).not.toBeChecked();
    const tabs = island.getByRole('tablist', { name: 'Preview workspace views' });
    await tabs.getByRole('tab', { name: 'Activity', exact: true }).click();
    await expect(tabs.getByRole('tab', { name: 'Activity', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(tabs.getByRole('tab', { name: 'Archive', exact: true })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    const field = island.locator('[data-depth-part="field"]');
    await field.locator('[data-zao-slot="trigger"]').click();
    await expect(field.getByRole('option', { name: 'West', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      field.getByRole('option', { name: 'Archived region', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    const draft = island.getByRole('textbox', { name: 'Preview request', exact: true });
    await expect(draft).toHaveValue('Review storage use.');
    await draft.focus();
    await expect(draft).toBeFocused();
  });
}
