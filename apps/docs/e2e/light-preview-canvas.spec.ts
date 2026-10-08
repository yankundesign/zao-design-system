import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const components = [
  'button',
  'icon-button',
  'text-field',
  'card',
  'combobox',
  'dialog',
  'menu',
  'progress',
  'select',
  'switch',
  'table',
  'tabs',
] as const;

test('all light component previews use the surrounding page canvas', async ({ page }) => {
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );

  for (const component of components) {
    await test.step(component, async () => {
      await page.goto(`/components/${component}?style=quiet-instrument`);

      await page.getByRole('radio', { name: 'Light', exact: true }).click();
      await page.addStyleTag({ content: css });

      const preview = page.locator('.study');
      await expect(preview).toHaveAttribute('data-zao-mode', 'light');
      const canvas = await page
        .locator('body')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      await expect(preview).toHaveCSS('background-color', canvas);

      if (component === 'table') {
        await expect(preview.locator('[data-zao-component="table"]')).toHaveCSS(
          'background-color',
          canvas,
        );
      }
    });
  }
});
