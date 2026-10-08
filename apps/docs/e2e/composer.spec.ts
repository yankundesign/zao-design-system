import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const contexts = [
  { name: 'Quiet light', theme: 'su', mode: 'light', real: true },
  { name: 'Quiet dark', theme: 'su', mode: 'dark', real: true },
  { name: 'Su light', theme: 'su', mode: 'light', real: false },
  { name: 'Su dark', theme: 'su', mode: 'dark', real: false },
] as const;
type Context = (typeof contexts)[number];

async function openPage(page: Page, context: Context = contexts[0], formName = 'Request') {
  if (!context.real) {
    // Published finishes are exercised without the docs-only Quiet study overrides.
    await page.route('**/api/style-studies/**/css*', (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
    );
  }
  await page.goto('/components/composer?style=quiet-instrument');
  const mode = page.getByRole('radio', {
    name: context.mode === 'light' ? 'Light' : 'Dark',
    exact: true,
  });
  if ((await mode.count()) > 0) {
    await mode.click();
    await expect(page.locator('.study')).toHaveAttribute('data-zao-mode', context.mode);
  }
  const study = page.locator('.study');
  // The public docs display Su; keep the full library finish matrix local to this test.
  await study.evaluate(
    (node, { theme, mode }) => {
      node.setAttribute('data-zao-theme', theme);
      node.setAttribute('data-zao-mode', mode);
    },
    { theme: context.theme, mode: context.mode },
  );
  await expect(study).toHaveAttribute('data-zao-theme', context.theme);
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
  return page.getByRole('form', { name: formName, exact: true });
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

async function dimensionToken(element: Locator, token: string) {
  return element.evaluate((node, name) => {
    const sample = document.createElement('span');
    sample.style.width = `var(${name})`;
    sample.style.position = 'absolute';
    node.parentElement!.append(sample);
    const width = sample.getBoundingClientRect().width;
    sample.remove();
    return width;
  }, token);
}

async function contactShadow(form: Locator, color: string) {
  const contact = (await dimensionToken(form, '--zao-space-0-5')) / 2;
  return `${await colorToken(form, color)} ${-contact}px ${contact}px 0px 0px`;
}

async function inputMetrics(input: Locator) {
  return input.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      height: node.getBoundingClientRect().height,
      lineHeight: parseFloat(style.lineHeight),
      overflow: style.overflowY,
    };
  });
}

async function documentBounds(element: Locator) {
  return element.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return {
      x: bounds.x + scrollX,
      y: bounds.y + scrollY,
      width: bounds.width,
      height: bounds.height,
    };
  });
}

async function expectAttachGeometry(form: Locator) {
  const attach = form.getByRole('button', { name: 'Attach files', exact: true });
  const plus = attach.locator('svg[data-zao-slot="icon"]');
  const horizontalInset = await dimensionToken(form, '--zao-space-4');
  const verticalInset = await dimensionToken(form, '--zao-space-3');
  for (const side of ['left', 'right']) {
    await expect(form).toHaveCSS(`padding-${side}`, `${horizontalInset}px`);
  }
  for (const side of ['top', 'bottom']) {
    await expect(form).toHaveCSS(`padding-${side}`, `${verticalInset}px`);
  }
  const iconSize = await dimensionToken(plus, '--zao-size-icon-md');
  const clearance = await dimensionToken(form, '--zao-space-1');
  // Read every rectangle in one task so focus/scroll adjustments cannot mix coordinate frames.
  const {
    form: formBounds,
    input: inputBounds,
    writing: writingBounds,
    attach: attachBounds,
    plus: plusBounds,
  } = await form.evaluate((node) => {
    function bounds(element: Element) {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    }
    const attach = node.querySelector('button[aria-label="Attach files"]')!;
    return {
      form: bounds(node),
      input: bounds(node.querySelector('textarea')!),
      writing: bounds(node.querySelector('[data-zao-slot="writing"]')!),
      attach: bounds(attach),
      plus: bounds(attach.querySelector('svg[data-zao-slot="icon"]')!),
    };
  });
  expect(plusBounds.width).toBe(iconSize);
  expect(plusBounds.height).toBe(iconSize);
  // The Iconoir drawing begins at x=6 in its 24-unit view box.
  expect(plusBounds.x + (plusBounds.width * 6) / 24).toBeCloseTo(inputBounds.x, 1);
  expect(attachBounds.y - writingBounds.y - writingBounds.height).toBeCloseTo(verticalInset, 1);
  // The visible glyph aligns with the draft while the whole hover/focus target has clearance.
  expect(attachBounds.x - formBounds.x).toBeGreaterThanOrEqual(clearance);
  expect(attachBounds.x + attachBounds.width).toBeLessThan(formBounds.x + formBounds.width);
  expect(attachBounds.y + attachBounds.height).toBeLessThan(formBounds.y + formBounds.height);
}

