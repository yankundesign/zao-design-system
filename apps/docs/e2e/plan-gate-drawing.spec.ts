import { expect, test } from '@playwright/test';

test('Plan and ApprovalGate are linked after Conversation in the component navigation', async ({
  page,
}) => {
  await page.goto('/components/plan');
  await expect(page.getByRole('heading', { level: 1, name: 'Plan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ApprovalGate' })).toBeVisible();
  await page.getByRole('link', { name: 'ApprovalGate' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'ApprovalGate' })).toBeVisible();
});

test('Plan draws each status on its rail and announces changed steps only inside Conversation', async ({
  page,
}) => {
  await page.goto('/components/plan');
  const plan = page.locator('[data-zao-component="plan"]').first();
  const steps = plan.locator('[data-zao-slot="step"]');
  await expect(steps).toHaveCount(7);
  for (const status of ['planned', 'running', 'waiting', 'done', 'declined', 'failed', 'skipped']) {
    await expect(plan.locator(`[data-zao-status="${status}"]`)).toHaveCount(1);
  }
  await expect(plan.locator('[aria-current="step"]')).toHaveCount(2);
  await expect(plan.locator('[data-zao-slot="summary"]')).toContainText('2 of 7 done');
  for (const status of ['done', 'declined']) {
    const fill = await plan
      .locator(`[data-zao-status="${status}"]`)
      .evaluate((node) =>
        getComputedStyle(node, '::after').getPropertyValue('--zao-plan-fill').trim(),
      );
    expect(fill).toBe('100%');
  }

  const conversation = page.getByRole('region', { name: 'Seat cleanup conversation' });
  await expect(conversation.locator('[data-zao-component="plan"][data-zao-entering]')).toHaveCount(
    0,
  );
  await page.getByRole('switch', { name: 'Fail step 2' }).click();
  await expect(conversation.locator('[data-zao-status="failed"]')).toHaveCount(1);
  await expect(conversation.locator('[aria-live="polite"]')).toHaveText('Step 2 Failed.');
  await expect(plan.getByText('Step 2 Failed.')).toHaveCount(0);

  await page.getByRole('button', { name: 'Propose again' }).click();
  const arrivingPlan = conversation.locator('[data-zao-component="plan"][data-zao-entering]');
  await expect(arrivingPlan).toBeVisible();
  await expect(conversation.locator('[data-zao-plan-initial]')).toHaveCount(3);
  const boxBefore = await arrivingPlan.boundingBox();
  await page.waitForTimeout(120);
  const boxDuring = await arrivingPlan.boundingBox();
  expect(
    boxDuring && boxBefore && [boxDuring.x, boxDuring.y, boxDuring.width, boxDuring.height],
  ).toEqual(boxBefore && [boxBefore.x, boxBefore.y, boxBefore.width, boxBefore.height]);
});

