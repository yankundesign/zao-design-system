import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/*
 * Azurite plan (Nov 14). Where the seal goes beyond the primary action: the committed check in
 * Select and Combobox (S1), Table's checked box (S2), Plan's running marker (S4), every chart's
 * accent mark (C1-C3) and the header's Seal switch (L2). What stays ink in either seal: focus,
 * Progress's reading and data ink. The landing's picked course (L1) is covered in landing.spec.
 */

const modes = ['light', 'dark'] as const;
const seals = ['ink', 'azurite'] as const;
type Mode = (typeof modes)[number];
type Seal = (typeof seals)[number];
type Property = 'color' | 'backgroundColor' | 'borderTopColor' | 'fill' | 'stroke' | 'outlineColor';

async function open(page: Page, route: string, mode: Mode, seal: Seal) {
  await page.addInitScript(
    ([modeValue, sealValue]) => {
      localStorage.setItem('zao-mode', modeValue!);
      localStorage.setItem('zao-seal', sealValue!);
    },
    [mode, seal],
  );
  await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' });
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('data-zao-mode', mode);
  await expect(page.locator('html')).toHaveAttribute('data-zao-seal', seal);
  await page.evaluate(() => document.fonts.ready);
}

/** What a semantic role resolves to for a property, read beside the part it is compared with. */
function role(scope: Locator, property: Property, token: string) {
  return scope.evaluate(
    (node, [name, variable]) => {
      const host = node instanceof SVGElement ? node.closest('svg')!.parentElement! : node;
      const sample = document.createElement('span');
      sample.style.transition = 'none';
      sample.style[name as 'color'] = `var(${variable})`;
      host.append(sample);
      const value = getComputedStyle(sample)[name as 'color'];
      sample.remove();
      return value;
    },
    [property, token] as const,
  );
}

function paint(part: Locator, property: Property, pseudo?: '::before' | '::after') {
  return part.evaluate(
    (node, [name, pseudoElement]) => getComputedStyle(node, pseudoElement)[name as 'color'],
    [property, pseudo] as const,
  );
}

const preview = (page: Page) => page.locator('[data-preview-style]').first();