async function expectReady(form: Locator) {
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expect(form).not.toHaveAttribute('data-zao-responding', '');
  await expect(form.getByRole('button', { name: 'Stop response', exact: true })).toHaveCount(0);
}

async function expectResponding(form: Locator) {
  await expect(form).toHaveAttribute('data-zao-responding', '');
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expect(form.getByRole('button', { name: 'Stop response', exact: true })).toBeEnabled();
}

async function countAcceptances(form: Locator) {
  await form.evaluate((node) => {
    const original = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      // Acceptance uses the same delay as Stop; only count while the host is ready.
      if (delay === 750 && !node.hasAttribute('data-zao-responding'))
        node.setAttribute(
          'data-acceptance-count',
          String(Number(node.getAttribute('data-acceptance-count') ?? 0) + 1),
        );
      return original(handler, delay, ...args);
    }) as typeof window.setTimeout;
  });
}

for (const context of contexts) {
  test(`${context.name}: semantic construction, growth, focus, narrow layout, and accessibility`, async ({
    page,
  }) => {
    const form = await openPage(page, context);
    const input = form.getByRole('textbox', { name: 'Request', exact: true });
    const specimen = page.locator('[data-zao-specimen="composer"]');
    await expect(
      page.getByRole('region', { name: 'Composer with context', exact: true }),
    ).toBeVisible();
    await expect(input).toHaveValue('Summarize the attached files.');
    for (const text of ['ZAO assistant', 'North workspace', 'Local simulation', 'Fail next send']) {
      await expect(specimen.getByText(text, { exact: true })).toHaveCount(0);
    }
    await expect(
      specimen.getByText('Ready for a request. Files stay in this browser.', { exact: true }),
    ).toHaveCount(0);
    await expect(specimen.getByRole('switch')).toHaveCount(0);
    await expect(specimen.getByRole('status')).toHaveCount(0);
    await expect(specimen.locator('[data-zao-example="request-status"]')).toHaveCount(0);
    await expect(specimen.locator('[data-zao-example="accepted-request"]')).toHaveCount(0);
    await input.fill('A short request');
    const initial = await inputMetrics(input);
    expect(initial.height).toBeCloseTo(Math.max(initial.lineHeight, 24), 0);
    expect(initial.height).toBeGreaterThanOrEqual(24);
    expect((await form.boundingBox())!.height).toBeLessThanOrEqual(140);
    const empty = page.getByRole('form', { name: 'New request', exact: true });
    expect((await empty.boundingBox())!.height).toBeLessThanOrEqual(100);
    await expect(input).toHaveAccessibleName('Request');
    await expect(input).toHaveAccessibleDescription(
      'Enter adds a line. Ctrl or Cmd + Enter sends.',
    );
    for (const slot of ['label', 'guidance']) {
      const hidden = form.locator(`[data-zao-slot="${slot}"]`);
      await expect(hidden).toHaveCSS('position', 'absolute');
      const bounds = await hidden.boundingBox();
      expect(bounds!.width).toBeLessThanOrEqual(1);
      expect(bounds!.height).toBeLessThanOrEqual(1);
      await expect(hidden).not.toHaveAttribute('aria-hidden', 'true');
    }
    await expect(form).toHaveCSS('border-radius', '0px');
    await expect(input).toHaveCSS(
      'background-color',
      await colorToken(input, '--zao-color-bg-canvas'),
    );
    await expect(input).toHaveCSS('color', await colorToken(input, '--zao-color-fg-default'));
    await expect(form).toHaveCSS(
      'border-color',
      await colorToken(form, '--zao-color-border-subtle'),
    );
    const restingShadow = await contactShadow(form, '--zao-color-border-default');
    const writingShadow = await contactShadow(form, '--zao-color-border-strong');
    await input.evaluate((node) => (node as HTMLTextAreaElement).blur());
    await expect(form).toHaveCSS('box-shadow', restingShadow);
    await expect(form).toHaveCSS('transform', 'none');
    await expect(form).toHaveCSS('transition-duration', '0s');
    await expect(form).toHaveCSS('overflow', 'visible');
    const restingBounds = await form.boundingBox();
    // Read in the same task as focus so a delayed transition cannot satisfy the assertion.
    expect(
      await input.evaluate((node) => {
        (node as HTMLTextAreaElement).focus();
        return getComputedStyle(node.closest('form')!).boxShadow;
      }),
    ).toBe(writingShadow);
    expect(await form.boundingBox()).toEqual(restingBounds);
    await expect(input).toHaveCSS('outline-style', 'solid');
    await expect(input).toHaveCSS(
      'outline-color',
      await colorToken(input, '--zao-color-focus-ring'),
    );
    await input.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS('outline-style', 'none');
    await expect(form).toHaveCSS('box-shadow', writingShadow);
    await expect(form).toHaveCSS(
      'border-color',
      await colorToken(form, '--zao-color-border-subtle'),
    );
    await input.press('End');
    await input.pressSequentially(' with another detail');
    await expect(input).toHaveValue('A short request with another detail');
    await expect(input).toHaveCSS('outline-style', 'none');
    await input.press('Tab');
    const attach = form.getByRole('button', { name: 'Attach files', exact: true });
    await expect(attach).toBeFocused();
    await expect(form).toHaveCSS('box-shadow', restingShadow);
    await attach.press('Shift+Tab');
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS('outline-style', 'solid');
    await expect(input).toHaveCSS(
      'outline-color',
      await colorToken(input, '--zao-color-focus-ring'),
    );
    await expect(form).toHaveCSS('box-shadow', writingShadow);
    const contextItems = form.getByRole('list', { name: 'Included context' }).getByRole('listitem');
    await expect(contextItems).toHaveCount(2);
    for (const item of await contextItems.all()) {
      const chip = item.locator('[data-zao-slot="context-chip"]');
      const icon = chip.locator('[data-zao-slot="context-icon"]');
      await expect(chip).toHaveCSS('border-width', '1px');
      await expect(chip).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
      await expect(chip).toHaveCSS(
        'background-color',
        await colorToken(chip, '--zao-color-bg-sunken'),
      );
      await expect(chip.locator('.composer-context-label')).toHaveCSS(
        'color',
        await colorToken(chip, '--zao-color-fg-default'),
      );
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.locator('svg')).toHaveAttribute('focusable', 'false');
      expect(await icon.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(-1);
      const iconBounds = (await icon.boundingBox())!;
      const iconSize = await dimensionToken(icon, '--zao-size-icon-sm');
      expect(iconBounds.width).toBe(iconSize);
      expect(iconBounds.height).toBe(iconSize);
      const remove = item.getByRole('button');
      await expect(remove).toHaveAccessibleName(/Remove .+ context/);
      const bounds = (await remove.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(24);
      expect(bounds.height).toBeGreaterThanOrEqual(24);
    }
    const firstRemove = contextItems.nth(0).getByRole('button');
    const secondRemove = contextItems.nth(1).getByRole('button');
    await firstRemove.focus();
    await expect(form).toHaveCSS('box-shadow', restingShadow);
    await firstRemove.press('Tab');
    await expect(secondRemove).toBeFocused();
    await expect(form).toHaveCSS('box-shadow', restingShadow);
    await secondRemove.press('Tab');
    await expect(input).toBeFocused();
    await expect(form).toHaveCSS('box-shadow', writingShadow);
    await expect(form.locator('kbd')).toHaveCount(0);
    await expect(form.getByText(/^(Sending|Responding|Stopping)[….]*$/)).toHaveCount(0);
    await expect(form.getByRole('status')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expectAttachGeometry(form);
    const inputBounds = (await input.boundingBox())!;
    expect((await contextItems.first().boundingBox())!.x).toBeCloseTo(inputBounds.x, 1);
    const send = form.getByRole('button', { name: 'Send', exact: true });
    for (const label of ['Attach files', 'Send']) {
      const action = form.getByRole('button', { name: label, exact: true });
      await expect(action).toHaveAccessibleName(label);
      await expect(action).toHaveText('');
      const bounds = await action.boundingBox();
      expect(bounds!.width).toBe(28);
      expect(bounds!.height).toBe(28);
    }
    await attach.scrollIntoViewIfNeeded();
    // Hover can scroll a keyboard-focused page; compare layout in document coordinates.
    const attachRestingBounds = await documentBounds(attach);
    const trayRestingBounds = await documentBounds(form);
    await attach.hover();
    expect(await documentBounds(attach)).toEqual(attachRestingBounds);
    expect(await documentBounds(form)).toEqual(trayRestingBounds);
    await page.mouse.down();
    expect(await documentBounds(attach)).toEqual(attachRestingBounds);
    expect(await documentBounds(form)).toEqual(trayRestingBounds);
    // Release outside the native target to cancel activation without opening a file chooser.
    const cancelBounds = (await attach.boundingBox())!;
    await page.mouse.move(cancelBounds.x + cancelBounds.width + 12, cancelBounds.y);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    expect(await documentBounds(attach)).toEqual(attachRestingBounds);
    await send.scrollIntoViewIfNeeded();
    const beforeHover = await documentBounds(form);
    await send.hover();
    expect(await documentBounds(form)).toEqual(beforeHover);

    await input.fill(Array.from({ length: 20 }, (_, index) => `Line ${index + 1}`).join('\n'));
    const expanded = await inputMetrics(input);
    expect(expanded.height).toBeCloseTo(expanded.lineHeight * 8, 0);
    expect(expanded.overflow).toBe('auto');
    await input.fill('Short again');
    expect((await inputMetrics(input)).height).toBeCloseTo(initial.height, 0);

    await input.fill('A considered draft with context and details. '.repeat(5));
    await input.focus();
    const wide = await inputMetrics(input);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(input).toBeFocused();
    await expect.poll(async () => (await inputMetrics(input)).height).toBeGreaterThan(wide.height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(0);
    await page.mouse.move(0, 0);
    await expectAttachGeometry(form);
    for (const button of await form.getByRole('button').all()) {
      const bounds = await button.boundingBox();
      expect(bounds!.width).toBe(28);
      expect(bounds!.height).toBe(28);
    }
    const formBounds = (await form.boundingBox())!;
    for (const item of await contextItems.all()) {
      const bounds = (await item.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(formBounds.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(formBounds.x + formBounds.width);
    }
    const disabled = page.getByRole('form', { name: 'Unavailable request', exact: true });
    await expect(disabled.getByRole('textbox')).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Attach files' })).toBeDisabled();
    const disabledShadow = await contactShadow(disabled, '--zao-color-border-subtle');
    await expect(disabled).toHaveCSS(
      'background-color',
      await colorToken(disabled, '--zao-color-bg-sunken'),
    );
    await expect(disabled).toHaveCSS('box-shadow', disabledShadow);
    await disabled.hover();
    expect(
      await disabled.getByRole('textbox').evaluate((node) => {
        (node as HTMLTextAreaElement).focus();
        return getComputedStyle(node.closest('form')!).boxShadow;
      }),
    ).toBe(disabledShadow);
    await expect(disabled.getByRole('textbox')).not.toBeFocused();

    const { violations } = await new AxeBuilder({ page })
      .include('[data-zao-specimen="composer"]')
      .analyze();
    expect(
      violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
    ).toEqual([]);
  });
}

test('compact icon actions retain keyboard labels and Escape-dismissible tooltips', async ({
  page,
}) => {
  const form = await openPage(page);
  await page.mouse.move(0, 0);
  await form.getByRole('textbox', { name: 'Request', exact: true }).focus();
  await page.keyboard.press('Tab');
  const attach = form.getByRole('button', { name: 'Attach files', exact: true });
  const tooltip = form.locator('[data-zao-slot="tooltip"]').filter({ hasText: /^Attach files$/ });
  await expect(attach).toBeFocused();
  await expect(tooltip).toBeVisible();
  for (const narrow of [false, true]) {
    if (narrow) await page.setViewportSize({ width: 360, height: 800 });
    await expect(attach).toBeFocused();
    await expect(tooltip).toBeVisible();
    await expect
      .poll(() =>
        tooltip.evaluate((node) => {
          const tooltipBounds = node.getBoundingClientRect();
          const formBounds = node.closest('form')!.getBoundingClientRect();
          return (
            tooltipBounds.x >= 0 &&
            tooltipBounds.x + tooltipBounds.width <= innerWidth &&
            tooltipBounds.y + tooltipBounds.height > formBounds.y + formBounds.height
          );
        }),
      )
      .toBe(true);
    // Probe the tooltip's painted area beyond the tray, where clipping would hide it.
    expect(
      await tooltip.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const formBounds = node.closest('form')!.getBoundingClientRect();
        const painted = document.elementFromPoint(
          bounds.x + bounds.width / 2,
          formBounds.y + formBounds.height + 2,
        );
        return painted !== null && (painted === node || node.contains(painted));
      }),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await expect(attach).toBeFocused();
});

test('context chips can be removed by pointer and keyboard without sending or changing the draft', async ({
  page,
}) => {
  const form = await openPage(page);
  const input = form.getByRole('textbox', { name: 'Request', exact: true });
  const draft = 'Keep this\n  considered request  ';
  await input.fill(draft);
  await form.locator('input[type="file"]').setInputFiles({
    name: 'retained.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Retained local attachment'),
  });
  const context = form.getByRole('list', { name: 'Included context' });
  await expect(context.getByRole('listitem')).toHaveCount(2);
  await form.getByRole('button', { name: 'Remove Project files context', exact: true }).click();
  await expect(context.getByRole('listitem')).toHaveCount(1);
  await expect(context).toContainText('Reference data');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'none');
  await expect(input).toHaveValue(draft);
  const remove = form.getByRole('button', { name: 'Remove Reference data context', exact: true });
  await input.press('Shift+Tab');
  const removeAttachment = form.getByRole('button', { name: 'Remove retained.txt', exact: true });
  await expect(removeAttachment).toBeFocused();
  await removeAttachment.press('Shift+Tab');
  await expect(remove).toBeFocused();
  await expect(remove).toHaveCSS('outline-style', 'solid');
  await remove.press('Space');
  await expect(context).toHaveCount(0);
  await expect(form.locator('[data-zao-slot="context"]')).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await expect(input).toHaveCSS('outline-color', await colorToken(input, '--zao-color-focus-ring'));
  await expect(input).toHaveValue(draft);
  await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveText('retained.txt');
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expectReady(form);
});

test('empty guards, ordinary Enter, multiline paste, and shortcut share native submission behavior', async ({
  page,
}) => {
  await openPage(page);
  const form = page.getByRole('form', { name: 'New request', exact: true });
  const input = form.getByRole('textbox');
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await input.fill(' \n\t ');
  await form.evaluate((node) => (node as HTMLFormElement).requestSubmit());
  await expectReady(form);
  await expect(input).toHaveValue(' \n\t ');
  await input.fill('First line');
  await input.press('End');
  await input.press('Enter');
  await input.pressSequentially('Second line');
  await expect(input).toHaveValue('First line\nSecond line');
  await expectReady(form);
  await input.fill('  Pasted first line\nPasted second line  ');
  await input.press('Control+Enter');
  await expect(input).toHaveValue('');
  await input.fill('Send by button');
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(input).toHaveValue('');
});

test('IME and already-prevented keyboard events cannot send', async ({ page }) => {
  const form = await openPage(page);
  const input = form.getByRole('textbox');
  await input.fill('Composing a request');
  await input.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await form.evaluate((node) => (node as HTMLFormElement).requestSubmit());
  await expectReady(form);
  await input.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    const imeFallback = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(imeFallback, 'keyCode', { value: 229 });
    node.dispatchEvent(imeFallback);
    node.addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expectReady(form);
  await input.press('Meta+Enter');
  await expectResponding(form);
  await expect(input).toHaveValue('');
});

test('rejection preserves whitespace and attachments, locks repeated sends, and supports retry and Stop', async ({
  page,
}) => {
  const form = await openPage(page, contexts[0], 'Request with send error');
  const input = form.getByRole('textbox');
  const text = '  Summarize\nstorage usage  ';
  await input.fill(text);
  await form.locator('input[type="file"]').setInputFiles({
    name: 'report.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Storage: 68% used'),
  });
  await countAcceptances(form);
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await expect(form).toHaveAttribute('data-zao-pending', '');
  await expect(form.getByRole('alert')).toHaveCount(0);
  await form.evaluate((node) => {
    const nativeForm = node as HTMLFormElement;
    nativeForm.requestSubmit();
    nativeForm.requestSubmit();
  });
  await expect(form).toHaveAttribute('data-acceptance-count', '1');
  await expect(form.getByRole('alert')).toHaveText(
    'Could not send your request. Your draft is preserved. Try sending again.',
  );
  await expect(input).toHaveValue(text);
  await expect(
    form.getByRole('list', { name: 'Included attachments' }).getByRole('listitem'),
  ).toHaveCount(1);
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(await input.getAttribute('aria-describedby')).toContain(
    await form.getByRole('alert').getAttribute('id'),
  );
  await input.press('Control+Enter');
  await expect(form.getByRole('alert')).toHaveCount(0);
  await expectResponding(form);
  // The host clears only the exact accepted draft and attachment IDs.
  await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveCount(0);
  await expect(input).toHaveValue('');
  await input.fill('Prepare the next request');
  await input.press('Control+Enter');
  await expect(form).toHaveAttribute('data-acceptance-count', '2');
  await expect(input).toHaveValue('Prepare the next request');
  const stop = form.getByRole('button', { name: 'Stop response', exact: true });
  await expect(stop).toHaveAccessibleName('Stop response');
  await expect(stop).toHaveText('');
  const stopBounds = await stop.boundingBox();
  expect(stopBounds!.width).toBe(28);
  expect(stopBounds!.height).toBe(28);
  await stop.click();
  await expectReady(form);
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  await expect(input).toHaveValue('Prepare the next request');
  await expect(form).toHaveAttribute('data-acceptance-count', '2');
});

test('pending Stop keeps its control busy until host confirmation and preserves draft preparation', async ({
  page,
}) => {
  const form = await openPage(page);
  const input = form.getByRole('textbox', { name: 'Request', exact: true });
  const fileInput = form.locator('input[type="file"]');
  const send = form.getByRole('button', { name: 'Send', exact: true });
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await countAcceptances(form);
  await input.fill('The accepted request');
  await send.click();
  await expect(send).toBeDisabled();
  await expect(send).toHaveAttribute('aria-busy', 'true');
  await expect(input).toBeEnabled();
  await expect(form.getByRole('button', { name: 'Attach files', exact: true })).toBeEnabled();
  await expect(form.getByText(/^(Sending|Responding|Stopping)[….]*$/)).toHaveCount(0);
  await page.clock.runFor(750);
  const stop = form.getByRole('button', { name: 'Stop response', exact: true });
  await expect(stop).toBeEnabled();
  await expect(stop).not.toHaveAttribute('aria-busy', 'true');
  await expect(form).toHaveAttribute('data-zao-responding', '');
  await expect(form).toHaveAttribute('data-acceptance-count', '1');
  await expect(input).toHaveValue('');
  const specimen = page.locator('[data-zao-specimen="composer"]');
  await expect(specimen.getByRole('status')).toHaveCount(0);
  await expect(
    specimen.locator('[data-zao-example="request-status"], [data-zao-example="accepted-request"]'),
  ).toHaveCount(0);
  await input.fill('The next draft');
  await fileInput.setInputFiles({
    name: 'next-draft.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Keep this next-draft attachment'),
  });
  const stopBounds = (await stop.boundingBox())!;
  const formBounds = await form.boundingBox();
  await stop.click();
  await expect(stop).toBeDisabled();
  await expect(stop).toHaveAttribute('aria-busy', 'true');
  await expect(stop).toHaveAccessibleName('Stop response');
  await expect(stop).toHaveText('');
  await expect(send).toHaveCount(0);
  await expect(form).toHaveAttribute('data-zao-responding', '');
  await expect(form).toHaveAttribute('data-acceptance-count', '1');
  await expect(form.getByRole('status')).toHaveCount(0);
  await expect(form.getByText(/^(Sending|Responding|Stopping)[….]*$/)).toHaveCount(0);
  expect(await form.boundingBox()).toEqual(formBounds);
  const busyBounds = (await stop.boundingBox())!;
  expect(busyBounds.width).toBe(stopBounds.width);
  expect(busyBounds.height).toBe(stopBounds.height);
  expect(busyBounds.x).toBe(stopBounds.x);
  expect(busyBounds.y).toBe(stopBounds.y);
  await expect(input).toBeEnabled();
  await expect(fileInput).toBeEnabled();
  await expect(form.getByRole('button', { name: 'Attach files', exact: true })).toBeEnabled();
  await expect(
    form.getByRole('button', { name: 'Remove next-draft.txt', exact: true }),
  ).toBeEnabled();
  await expect(
    form.getByRole('button', { name: 'Remove Project files context', exact: true }),
  ).toBeEnabled();
  await input.fill('Edited while stopping');
  await fileInput.setInputFiles({
    name: 'prepared-while-stopping.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Prepared during Stop confirmation'),
  });
  await input.press('Control+Enter');
  await form.evaluate((node) => {
    const nativeForm = node as HTMLFormElement;
    nativeForm.requestSubmit();
    nativeForm.requestSubmit();
  });
  await page.clock.runFor(749);
  await expect(stop).toBeDisabled();
  await expect(form).toHaveAttribute('data-zao-responding', '');
  await expect(form).toHaveAttribute('data-acceptance-count', '1');
  await expect(input).toHaveValue('Edited while stopping');
  await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveText([
    'next-draft.txt',
    'prepared-while-stopping.txt',
  ]);
  await page.clock.runFor(1);
  await expect(stop).toHaveCount(0);
  await expect(form).not.toHaveAttribute('data-zao-responding', '');
  await expectReady(form);
  await expect(send).toBeEnabled();
  await expect(send).not.toHaveAttribute('aria-busy', 'true');
  await expect(input).toHaveValue('Edited while stopping');
  await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveText([
    'next-draft.txt',
    'prepared-while-stopping.txt',
  ]);
  await expect(form).toHaveAttribute('data-acceptance-count', '1');
});