test('Plan rail follows inline start across light/dark, LTR/RTL, and reduced motion', async ({
  page,
}) => {
  await page.goto('/components/plan');
  for (const mode of ['light', 'dark'] as const) {
    await page
      .getByRole('radiogroup', { name: 'Mode' })
      .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark' })
      .click();
    for (const direction of ['ltr', 'rtl'] as const) {
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, direction);
      const step = page
        .locator('[data-zao-component="plan"]')
        .first()
        .locator('[data-zao-slot="step"]')
        .first();
      const sides = await step.evaluate((element) => {
        const style = getComputedStyle(element, '::before');
        return { left: style.left, right: style.right };
      });
      if (direction === 'ltr') expect(sides.left).not.toBe('auto');
      else expect(sides.right).not.toBe('auto');
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Propose again' }).click();
  const reducedPlan = page.locator('[data-zao-component="plan"][data-zao-entering]');
  await expect(reducedPlan).toBeVisible();
  const pens = reducedPlan.locator('[data-zao-slot="pen"]');
  await expect(pens).toHaveCount(3);
  for (let index = 0; index < (await pens.count()); index += 1) {
    await expect(pens.nth(index)).toHaveCSS('display', 'none');
  }
});

test('ApprovalGate loading resolves into a focused record and impressions follow the seal', async ({
  page,
}) => {
  await page.goto('/components/approval-gate');
  const gate = page.locator('[data-zao-component="approval-gate"]').first();
  const approve = gate.getByRole('button', { name: 'Approve removal' });
  const decline = gate.getByRole('button', { name: 'Decline' });
  await approve.click();
  await expect(approve).toHaveAttribute('aria-busy', 'true');
  await expect(decline).toBeDisabled();
  const record = gate.getByRole('status');
  await expect(record).toContainText('Approved removal');
  await expect(record).toBeFocused();
  await expect(gate.locator('[data-zao-slot="impression"]')).toBeVisible();
  await expect(gate.locator('[data-zao-slot="actions"]')).toHaveCSS('min-height', /34px|35px/);

  const records = page.locator('[data-zao-component="approval-gate"] [data-zao-slot="record"]');
  await expect(records).toHaveCount(5);
  const impressionCount = await page.locator('[data-zao-slot="impression"]').count();
  expect(impressionCount).toBe(3);
  await expect(page.locator('[data-zao-seal="azurite"] [data-zao-slot="impression"]')).toHaveCount(
    1,
  );
  const sealPaint = await page
    .locator('[data-zao-seal="azurite"] [data-zao-slot="impression"]')
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  const inkPaint = await page
    .locator('[data-zao-component="approval-gate"] [data-zao-slot="impression"]')
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(sealPaint).not.toBe(inkPaint);
});

test('Card and Table drawing states keep native geometry, disable content, and finish on Build', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components/table');
  const demo = page.locator('section[aria-labelledby="table-drawing-heading"]');
  const root = page
    .locator('[data-zao-component="table"]')
    .filter({ has: page.locator('table[aria-label="Storage records"]') });
  const before = await root.boundingBox();
  await demo.getByRole('button', { name: 'Load' }).click();
  await expect(root).toHaveAttribute('aria-busy', 'true');
  await expect(root).toHaveAttribute('inert', '');
  await expect(root).toHaveAttribute('aria-hidden', 'true');
  await expect(demo.getByRole('status')).toHaveText('Loading storage records');
  await expect(root).toHaveAttribute('data-zao-drawing', '');
  await expect(root).toHaveCSS('transition-duration', '0s');
  expect(
    await root.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--zao-plane-rest').trim(),
    ),
  ).toBe('0px');
  const during = await root.boundingBox();
  expect(during && before && [during.x, during.width, during.height]).toEqual(
    before && [before.x, before.width, before.height],
  );
  await demo.getByRole('button', { name: 'Build' }).click();
  await expect(root).not.toHaveAttribute('aria-busy');
  await expect(root).not.toHaveAttribute('data-zao-drawing');
  await expect(root).toHaveAttribute('data-zao-building', '');
  await expect(root).not.toHaveAttribute('data-zao-building');
  expect(
    await root.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--zao-plane-rest').trim(),
    ),
  ).toBe('4px');

  await page.goto('/components/card');
  const cardDemo = page.locator('.construction-states');
  const card = page.locator('[data-zao-component="card"]').last();
  const cardBox = await card.boundingBox();
  await cardDemo.getByRole('button', { name: 'Load' }).click();
  await expect(card).toHaveAttribute('data-zao-drawing', '');
  await expect(card).toHaveAttribute('aria-busy', 'true');
  const drawingCardBox = await card.boundingBox();
  expect(drawingCardBox && cardBox && [drawingCardBox.width, drawingCardBox.height]).toEqual(
    cardBox && [cardBox.width, cardBox.height],
  );
  const horizontal = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(horizontal.scroll).toBeLessThanOrEqual(horizontal.client);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await cardDemo.getByRole('button', { name: 'Build' }).click();
  await expect(card).not.toHaveAttribute('data-zao-building');
});

test('Plan and approval records fit a narrow canvas and retain their construction in forced colors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['plan', 'approval-gate']) {
    await page.goto(`/components/${route}`);
    for (const mode of ['Light', 'Dark']) {
      await page
        .getByRole('radiogroup', { name: 'Mode' })
        .getByRole('radio', { name: mode, exact: true })
        .click();
      for (const direction of ['ltr', 'rtl']) {
        await page.evaluate((dir) => {
          document.documentElement.dir = dir;
        }, direction);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        ).toBe(true);
      }
    }
  }
  const impressions = page.locator('[data-zao-slot="impression"]');
  await expect(impressions).toHaveCount(2);
  await expect(page.locator('[data-zao-slot="record"][data-zao-new]')).toHaveCount(0);
  await page.emulateMedia({ forcedColors: 'active' });
  for (const impression of await impressions.all()) {
    await expect(impression).toHaveCSS('forced-color-adjust', 'none');
    const paint = await impression.evaluate((node) => ({
      fill: getComputedStyle(node).backgroundColor,
      mark: getComputedStyle(node.firstElementChild!).color,
    }));
    expect(paint.fill).not.toBe(paint.mark);
  }
  await page.goto('/components/plan');
  const step = page
    .locator('[data-zao-component="plan"]')
    .first()
    .locator('[data-zao-slot="step"]')
    .first();
  const segment = await step.evaluate((node) => getComputedStyle(node, '::after').backgroundColor);
  expect(segment).not.toBe('rgba(0, 0, 0, 0)');
});
