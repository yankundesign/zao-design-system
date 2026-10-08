import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const finishes = [
  { name: 'Su light', theme: 'su', mode: 'light' },
  { name: 'Su dark', theme: 'su', mode: 'dark' },
] as const;

async function settle(nav: Locator) {
  await nav.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function openDocs(page: Page, finish: (typeof finishes)[number]) {
  await page.setViewportSize({ width: 1280, height: 1300 });
  await page.goto('/components/card?style=quiet-instrument');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: finish.mode === 'light' ? 'Light' : 'Dark' })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-zao-theme', finish.theme);
  await expect(page.locator('html')).toHaveAttribute('data-zao-mode', finish.mode);
  await page.evaluate(async () => document.fonts.ready);
  await page.mouse.move(0, 0);
  const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
  await settle(nav);
  return nav;
}

async function semantic(link: Locator) {
  return link.evaluate((node) => {
    const sample = document.createElement('span');
    sample.style.position = 'absolute';
    sample.style.pointerEvents = 'none';
    sample.style.transition = 'none';
    sample.style.animation = 'none';
    node.append(sample);
    const color = (token: string) => {
      sample.style.color = `var(${token})`;
      return getComputedStyle(sample).color;
    };
    const background = (token: string) => {
      sample.style.backgroundColor = `var(${token})`;
      return getComputedStyle(sample).backgroundColor;
    };
    const result = {
      foreground: color('--zao-color-fg-default'),
      muted: color('--zao-color-fg-muted'),
      hover: background('--zao-color-bg-hover'),
      active: background('--zao-color-bg-active'),
      edge: background('--zao-color-fg-default'),
      contact: background('--zao-color-border-subtle'),
      medium: getComputedStyle(node).getPropertyValue('--zao-font-weight-medium').trim(),
    };
    sample.remove();
    return result;
  });
}

async function edge(link: Locator) {
  return link.evaluate((node) => {
    const paper = node.querySelector<HTMLElement>('.docs-nav-paper')!;
    const paperStyle = getComputedStyle(paper);
    const style = getComputedStyle(paper, '::after');
    const matrix = new DOMMatrixReadOnly(style.transform);
    const linkBox = node.getBoundingClientRect();
    const paperBox = paper.getBoundingClientRect();
    const sample = document.createElement('span');
    sample.style.position = 'absolute';
    sample.style.pointerEvents = 'none';
    sample.style.transition = 'none';
    sample.style.animation = 'none';
    sample.style.transitionTimingFunction = 'var(--zao-motion-easing-standard)';
    node.append(sample);
    const expectedEasing = getComputedStyle(sample).transitionTimingFunction;
    sample.remove();
    return {
      opacity: Number(paperStyle.opacity),
      faceFill: paperStyle.backgroundColor,
      faceLeft: paperBox.left - linkBox.left,
      faceRight: linkBox.right - paperBox.right,
      faceTop: paperBox.top - linkBox.top,
      faceBottom: linkBox.bottom - paperBox.bottom,
      scaleX: matrix.m11,
      scaleY: matrix.m22,
      x: matrix.m41,
      y: matrix.m42,
      top: Number.parseFloat(style.top),
      bottom: Number.parseFloat(style.bottom),
      right: Number.parseFloat(style.right),
      width: Number.parseFloat(style.width),
      height: Number.parseFloat(style.height),
      origin: style.transformOrigin,
      fill: style.backgroundColor,
      content: style.content,
      pointerEvents: style.pointerEvents,
      transition: paperStyle.transitionProperty,
      duration: paperStyle.transitionDuration,
      easing: paperStyle.transitionTimingFunction,
      expectedDuration: paperStyle.getPropertyValue('--zao-motion-duration-fast').trim(),
      expectedEasing,
    };
  });
}

async function expectEdge(link: Locator, current: boolean) {
  await expect
    .poll(() => edge(link))
    .toMatchObject({
      opacity: current ? 1 : 0,
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
    });
}

