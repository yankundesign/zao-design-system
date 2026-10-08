import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const components = [
  { name: 'Combobox', slug: 'combobox' },
  { name: 'Dialog', slug: 'dialog' },
  { name: 'Menu', slug: 'menu' },
  { name: 'Progress', slug: 'progress' },
  { name: 'Select', slug: 'select' },
  { name: 'Switch', slug: 'switch' },
  { name: 'Tabs', slug: 'tabs' },
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

  const preview = page.locator('.study');
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

function specimen(page: Page, slug: string) {
  return page.locator(`[data-zao-specimen="${slug}"]`).first();
}

async function expectPopupBelowWithArrowSpace(trigger: Locator, popup: Locator, arrow: Locator) {
  await expect(popup).toBeVisible();
  const triggerBox = await trigger.boundingBox();
  const popupBox = await popup.boundingBox();
  const arrowBox = await arrow.boundingBox();
  if (!triggerBox || !popupBox || !arrowBox) {
    throw new Error('The trigger, popup, and arrow must have visible bounds.');
  }

  expect(popupBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 1);
  expect(triggerBox.x + triggerBox.width - arrowBox.x - arrowBox.width).toBeGreaterThanOrEqual(7);
}

test('docs navigation links to each new component page', async ({ page }) => {
  await page.goto('/components/button');
  const nav = page.getByRole('navigation', { name: 'Docs' });

  for (const { name, slug } of components) {
    await expect(nav.getByRole('link', { name })).toBeVisible();
  }

  for (const { name, slug } of components) {
    await nav.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(specimen(page, slug)).toBeVisible();
  }
});

test('Combobox filters, selects with the keyboard, and exposes disabled choices', async ({
  page,
}) => {
  await page.goto('/components/combobox');
  const preview = specimen(page, 'combobox');
  const destination = preview.getByRole('combobox', { name: 'Destination workspace' });
  await destination.fill('West');
  const popup = preview.locator('[data-zao-component="combobox"] [data-zao-slot="popup"]').last();
  await expect(popup.getByRole('option', { name: 'West workspace' })).toBeVisible();
  await expect(popup.getByRole('option', { name: 'East workspace' })).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(destination).toHaveValue('West workspace');

  const first = preview.locator('[data-zao-component="combobox"]').first();
  await first.locator('[data-zao-slot="trigger"]').click();
  await expect(first.getByRole('option', { name: 'Archive workspace' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(preview.getByRole('combobox', { name: 'Locked workspace' })).toBeDisabled();
});

test('Combobox popup opens below the field and leaves space after its arrow', async ({ page }) => {
  await page.goto('/components/combobox');
  const root = specimen(page, 'combobox').locator('[data-zao-component="combobox"]').first();
  const inputGroup = root.locator('[data-zao-slot="input-group"]');
  const trigger = root.locator('[data-zao-slot="trigger"]');
  await trigger.click();
  await expectPopupBelowWithArrowSpace(
    inputGroup,
    root.locator('[data-zao-slot="popup"]'),
    trigger.locator('svg'),
  );
});

test('Dialog moves focus inside, closes on Escape, and restores trigger focus', async ({
  page,
}) => {
  await page.goto('/components/dialog');
  const preview = specimen(page, 'dialog');
  const trigger = preview.getByRole('button', { name: 'Review access' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = preview.getByRole('dialog', { name: 'Review workspace access' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Approving gives the three invited members access')).toBeVisible();
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole('button', { name: 'Approve access' }).click();
  await expect(preview.getByText('Approved access for 3 members.')).toBeVisible();
});

test('Menu supports arrow navigation, action activation, Escape, and disabled items', async ({
  page,
}) => {
  await page.goto('/components/menu');
  const preview = specimen(page, 'menu');
  const root = preview.locator('[data-zao-component="menu"]');
  const trigger = root.getByRole('button', { name: 'Workspace actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popup = root.locator('[data-zao-slot="popup"]');
  await expect(popup).toBeVisible();
  await expect(popup.getByRole('menuitem', { name: 'Archive workspace' })).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(popup.getByRole('menuitem', { name: 'Rename workspace' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(popup.getByRole('menuitem', { name: 'Copy workspace ID' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(preview.getByText('Copied workspace ID.')).toBeVisible();

  await trigger.click();
  await expectPopupBelowWithArrowSpace(trigger, popup, trigger.locator('svg'));
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('Progress exposes the task values', async ({ page }) => {
  await page.goto('/components/progress');
  const preview = specimen(page, 'progress');
  await expect(preview.getByRole('progressbar', { name: 'Upload files' })).toHaveAttribute(
    'aria-valuenow',
    '68',
  );
  await expect(preview.getByRole('progressbar', { name: 'Prepare workspace' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
});

test('Select navigates with the keyboard and exposes invalid and disabled states', async ({
  page,
}) => {
  await page.goto('/components/select');
  const preview = specimen(page, 'select');
  const region = preview.locator('[data-zao-component="select"]').first();
  const trigger = region.locator('[data-zao-slot="trigger"]');
  await trigger.click();
  const popup = region.locator('[data-zao-slot="popup"]');
  await expectPopupBelowWithArrowSpace(trigger, popup, trigger.locator('svg'));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(region.locator('[data-zao-slot="value"]')).toHaveText('Central');

  const backup = preview.locator('[data-zao-component="select"]').nth(1);
  await expect(backup.locator('[data-zao-slot="trigger"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(backup.getByText('Choose a backup region.')).toBeVisible();
  await expect(
    preview.locator('[data-zao-component="select"]').nth(2).locator('[data-zao-slot="trigger"]'),
  ).toBeDisabled();
});

test('Switch toggles with Space while disabled switches stay fixed', async ({ page }) => {
  await page.goto('/components/switch');
  const preview = specimen(page, 'switch');
  const email = preview.getByRole('switch', { name: 'Email updates' });
  await expect(email).toBeChecked();
  await email.focus();
  await page.keyboard.press('Space');
  await expect(email).not.toBeChecked();
  await page.keyboard.press('Space');
  await expect(email).toBeChecked();
  await expect(preview.getByRole('switch', { name: 'Activity alerts' })).not.toBeChecked();
  await expect(preview.getByRole('switch', { name: 'Locked setting' })).toBeDisabled();
});

test('Tabs activate panels with arrow keys while a disabled tab stays inactive', async ({
  page,
}) => {
  await page.goto('/components/tabs');
  const preview = specimen(page, 'tabs');
  const tabs = preview.getByRole('tablist', { name: 'Workspace views' });
  const overview = tabs.getByRole('tab', { name: 'Overview' });
  const activity = tabs.getByRole('tab', { name: 'Activity' });
  const permissions = tabs.getByRole('tab', { name: 'Permissions' });
  const archive = tabs.getByRole('tab', { name: 'Archive' });
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(activity).toHaveAttribute('aria-selected', 'true');
  await expect(preview.getByRole('tabpanel', { name: 'Activity' })).toContainText(
    'Recent activity',
  );
  await page.keyboard.press('ArrowRight');
  await expect(permissions).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(archive).toBeDisabled();
  await expect(archive).toBeFocused();
  await expect(archive).toHaveAttribute('aria-selected', 'false');
  await expect(permissions).toHaveAttribute('aria-selected', 'true');
  await expect(preview.getByRole('tabpanel', { name: 'Permissions' })).toContainText(
    'Members can view shared files.',
  );
});

test('floating component previews keep the selected Su study on open popups', async ({ page }) => {
  for (const slug of ['combobox', 'select', 'menu', 'dialog']) {
    await page.goto(`/components/${slug}?style=quiet-instrument`);
    const study = page.locator('.study[data-study="quiet-instrument"]');
    await expect(study).toBeVisible();
    const preview = specimen(page, slug);
    await preview.locator('[data-zao-slot="trigger"]').first().click();
    const popup = preview.locator('[data-zao-slot="popup"]').first();
    await expect(popup).toBeVisible();
    await expect
      .poll(() =>
        popup.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--test-style-id').trim(),
        ),
      )
      .toBe('quiet-instrument');
  }
});

test('choice popups remain visible at the bottom edge in each finish', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });

  for (const finish of finishes) {
    for (const slug of ['combobox', 'select', 'menu']) {
      await page.goto(`/components/${slug}`);
      await chooseFinish(page, finish.theme, finish.mode);
      const root = specimen(page, slug);
      const trigger = root.locator('[data-zao-slot="trigger"]').first();
      await trigger.evaluate((element) => {
        const study = element.closest('.study') as HTMLElement;
        study.style.marginTop = `${760 - element.getBoundingClientRect().bottom}px`;
      });
      await trigger.click();

      const popup = root.locator('[data-zao-slot="popup"]').first();
      await expect(popup).toBeVisible();
      const popupBox = await popup.boundingBox();
      const triggerBox = await trigger.boundingBox();
      expect(popupBox).not.toBeNull();
      expect(triggerBox).not.toBeNull();
      expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(800);
      expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(triggerBox!.y);
    }
  }
});

for (const finish of finishes) {
  for (const component of components) {
    test(`${component.name} has no axe violations in ${finish.name}`, async ({ page }) => {
      await page.goto(`/components/${component.slug}`);
      await chooseFinish(page, finish.theme, finish.mode);
      const preview = page.locator('.study');
      await expect(preview.locator(`[data-zao-specimen="${component.slug}"]`)).toBeVisible();

      const { violations } = await new AxeBuilder({ page })
        .include(`[data-zao-specimen="${component.slug}"]`)
        .analyze();
      expect(
        violations.map(({ id, nodes }) => ({
          id,
          nodes: nodes.map(({ target, failureSummary, any }) => ({
            target,
            failureSummary,
            checks: any.map(({ id: checkId, data }) => ({ id: checkId, data })),
          })),
        })),
      ).toEqual([]);
    });
  }
}
