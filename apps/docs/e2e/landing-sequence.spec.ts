import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// The landing sequence (docs/plans/2026-11-landing-sequence, WP 5.1). On a desktop with motion
// allowed, `/` opens on Parts across the whole screen, builds the workspace as the reader
// scrolls, holds it, and sets it into the docs page; reduced motion, phones and short windows
// keep the Oct 11 hero (LS10, LS12).

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });

interface Scenes {
  A: number;
  H: number;
  total: number;
}

async function openSequence(page: Page): Promise<Scenes> {
  await page.goto('/');
  await page.locator('[data-landing-sequence][data-ready]').waitFor({ state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  const { header, total } = await page.evaluate(() => ({
    header: document.querySelector<HTMLElement>('body > header')!.offsetHeight,
    total: document.querySelector<HTMLElement>('.landing-sequence-spacer')!.offsetHeight,
  }));
  const V = 900 - header;
  // LS3: assembly over 1.5 screens, Built held for half a screen, the step back over one.
  expect(total).toBeCloseTo(3 * V, 0);
  return { A: 1.5 * V, H: 0.5 * V, total };
}

/** Scrolls natively and waits for two frames, so the scroll timeline and the state follow. */
async function at(page: Page, top: number) {
  await page.evaluate(async (y) => {
    window.scrollTo(0, y);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, top);
}

const stage = (page: Page) => page.locator('[data-landing-section="hero"] .exploded-stage');
const header = (page: Page) => page.locator('body > header');
const live = (page: Page) => page.locator('.exploded-live [data-landing-window]');

/** What the reader sees at a point: the header or what covers it. */
const topAt = (page: Page, x: number, y: number) =>
  page.evaluate(
    ([px, py]) =>
      document.elementFromPoint(px!, py!)?.closest('body > header') ? 'header' : 'other',
    [x, y],
  );

const headlineTop = (page: Page) =>
  page.locator('#landing-title').evaluate((node) => Math.round(node.getBoundingClientRect().top));

const overflowX = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('opens on Parts across the whole screen, the header covered, with a still hint', async ({
  page,
}) => {
  await openSequence(page);
  await expect(stage(page)).toHaveAttribute('data-pose', 'parts');
  await expect(stage(page)).toHaveAttribute('data-scrub', '');
  // LS1, revised: no header first. It, the nav and the copy wait under the window, inert.
  await expect(header(page)).toHaveAttribute('inert', '');
  expect(await topAt(page, 720, 30)).toBe('other');
  for (const selector of ['.docs-nav-aside', '.landing-hero-copy']) {
    await expect(page.locator(selector)).toHaveAttribute('inert', '');
  }
  await expect(page.locator('.landing-sequence-ground')).toBeVisible();
  const foot = page.locator('.landing-sequence-caption');
  await expect(foot).toHaveText('Scroll to build');
  await expect(foot).toBeInViewport();
  // The hint is still: nothing on the first screen runs on its own. (Plates further down may run
  // their own arrivals; they replay when they come into view.)
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((animation) => {
        if (!(animation.timeline instanceof DocumentTimeline)) return false;
        if (animation.playState !== 'running') return false;
        const target = (animation.effect as KeyframeEffect | null)?.target;
        if (!target) return true;
        const box = target.getBoundingClientRect();
        return box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
      }).length,
  );
  expect(running).toBe(0);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
});

test('scrolling builds the workspace, holds it full width, then sets it into the page', async ({
  page,
}) => {
  const { A, H, total } = await openSequence(page);

  // Mid-assembly: still the drawing; the lower gaps have closed, so their tags have retired.
  await at(page, A * 0.45);
  await expect(stage(page)).toHaveAttribute('data-pose', 'parts');
  await expect(page.locator('.landing-sequence-caption')).toBeHidden();
  const tags = await stage(page)
    .locator('.exploded-tag')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).visibility));
  expect(tags[1]).toBe('hidden');
  expect(tags[5]).toBe('visible');

  // Built: the working window across the screen's width (LS4, revised), usable.
  await at(page, A + H * 0.5);
  await expect(stage(page)).toHaveAttribute('data-pose', 'built');
  await expect(live(page)).toBeVisible();
  const built = (await live(page).boundingBox())!;
  expect(built.width).toBeGreaterThan(1300);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
  const status = page.locator('[data-request-status="REQ-0137"]').first();
  await expect(status).toHaveText('Needs review');
  // The window's bottom waits below the fold while Built fills the width (LS4), so only what
  // is in view is used here; landing.spec.ts covers the rest of the workspace.
  await page.getByRole('button', { name: 'Approve 2 requests' }).click();
  await expect(status).toHaveText('Ready');

  // Stepping back: the docs are held still around the window, the header uncovered.
  const resting = await headlineTop(page);
  await at(page, A + H + (total - A - H) * 0.6);
  expect(await headlineTop(page)).toBe(resting);
  const headerBottom = (await header(page).boundingBox())!.height;
  expect((await page.locator('.landing-sequence-stage').boundingBox())!.y).toBeGreaterThan(
    headerBottom,
  );

  // Nearly docked, the copy, nav and header are already uncovered, so they are usable: covering
  // follows the window's painted box, not the scroll position.
  await at(page, total - 30);
  for (const selector of ['body > header', '.docs-nav-aside', '.landing-hero-copy']) {
    await expect(page.locator(selector)).not.toHaveAttribute('inert');
  }

  // Docked: the window rests at 1:1 in its slot. The sequence is done for the session: the
  // spacer goes and the scroll moves back by its height in the same frame, so nothing moves.
  await at(page, total);
  await expect(page.locator('.landing-sequence-spacer')).toHaveCount(0);
  await expect(page.locator('[data-landing-sequence]')).toHaveAttribute('data-phase', 'done');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await headlineTop(page)).toBe(resting);
  await expect(stage(page)).toHaveAttribute('data-pose', 'built');
  await expect(header(page)).not.toHaveAttribute('inert');
  await expect(page.locator('.docs-nav-aside')).not.toHaveAttribute('inert');
  await expect(page.locator('.landing-hero-copy')).not.toHaveAttribute('inert');
  const slot = (await page.locator('.landing-sequence-slot').boundingBox())!;
  const workspace = (await page.locator('.landing-sequence-stage').boundingBox())!;
  expect(workspace.x).toBeCloseTo(slot.x, 0);
  expect(workspace.y).toBeCloseTo(slot.y, 0);
  expect(workspace.width).toBeCloseTo(slot.width, 0);
  // The header is on top and can be used: its mode switch is what a pointer reaches.
  const dark = page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: 'Dark', exact: true });
  const point = (await dark.boundingBox())!;
  expect(
    await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.closest('[role="radio"]')?.textContent,
      [point.x + point.width / 2, point.y + point.height / 2],
    ),
  ).toBe('Dark');

  // The page scrolls normally, and scrolling up stops at the docs' top: nothing replays.
  await at(page, 100);
  expect(await headlineTop(page)).toBe(resting - 100);
  await at(page, 0);
  expect(await headlineTop(page)).toBe(resting);
  await expect(stage(page)).toHaveAttribute('data-pose', 'built');
  await expect(header(page)).not.toHaveAttribute('inert');
});

