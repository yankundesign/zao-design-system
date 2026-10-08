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

async function openConversation(page: Page, context: (typeof contexts)[number] = contexts[0]!) {
  await page.goto('/components/conversation');
  await page
    .getByRole('radio', { name: context.mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  if (context.real) {
    await page.addStyleTag({
      content: await readFile(
        new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
        'utf8',
      ),
    });
  }
  await page.evaluate(() => document.fonts.ready);
  const specimen = page.locator('[data-zao-specimen="conversation"]');
  const conversation = specimen.locator('[data-zao-component="conversation"]');
  const viewport = conversation.locator('[data-zao-slot="viewport"]');
  return { specimen, conversation, viewport };
}

async function distanceFromEnd(viewport: Locator) {
  return viewport.evaluate(
    (element) => element.scrollHeight - element.clientHeight - element.scrollTop,
  );
}

async function tokenValue(element: Locator, token: string, property: 'color' | 'width') {
  return element.evaluate(
    (node, { name, property }) => {
      const sample = document.createElement('span');
      sample.style[property] = `var(${name})`;
      sample.style.position = 'absolute';
      node.parentElement!.append(sample);
      const value = getComputedStyle(sample)[property];
      sample.remove();
      return value;
    },
    { name: token, property },
  );
}

test('new component pages are discoverable and server render named native content', async ({
  page,
  request,
}) => {
  await page.goto('/components/composer');
  for (const name of ['Composer', 'Conversation']) {
    await expect(
      page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name, exact: true }),
    ).toBeVisible();
    const response = await request.get(`/components/${name.toLowerCase()}`);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain(`data-zao-component="${name.toLowerCase()}"`);
    expect(html).toContain('Quiet instrument');
  }
});

test('chronological rich content has explicit authorship and separate lifecycle feedback', async ({
  page,
}) => {
  const { conversation, viewport } = await openConversation(page);
  const list = conversation.locator('ol[data-zao-slot="list"]');
  await expect(list).toHaveAttribute('role', 'list');
  expect(await list.locator(':scope > li').count()).toBeGreaterThan(4);
  await expect(viewport).toHaveAttribute('tabindex', '0');
  expect(await viewport.getAttribute('aria-label')).toBeTruthy();
  await expect(list.locator('[data-zao-slot="author"]').first()).toBeVisible();
  await expect(list.locator('[data-zao-component="card"]')).toHaveCount(1);
  await expect(list.locator('table')).toHaveCount(1);
  await expect(list.locator('[aria-live]')).toHaveCount(0);
  await expect(conversation.locator('[data-zao-slot="announcement"]')).toHaveAttribute(
    'aria-live',
    'polite',
  );
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
});

test('removing follow-up context preserves the next draft, selected files, and conversation history', async ({
  page,
}) => {
  const { specimen, conversation } = await openConversation(page);
  const form = specimen.getByRole('form', { name: 'Follow-up request', exact: true });
  const input = form.getByRole('textbox', { name: 'Follow-up request', exact: true });
  const items = conversation.locator('ol[data-zao-slot="list"] > li');
  const history = await items.evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.getAttribute('data-message-id'),
      content: element.textContent,
    })),
  );
  const draft = 'Keep my\n  next question  ';
  await input.fill(draft);
  await form.locator('input[type="file"]').setInputFiles({
    name: 'follow-up.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Retained follow-up attachment'),
  });
  await input.click();
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'none');
  await input.press('End');
  await input.pressSequentially('with details');
  await expect(input).toHaveCSS('outline-style', 'none');
  const editedDraft = await input.inputValue();
  await input.press('Tab');
  const attach = form.getByRole('button', { name: 'Attach files', exact: true });
  await expect(attach).toBeFocused();
  await attach.press('Shift+Tab');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await form.getByRole('button', { name: 'Remove Storage snapshot context', exact: true }).click();
  await expect(form.getByRole('list', { name: 'Included context' })).toHaveCount(0);
  await expect(form.locator('[data-zao-slot="context"]')).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'none');
  await expect(input).toHaveValue(editedDraft);
  await expect(form.locator('[data-zao-slot="attachment-name"]')).toHaveText('follow-up.txt');
  await expect(form.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
  await expect(form).not.toHaveAttribute('data-zao-pending', '');
  await expect(conversation.locator('[data-zao-status="streaming"]')).toHaveCount(0);
  expect(
    await items.evaluateAll((elements) =>
      elements.map((element) => ({
        id: element.getAttribute('data-message-id'),
        content: element.textContent,
      })),
    ),
  ).toEqual(history);
});