test('shortcut and Send both obey required and minimum-length native validation', async ({
  page,
}) => {
  const form = await openPage(page);
  const input = form.getByRole('textbox');
  await input.fill('');
  await form.locator('input[type="file"]').setInputFiles({
    name: 'validation.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('An attachment makes Send available'),
  });
  // Set the same native constraints consumers can provide through textareaProps.
  await input.evaluate((node) => {
    const textarea = node as HTMLTextAreaElement;
    textarea.required = true;
    textarea.minLength = 5;
  });
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  await input.press('Control+Enter');
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expectReady(form);
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expectReady(form);

  await input.fill('a');
  expect(await input.evaluate((node) => (node as HTMLTextAreaElement).validity.tooShort)).toBe(
    true,
  );
  await input.press('Control+Enter');
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await expectReady(form);
  await input.fill('Valid shortcut request');
  await input.press('Control+Enter');
  await expectResponding(form);
  await expect(input).toHaveValue('');
  await form.getByRole('button', { name: 'Stop response' }).click();
  await expectReady(form);
  await input.fill('Valid button request');
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await expectResponding(form);
  await expect(input).toHaveValue('');
  await form.getByRole('button', { name: 'Stop response' }).click();
});

test('editing a pending draft survives host acceptance', async ({ page }) => {
  const form = await openPage(page);
  const input = form.getByRole('textbox');
  await input.fill('Accepted snapshot');
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(form).toHaveAttribute('data-zao-pending', '');
  await input.fill('Next draft edited during acceptance');
  await expectResponding(form);
  await expect(input).toHaveValue('Next draft edited during acceptance');
  await form.getByRole('button', { name: 'Stop response' }).click();
});