test('once docked, it is done for the session; a new session plays it again', async ({
  page,
  browser,
}) => {
  const { total } = await openSequence(page);
  await at(page, total);
  await expect(page.locator('[data-landing-sequence]')).toHaveAttribute('data-phase', 'done');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.reload();
  await page.locator('[data-landing-sequence][data-ready]').waitFor({ state: 'attached' });
  // From the first visible frame the workspace is the live window, never the drawing's copies.
  expect(
    await page.evaluate(() => {
      const drawing = document.querySelector<HTMLElement>(
        '[data-landing-section="hero"] .exploded-stage',
      )!;
      return [
        drawing.dataset.pose,
        document.querySelectorAll('.exploded-layer[data-layer]').length
          ? getComputedStyle(document.querySelector('.exploded-layer')!).display
          : 'none',
      ];
    }),
  ).toEqual(['built', 'none']);
  await expect(page.locator('[data-landing-sequence]')).toHaveAttribute('data-phase', 'done');
  await expect(page.locator('.landing-sequence-spacer')).toHaveCount(0);
  await expect(stage(page)).toHaveAttribute('data-pose', 'built');
  await expect(header(page)).not.toHaveAttribute('inert');
  await expect(page.getByRole('radiogroup', { name: 'Workspace view' })).toHaveCount(0);

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const fresh = await context.newPage();
  await fresh.goto('/');
  await fresh.locator('[data-landing-sequence][data-ready]').waitFor({ state: 'attached' });
  await expect(fresh.locator('[data-landing-sequence]')).toHaveAttribute('data-phase', 'sequence');
  await expect(fresh.locator('.landing-sequence-spacer')).toHaveCount(1);
  await context.close();
});