test('reading earlier content survives late results and Latest keeps keyboard focus', async ({
  page,
}) => {
  const { specimen, conversation, viewport } = await openConversation(page);
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  const latest = conversation.getByRole('button', { name: 'Latest response', exact: true });
  await expect(latest).toBeVisible();
  const before = await viewport.evaluate((element) => ({
    top: element.scrollTop,
    height: element.scrollHeight,
  }));
  await specimen.getByRole('button', { name: 'Add late result', exact: true }).click();
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(before.height);
  expect(await viewport.evaluate((element) => element.scrollTop)).toBeCloseTo(before.top, 0);
  await latest.focus();
  await latest.press('Enter');
  await expect(latest).toBeFocused();
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
});

test('streaming follows at the end, preserves a next draft, and stopping keeps partial output', async ({
  page,
}) => {
  const { specimen, conversation, viewport } = await openConversation(page);
  const input = specimen.getByRole('textbox', { name: 'Follow-up request', exact: true });
  await input.fill('Compare the latest storage reading.');
  await input.press('Control+Enter');
  const partial = conversation
    .locator('[data-zao-kind="assistant"][data-zao-status="streaming"]')
    .last();
  await expect(partial).toBeVisible();
  await expect.poll(() => partial.locator('[data-zao-slot="content"]').innerText()).not.toBe('');
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  await input.fill('Prepare another question.');
  await specimen.getByRole('button', { name: 'Stop response', exact: true }).click();
  const stopped = conversation
    .locator('[data-zao-kind="assistant"][data-zao-status="stopped"]')
    .last();
  await expect(stopped).toBeVisible();
  expect((await stopped.locator('[data-zao-slot="content"]').innerText()).length).toBeGreaterThan(
    0,
  );
  await expect(input).toHaveValue('Prepare another question.');
  await expect(conversation.locator('[data-zao-slot="announcement"]')).toContainText(/stop/i);
});