test('file-only requests accept multiple repeated names while preserving newly attached files', async ({
  page,
}) => {
  const form = await openPage(page);
  const input = form.getByRole('textbox');
  const fileInput = form.locator('input[type="file"]');
  const file = {
    name: 'same-name.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('First attachment'),
  };
  await input.fill('');
  await expect(fileInput).toHaveAttribute('multiple', '');
  await fileInput.setInputFiles([file, { ...file, buffer: Buffer.from('Second attachment') }]);
  await expect(fileInput).toHaveValue('');
  await fileInput.setInputFiles(file);
  const files = form.getByRole('list', { name: 'Included attachments' }).getByRole('listitem');
  await expect(files).toHaveCount(3);
  await form.getByRole('button', { name: 'Remove same-name.txt' }).first().click();
  await expect(files).toHaveCount(2);
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  await form.getByRole('button', { name: 'Send', exact: true }).click();
  await fileInput.setInputFiles({
    name: 'next-draft.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Keep this file'),
  });
  await expectResponding(form);
  await expect(files).toHaveCount(1);
  await expect(files).toContainText('next-draft.txt');
  await form.getByRole('button', { name: 'Stop response' }).click();
  await expectReady(form);
  await expect(files).toHaveCount(1);
  await expect(files).toContainText('next-draft.txt');
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

test('compact attachment tiles contain long filenames on narrow screens without losing their names', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const form = await openPage(page);
  const names = [
    `${'project-reference-file-review-'.repeat(12)}2026.txt`,
    'capacity-snapshot-with-a-long-readable-filename.csv',
  ];
  await form
    .locator('input[type="file"]')
    .setInputFiles(
      names.map((name) => ({ name, mimeType: 'text/plain', buffer: Buffer.from('Local example') })),
    );
  const files = form.getByRole('list', { name: 'Included attachments' }).getByRole('listitem');
  await expect(files).toHaveCount(names.length);
  const formBounds = (await form.boundingBox())!;
  for (const [index, name] of names.entries()) {
    const file = files.nth(index);
    const filename = file.locator('[data-zao-slot="attachment-name"]');
    await expect(filename).toHaveText(name);
    await expect(filename).toHaveAttribute('title', name);
    await expect(filename).toHaveCSS('overflow-wrap', 'anywhere');
    await expect(filename).toHaveCSS('white-space', 'normal');
    expect(await filename.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await expect(
      file.getByRole('button', { name: `Remove ${name}`, exact: true }),
    ).toHaveAccessibleName(`Remove ${name}`);
    const bounds = (await file.boundingBox())!;
    expect(bounds.width).toBeLessThanOrEqual(formBounds.width);
    expect(bounds.x).toBeGreaterThanOrEqual(formBounds.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(formBounds.x + formBounds.width);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(0);
});

type URLProbe = Window & {
  composerURLs: { created: string[]; revoked: string[]; failed: string[] };
};

test('image preview failure keeps file metadata and object URLs are revoked on removal and navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = window as unknown as URLProbe;
    probe.composerURLs = { created: [], revoked: [], failed: [] };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      probe.composerURLs.created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      probe.composerURLs.revoked.push(url);
      revoke(url);
    };
    document.addEventListener(
      'error',
      (event) => {
        if (event.target instanceof HTMLImageElement && event.target.src.startsWith('blob:')) {
          probe.composerURLs.failed.push(event.target.src);
        }
      },
      true,
    );
  });
  const form = await openPage(page);
  const fileInput = form.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'preview.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>',
    ),
  });
  const preview = form.getByRole('img', { name: 'Preview of preview.svg' });
  await expect
    .poll(() => preview.evaluate((node) => (node as HTMLImageElement).naturalWidth))
    .toBe(8);
  await fileInput.setInputFiles({
    name: 'broken.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('This is not an image'),
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as URLProbe).composerURLs.failed.length))
    .toBe(1);
  await expect(form.getByRole('img', { name: 'Preview of broken.svg' })).toHaveCount(0);
  await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveText([
    'preview.svg',
    'broken.svg',
  ]);
  await form.getByRole('button', { name: 'Remove preview.svg' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as URLProbe).composerURLs.revoked.length))
    .toBe(1);
  await page
    .locator('.docs-nav-desktop')
    .getByRole('link', { name: 'TextField', exact: true })
    .click();
  await expect(page).toHaveURL(/\/components\/text-field(?:\?style=quiet-instrument)?$/);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as URLProbe).composerURLs.revoked.length))
    .toBe(2);
  expect(
    await page.evaluate(() => {
      const { created, revoked } = (window as unknown as URLProbe).composerURLs;
      return [...created].sort().join('|') === [...revoked].sort().join('|');
    }),
  ).toBe(true);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the writing plane grows immediately and keyboard Send remains usable', async ({ page }) => {
    const form = await openPage(page);
    const input = form.getByRole('textbox');
    await input.fill('Line one\nLine two\nLine three\nLine four');
    const metrics = await inputMetrics(input);
    expect(metrics.height).toBeGreaterThan(metrics.lineHeight * 3);
    expect(await input.evaluate((node) => node.getAnimations().length)).toBe(0);
    await input.press('Control+Enter');
    await expectResponding(form);
    await form.getByRole('button', { name: 'Stop response' }).click();
  });
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('Attach files, Send, and Stop work through labeled native touch targets', async ({
    page,
  }) => {
    const form = await openPage(page);
    const input = form.getByRole('textbox');
    await input.fill('Touch request');
    await input.tap();
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS('outline-style', 'none');
    await form.getByRole('button', { name: 'Remove Project files context', exact: true }).tap();
    await expect(
      form.getByRole('list', { name: 'Included context' }).getByRole('listitem'),
    ).toHaveCount(1);
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS('outline-style', 'none');
    await expect(input).toHaveValue('Touch request');
    await expectReady(form);
    const chooserPromise = page.waitForEvent('filechooser');
    await form.getByRole('button', { name: 'Attach files' }).tap();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'touch.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Selected by touch'),
    });
    await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveText('touch.txt');
    await form.getByRole('button', { name: 'Send', exact: true }).tap();
    await expectResponding(form);
    await form.getByRole('button', { name: 'Stop response' }).tap();
    await expectReady(form);
  });
});