test('before docking it reverses, and picking works only at rest', async ({ page }) => {
  const { A, H } = await openSequence(page);
  await at(page, A + H);
  await expect(stage(page)).toHaveAttribute('data-pose', 'built');
  await at(page, 0);
  await expect(stage(page)).toHaveAttribute('data-pose', 'parts');
  await expect(header(page)).toHaveAttribute('inert', '');
  await expect(page.locator('.landing-sequence-caption')).toHaveText('Scroll to build');

  // Pointing at the drawing picks a layer: it rises, the others stay at half strength.
  const box = (await stage(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
  await expect(stage(page)).toHaveAttribute('data-picking', 'true');
  await expect(page.locator('.landing-sequence-caption')).not.toHaveText('Scroll to build');
  await expect
    .poll(() =>
      stage(page)
        .locator('.exploded-layer:not([data-picked="true"])')
        .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).opacity)),
    )
    .toEqual(['0.5', '0.5', '0.5', '0.5', '0.5']);
  // Scrolling clears the pick.
  await at(page, 20);
  await expect(stage(page)).toHaveAttribute('data-picking', 'false');
});

test('never takes over scrolling', async ({ page }) => {
  await openSequence(page);
  await page.evaluate(() => {
    (window as unknown as { prevented: number }).prevented = 0;
    for (const type of ['wheel', 'touchmove', 'keydown']) {
      window.addEventListener(
        type,
        (event) => {
          // Runs after every other listener on the target's path.
          queueMicrotask(() => {
            if (event.defaultPrevented) (window as unknown as { prevented: number }).prevented++;
          });
        },
        { capture: true },
      );
    }
  });
  await page.mouse.move(720, 450);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(600);
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => (window as unknown as { prevented: number }).prevented)).toBe(0);
});

test('reloading mid-sequence renders that scene, and layout never shifts', async ({ page }) => {
  const { A, H } = await openSequence(page);
  await page.evaluate(() => {
    (window as unknown as { shift: number }).shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[])
        (window as unknown as { shift: number }).shift += entry.value;
    }).observe({ type: 'layout-shift', buffered: false });
  });
  for (let y = 0; y <= A + H; y += 200) await at(page, y);
  expect(await page.evaluate(() => (window as unknown as { shift: number }).shift)).toBeLessThan(
    0.01,
  );
  await page.reload();
  await page.locator('[data-landing-sequence][data-ready]').waitFor({ state: 'attached' });
  const scroll = await page.evaluate(() => window.scrollY);
  await expect(stage(page)).toHaveAttribute('data-pose', scroll >= A ? 'built' : 'parts');
});

test('focus starts on the drawing, never under the window', async ({ page }) => {
  await openSequence(page);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('group', { name: 'North workspace, taken apart into six layers' }),
  ).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.landing-sequence-caption')).toHaveText(
    '00 Canvas: the ground every part stands on.',
  );
});

for (const [name, options] of [
  ['reduced motion', { reducedMotion: 'reduce' as const, viewport: { width: 1440, height: 900 } }],
  [
    'a short window',
    { reducedMotion: 'no-preference' as const, viewport: { width: 1280, height: 600 } },
  ],
  ['a phone', { reducedMotion: 'no-preference' as const, viewport: { width: 375, height: 812 } }],
] as const) {
  test.describe(name, () => {
    test.use(options);

    test('keeps the Oct 11 hero with its Parts/Built switch', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-landing-sequence][data-ready]').waitFor({ state: 'attached' });
      await expect(page.locator('.landing-sequence-spacer')).toHaveCount(0);
      await expect(header(page)).not.toHaveAttribute('inert');
      await expect(page.locator('#landing-title')).toBeVisible();
      const radios = page.getByRole('radiogroup', { name: 'Workspace view' });
      await radios.getByRole('radio', { name: 'Built' }).click();
      await expect(stage(page)).toHaveAttribute('data-pose', 'built');
      expect(await overflowX(page)).toBeLessThanOrEqual(0);
    });
  });
}

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: axe finds no violations at Parts and when docked`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: mode });
    const { total } = await openSequence(page);
    await expect(page.locator('[data-landing]')).toHaveAttribute('data-zao-mode', mode);
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    await at(page, total);
    await expect(page.locator('[data-landing-sequence]')).toHaveAttribute('data-phase', 'done');
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  });
}
