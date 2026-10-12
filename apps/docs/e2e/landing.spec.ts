import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

// The landing page (docs/plans/2026-10-landing). L5–L9 and L14–L17 are decided; L12 and L13
// remain open and have no option sheet. Since Oct 11 (finish plan V9, V10) the hero is the
// workspace taken apart along the depth axis, resting on Parts, and the bracket set closes the
// page in Explore.

async function chooseMode(page: Page, mode: 'light' | 'dark') {
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
}

async function open(page: Page, query = '', mode: 'light' | 'dark' = 'light') {
  await page.goto(`/${query}`);
  await chooseMode(page, mode);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-landing]')).toHaveAttribute('data-zao-mode', mode);
}

/** A course's vertical travel in figure units (fen), read from its computed transform. */
function lift(page: Page, course: number) {
  return page
    .locator(`[data-landing-bracket] .landing-bracket-part[data-course="${course}"]`)
    .first()
    .evaluate((part) => {
      const transform = getComputedStyle(part).transform;
      return transform === 'none' ? 0 : -new DOMMatrixReadOnly(transform).f || 0;
    });
}

/** Points at the drawing: across is 0–1 of its width, `y` is in figure units. */
async function pointAt(page: Page, across: number, y: number) {
  await page.locator('[data-landing-bracket]').scrollIntoViewIfNeeded();
  const box = (await page.locator('[data-landing-bracket] svg').boundingBox())!;
  await page.mouse.move(box.x + box.width * across, box.y + ((y - 1.5) / 92) * box.height);
}

/** The box in page coordinates, so scrolling a control into view does not count as movement. */
function pageBox(locator: Locator) {
  return locator.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
  });
}

/** Luminance of a computed background, 0 (black) to 1 (white), whatever color syntax it uses. */
function luminance(page: Page, selector: string) {
  return page.locator(selector).evaluate((node) => {
    const context = document.createElement('canvas').getContext('2d')!;
    context.fillStyle = getComputedStyle(node).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255;
  });
}

const caption = (page: Page) => page.locator('.landing-bracket-caption [data-current]');

/** The working window. Each layer of the exploded drawing holds an inert copy of it. */
const liveWindow = (page: Page) => page.locator('.exploded-live [data-landing-window]');
const stage = (page: Page) => page.locator('[data-landing-section="hero"] .exploded-stage');

