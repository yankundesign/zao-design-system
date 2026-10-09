import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const modes = ['light', 'dark'] as const;
const paints = ['published Su', 'real Quiet instrument'] as const;
const promoted = {
  '--zao-radius-action': '0px',
  '--zao-radius-control': '2px',
  '--zao-radius-surface': '2px',
  '--zao-radius-overlay': '2px',
  '--zao-motion-duration-fast': '80ms',
};

async function openPreview(
  page: Page,
  component: string,
  mode: 'light' | 'dark',
  paint: (typeof paints)[number],
) {
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await page.goto(`/components/${component}`);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  if (paint === 'real Quiet instrument') {
    const css = await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    );
    // The promoted groups must inherit Su even when the remaining study is loaded.
    for (const variable of Object.keys(promoted)) {
      expect(css, `${variable} is no longer a study declaration`).not.toMatch(
        new RegExp(`${variable}\\s*:`),
      );
    }
    await page.addStyleTag({ content: css });
  }
  await page.evaluate(() => document.fonts.ready);
  return page.locator('.study').first();
}

for (const mode of modes) {
  for (const paint of paints) {
    test(`${paint}, ${mode}: promoted radius and fast motion come from Su without study overrides`, async ({
      page,
    }) => {
      let island = await openPreview(page, 'button', mode, paint);
      expect(
        await island.evaluate((node, variables) => {
          const style = getComputedStyle(node);
          return Object.fromEntries(
            variables.map((variable) => [variable, style.getPropertyValue(variable).trim()]),
          );
        }, Object.keys(promoted)),
      ).toEqual(promoted);

      const button = island.getByRole('button', { name: 'Save changes', exact: true });
      const construction = await button.evaluate((node) => {
        const face = getComputedStyle(node.querySelector('[data-zao-slot="face"]')!);
        return {
          rootRadius: getComputedStyle(node).borderRadius,
          faceRadius: face.borderRadius,
          baseRadius: getComputedStyle(node, '::before').borderRadius,
          sideRadius: getComputedStyle(node, '::after').borderRadius,
          durations: face.transitionDuration.split(',').map((duration) => duration.trim()),
        };
      });
      expect(construction).toEqual({
        rootRadius: '0px',
        faceRadius: '0px',
        baseRadius: '0px',
        sideRadius: '0px',
        durations: ['0.08s', '0.08s', '0.08s'],
      });

      island = await openPreview(page, 'card', mode, paint);
      const card = island.locator('[data-zao-component="card"]').first();
      expect(
        await card.evaluate((node) => ({
          surfaceToken: getComputedStyle(node).getPropertyValue('--zao-radius-surface').trim(),
          face: getComputedStyle(node).borderRadius,
          rearContent: getComputedStyle(node, '::before').content,
        })),
      ).toEqual({ surfaceToken: '2px', face: '0px', rearContent: 'none' });
    });
  }

  test(`published Su, ${mode}: Button construction follows an island action-radius token`, async ({
    page,
  }) => {
    const island = await openPreview(page, 'button', mode, 'published Su');
    const button = island.getByRole('button', { name: 'Save changes', exact: true });
    const before = await button.boundingBox();
    // Reuse another approved radius to prove the component reads its finish token.
    await island.evaluate((node) => {
      (node as HTMLElement).style.setProperty('--zao-radius-action', 'var(--zao-radius-control)');
    });
    expect(
      await button.evaluate((node) => [
        getComputedStyle(node).borderRadius,
        getComputedStyle(node.querySelector('[data-zao-slot="face"]')!).borderRadius,
        getComputedStyle(node, '::before').borderRadius,
      ]),
    ).toEqual(['2px', '2px', '2px']);
    expect(await button.boundingBox()).toEqual(before);
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    expect(await button.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
  });
}