test('scrolling back during streaming suspends following and announces lifecycle rather than tokens', async ({
  page,
}) => {
  const { specimen, conversation, viewport } = await openConversation(page);
  const input = specimen.getByRole('textbox', { name: 'Follow-up request', exact: true });
  await input.fill('Explain the workspace storage.');
  await input.press('Control+Enter');
  await expect(conversation.locator('[data-zao-status="streaming"]')).toHaveCount(1);
  const announcement = conversation.locator('[data-zao-slot="announcement"]');
  const feedback = await announcement.innerText();
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(
    conversation.getByRole('button', { name: 'Latest response', exact: true }),
  ).toBeVisible();
  const height = await viewport.evaluate((element) => element.scrollHeight);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(height);
  expect(await viewport.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(announcement).toHaveText(feedback);
  await specimen.getByRole('button', { name: 'Stop response', exact: true }).click();
});

test('a failed response preserves partial output and retry keeps the same chronological exchange', async ({
  page,
}) => {
  const { specimen, conversation } = await openConversation(page);
  const items = conversation.locator('ol[data-zao-slot="list"] > li');
  const initialIds = await items.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-message-id')),
  );
  const input = specimen.getByRole('textbox', { name: 'Follow-up request', exact: true });
  await specimen.getByRole('switch', { name: 'Fail next response', exact: true }).click();
  await input.fill('Review the storage snapshot.');
  await input.press('Control+Enter');

  const responseItem = items.last();
  const response = responseItem.locator('[data-zao-kind="assistant"]');
  await expect(response).toHaveAttribute('data-zao-status', 'error');
  const partialContent = response.locator('[data-zao-slot="content"]');
  const partialText = await partialContent.innerText();
  expect(partialText).toContain('Follow-up summary');
  expect(partialText).toContain('160 GB available');
  await expect(response.locator('[data-zao-slot="error"]')).toContainText('Retry the response');
  await expect(conversation.locator('[data-zao-slot="announcement"]')).toContainText('failed');
  await expect(items).toHaveCount(initialIds.length + 2);

  const acceptedIds = await items.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-message-id')),
  );
  expect(acceptedIds.slice(0, initialIds.length)).toEqual(initialIds);
  await expect(items.nth(initialIds.length)).toContainText('Review the storage snapshot.');
  await input.fill('Prepare a separate next request.');
  await expect(partialContent).toHaveText(partialText);

  await response.getByRole('button', { name: 'Retry response', exact: true }).click();
  await expect(response).toHaveAttribute('data-zao-status', 'streaming');
  await expect(response).toHaveAttribute('data-zao-status', 'complete');
  await expect(partialContent).toContainText(
    'This response is generated locally from a fixed example',
  );
  await expect(response.locator('[data-zao-slot="error"]')).toHaveCount(0);
  await expect(input).toHaveValue('Prepare a separate next request.');
  await expect(conversation.locator('[data-zao-slot="announcement"]')).toContainText('Completed');
  expect(
    await items.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-message-id')),
    ),
  ).toEqual(acceptedIds);
});

test('late rich content grows the current message and continues following at the bottom', async ({
  page,
}) => {
  const { specimen, conversation, viewport } = await openConversation(page);
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  const messages = conversation.locator('ol[data-zao-slot="list"] > li');
  const count = await messages.count();
  const before = await viewport.evaluate((element) => ({
    height: element.scrollHeight,
    top: element.scrollTop,
  }));
  await specimen.getByRole('button', { name: 'Add late result', exact: true }).click();
  await expect(messages.last().locator('[data-zao-example="late-result"]')).toHaveCount(1);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(before.height);
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  expect(await viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(before.top);
  await expect(messages).toHaveCount(count);
  await expect(
    conversation.getByRole('button', { name: 'Latest response', exact: true }),
  ).toHaveCount(0);
});

test('layout contraction clamps the viewport without suspending subsequent rich-content following', async ({
  page,
}) => {
  const { conversation, viewport } = await openConversation(page);
  const code = conversation.getByRole('region', { name: 'Example code', exact: true });
  const latest = conversation.getByRole('button', { name: 'Latest response', exact: true });
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  const initialHeight = await viewport.evaluate((element) => element.scrollHeight);

  // Model a rich result reserving space, contracting when resolved, then growing again later.
  await code.evaluate((element) => {
    element.style.paddingBottom = '300px';
  });
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(initialHeight + 200);
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  const expanded = await viewport.evaluate((element) => ({
    height: element.scrollHeight,
    top: element.scrollTop,
  }));

  const contracted = await code.evaluate((element) => {
    const viewport = element.closest('[data-zao-slot="viewport"]')!;
    element.style.paddingBottom = '0px';
    const measured = { height: viewport.scrollHeight, top: viewport.scrollTop };
    // Re-expand before queued scroll and ResizeObserver events see the intermediate clamp.
    element.style.paddingBottom = '400px';
    return measured;
  });
  expect(contracted.height).toBeLessThan(expanded.height - 200);
  expect(contracted.top).toBeLessThan(expanded.top - 200);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(expanded.height);
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  await expect(latest).toHaveCount(0);

  // Deliberate scroll-back still wins while the same rich result changes size.
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(latest).toBeVisible();
  await code.evaluate((element) => {
    element.style.paddingBottom = '0px';
    void element.getBoundingClientRect();
    element.style.paddingBottom = '500px';
  });
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(latest).toBeVisible();
});

test('wide code and tables scroll in their own named keyboard regions', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 800 });
  const { conversation, viewport } = await openConversation(page);
  const code = conversation.getByRole('region', { name: 'Example code', exact: true });
  const table = conversation.getByRole('region', {
    name: 'North workspace storage snapshot scroll area',
    exact: true,
  });

  for (const region of [code, table]) {
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect
      .poll(() => region.evaluate((element) => element.scrollWidth - element.clientWidth))
      .toBeGreaterThan(0);
    await region.focus();
    await expect(region).toBeFocused();
    await region.press('ArrowRight');
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(region).toBeFocused();
  }

  expect(await viewport.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
});

