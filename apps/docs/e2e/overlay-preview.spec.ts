import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The preview and its content need visible bounds.');
  return box;
}

async function settle(popup: Locator) {
  await expect(popup).not.toHaveAttribute('data-starting-style', '');
  await popup.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

for (const mode of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1440, height: 500 },
    { width: 360, height: 800 },
    { width: 320, height: 600 },
  ]) {
    test(`${mode}: ${viewport.width}×${viewport.height} Menu preview contains its open overlay and keeps result and Usage clear`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/components/menu?style=quiet-instrument');
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
      await page.evaluate(async () => document.fonts.ready);
      await expect(page.locator('[data-anatomy-kind="menu"]')).toHaveAttribute(
        'data-anatomy-ready',
        'true',
      );
      const study = page.locator('.docs-menu-preview');
      const trigger = study.getByRole('button', { name: 'Workspace actions', exact: true });
      const result = study.locator('[aria-live="polite"]');
      const usage = page.getByRole('heading', { name: 'Usage', exact: true }).locator('..');
      const popup = study.getByRole('menu');
      await trigger.scrollIntoViewIfNeeded();
      if (viewport.height <= 600) {
        await trigger.evaluate((node) => {
          node.scrollIntoView({ block: 'end' });
          window.scrollBy(
            0,
            Number.parseFloat(getComputedStyle(node).getPropertyValue('--zao-space-2')),
          );
        });
      }
      await page.mouse.move(0, 0);
      await trigger.focus();
      const before = {
        study: await bounds(study),
        trigger: await bounds(trigger),
        result: await bounds(result),
        usage: await bounds(usage),
      };
      await page.keyboard.press('Enter');
      await expect(popup).toBeVisible();
      await settle(popup);
      await expect(popup).toHaveAttribute('data-side', viewport.height <= 600 ? 'top' : 'bottom');
      const after = {
        study: await bounds(study),
        trigger: await bounds(trigger),
        result: await bounds(result),
        usage: await bounds(usage),
      };
      expect(after).toEqual(before);
      const panel = await bounds(popup);
      const clearance = await popup.evaluate((node) =>
        Number.parseFloat(getComputedStyle(node).getPropertyValue('--zao-space-1')),
      );
      expect(panel.x - clearance).toBeGreaterThanOrEqual(after.study.x);
      expect(panel.x + panel.width + clearance).toBeLessThanOrEqual(
        after.study.x + after.study.width,
      );
      expect(panel.y - clearance).toBeGreaterThanOrEqual(after.study.y);
      expect(panel.y + panel.height + clearance).toBeLessThanOrEqual(
        after.study.y + after.study.height,
      );
      expect(panel.y + panel.height + clearance).toBeLessThanOrEqual(after.result.y);
      expect(panel.y + panel.height + clearance).toBeLessThanOrEqual(after.usage.y);
      await expect(
        popup.getByRole('menuitem', { name: 'Rename workspace', exact: true }),
      ).toBeFocused();
      const path = test.info().outputPath('contained-menu-preview.png');
      await page.screenshot({ path });
      await test.info().attach('contained Menu preview', { path, contentType: 'image/png' });
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await bounds(study)).toEqual(before.study);
      expect(await bounds(result)).toEqual(before.result);
    });
  }
}
