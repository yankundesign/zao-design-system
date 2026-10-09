import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const components = [
  { name: 'Button', slug: 'button' },
  { name: 'IconButton', slug: 'icon-button' },
  { name: 'TextField', slug: 'text-field' },
  { name: 'Card', slug: 'card' },
] as const;

const finishes = [
  { name: 'Su light', theme: 'su', mode: 'light' },
  { name: 'Su dark', theme: 'su', mode: 'dark' },
] as const;

async function chooseFinish(page: Page, theme: 'su', mode: 'light' | 'dark') {
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark' })
    .click();

  const preview = page.locator('.study').first();
  await expect(preview).toHaveAttribute('data-zao-theme', theme);
  await expect(preview).toHaveAttribute('data-zao-mode', mode);
  await preview.evaluate(async (element) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const finiteAnimations = element
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
    await Promise.all(
      finiteAnimations.map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

test('component pages are discoverable in docs navigation', async ({ page }) => {
  await page.goto('/components/button');
  const nav = page.getByRole('navigation', { name: 'Docs' });

  for (const { name, slug } of components) {
    const link = nav.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/components/${slug}(?:\\?|$)`));
    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  }
});

test('mobile docs navigation keeps the current component in view', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/components/card?style=quiet-instrument');

  const disclosure = page.getByText('Browse docs · Components / Card');
  await expect(disclosure).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Card' })).toBeInViewport();
  await expect(page.getByRole('navigation', { name: 'Docs' })).toHaveCount(0);

  await disclosure.click();
  const nav = page.getByRole('navigation', { name: 'Docs' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Card' })).toHaveAttribute('aria-current', 'page');
});

test('the chosen Su study is present in the server-rendered preview', async ({ request }) => {
  for (const suffix of ['', '?style=quiet-instrument']) {
    const response = await request.get(`/components/button${suffix}`);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('data-study="quiet-instrument"');
    expect(html).toContain('Quiet instrument');
    expect(html).not.toContain('data-style-select-trigger');
  }
});

test('Button supports keyboard activation and disabled state', async ({ page }) => {
  await page.goto('/components/button');
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();

  const specimen = page.locator('[data-zao-specimen="button"]').first();
  const primary = specimen.getByRole('button', { name: 'Save changes' });
  await expect(specimen.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();

  await primary.evaluate((element) => {
    element.addEventListener('click', () => {
      const count = Number(element.dataset.keyboardActivations ?? 0);
      element.dataset.keyboardActivations = String(count + 1);
    });
  });
  await primary.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(primary).toHaveAttribute('data-keyboard-activations', '2');

  await page.keyboard.press('Tab');
  await expect(specimen.getByRole('button', { name: 'Review details' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(specimen.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    specimen.getByRole('button', { name: 'Delete workspace', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(specimen.getByRole('button', { name: 'Small', exact: true })).toBeFocused();
});

test('TextField shows guidance and errors, accepts editing, and disables input', async ({
  page,
}) => {
  await page.goto('/components/text-field');
  await expect(page.getByRole('heading', { level: 1, name: 'TextField' })).toBeVisible();

  const specimen = page.locator('[data-zao-specimen="text-field"]').first();
  const name = specimen.getByRole('textbox', { name: 'Workspace name' });
  await expect(name).toHaveValue('North workspace');
  await expect(specimen.getByText('This name appears in invitations.')).toBeVisible();
  await name.fill('Updated workspace');
  await expect(name).toHaveValue('Updated workspace');

  const contact = specimen.getByRole('textbox', { name: 'Contact address' });
  await expect(contact).toHaveAttribute('aria-invalid', 'true');
  await expect(specimen.getByText('Use a workspace email address.')).toBeVisible();
  await expect(specimen.getByRole('textbox', { name: 'Workspace ID' })).toBeDisabled();
});

test('Card keeps its heading, data, and figure semantics', async ({ page }) => {
  await page.goto('/components/card');
  await expect(page.getByRole('heading', { level: 1, name: 'Card' })).toBeVisible();

  const specimen = page.locator('[data-zao-specimen="card"]').first();
  const card = specimen.locator('[data-zao-component="card"]');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('heading', { name: 'North workspace' })).toBeVisible();
  await expect(card.getByText('Active members')).toBeVisible();
  await expect(card.getByRole('img', { name: 'Storage use at 68 percent' })).toBeVisible();
});

test('Su uses Quiet instrument without a style selector in light and dark', async ({ page }) => {
  await page.goto('/components/button');
  await chooseFinish(page, 'su', 'light');

  await expect(page.locator('[data-style-select-trigger]')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Compare with' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Context' })).toHaveCount(0);

  await expect.poll(() => new URL(page.url()).searchParams.get('style')).toBe('quiet-instrument');
  await expect(page.locator('.study[data-study="quiet-instrument"]')).toBeVisible();
  await expect(page.locator('[data-preview-style]')).toHaveCount(1);
  await expect(page.getByRole('complementary', { name: 'Design notes' })).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('.study[data-study="quiet-instrument"]')
        .evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--test-style-id').trim(),
        ),
    )
    .toBe('quiet-instrument');

  await chooseFinish(page, 'su', 'dark');
  await expect(page.locator('.study[data-study="quiet-instrument"]')).toHaveAttribute(
    'data-zao-mode',
    'dark',
  );

  await expect(page.locator('[data-style-select-trigger]')).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Design notes' })).toHaveCount(0);
});

for (const context of finishes) {
  for (const component of components) {
    test(component.name + ' has no axe violations in ' + context.name, async ({ page }) => {
      await page.goto('/components/' + component.slug);
      await chooseFinish(page, context.theme, context.mode);

      const preview = page.locator('.study');
      await expect(preview).toHaveAttribute('data-study', 'quiet-instrument');
      await expect(preview).toHaveAttribute('data-zao-theme', context.theme);
      await expect(preview).toHaveAttribute('data-zao-mode', context.mode);
      const specimens = preview.locator('[data-zao-specimen="' + component.slug + '"]');
      await expect(specimens).toHaveCount(component.slug === 'card' ? 2 : 1);
      for (const specimen of await specimens.all()) {
        await expect(specimen).toBeVisible();
      }

      const { violations } = await new AxeBuilder({ page })
        .include('[data-zao-specimen="' + component.slug + '"]')
        .analyze();
      expect(
        violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target),
        })),
      ).toEqual([]);
    });
  }
}

test('Quiet instrument stays scoped and carries across component pages', async ({ page }) => {
  await page.goto('/components/button');
  await chooseFinish(page, 'su', 'light');
  const shellBackground = await page
    .locator('body > header')
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  const quiet = page.locator('.study[data-study="quiet-instrument"]');
  await expect(quiet.locator('[data-zao-specimen="button"]')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Design notes' })).toHaveCount(0);

  await expect
    .poll(() =>
      quiet.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--test-style-id').trim(),
      ),
    )
    .toBe('quiet-instrument');
  await expect
    .poll(() =>
      page
        .locator('body > header')
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe(shellBackground);

  await page
    .getByRole('navigation', { name: 'Docs' })
    .getByRole('link', { name: 'TextField' })
    .click();
  await expect.poll(() => new URL(page.url()).searchParams.get('style')).toBe('quiet-instrument');
  await expect(quiet.locator('[data-zao-specimen="text-field"]')).toBeVisible();

  await page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Card' }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('style')).toBe('quiet-instrument');
  const cards = quiet.locator('[data-zao-specimen="card"]');
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    await expect(card).toBeVisible();
  }
});

test('saved Yu preferences fall back to Su and preserve light, dark, and system mode', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('zao-theme') === null) {
      localStorage.setItem('zao-theme', 'yu');
      localStorage.setItem('zao-mode', 'light');
    }
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-zao-theme', 'su');
  await expect(page.locator('html')).toHaveAttribute('data-zao-mode', 'light');
  await expect(page.getByRole('radiogroup', { name: 'Finish' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Yu 玉' })).toHaveCount(0);
  await expect(page.getByText('Yu 玉 · jade · dark')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('zao-theme'))).toBe('su');

  await page.goto('/components/text-field');
  const preview = page.locator('.study[data-study="quiet-instrument"]');
  await expect(preview).toHaveAttribute('data-zao-theme', 'su');
  await expect(preview).toHaveAttribute('data-zao-mode', 'light');
  await expect(page.locator('[data-style-select-trigger]')).toHaveCount(0);

  await chooseFinish(page, 'su', 'dark');
  await page.reload();
  await expect(preview).toHaveAttribute('data-zao-mode', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('radio', { name: 'System', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-zao-mode');
  await expect(preview).toHaveAttribute('data-zao-mode', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(preview).toHaveAttribute('data-zao-mode', 'light');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'System', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('html')).toHaveAttribute('data-zao-theme', 'su');
});

test('legacy style, comparison, and context parameters do not restore removed controls', async ({
  page,
}) => {
  await page.goto(
    '/components/button?style=calibration-sheet&compare=quiet-instrument&context=yu-dark',
  );
  await chooseFinish(page, 'su', 'light');

  await expect(page.locator('[data-style-select-trigger]')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Compare with' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Context' })).toHaveCount(0);
  await expect(page.locator('[data-preview-style]')).toHaveCount(1);
  await expect(page.locator('.study[data-study="quiet-instrument"]')).toHaveAttribute(
    'data-zao-theme',
    'su',
  );
  await expect(page.locator('.study[data-study="calibration-sheet"]')).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Design notes' })).toHaveCount(0);
});
