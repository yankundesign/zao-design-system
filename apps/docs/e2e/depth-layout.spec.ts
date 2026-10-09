import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const components = [
  'button',
  'icon-button',
  'card',
  'menu',
  'switch',
  'progress',
  'composer',
  'conversation',
  'dialog',
  'table',
  'tabs',
  'text-field',
  'combobox',
  'select',
] as const;
type Component = (typeof components)[number];

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

async function openIsland(page: Page, component: Component, mode: 'light' | 'dark') {
  await page.goto(`/components/${component}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  await page.addStyleTag({
    content: await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    ),
  });
  await page.evaluate(() => document.fonts.ready);
  const island = page.locator('.study').first();
  await expect(island).toHaveAttribute('data-zao-mode', mode);

  // Field depth belongs to the floating choice frame; open it before measuring.
  if (component === 'menu' || component === 'combobox' || component === 'select') {
    const root = island.locator(`[data-zao-component="${component}"]`).first();
    await root.locator('[data-zao-slot="trigger"]').click();
    const popup = root.locator('[data-zao-slot="popup"]');
    await expect(popup).toBeVisible();
    await expect(popup).not.toHaveAttribute('data-starting-style', '');
  }
  await page.mouse.move(0, 0);
  await settle(island);
  return island;
}

async function layout(island: Locator) {
  return island.evaluate((element) => {
    const rect = (node: Element) => {
      const box = node.getBoundingClientRect();
      return {
        x: box.x + scrollX,
        y: box.y + scrollY,
        width: box.width,
        height: box.height,
      };
    };
    const selector = [
      '[data-zao-component]',
      '[data-zao-field-frame]',
      '[data-zao-slot="popup"]',
      '[data-zao-slot="items"]',
      '[data-zao-slot="track"]',
      '[data-zao-slot="writing"]',
      '[role]',
      'button',
      'input',
      'textarea',
      'label',
      'h3',
      'h4',
      'p',
      'dl',
      'dt',
      'dd',
    ].join(',');
    const boxes = [element, ...element.querySelectorAll<HTMLElement>(selector)]
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && getComputedStyle(node).visibility !== 'hidden';
      })
      .map((node) => {
        const css = getComputedStyle(node);
        return {
          tag: node.tagName,
          slot: node.getAttribute('data-zao-slot'),
          box: rect(node),
          clientWidth: node.clientWidth,
          clientHeight: node.clientHeight,
          // An unchanged outer box can hide shifted field text or smaller content space.
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
      // Button's approved label travels with its face. Its layout within that face stays fixed.
      const face = parent.closest('[data-zao-slot="face"]');
      const origin = face?.getBoundingClientRect();
      const fragments = [...range.getClientRects()]
        .filter((box) => box.width > 0 && box.height > 0)
        .map((box) => ({
          x: origin ? box.x - origin.x : box.x + scrollX,
          y: origin ? box.y - origin.y : box.y + scrollY,
          width: box.width,
          height: box.height,
        }));
      if (fragments.length) text.push({ value: node.textContent, boxes: fragments });
    }

    const neighbors = [
      ...document.querySelectorAll('main > div > header, main > div > section, footer'),
    ]
      .filter((node) => !element.contains(node))
      .map(rect);
    return { boxes, text, neighbors };
  });
}

for (const mode of ['light', 'dark'] as const) {
  for (const component of components) {
    test(`Su ${mode}: ${component} depth changes keep content, targets, and neighbors in place`, async ({
      page,
    }) => {
      const island = await openIsland(page, component, mode);
      const before = await layout(island);
      expect(before.boxes.length).toBeGreaterThan(1);
      expect(before.text.length).toBeGreaterThan(0);
      expect(before.neighbors.length).toBeGreaterThan(1);
      const outsideDepth = await page.locator('html').evaluate((element) => {
        const css = getComputedStyle(element);
        return [
          css.getPropertyValue('--zao-depth-contact'),
          css.getPropertyValue('--zao-depth-lift'),
        ];
      });

      for (const distance of [0, 4]) {
        await island.evaluate((element, value) => {
          element.style.setProperty('--zao-depth-contact', `${value}px`);
          element.style.setProperty('--zao-depth-lift', `${value * 2}px`);
        }, distance);
        await settle(island);
        expect(await layout(island)).toEqual(before);
        expect(
          await page.locator('html').evaluate((element) => {
            const css = getComputedStyle(element);
            return [
              css.getPropertyValue('--zao-depth-contact'),
              css.getPropertyValue('--zao-depth-lift'),
            ];
          }),
        ).toEqual(outsideDepth);
      }
    });
  }
}