for (const mode of modes) {
  for (const seal of seals) {
    const name = `${mode}, ${seal} seal`;
    const sealSolid = `--zao-color-seal-${seal}-solid`;

    test(`${name}: the committed check in Select and Combobox carries the seal's text role`, async ({
      page,
    }) => {
      for (const [route, specimen, option] of [
        ['/components/select', 'select', 'West'],
        ['/components/combobox', 'combobox', 'North workspace'],
      ] as const) {
        await open(page, route, mode, seal);
        const root = page.locator(`[data-zao-specimen="${specimen}"] > *`).first();
        await root.locator('[data-zao-slot="trigger"]').click();
        const popup = root.locator('[data-zao-slot="popup"]');
        const check = popup
          .getByRole('option', { name: option, exact: true })
          .locator('[data-zao-slot="item-indicator"]');
        await expect(check).toBeVisible();
        expect(await paint(check, 'color')).toBe(
          await role(popup, 'color', `--zao-color-seal-${seal}-text`),
        );
        const ink = await role(popup, 'color', '--zao-color-fg-default');
        if (seal === 'azurite') expect(await paint(check, 'color')).not.toBe(ink);
        else expect(await paint(check, 'color')).toBe(ink);
        // The option's own label stays ink.
        expect(await paint(popup.getByRole('option', { name: option, exact: true }), 'color')).toBe(
          ink,
        );
        await page.keyboard.press('Escape');
      }
    });

    test(`${name}: a checked Table box carries the seal and its row keeps the neutral fill`, async ({
      page,
    }) => {
      await open(page, '/components/table', mode, seal);
      const table = preview(page).locator('[data-zao-component="table"]').first();
      const box = table.locator('tbody .table-checkbox').first();
      const unchecked = await paint(box, 'backgroundColor');
      await box.check();
      await page.mouse.move(0, 0);
      const row = table.locator('tbody tr[data-selected]').first();
      await expect(row).toBeVisible();
      await expect
        .poll(() => paint(box, 'backgroundColor'))
        .toBe(await role(table, 'backgroundColor', sealSolid));
      expect(await paint(box, 'borderTopColor')).toBe(
        await role(table, 'borderTopColor', sealSolid),
      );
      expect(await paint(box, 'color')).toBe(
        await role(table, 'color', `--zao-color-seal-${seal}-on`),
      );
      expect(await paint(box, 'backgroundColor')).not.toBe(unchecked);
      await expect
        .poll(() => paint(row, 'backgroundColor'))
        .toBe(await role(table, 'backgroundColor', '--zao-color-bg-active'));
      // The header box goes mixed with one row selected, in the same seal.
      const all = table.locator('thead .table-checkbox');
      expect(await paint(all, 'backgroundColor')).toBe(
        await role(table, 'backgroundColor', sealSolid),
      );
    });

    test(`${name}: Plan's running marker carries the seal; finished and waiting steps stay ink`, async ({
      page,
    }) => {
      await open(page, '/components/plan', mode, seal);
      const plan = preview(page).locator('[data-zao-component="plan"]').first();
      const step = (status: string) =>
        plan.locator(`[data-zao-slot="step"][data-zao-status="${status}"]`).first();
      const ink = await role(plan, 'borderTopColor', '--zao-color-fg-default');
      expect(await paint(step('running'), 'borderTopColor', '::before')).toBe(
        await role(plan, 'borderTopColor', sealSolid),
      );
      if (seal === 'azurite')
        expect(await paint(step('running'), 'borderTopColor', '::before')).not.toBe(ink);
      expect(await paint(step('waiting'), 'borderTopColor', '::before')).toBe(ink);
      expect(await paint(step('done'), 'borderTopColor', '::before')).toBe(ink);
      expect(await paint(step('done'), 'backgroundColor', '::before')).toBe(
        await role(plan, 'backgroundColor', '--zao-color-fg-default'),
      );
      // The gauge's finished ticks are a record: ink.
      const tick = plan.locator('.zao-plan-tick[data-zao-tick="done"]').first();
      expect(await paint(tick, 'borderLeftColor' as Property)).toBe(
        await role(plan, 'borderLeftColor' as Property, '--zao-color-fg-default'),
      );
    });

    test(`${name}: each chart's accent mark carries the seal and its data stays ink`, async ({
      page,
    }) => {
      await open(page, '/charts', mode, seal);
      const item = (chart: string) => page.locator(`[data-zao-gallery-item="${chart}"]`);
      for (const chart of ['ring', 'meter', 'bar', 'line', 'histogram']) {
        const accent = item(chart).locator('[data-zao-slot="chart-accent"]').first();
        await expect(accent, chart).toBeVisible();
        expect(await paint(accent, 'fill'), chart).toBe(await role(accent, 'fill', sealSolid));
      }
      const brackets = item('heatmap').locator('[data-zao-slot="chart-accent"]').first();
      expect(await paint(brackets, 'stroke')).toBe(await role(brackets, 'stroke', sealSolid));
      // The share strip's accent is a square in the plot or a chip beside the lead label.
      const share = item('share').locator('[data-zao-slot="chart-accent"]').first();
      const property = (await share.evaluate((node) => node instanceof SVGElement))
        ? 'fill'
        : 'backgroundColor';
      expect(await paint(share, property)).toBe(await role(share, property, sealSolid));

      // Data ink is unchanged in either seal.
      const lead = item('bar').locator('[data-chart-ink="data"]').first();
      expect(await paint(lead, 'stroke')).toBe(
        await role(lead, 'stroke', '--zao-color-fg-default'),
      );
      const used = item('ring')
        .locator('[data-zao-slot="storage-mark"][data-state="used"]')
        .first();
      expect(await paint(used, 'stroke')).toBe(
        await role(used, 'stroke', '--zao-color-fg-default'),
      );
      const cell = item('heatmap').locator('[data-zao-slot="chart-mark"]').first();
      if (seal === 'azurite') {
        const sealFill = await role(cell, 'fill', sealSolid);
        expect(await paint(cell, 'fill')).not.toBe(sealFill);
        expect(await paint(lead, 'stroke')).not.toBe(await role(lead, 'stroke', sealSolid));
      }
    });

    test(`${name}: focus and Progress's reading stay ink`, async ({ page }) => {
      await open(page, '/components/progress', mode, seal);
      const reading = preview(page).locator('.progress-construction [data-zao-slot="indicator"]');
      expect(await paint(reading.first(), 'backgroundColor')).toBe(
        await role(preview(page), 'backgroundColor', '--zao-color-seal-ink-solid'),
      );

      await open(page, '/components/text-field', mode, seal);
      const field = preview(page).locator('input').first();
      await page.keyboard.press('Tab');
      await field.focus();
      expect(await paint(field, 'outlineColor')).toBe(
        await role(preview(page), 'outlineColor', '--zao-color-fg-default'),
      );
    });

    test(`${name}: the Seal switch sets 青 in azurite, and the record specimens keep their own seals`, async ({
      page,
    }) => {
      await open(page, '/components/approval-gate', mode, seal);
      const glyph = page.locator('[data-seal-glyph="azurite"]');
      await expect(glyph).toHaveText('青');
      expect(await paint(glyph, 'color')).toBe(
        await role(page.locator('body > header'), 'color', '--zao-color-seal-azurite-text'),
      );

      const record = (sealName: Seal) =>
        preview(page)
          .locator(`[data-zao-seal="${sealName}"]`)
          .filter({ has: page.locator('[data-zao-slot="impression"]') })
          .first();
      for (const sealName of seals) {
        const impression = record(sealName).locator('[data-zao-slot="impression"]');
        expect(await paint(impression, 'backgroundColor'), sealName).toBe(
          await role(record(sealName), 'backgroundColor', `--zao-color-seal-${sealName}-solid`),
        );
      }
    });
  }

  test(`${mode}: the azurite seal is a blue that stands off both grounds`, async ({ page }) => {
    await open(page, '/components/button', mode, 'azurite');
    const channels = await preview(page).evaluate((node) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const rgb = (token: string) => {
        const sample = document.createElement('span');
        sample.style.color = `var(${token})`;
        node.append(sample);
        context.fillStyle = getComputedStyle(sample).color;
        sample.remove();
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3) as [number, number, number];
      };
      return {
        solid: rgb('--zao-color-accent-solid'),
        azurite: rgb('--zao-color-seal-azurite-solid'),
        on: rgb('--zao-color-fg-on-accent'),
        canvas: rgb('--zao-color-bg-canvas'),
        surface: rgb('--zao-color-bg-surface'),
      };
    });
    const luminance = ([r, g, b]: [number, number, number]) => {
      const linear = (value: number) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    };
    const contrast = (a: [number, number, number], b: [number, number, number]) => {
      const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
      return (high + 0.05) / (low + 0.05);
    };
    expect(channels.solid).toEqual(channels.azurite);
    // Blue leads red by a clear margin, so a 2px mark still reads as the seal and not as ink.
    expect(channels.solid[2] - channels.solid[0]).toBeGreaterThan(100);
    expect(contrast(channels.on, channels.solid)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(channels.solid, channels.canvas)).toBeGreaterThanOrEqual(3);
    expect(contrast(channels.solid, channels.surface)).toBeGreaterThanOrEqual(3);
  });
}