async function lip(link: Locator) {
  return link.locator('.docs-nav-paper').evaluate((paper) => {
    const style = getComputedStyle(paper, '::before');
    const paperStyle = getComputedStyle(paper);
    const matrix = new DOMMatrixReadOnly(style.transform);
    const offsets = (shadow: string) =>
      (shadow.match(/-?\d+(?:\.\d+)?px/g) ?? []).map((value) => Number.parseFloat(value));
    return {
      angle: (Math.atan2(matrix.m31, matrix.m11) * 180) / Math.PI,
      perspective: matrix.m34,
      transform: style.transform,
      left: Number.parseFloat(style.left),
      top: Number.parseFloat(style.top),
      bottom: Number.parseFloat(style.bottom),
      width: Number.parseFloat(style.width),
      origin: style.transformOrigin,
      fill: style.backgroundColor,
      content: style.content,
      pointerEvents: style.pointerEvents,
      transition: style.transitionProperty,
      faceTransition: paperStyle.transitionProperty,
      shadow: style.boxShadow,
      faceShadow: paperStyle.boxShadow,
      contactOffsets: offsets(style.boxShadow),
      faceContactOffsets: offsets(paperStyle.boxShadow),
    };
  });
}

async function expectLip(link: Locator, angle: 0 | 30) {
  await expect.poll(async () => (await lip(link)).angle).toBeCloseTo(angle, 3);
}

async function expectContact(link: Locator, face: 0 | 1, fold: 0 | 1 | 2) {
  await expect
    .poll(() => lip(link))
    .toMatchObject({
      faceContactOffsets: [0, face, 0, 0],
      contactOffsets: [fold === 0 ? 0 : -fold, fold, 0, 0],
    });
}

async function geometry(nav: Locator) {
  return nav.getByRole('link').evaluateAll((links) =>
    links.map((link) => {
      const box = link.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(link.querySelector('.docs-nav-label')!);
      const text = range.getBoundingClientRect();
      return {
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        text: { x: text.x, y: text.y, width: text.width, height: text.height },
      };
    }),
  );
}

async function capturePaper(page: Page, link: Locator, name: string) {
  const box = await link.boundingBox();
  if (!box) throw new Error('The selected paper row must have visible bounds.');
  const viewport = page.viewportSize()!;
  const x = Math.max(0, box.x - 4);
  const y = Math.max(0, box.y - 4);
  const right = Math.min(viewport.width, box.x + box.width + 4);
  const bottom = Math.min(viewport.height, box.y + box.height + 4);
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path, clip: { x, y, width: right - x, height: bottom - y } });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function capture(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function armMarker(link: Locator) {
  await link.evaluate((node) => {
    const paper = node.querySelector('.docs-nav-paper')!;
    node.setAttribute('data-nav-marker-transitions', '[]');
    const record = (event: Event) => {
      const transition = event as TransitionEvent;
      if (
        transition.target !== paper ||
        transition.pseudoElement !== '' ||
        transition.propertyName !== 'opacity'
      ) {
        return;
      }
      const style = getComputedStyle(paper);
      const properties = style.transitionProperty.split(',').map((value) => value.trim());
      const durations = style.transitionDuration.split(',').map((value) => value.trim());
      let propertyIndex = -1;
      properties.forEach((property, index) => {
        if (property === 'all' || property === transition.propertyName) propertyIndex = index;
      });
      const duration = propertyIndex < 0 ? null : durations[propertyIndex % durations.length]!;
      const observed = JSON.parse(node.getAttribute('data-nav-marker-transitions')!) as unknown[];
      observed.push({
        phase: transition.type === 'transitionrun' ? 'run' : 'end',
        property: transition.propertyName,
        duration:
          transition.type === 'transitionend'
            ? transition.elapsedTime * 1000
            : duration === null
              ? null
              : Number.parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000),
        pathname: window.location.pathname,
      });
      node.setAttribute('data-nav-marker-transitions', JSON.stringify(observed));
    };
    node.addEventListener('transitionrun', record);
    node.addEventListener('transitionend', record);
  });
}