test('keyboard scroll-back suspends following', async ({ page }) => {
  const { conversation, viewport } = await openConversation(page);
  await expect.poll(() => distanceFromEnd(viewport)).toBeLessThanOrEqual(1);
  await viewport.focus();
  await viewport.press('Home');
  await expect(
    conversation.getByRole('button', { name: 'Latest response', exact: true }),
  ).toBeVisible();
  await expect(viewport).toBeFocused();
});

for (const context of contexts) {
  test(`${context.name}: rich messages are accessible, stationary, and fit a narrow viewport`, async ({
    page,
  }) => {
    const { specimen, conversation } = await openConversation(page, context);
    const violations = await new AxeBuilder({ page })
      .include('[data-zao-specimen="conversation"]')
      .analyze();
    expect(violations.violations).toEqual([]);
    const message = conversation.locator('[data-zao-kind="user"]').first();
    await expect(message).toHaveCSS('transform', 'none');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(message).toHaveCSS('transform', 'none');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(
      await specimen.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    const form = specimen.getByRole('form', { name: 'Follow-up request', exact: true });
    const contextList = form.getByRole('list', { name: 'Included context' });
    await expect(contextList.getByRole('listitem')).toHaveCount(1);
    const chip = contextList.locator('[data-zao-slot="context-chip"]');
    const icon = chip.locator('[data-zao-slot="context-icon"]');
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon.locator('svg')).toHaveAttribute('focusable', 'false');
    const iconSize = await tokenValue(icon, '--zao-size-icon-sm', 'width');
    await expect(icon).toHaveCSS('width', iconSize);
    await expect(icon).toHaveCSS('height', iconSize);
    await expect(chip).toHaveCSS('border-width', '1px');
    await expect(chip).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
    await expect(chip).toHaveCSS(
      'background-color',
      await tokenValue(chip, '--zao-color-bg-sunken', 'color'),
    );
    await expect(chip.locator('.composer-context-label')).toHaveCSS(
      'color',
      await tokenValue(chip, '--zao-color-fg-default', 'color'),
    );
    const remove = contextList.getByRole('button', {
      name: 'Remove Storage snapshot context',
      exact: true,
    });
    const bounds = (await remove.boundingBox())!;
    const formBounds = (await form.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(24);
    expect(bounds.height).toBeGreaterThanOrEqual(24);
    expect(bounds.x).toBeGreaterThanOrEqual(formBounds.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(formBounds.x + formBounds.width);
    await remove.focus();
    await remove.press('Tab');
    const input = form.getByRole('textbox', { name: 'Follow-up request', exact: true });
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS('outline-style', 'solid');
    await input.press('Tab');
    await expect(form.getByRole('button', { name: 'Attach files', exact: true })).toBeFocused();
    await expect(form.locator('kbd')).toHaveCount(0);
    await expect(form.getByText(/^(Sending|Responding|Stopping)[….]*$/)).toHaveCount(0);
    await expect(form.getByRole('status')).toHaveCount(0);
    await expect(conversation.locator('[data-zao-slot="viewport"]')).toHaveCSS(
      'scroll-behavior',
      'auto',
    );
  });
}