test('forced colors keep the system paints on the new seal placements', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.addInitScript(() => localStorage.setItem('zao-seal', 'azurite'));
  await page.goto('/components/table');
  const table = preview(page).locator('[data-zao-component="table"]').first();
  const box = table.locator('tbody .table-checkbox').first();
  await box.check();
  const system = (value: string) =>
    table.evaluate((node, color) => {
      const sample = document.createElement('span');
      sample.style.forcedColorAdjust = 'none';
      sample.style.backgroundColor = color;
      node.append(sample);
      const resolved = getComputedStyle(sample).backgroundColor;
      sample.remove();
      return resolved;
    }, value);
  await expect.poll(() => paint(box, 'backgroundColor')).toBe(await system('Highlight'));

  await page.goto('/charts');
  const accent = page
    .locator('[data-zao-gallery-item="bar"] [data-zao-slot="chart-accent"]')
    .first();
  await expect(accent).toBeVisible();
  const highlight = await accent.evaluate((node) => {
    const sample = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    sample.style.forcedColorAdjust = 'none';
    sample.style.fill = 'Highlight';
    node.parentElement!.append(sample);
    const resolved = getComputedStyle(sample).fill;
    sample.remove();
    return resolved;
  });
  expect(await paint(accent, 'fill')).toBe(highlight);
});