/** Puts the workspace back together so its controls can be used. */
async function build(page: Page) {
  await page
    .getByRole('radiogroup', { name: 'Workspace view' })
    .getByRole('radio', { name: 'Built' })
    .click();
  await expect(stage(page)).toHaveAttribute('data-pose', 'built');
  // Let the assembly finish settling before anything is measured.
  await stage(page).evaluate((node) =>
    Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

test('sections follow the plan order with one page title', async ({ page }) => {
  await open(page);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('ZAO is the foundation for how we build.');
  const order = await page
    .locator('[data-landing-section]')
    .evaluateAll((sections) =>
      sections.map((section) => section.getAttribute('data-landing-section')),
    );
  expect(order).toEqual(['hero', 'readers', 'explore']);
  for (const name of ['Written for two readers.', 'Explore ZAO']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  // The Button close-up and the standalone Depth section were dropped on Oct 10 (L16).
  await expect(page.getByRole('heading', { name: 'Every part has a job.' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Turn the depth.' })).toHaveCount(0);
  await expect(page.getByText('Local Su study')).toHaveCount(0);
});

test('hero actions are real links drawn with Button construction', async ({ page }) => {
  await open(page);
  const browse = page.getByRole('link', { name: 'Browse components' });
  const github = page.getByRole('link', { name: 'View on GitHub' });
  await expect(browse).toHaveAttribute('href', '/components/button');
  await expect(browse).toHaveAttribute('data-zao-variant', 'primary');
  await expect(github).toHaveAttribute('href', 'https://github.com/yankundesign/zao-design-system');
  await expect(github).toHaveAttribute('target', '_blank');
  await expect(browse.locator('[data-zao-slot="face"]')).toHaveCount(1);

  // Hover lifts the face 2px along the depth axis; the link's own box stays where it is.
  const before = await browse.boundingBox();
  const travel = () =>
    browse.locator('[data-zao-slot="face"]').evaluate((face) => {
      const transform = getComputedStyle(face).transform;
      const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
      return [matrix.m41, matrix.m42];
    });
  expect(await travel()).toEqual([0, 0]);
  await browse.hover();
  await expect.poll(travel).toEqual([2, -2]);
  expect(await browse.boundingBox()).toEqual(before);
});

test.describe('the bracket set answers the pointer', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

  test('rests assembled, opens evenly to six fen, picks a course, and settles', async ({
    page,
  }) => {
    await open(page);
    for (const course of [0, 3, 5]) expect(await lift(page, course)).toBe(0);
    await expect(caption(page)).toHaveText('斗拱 Bracket set. Standard parts, assembled by rule.');
    await page.locator('[data-landing-bracket]').scrollIntoViewIfNeeded();
    const hero = await pageBox(page.locator('[data-landing-section="hero"]'));

    // Far right is fully open. Pointing at the beam picks it: it rises 5 × 6 fen plus a half step.
    await pointAt(page, 0.99, 14.5 - 30);
    await expect.poll(() => lift(page, 5)).toBeCloseTo(33, 0);
    for (const course of [1, 2, 3, 4])
      await expect.poll(() => lift(page, course)).toBeCloseTo(course * 6, 0);
    await expect(caption(page)).toHaveText('柱头方 Beam · 15 fen high, one cai');
    await expect(page.locator('.landing-ruler')).toHaveAttribute('data-measuring', '');

    // L17 B: the parts not picked are ghosted in the rule ink; the picked part keeps full ink.
    const inks = await page.locator('[data-landing-bracket]').evaluate((drawing) => {
      const probe = (color: string) => {
        const span = document.createElement('span');
        span.style.color = color;
        drawing.append(span);
        const value = getComputedStyle(span).color;
        span.remove();
        return value;
      };
      const color = (selector: string) => getComputedStyle(drawing.querySelector(selector)!).color;
      return {
        picked: color('[data-course="5"]'),
        other: color('[data-course="0"]'),
        ink: probe('var(--zao-color-fg-default)'),
        rule: probe('var(--zao-color-border-subtle)'),
      };
    });
    expect(inks.picked).toBe(inks.ink);
    expect(inks.other).toBe(inks.rule);

    // Opening never moves the page.
    expect(await pageBox(page.locator('[data-landing-section="hero"]'))).toEqual(hero);

    // The long arm, half open: it and the parts on it lift half a step more than the gap.
    await pointAt(page, 0.5, 39.5 - 9);
    await expect(caption(page)).toHaveText('慢栱 Long arm · 92 × 15 fen');
    await expect.poll(() => lift(page, 2)).toBeCloseTo(6, 0);
    await expect.poll(() => lift(page, 3)).toBeCloseTo(12, 0);
    const span = page.locator('[data-ruler-span]').first();
    const ruler = (await page.locator('.landing-ruler').boundingBox())!;
    await expect
      .poll(async () => {
        const box = (await span.boundingBox())!;
        return Math.round((box.width / ruler.width) * 126);
      })
      .toBe(92);

    // Leaving settles every part back to its seat.
    await page.mouse.move(4, 4);
    for (const course of [1, 3, 5]) await expect.poll(() => lift(page, course)).toBe(0);
    await expect(caption(page)).toHaveText('斗拱 Bracket set. Standard parts, assembled by rule.');
    await expect(page.locator('.landing-ruler')).not.toHaveAttribute('data-measuring', '');
  });

  test('keyboard picks and opens, Escape rests, and readings are announced', async ({ page }) => {
    await open(page);
    const drawing = page.getByRole('group', { name: 'Bracket set drawing' });
    await drawing.scrollIntoViewIfNeeded();
    await drawing.focus();
    await page.keyboard.press('ArrowUp');
    await expect(caption(page)).toHaveText('栌斗 Main bearing block · 32 × 20 fen');
    await expect(page.locator('[data-landing-hero-figure] [role="status"]')).toHaveText(
      '栌斗 Main bearing block, 32 by 20 fen.',
    );
    for (let press = 0; press < 8; press += 1) await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-landing-hero-figure] [role="status"]')).toHaveText(
      'Opened 6 of 6 fen.',
    );
    await expect.poll(() => lift(page, 4)).toBeCloseTo(4 * 6 + 3, 0);
    await page.keyboard.press('ArrowDown');
    await expect(caption(page)).toHaveText('栌斗 Main bearing block · 32 × 20 fen');
    await page.keyboard.press('Escape');
    await expect.poll(() => lift(page, 4)).toBe(0);
    await expect(drawing).toBeFocused();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });

  test('parts stay seated while the pick, measure and readout answer', async ({ page }) => {
    await open(page);
    await pointAt(page, 0.99, 39.5 - 18);
    await expect(caption(page)).not.toHaveText(/Bracket set/);
    await expect(page.locator('.landing-ruler')).toHaveAttribute('data-measuring', '');
    for (const course of [1, 3, 5]) expect(await lift(page, course)).toBe(0);
    const animations = await page
      .locator('[data-landing-bracket] .landing-bracket-part')
      .evaluateAll(async (parts) => {
        const running = parts.flatMap((part) => part.getAnimations());
        const transforms = parts.map((part) => getComputedStyle(part).transform);
        const properties = running.map((animation) =>
          animation instanceof CSSTransition ? animation.transitionProperty : 'animation',
        );
        // Reduced motion removes transform but retains color feedback, shortened
        // to 0.01ms by the global protection. Await that real browser update.
        await Promise.all(running.map((animation) => animation.finished));
        return {
          transforms,
          properties,
          count: parts.flatMap((part) => part.getAnimations()).length,
        };
      });
    expect(new Set(animations.transforms)).toEqual(new Set(['none']));
    expect(animations.properties.every((property) => property === 'color')).toBe(true);
    expect(animations.count).toBe(0);
  });
});

test('the workspace follows the page: light on a light page, dark on a dark page', async ({
  page,
}) => {
  const hero = page.locator('[data-landing-section="hero"]');
  for (const mode of ['light', 'dark'] as const) {
    await open(page, '', mode);
    // It sets no mode of its own; it inherits the landing island's.
    await expect(hero).not.toHaveAttribute('data-zao-mode', /.*/);
    await expect(liveWindow(page)).not.toHaveAttribute('data-zao-mode', /.*/);
    const window = await luminance(page, '.exploded-live [data-landing-window]');
    expect(mode === 'light' ? window > 0.8 : window < 0.2).toBe(true);
  }
});

test('the island takes the resolved mode before hydration', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  // Without the app's scripts, only the inline mode script can set the island's mode.
  await page.route('**/_next/static/chunks/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-landing]')).toHaveAttribute('data-zao-mode', 'dark');
  expect(await luminance(page, '.exploded-live [data-landing-window]')).toBeLessThan(0.2);
  await context.close();
});

test.describe('the workspace', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const status = (page: Page, id: string) => page.locator(`[data-request-status="${id}"]`).first();
  const transcript = (page: Page) =>
    page.locator('.exploded-live [data-landing-window] .zao-conversation-list');

  test('the assistant approves the waiting requests, and the same Button reopens them', async ({
    page,
  }) => {
    await open(page);
    await build(page);
    await expect(status(page, 'REQ-0137')).toHaveText('Needs review');
    await expect(status(page, 'REQ-1186')).toHaveText('Needs review');
    const action = page.getByRole('button', { name: 'Approve 2 requests' });
    await action.click();
    await expect(status(page, 'REQ-0137')).toHaveText('Ready');
    await expect(status(page, 'REQ-1186')).toHaveText('Ready');
    await expect(
      transcript(page).getByText(
        'Approved 2 requests. Policy update and Storage audit are now Ready.',
      ),
    ).toBeVisible();
    const reopen = page.getByRole('button', { name: 'Reopen 2 requests' });
    await expect(reopen).toBeFocused();
    await reopen.click();
    await expect(status(page, 'REQ-0137')).toHaveText('Needs review');
    await expect(page.getByRole('button', { name: 'Approve 2 requests' })).toBeFocused();
  });

  test('a written request to approve does the same', async ({ page }) => {
    await open(page);
    await build(page);
    await page.getByRole('textbox', { name: 'Message the assistant' }).fill('Approve them, please');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(status(page, 'REQ-1186')).toHaveText('Ready');
    await expect(transcript(page).getByText('Approve them, please')).toBeVisible();
  });

  test('tabs, Menu and IconButton switch views without resizing the window', async ({ page }) => {
    await open(page);
    await build(page);
    const window = liveWindow(page);
    const before = await pageBox(window);
    await page.getByRole('tab', { name: /^Members/ }).click();
    await expect(page.getByRole('table', { name: 'North members' })).toBeVisible();
    expect(await pageBox(window)).toEqual(before);
    await page.getByRole('button', { name: 'Workspace settings' }).click();
    await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('button', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'All requests' }).click();
    await expect(page.getByRole('tab', { name: /^Requests/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await pageBox(window)).toEqual(before);
  });

  test('the hero rests on Parts: six named layers that keep the stage and the page still', async ({
    page,
  }) => {
    await open(page);
    const drawing = stage(page);
    await expect(drawing).toHaveAttribute('data-pose', 'parts');
    await expect(drawing).toHaveAttribute('data-apart', 'true');
    const radios = page.getByRole('radiogroup', { name: 'Workspace view' });
    await expect(radios.getByRole('radio', { name: 'Parts' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    // The working window is hidden and inert; six layers, each a static copy, stand in for it.
    await expect(liveWindow(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Approve 2 requests' })).toHaveCount(0);
    await expect(drawing.locator('.exploded-layer')).toHaveCount(6);
    await expect(drawing.locator('.exploded-tag-name')).toHaveText([
      /^00 canvas/,
      /^01 surface/,
      /^02 cards/,
      /^03 controls/,
      /^04 overlay/,
      /^05 focus/,
    ]);
    const hero = page.locator('[data-landing-section="hero"]');
    const heroCaption = hero.locator('.landing-hero-caption');
    await expect(heroCaption).toContainText('six layers along the depth axis');

    // Every layer stays inside the stage.
    const box = await drawing.boundingBox();
    for (const layer of await drawing.locator('.exploded-layer').all()) {
      const part = (await layer.boundingBox())!;
      expect(part.x).toBeGreaterThanOrEqual(box!.x - 1);
      expect(part.y).toBeGreaterThanOrEqual(box!.y - 1);
      expect(part.x + part.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
      expect(part.y + part.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
    }

    // The keyboard picks layers from the canvas up, and Escape clears the pick.
    const group = page.getByRole('group', { name: 'North workspace, taken apart into six layers' });
    await group.focus();
    await page.keyboard.press('ArrowUp');
    await expect(heroCaption).toHaveText('00 Canvas: the ground every part stands on.');
    await page.keyboard.press('ArrowUp');
    await expect(heroCaption).toContainText('01 Surface');
    await expect(drawing.locator('.exploded-layer[data-picked="true"]')).toHaveAttribute(
      'data-layer',
      'surface',
    );
    await page.keyboard.press('Escape');
    await expect(heroCaption).toContainText('six layers along the depth axis');

    // Built puts the window back in the same box; nothing below moves.
    const before = await pageBox(drawing);
    const below = await pageBox(page.locator('[data-landing-section="readers"]'));
    await build(page);
    await expect(liveWindow(page)).toBeVisible();
    const named = await liveWindow(page)
      .locator('[data-showcase-part]')
      .evaluateAll((parts) => [
        ...new Set(parts.map((part) => part.getAttribute('data-showcase-part'))),
      ]);
    expect(named.length).toBe(11);
    await expect(heroCaption).toContainText(`made from ${named.length} ZAO components`);
    expect(await pageBox(drawing)).toEqual(before);
    expect(await pageBox(page.locator('[data-landing-section="readers"]'))).toEqual(below);
    await radios.getByRole('radio', { name: 'Parts' }).click();
    await expect(drawing).toHaveAttribute('data-pose', 'parts');
    await expect(liveWindow(page)).toBeHidden();
  });

  test('depth scales the window’s painted distances, never its layout', async ({ page }) => {
    await open(page);
    await build(page);
    const window = liveWindow(page);
    const before = await pageBox(window);
    const slider = page.getByRole('slider', { name: 'Depth scale' });
    await slider.fill('4');
    await expect(window).toHaveAttribute('data-depth-scale', '4');
    const lift = await window.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--zao-depth-lift'),
    );
    expect(Number.parseFloat(lift)).toBeGreaterThan(4);
    expect(await pageBox(window)).toEqual(before);
  });
});

test('keyboard order follows the reading order', async ({ page }) => {
  await open(page);
  const main = page.locator('main');
  const targets: Locator[] = [
    main.getByRole('link', { name: 'Browse components' }),
    main.getByRole('link', { name: 'View on GitHub' }),
    main.getByRole('group', { name: 'Bracket set drawing' }),
    main.getByRole('radio', { name: 'Parts' }),
    main.getByRole('group', { name: 'North workspace, taken apart into six layers' }),
    main.getByRole('slider', { name: 'Depth scale' }),
    main.getByRole('link', { name: /^Foundations/ }),
  ];
  const positions: number[] = [];
  for (const target of targets) {
    positions.push(
      await target.first().evaluate((node) => {
        const all = [
          ...document.querySelectorAll<HTMLElement>(
            'main a[href], main button:not([disabled]), main input:not([disabled]), main [tabindex="0"]',
          ),
        ];
        return all.indexOf(node as HTMLElement);
      }),
    );
  }
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test('explore tiles are whole links and lift one drawn part', async ({ page }) => {
  await open(page);
  const tiles = page.locator('.landing-explore-tile');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('href', '/foundations/color');
  await expect(tiles.nth(1)).toHaveAttribute('href', '/components/button');
  await expect(tiles.nth(2)).toHaveAttribute('href', '/charts');
  await expect(tiles.nth(1)).toContainText('14 parts, one construction.');
  const figure = tiles.nth(1).locator('svg');
  await expect(figure).toHaveAttribute('aria-hidden', 'true');
  await tiles.nth(1).hover();
  await expect
    .poll(() =>
      tiles
        .nth(1)
        .locator('.docs-nav-figure-part')
        .evaluate((part) => getComputedStyle(part).transform),
    )
    .not.toBe('none');
});

test('the window tab strip never shows a scrollbar', async ({ page }) => {
  const strip = () =>
    page
      .locator('.exploded-live [data-landing-window] .tabs-viewport')
      .evaluate((viewport: HTMLElement) => ({
        overflow: viewport.scrollWidth - viewport.clientWidth,
        scrollbar: viewport.offsetHeight - viewport.clientHeight,
        hidden: getComputedStyle(viewport).scrollbarWidth,
      }));
  // Wide: every tab fits, so nothing scrolls.
  for (const width of [1440, 1280, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const reading = await strip();
    expect(reading.overflow).toBeLessThanOrEqual(0);
    expect(reading.scrollbar).toBe(0);
  }
  // Phone: the strip pans, with no scrollbar drawn.
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await build(page);
  const narrow = await strip();
  expect(narrow.hidden).toBe('none');
  expect(narrow.scrollbar).toBe(0);
  await page.getByRole('tab', { name: 'Overview' }).focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Settings' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Settings' })).toBeInViewport();
});

test('narrow layouts never scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  // The Parts drawing is fitted to the stage; the Built window reflows to the phone.
  expect(await overflow()).toBeLessThanOrEqual(0);
  await build(page);
  expect(await overflow()).toBeLessThanOrEqual(0);
});

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: axe finds no violations`, async ({ page }) => {
    await open(page, '', mode);
    const results = await new AxeBuilder({ page }).include('main').analyze();
    expect(results.violations).toEqual([]);
  });
}