function milliseconds(value: string) {
  return Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);
}

for (const finish of finishes) {
  test(`${finish.name}: row states preserve location, labels, targets, and outside keyboard focus`, async ({
    page,
  }) => {
    const nav = await openDocs(page, finish);
    const current = nav.getByRole('link', { name: 'Card', exact: true });
    const candidate = nav.getByRole('link', { name: 'Color', exact: true });
    const colors = await semantic(candidate);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(current).toHaveAttribute('aria-current', 'page');
    expect(await current.evaluate((node) => node.tagName)).toBe('A');
    await expect(current).toHaveCSS('border-radius', '0px');
    await expect(current).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(current.locator('.docs-nav-paper')).toHaveCSS('background-color', colors.active);
    await expect(current).toHaveCSS('color', colors.foreground);
    await expect(current).toHaveCSS('font-weight', colors.medium);
    await expect(candidate).toHaveCSS('color', colors.muted);
    await expect(candidate).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expectEdge(current, true);
    await expectEdge(candidate, false);

    for (const link of await nav.getByRole('link').all()) {
      const paper = link.locator('.docs-nav-paper');
      await expect(paper).toHaveAttribute('aria-hidden', 'true');
      await expect(paper).toBeEmpty();
      expect(await paper.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(-1);
      await expect(paper).toHaveCSS('pointer-events', 'none');
      const marker = await edge(link);
      expect(marker.content).not.toBe('none');
      expect(marker).toMatchObject({
        top: 8,
        bottom: 8,
        right: 0,
        width: 4,
        height: 16,
        pointerEvents: 'none',
        faceLeft: 4,
        faceRight: 0,
        faceTop: 0,
        faceBottom: 0,
        faceFill: colors.active,
      });
      expect(marker.fill).toBe(colors.edge);
      const fold = await lip(link);
      expect(fold).toMatchObject({ left: -4, top: 0, bottom: 0, width: 4, pointerEvents: 'none' });
      expect(fold.content).not.toBe('none');
      expect(Number.parseFloat(fold.origin.split(' ')[0]!)).toBe(4);
      expect(fold.angle).toBe(0);
      expect(fold.fill).toBe(colors.active);
    }
    const before = await geometry(nav);
    const markerBefore = await edge(current);
    const restLip = await lip(current);
    expect(restLip.faceContactOffsets).toEqual([0, 1, 0, 0]);
    expect(restLip.contactOffsets).toEqual([-1, 1, 0, 0]);
    expect(restLip.faceShadow).toContain(colors.contact);
    expect(restLip.shadow).toContain(colors.contact);
    await capture(page, 'rest');
    await capturePaper(page, current, 'paper-rest');
    await candidate.hover();
    await expect(candidate).toHaveCSS('background-color', colors.hover);
    await expect(candidate).toHaveCSS('color', colors.foreground);
    await expectEdge(candidate, false);
    await expectLip(candidate, 0);
    expect(await geometry(nav)).toEqual(before);
    await current.hover();
    await expect(current).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expectEdge(current, true);
    await expectLip(current, 30);
    await expectContact(current, 1, 2);
    expect(await edge(current)).toEqual(markerBefore);
    expect(await geometry(nav)).toEqual(before);
    const hoverLip = await lip(current);
    expect(hoverLip.faceContactOffsets).toEqual([0, 1, 0, 0]);
    expect(hoverLip.contactOffsets).toEqual([-2, 2, 0, 0]);
    expect(hoverLip.perspective).toBeCloseTo(-Math.cos(Math.PI / 6) / 48, 5);
    await capturePaper(page, current, 'paper-hover');
    await page.mouse.down();
    await expect(current).toHaveCSS('background-color', colors.active);
    await expectEdge(current, true);
    await expectLip(current, 0);
    await expectContact(current, 0, 0);
    expect(await lip(current)).toMatchObject({
      faceContactOffsets: [0, 0, 0, 0],
      contactOffsets: [0, 0, 0, 0],
      faceTransition: 'none',
      transition: 'none',
    });
    expect(await geometry(nav)).toEqual(before);
    await capturePaper(page, current, 'paper-pressed');
    await page.mouse.up();
    await expectLip(current, 30);
    await expectContact(current, 1, 2);
    expect(await geometry(nav)).toEqual(before);
    await capturePaper(page, current, 'paper-released-hover');

    await page.mouse.down();
    await page.mouse.move(0, 0);
    await page.mouse.up();
    expect(new URL(page.url()).pathname).toBe('/components/card');
    await expectLip(current, 0);
    await expectContact(current, 1, 1);
    await expect(current).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect((await lip(current)).contactOffsets).toEqual([-1, 1, 0, 0]);
    expect(await edge(current)).toEqual(markerBefore);
    await current.hover();
    await expectLip(current, 30);
    await expectContact(current, 1, 2);
    expect((await lip(current)).contactOffsets).toEqual([-2, 2, 0, 0]);
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await candidate.focus();
    expect(await candidate.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
    await expect(candidate).toHaveCSS('background-color', colors.hover);
    await expect(candidate).toHaveCSS('outline-style', 'solid');
    await expect(candidate).toHaveCSS('outline-width', '2px');
    await expect(candidate).toHaveCSS('outline-offset', '2px');
    await expectEdge(candidate, false);
    expect(await geometry(nav)).toEqual(before);
    await current.focus();
    await expect(current).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(current).toHaveCSS('outline-style', 'solid');
    await expectEdge(current, true);
    await expectLip(current, 30);
    await expectContact(current, 1, 2);
    expect((await lip(current)).contactOffsets).toEqual([-2, 2, 0, 0]);
    expect(await edge(current)).toEqual(markerBefore);
    expect(await geometry(nav)).toEqual(before);
    await capture(page, 'current-focus');

    await candidate.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/foundations/color');
    await expect(candidate).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expectEdge(candidate, true);

    if (finish.theme === 'su' && finish.mode === 'light') {
      const button = nav.getByRole('link', { name: 'Button', exact: true });
      const iconButton = nav.getByRole('link', { name: 'IconButton', exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-current', 'page');
      await page.keyboard.press('Tab');
      await expect(iconButton).toBeFocused();
      expect(await iconButton.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
      await expect(button.locator('.docs-nav-paper')).toHaveCSS('background-color', colors.active);
      await expect(iconButton).toHaveCSS('background-color', colors.hover);
      await settle(nav);
      const clip = await nav.locator('[data-nav-section="components"]').evaluate((section) => {
        const nodes = [
          section.querySelector('.docs-nav-section-heading')!,
          ...Array.from(section.querySelectorAll('a')).slice(0, 4),
        ];
        const bounds = nodes.map((node) => node.getBoundingClientRect());
        const x = Math.max(0, Math.min(...bounds.map((box) => box.x)) - 4);
        const y = Math.max(0, Math.min(...bounds.map((box) => box.y)) - 4);
        const right = Math.min(innerWidth, Math.max(...bounds.map((box) => box.right)) + 4);
        const bottom = Math.min(innerHeight, Math.max(...bounds.map((box) => box.bottom)) + 4);
        return { x, y, width: right - x, height: bottom - y };
      });
      const path = test.info().outputPath('components-current-and-keyboard-focus.png');
      await page.screenshot({ path, clip });
      await test.info().attach('components-current-and-keyboard-focus', {
        path,
        contentType: 'image/png',
      });
    }
  });

  test(`${finish.name}: native pointer cancellation restores paint and selection changes only after activation`, async ({
    page,
  }) => {
    const nav = await openDocs(page, finish);
    const current = nav.getByRole('link', { name: 'Card', exact: true });
    const candidate = nav.getByRole('link', { name: 'Color', exact: true });
    const colors = await semantic(candidate);
    const before = await geometry(nav);
    await armMarker(candidate);
    await candidate.hover();
    await page.mouse.down();
    expect(await candidate.evaluate((node) => node.matches(':active'))).toBe(true);
    await expect(candidate).toHaveCSS('background-color', colors.active);
    await expect(candidate).toHaveCSS('color', colors.foreground);
    await expect(candidate).toHaveCSS('transition-property', 'none');
    await expectEdge(candidate, false);
    await expect(current).toHaveAttribute('aria-current', 'page');
    expect(new URL(page.url()).pathname).toBe('/components/card');
    expect(await geometry(nav)).toEqual(before);
    await capture(page, 'pressed-before-navigation');
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await settle(nav);
    expect(new URL(page.url()).pathname).toBe('/components/card');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expectEdge(candidate, false);
    const focused = await candidate.evaluate((node) => node.matches(':focus-visible'));
    await expect(candidate).toHaveCSS(
      'background-color',
      focused ? colors.hover : 'rgba(0, 0, 0, 0)',
    );
    expect(await geometry(nav)).toEqual(before);
    await expect(candidate).toHaveAttribute('data-nav-marker-transitions', '[]');

    await candidate.hover();
    await page.mouse.down();
    await expect(candidate).toHaveCSS('background-color', colors.active);
    await expectEdge(candidate, false);
    await page.mouse.up();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/foundations/color');
    await expect(candidate).toHaveAttribute('aria-current', 'page');
    await expect(current).not.toHaveAttribute('aria-current');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expectEdge(candidate, true);
    await expectEdge(current, false);
    await expect
      .poll(() =>
        candidate.evaluate((node) => {
          const observed = JSON.parse(node.getAttribute('data-nav-marker-transitions')!) as {
            phase: string;
          }[];
          return observed.some((transition) => transition.phase === 'end');
        }),
      )
      .toBe(true);
    const transitions = JSON.parse(
      (await candidate.getAttribute('data-nav-marker-transitions'))!,
    ) as {
      phase: 'run' | 'end';
      property: string;
      duration: number;
      pathname: string;
    }[];
    expect(transitions.filter((transition) => transition.phase === 'run').length).toBeGreaterThan(
      0,
    );
    expect(transitions.filter((transition) => transition.phase === 'end').length).toBeGreaterThan(
      0,
    );
    const marker = await edge(candidate);
    expect(marker.transition).toContain('opacity');
    expect(marker.easing).toContain(marker.expectedEasing);
    for (const transition of transitions) {
      expect(transition.pathname).toBe('/foundations/color');
      if (transition.phase === 'run') {
        expect(transition.duration).toBe(milliseconds(marker.expectedDuration));
      } else {
        expect(transition.duration).toBeCloseTo(milliseconds(marker.expectedDuration), 3);
      }
    }
    const after = await geometry(nav);
    expect(after.map((row) => row.box)).toEqual(before.map((row) => row.box));
    await capture(page, 'committed-current');
  });

  test(`${finish.name}: reduced motion updates the edge immediately with full row feedback`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const nav = await openDocs(page, finish);
    const current = nav.getByRole('link', { name: 'Card', exact: true });
    const candidate = nav.getByRole('link', { name: 'Color', exact: true });
    const colors = await semantic(candidate);
    await expectEdge(current, true);
    await expectEdge(candidate, false);
    expect((await edge(candidate)).transition).toBe('none');
    const before = await geometry(nav);
    await current.hover();
    expect(await lip(current)).toMatchObject({
      transform: 'none',
      transition: 'none',
      faceTransition: 'none',
      contactOffsets: [-1, 1, 0, 0],
    });
    await page.mouse.down();
    await expect(current).toHaveCSS('background-color', colors.active);
    expect(await lip(current)).toMatchObject({
      transform: 'none',
      contactOffsets: [0, 0, 0, 0],
      faceContactOffsets: [0, 0, 0, 0],
    });
    expect(await geometry(nav)).toEqual(before);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await page.keyboard.press('Tab');
    await current.focus();
    await expect(current).toHaveCSS('outline-style', 'solid');
    expect(await lip(current)).toMatchObject({ transform: 'none', contactOffsets: [-1, 1, 0, 0] });
    expect(await geometry(nav)).toEqual(before);
    await armMarker(candidate);
    await candidate.hover();
    await expect(candidate).toHaveCSS('background-color', colors.hover);
    await page.mouse.down();
    await expect(candidate).toHaveCSS('background-color', colors.active);
    await page.mouse.up();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/foundations/color');
    await expectEdge(candidate, true);
    await expectEdge(current, false);
    await expect(candidate).toHaveAttribute('data-nav-marker-transitions', '[]');
    expect((await edge(candidate)).transition).toBe('none');
    expect((await lip(candidate)).transform).toBe('none');
  });
}

test.describe('mobile nav item states', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('native touch feedback keeps the old location until release and closes the disclosure', async ({
    page,
  }) => {
    await page.goto('/components/card?style=quiet-instrument');
    await page.evaluate(async () => document.fonts.ready);
    const summary = page.locator('.docs-nav-aside summary');
    await summary.tap();
    const nav = page.getByRole('navigation', { name: 'Docs', exact: true });
    const candidate = nav.getByRole('link', { name: 'Color', exact: true });
    const current = nav.getByRole('link', { name: 'Card', exact: true });
    const colors = await semantic(candidate);
    await expect(candidate).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expectEdge(candidate, false);
    const box = await candidate.boundingBox();
    if (!box) throw new Error('The native touch link must have visible bounds.');
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await expect(candidate).toHaveCSS('background-color', colors.active);
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(candidate).not.toHaveAttribute('data-pressed');
    await expect.poll(() => candidate.evaluate((node) => node.matches(':active'))).toBe(false);
    await expect(candidate).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(candidate).toHaveCSS('color', colors.muted);
    await expectEdge(candidate, false);
    expect(new URL(page.url()).pathname).toBe('/components/card');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav).toBeVisible();

    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await expect(candidate).toHaveCSS('background-color', colors.active);
    await expect(candidate).toHaveCSS('color', colors.foreground);
    await expectEdge(candidate, false);
    await expect(current).toHaveAttribute('aria-current', 'page');
    expect(new URL(page.url()).pathname).toBe('/components/card');
    await capture(page, 'mobile-held-touch');
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/foundations/color');
    await expect(summary).toHaveText('Browse docs · Foundations / Color');
    await expect(page.getByRole('navigation', { name: 'Docs', exact: true })).toHaveCount(0);
    await summary.tap();
    await expect(nav).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(candidate).toHaveAttribute('aria-current', 'page');
    await expectEdge(candidate, true);
    await expect(current).not.toHaveAttribute('aria-current');

    const currentBox = await candidate.boundingBox();
    if (!currentBox) throw new Error('The selected touch paper must have visible bounds.');
    const before = await geometry(nav);
    const selectedTouch = await page.context().newCDPSession(page);
    await selectedTouch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: currentBox.x + currentBox.width / 2, y: currentBox.y + currentBox.height / 2 },
      ],
    });
    await expect(candidate).toHaveCSS('background-color', colors.active);
    await expectEdge(candidate, true);
    await expectLip(candidate, 0);
    expect(await lip(candidate)).toMatchObject({
      faceContactOffsets: [0, 0, 0, 0],
      contactOffsets: [0, 0, 0, 0],
    });
    expect(await geometry(nav)).toEqual(before);
    await selectedTouch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await selectedTouch.detach();
    await expect(candidate).not.toHaveAttribute('data-pressed');
    await expect(candidate).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expectEdge(candidate, true);
    await expectLip(candidate, 0);
    await expectContact(candidate, 1, 1);
    expect((await lip(candidate)).contactOffsets).toEqual([-1, 1, 0, 0]);
    expect(await geometry(nav)).toEqual(before);
    expect(new URL(page.url()).pathname).toBe('/foundations/color');
    await expect(nav).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  });
});
