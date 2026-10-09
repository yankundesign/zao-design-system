import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const modes = ['light', 'dark'] as const;
const paints = ['published Su', 'real Quiet instrument'] as const;
const directions = ['ltr', 'rtl'] as const;
type Mode = (typeof modes)[number];
type Paint = (typeof paints)[number];
type Direction = (typeof directions)[number];

async function openTabs(page: Page, mode: Mode, paint: Paint, direction: Direction) {
  // Base UI measures its initial indicator at mount; start with the actual document direction.
  await page.addInitScript((value) => {
    const apply = () => {
      if (!document.documentElement) return false;
      document.documentElement.dir = value;
      return true;
    };
    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect();
      });
      observer.observe(document, { childList: true });
    }
  }, direction);
  const css =
    paint === 'real Quiet instrument'
      ? await readFile(
          new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
          'utf8',
        )
      : '';
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
  await page.goto('/components/tabs');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', {
      name: mode === 'light' ? 'Light' : 'Dark',
      exact: true,
    })
    .click();
  const study = page.locator('.study').first();
  await expect(study).toHaveAttribute('data-zao-theme', 'su');
  await expect(study).toHaveAttribute('data-zao-mode', mode);
  await expect(study).toHaveAttribute('data-study', 'quiet-instrument');
  const role = expect.poll(() =>
    study.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--zao-color-border-field').trim(),
    ),
  );
  if (paint === 'real Quiet instrument') await role.not.toBe('');
  else await role.toBe('');
  await page.evaluate(() => document.fonts.ready);
  await study.evaluate((node, value) => {
    (node as HTMLElement).dir = value;
  }, direction);
  await page.mouse.move(0, 0);
  return study;
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function box(element: Locator) {
  const bounds = await element.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
}

async function labels(list: Locator) {
  return list.getByRole('tab').evaluateAll((tabs) =>
    tabs.map((tab) => {
      const css = getComputedStyle(tab);
      const text = [...tab.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!text) throw new Error('The vertical tab must expose its visible text.');
      const range = document.createRange();
      range.selectNodeContents(text);
      const label = range.getBoundingClientRect();
      const target = tab.getBoundingClientRect();
      return {
        name: text.textContent!.trim(),
        label: { x: label.x, y: label.y, width: label.width, height: label.height },
        target: { x: target.x, y: target.y, width: target.width, height: target.height },
        paddingEnd: parseFloat(css.paddingInlineEnd),
        direction: css.direction,
      };
    }),
  );
}

async function expectAligned(list: Locator, direction: Direction, count = 3) {
  const readings = await labels(list);
  expect(readings).toHaveLength(count);
  // Unequal label lengths make centering fail this shared-edge assertion.
  expect(new Set(readings.map((reading) => reading.label.width)).size).toBeGreaterThan(1);
  const edges = readings.map(({ label }) =>
    direction === 'ltr' ? label.x + label.width : label.x,
  );
  for (const edge of edges) expect(edge).toBeCloseTo(edges[0]!, 2);
  const rail = await box(list.locator(':scope > [data-zao-slot="rail"]'));
  const railCenter = rail.x + rail.width / 2;
  for (const reading of readings) {
    expect(reading.direction).toBe(direction);
    const targetEdge =
      direction === 'ltr'
        ? reading.target.x + reading.target.width - reading.paddingEnd
        : reading.target.x + reading.paddingEnd;
    const labelEdge = direction === 'ltr' ? reading.label.x + reading.label.width : reading.label.x;
    expect(labelEdge).toBeCloseTo(targetEdge, 2);
    if (direction === 'ltr') expect(labelEdge).toBeLessThan(railCenter);
    else expect(labelEdge).toBeGreaterThan(railCenter);
    expect(reading.target.width).toBeGreaterThanOrEqual(24);
    expect(reading.target.height).toBeGreaterThanOrEqual(24);
  }
  return readings;
}

async function expectStationary(
  list: Locator,
  reference: Awaited<ReturnType<typeof labels>>,
  direction: Direction,
) {
  expect(await expectAligned(list, direction)).toEqual(reference);
}

async function expectSelectionCenter(list: Locator, selected: Locator, width?: number) {
  const line = await box(list.locator('[data-zao-slot="selection-line"]'));
  const rail = await box(list.locator(':scope > [data-zao-slot="rail"]'));
  const target = await box(selected);
  expect(line.x + line.width / 2).toBeCloseTo(rail.x + rail.width / 2, 2);
  expect(line.y + line.height / 2).toBeCloseTo(target.y + target.height / 2, 2);
  if (width !== undefined) expect(line.width).toBe(width);
  return line;
}

async function tokens(list: Locator) {
  return list.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      hairline: parseFloat(css.getPropertyValue('--zao-stroke-hairline')),
      tick: parseFloat(css.getPropertyValue('--zao-space-1')),
      extendedTick: parseFloat(css.getPropertyValue('--zao-space-2')),
      selection: parseFloat(css.getPropertyValue('--zao-space-0-5')),
      graduation: parseFloat(css.getPropertyValue('--zao-space-4')),
    };
  });
}

async function railReading(list: Locator) {
  return list.evaluate((node) => {
    const rail = node.querySelector(':scope > [data-zao-slot="rail"]')!;
    const css = getComputedStyle(node);
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const targets = [...node.querySelectorAll(':scope > [data-zao-slot="tab"]')]
      .filter(
        (tab) =>
          tab.getBoundingClientRect().height > 0 && getComputedStyle(tab).visibility !== 'hidden',
      )
      .map(bounds)
      .sort((a, b) => a.y - b.y);
    const probe = document.createElement('span');
    probe.style.color = css.getPropertyValue('--zao-color-border-subtle');
    document.body.append(probe);
    const subtle = getComputedStyle(probe).color;
    probe.remove();
    return {
      rail: bounds(rail),
      scale: rail.getBoundingClientRect().width / parseFloat(getComputedStyle(rail).width),
      railHidden: rail.getAttribute('aria-hidden'),
      repeatingPaint: getComputedStyle(rail, '::after').backgroundImage,
      hairline: parseFloat(css.getPropertyValue('--zao-stroke-hairline')),
      minorLength: parseFloat(css.getPropertyValue('--zao-space-0-5')),
      direction: css.direction,
      gap: parseFloat(css.rowGap),
      subtle,
      targets,
      marks: [...rail.querySelectorAll('[data-zao-slot="graduation"]')].map((mark) => {
        const paint = getComputedStyle(mark);
        return {
          ...bounds(mark),
          color: paint.backgroundColor,
          opacity: parseFloat(paint.opacity),
          pointerEvents: paint.pointerEvents,
          tabIndex: (mark as HTMLElement).tabIndex,
          animations: mark.getAnimations().length,
        };
      }),
    };
  });
}

async function expectGapMarks(list: Locator, forcedColors = false) {
  // Geometry updates after ResizeObserver/MutationObserver callbacks, not input gestures.
  await list.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(async () => {
    const reading = await railReading(list);
    expect(reading.railHidden).toBe('true');
    expect(reading.repeatingPaint).toBe('none');
    expect(reading.marks).toHaveLength(Math.max(0, reading.targets.length - 1));
    const railCenter = reading.rail.x + reading.rail.width / 2;
    for (let index = 0; index < reading.marks.length; index++) {
      const mark = reading.marks[index]!;
      const before = reading.targets[index]!;
      const after = reading.targets[index + 1]!;
      const midpoint = (before.y + before.height + after.y) / 2;
      expect(mark.y + mark.height / 2).toBeCloseTo(midpoint, 2);
      expect(mark.width).toBeCloseTo(reading.minorLength * reading.scale, 2);
      expect(mark.height).toBeCloseTo(reading.hairline * reading.scale, 2);
      expect(mark.x).toBeCloseTo(
        reading.direction === 'ltr'
          ? railCenter + reading.hairline * reading.scale
          : railCenter - (reading.hairline + reading.minorLength) * reading.scale,
        2,
      );
      expect(mark.pointerEvents).toBe('none');
      expect(mark.tabIndex).toBe(-1);
      expect(mark.animations).toBe(0);
      if (!forcedColors) {
        expect(mark.color).toBe(reading.subtle);
        expect(mark.opacity).toBe(0.5);
      }
    }
  }).toPass({ timeout: 5000 });
  return railReading(list);
}

function localMarks(reading: Awaited<ReturnType<typeof railReading>>) {
  return reading.marks.map(({ x, y, width, height }) => ({
    x: x - reading.rail.x,
    y: y - reading.rail.y,
    width,
    height,
  }));
}

async function expectHorizontalUnchanged(study: Locator) {
  const horizontal = study.getByRole('tablist', { name: 'Workspace views', exact: true });
  await expect(horizontal.locator('[data-zao-slot="graduation"]')).toHaveCount(0);
  const values = await tokens(horizontal);
  const paint = await horizontal
    .locator(':scope > [data-zao-slot="rail"]')
    .evaluate((node) => getComputedStyle(node, '::after').backgroundImage);
  expect(paint).toContain('repeating-linear-gradient');
  expect(paint).toContain(`${values.graduation}px`);
  await expect(
    study
      .getByRole('tablist', { name: 'Overview views', exact: true })
      .locator('[data-zao-slot="rail"], [data-zao-slot="graduation"]'),
  ).toHaveCount(0);
}

async function guardDisabled(page: Page, study: Locator) {
  const horizontal = study.getByRole('tablist', { name: 'Workspace views', exact: true });
  const overview = horizontal.getByRole('tab', { name: 'Overview', exact: true });
  const disabled = horizontal.getByRole('tab', { name: 'Archive', exact: true });
  await horizontal.scrollIntoViewIfNeeded();
  await settle(horizontal);
  const target = await box(disabled);
  const selection = await box(horizontal.locator('[data-zao-slot="selection-line"]'));
  await disabled.hover();
  await settle(horizontal);
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveAttribute('aria-selected', 'false');
  expect(await box(disabled)).toEqual(target);
  expect(await box(horizontal.locator('[data-zao-slot="selection-line"]'))).toEqual(selection);
  expect((await box(disabled.locator('[data-zao-slot="tick"]'))).height).toBe(
    (await tokens(horizontal)).tick,
  );
  await disabled.click({ force: true });
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(disabled).toHaveAttribute('aria-selected', 'false');
  expect(await box(disabled)).toEqual(target);
  await page.mouse.move(0, 0);
}

for (const paint of paints)
  for (const mode of modes)
    for (const direction of directions) {
      test(`${paint}, ${mode}, ${direction}: vertical primary labels face the rail through manual navigation and feedback`, async ({
        page,
      }) => {
        const study = await openTabs(page, mode, paint, direction);
        await guardDisabled(page, study);
        const list = study.getByRole('tablist', { name: 'Account sections', exact: true });
        await expect(list).toHaveAttribute('data-zao-variant', 'primary');
        await expect(list).toHaveAttribute('data-orientation', 'vertical');
        await list.scrollIntoViewIfNeeded();
        await settle(list);
        const profile = list.getByRole('tab', { name: 'Profile', exact: true });
        const security = list.getByRole('tab', { name: 'Security', exact: true });
        const billing = list.getByRole('tab', { name: 'Billing', exact: true });
        const reference = await expectAligned(list, direction);
        const values = await tokens(list);
        const marker = await expectSelectionCenter(list, profile, values.selection);
        const graduations = (await expectGapMarks(list)).marks;
        await expectHorizontalUnchanged(study);

        await security.hover();
        await settle(list);
        await expect(profile).toHaveAttribute('aria-selected', 'true');
        expect(await box(list.locator('[data-zao-slot="selection-line"]'))).toEqual(marker);
        expect((await box(security.locator('[data-zao-slot="tick"]'))).width).toBe(
          values.extendedTick,
        );
        await expectStationary(list, reference, direction);
        expect((await expectGapMarks(list)).marks).toEqual(graduations);

        await page.mouse.move(0, 0);
        await profile.focus();
        await page.keyboard.press('ArrowDown');
        await expect(security).toBeFocused();
        await expect(profile).toHaveAttribute('aria-selected', 'true');
        await expect(security).toHaveAttribute('aria-selected', 'false');
        await expect(security).toHaveCSS('outline-style', 'solid');
        await expect(security).toHaveCSS('outline-width', '2px');
        await expect(security).toHaveCSS('outline-offset', '2px');
        await settle(list);
        expect((await box(security.locator('[data-zao-slot="tick"]'))).width).toBe(
          values.extendedTick,
        );
        expect(await box(list.locator('[data-zao-slot="selection-line"]'))).toEqual(marker);
        await expectStationary(list, reference, direction);
        expect((await expectGapMarks(list)).marks).toEqual(graduations);

        await page.keyboard.press('Enter');
        await expect(security).toHaveAttribute('aria-selected', 'true');
        await expect(study.getByRole('tabpanel', { name: 'Security', exact: true })).toBeVisible();
        await settle(list);
        await expectSelectionCenter(list, security, values.selection);
        await expectStationary(list, reference, direction);
        await page.keyboard.down('Space');
        await expect(security).toHaveAttribute('data-zao-pressed', '');
        await settle(list);
        await expectSelectionCenter(list, security, values.hairline);
        await expectStationary(list, reference, direction);
        expect((await expectGapMarks(list)).marks).toEqual(graduations);
        await page.keyboard.up('Space');
        await expect(security).not.toHaveAttribute('data-zao-pressed');
        await settle(list);
        await expectSelectionCenter(list, security, values.selection);

        await page.keyboard.press('End');
        await expect(billing).toBeFocused();
        await expect(security).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('Home');
        await expect(profile).toBeFocused();
        await expect(security).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('Enter');
        await expect(profile).toHaveAttribute('aria-selected', 'true');
        await settle(list);
        await expectSelectionCenter(list, profile, values.selection);
        await expectStationary(list, reference, direction);

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.keyboard.press('End');
        await expect(billing).toBeFocused();
        await expect(profile).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('Enter');
        await expect(billing).toHaveAttribute('aria-selected', 'true');
        await expect(study.getByRole('tabpanel', { name: 'Billing', exact: true })).toBeVisible();
        await settle(list);
        for (const decoration of await list
          .locator(
            '[data-zao-slot="indicator"], [data-zao-slot="selection-line"], [data-zao-slot="tick"]',
          )
          .all()) {
          await expect(decoration).toHaveCSS('transition-property', 'none');
          expect(await decoration.evaluate((node) => node.getAnimations().length)).toBe(0);
        }
        await expectSelectionCenter(list, billing, values.selection);
        await expectStationary(list, reference, direction);
        await page.keyboard.down('Space');
        await expect(billing).toHaveAttribute('data-zao-pressed', '');
        await expectSelectionCenter(list, billing, values.hairline);
        await expectStationary(list, reference, direction);
        await page.keyboard.up('Space');
        await expect(billing).not.toHaveAttribute('data-zao-pressed');
        await expectSelectionCenter(list, billing, values.selection);
        expect((await expectGapMarks(list)).marks).toEqual(graduations);
      });

      test(`${paint}, ${mode}, ${direction}: gap marks follow consumer layout and visible DOM membership`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const study = await openTabs(page, mode, paint, direction);
        const list = study.getByRole('tablist', { name: 'Account sections', exact: true });
        await list.scrollIntoViewIfNeeded();
        await settle(list);
        const initial = await expectGapMarks(list);
        await expectHorizontalUnchanged(study);

        // Consumer CSS may change actual row heights and gaps without changing token sources.
        await list.evaluate((node) => {
          (node as HTMLElement).style.gap = 'var(--zao-space-3)';
          const heights = ['--zao-space-8', '--zao-space-10', '--zao-space-12'];
          for (const [index, target] of [
            ...node.querySelectorAll<HTMLElement>(':scope > [data-zao-slot="tab"]'),
          ].entries()) {
            target.style.height = `var(${heights[index]})`;
          }
        });
        const unequal = await expectGapMarks(list);
        expect(new Set(unequal.targets.map((target) => target.height)).size).toBe(3);
        expect(unequal.marks.map((mark) => mark.y)).not.toEqual(
          initial.marks.map((mark) => mark.y),
        );
        await expectAligned(list, direction);

        await list.getByRole('tab', { name: 'Security', exact: true }).evaluate((node) => {
          (node as HTMLElement).hidden = true;
          (node as HTMLElement).style.display = 'none';
        });
        expect((await expectGapMarks(list)).targets).toHaveLength(2);
        await expectAligned(list, direction, 2);
        await list.locator(':scope > [data-zao-slot="tab"][hidden]').evaluate((node) => {
          (node as HTMLElement).hidden = false;
          (node as HTMLElement).style.removeProperty('display');
        });
        expect((await expectGapMarks(list)).marks).toEqual(unequal.marks);

        await list.getByRole('tab', { name: 'Security', exact: true }).evaluate((node) => {
          (node as HTMLElement).style.visibility = 'hidden';
        });
        expect((await expectGapMarks(list)).targets).toHaveLength(2);
        await list.locator(':scope > [data-zao-slot="tab"]').evaluateAll((targets) => {
          for (const target of targets) (target as HTMLElement).style.removeProperty('visibility');
        });
        expect((await expectGapMarks(list)).marks).toEqual(unequal.marks);
        await list.getByRole('tab', { name: 'Billing', exact: true }).evaluate((node) => {
          (node as HTMLElement).style.order = '-1';
        });
        await expectGapMarks(list);
        await list.getByRole('tab', { name: 'Billing', exact: true }).evaluate((node) => {
          (node as HTMLElement).style.removeProperty('order');
        });
        expect((await expectGapMarks(list)).marks).toEqual(unequal.marks);

        // This is a membership geometry probe, not a claim that a cloned target registers with Base UI.
        await list.evaluate((node) => {
          const source = node.querySelector(':scope > [data-zao-slot="tab"]')!;
          const extra = source.cloneNode(true) as HTMLElement;
          extra.dataset.zaoGeometryProbe = '';
          extra.removeAttribute('id');
          extra.removeAttribute('aria-controls');
          extra.removeAttribute('aria-selected');
          extra.removeAttribute('data-active');
          extra.setAttribute('role', 'presentation');
          extra.setAttribute('aria-hidden', 'true');
          extra.tabIndex = -1;
          extra.inert = true;
          extra.style.height = 'var(--zao-space-6)';
          const label = [...extra.childNodes].find(
            (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim(),
          )!;
          label.textContent = 'Additional layout row';
          node.insertBefore(extra, node.querySelector(':scope > [data-zao-slot="indicator"]'));
        });
        const added = await expectGapMarks(list);
        expect(added.targets).toHaveLength(4);
        expect(added.marks).toHaveLength(3);
        await list.locator('[data-zao-geometry-probe]').evaluate((node) => node.remove());
        expect((await expectGapMarks(list)).marks).toEqual(unequal.marks);

        await list.evaluate((node) => {
          (node as HTMLElement).style.gap =
            'calc(var(--zao-space-2) + var(--zao-stroke-hairline) / 2)';
          const heights = ['--zao-space-8', '--zao-space-10', '--zao-space-12'];
          for (const [index, target] of [
            ...node.querySelectorAll<HTMLElement>(':scope > [data-zao-slot="tab"]'),
          ].entries()) {
            target.style.height = `calc(var(${heights[index]}) + var(--zao-stroke-hairline) / 2)`;
          }
        });
        const fractional = await expectGapMarks(list);
        expect(fractional.gap % 1).toBe(0.5);
        expect(fractional.targets.every((target) => target.height % 1 === 0.5)).toBe(true);
        expect(fractional.rail.height % 1).toBe(0.5);
        await study.evaluate((node) => {
          (node as HTMLElement).style.transform = 'scale(1.25)';
          (node as HTMLElement).style.transformOrigin = 'top left';
        });
        const scaled = await expectGapMarks(list);
        expect(scaled.scale).toBeCloseTo(1.25, 3);
        await study.evaluate((node) => {
          (node as HTMLElement).style.removeProperty('transform');
          (node as HTMLElement).style.removeProperty('transform-origin');
        });
        expect(localMarks(await expectGapMarks(list))).toEqual(localMarks(fractional));

        // Font metrics and ancestor/layout resizing must remeasure the same actual gaps.
        const beforeFont = await labels(list);
        await list.locator(':scope > [data-zao-slot="tab"]').evaluateAll((targets) => {
          for (const target of targets) {
            (target as HTMLElement).style.fontFamily = 'var(--zao-font-family-mono)';
          }
        });
        await page.evaluate(() => document.fonts.ready);
        await expectGapMarks(list);
        const afterFont = await expectAligned(list, direction);
        expect(afterFont.map((target) => target.label.width)).not.toEqual(
          beforeFont.map((target) => target.label.width),
        );
        await study.evaluate((node) => {
          (node as HTMLElement).style.paddingBlockStart = 'var(--zao-space-6)';
        });
        await expectGapMarks(list);
        await page.setViewportSize({ width: 320, height: 800 });
        await list.scrollIntoViewIfNeeded();
        const narrow = await expectGapMarks(list);
        expect(narrow.targets.map((target) => target.height)).toEqual(
          fractional.targets.map((target) => target.height),
        );
        await expectAligned(list, direction);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await list.evaluate((node) => {
          (node as HTMLElement).style.gap = 'var(--zao-space-4)';
        });
        const reduced = await expectGapMarks(list);
        expect(reduced.gap).toBeGreaterThan(narrow.gap);
        expect(localMarks(reduced)).not.toEqual(localMarks(narrow));
        const durations = await list
          .locator('[data-zao-slot="graduation"]')
          .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).transitionDuration));
        // The docs-wide reduced-motion safeguard uses 0.01ms; there must be no running animation.
        expect(
          durations.every((value) =>
            value.split(',').every((duration) => parseFloat(duration) <= 0.00001),
          ),
        ).toBe(true);
        expect(reduced.marks.every((mark) => mark.animations === 0)).toBe(true);
        expect(errors).toEqual([]);
      });

      test(`${paint}, ${mode}, ${direction}: forced colors preserve decorative geometry and outside focus`, async ({
        page,
      }) => {
        const study = await openTabs(page, mode, paint, direction);
        const list = study.getByRole('tablist', { name: 'Account sections', exact: true });
        await list.scrollIntoViewIfNeeded();
        await settle(list);
        const ordinary = await expectAligned(list, direction);
        const marks = localMarks(await expectGapMarks(list));
        await page.emulateMedia({ forcedColors: 'active' });
        const forced = await expectGapMarks(list, true);
        expect(localMarks(forced)).toEqual(marks);
        // OS forced colors can translate the entire preview; interaction must keep its new targets fixed.
        const reference = await expectAligned(list, direction);
        expect(
          reference.map(({ label, target }) => [
            label.width,
            label.height,
            target.width,
            target.height,
          ]),
        ).toEqual(
          ordinary.map(({ label, target }) => [
            label.width,
            label.height,
            target.width,
            target.height,
          ]),
        );
        const system = await list.evaluate(() => {
          const probe = document.createElement('span');
          probe.style.forcedColorAdjust = 'none';
          document.body.append(probe);
          probe.style.color = 'Canvas';
          const canvas = getComputedStyle(probe).color;
          probe.style.color = 'CanvasText';
          const ink = getComputedStyle(probe).color;
          probe.remove();
          return { canvas, ink };
        });
        expect(system.ink).not.toBe(system.canvas);
        for (const decoration of await list
          .locator(
            '[data-zao-slot="rail"], [data-zao-slot="graduation"], [data-zao-slot="tick"], [data-zao-slot="selection-line"]',
          )
          .all()) {
          await expect(decoration).toHaveCSS('forced-color-adjust', 'none');
          await expect(decoration).toBeVisible();
        }
        for (const ink of await list
          .locator(
            '[data-zao-slot="graduation"], [data-zao-slot="tick"], [data-zao-slot="selection-line"]',
          )
          .all()) {
          await expect(ink).toHaveCSS('background-color', system.ink);
        }
        expect(
          await list
            .locator(':scope > [data-zao-slot="rail"]')
            .evaluate((node) => getComputedStyle(node, '::before').backgroundColor),
        ).toBe(system.ink);
        const profile = list.getByRole('tab', { name: 'Profile', exact: true });
        const security = list.getByRole('tab', { name: 'Security', exact: true });
        await security.hover();
        await settle(list);
        await expect(security.locator('[data-zao-slot="tick"]')).toHaveCSS(
          'background-color',
          system.ink,
        );
        await expectStationary(list, reference, direction);
        await page.mouse.move(0, 0);
        await profile.focus();
        await page.keyboard.press('ArrowDown');
        await expect(security).toBeFocused();
        await expect(profile).toHaveAttribute('aria-selected', 'true');
        await expect(security).toHaveCSS('outline-style', 'solid');
        await expect(security).toHaveCSS('outline-width', '2px');
        await expect(security).toHaveCSS('outline-offset', '2px');
        expect(await security.evaluate((node) => getComputedStyle(node).outlineColor)).not.toBe(
          system.canvas,
        );
        await settle(list);
        await expect(security.locator('[data-zao-slot="tick"]')).toHaveCSS(
          'background-color',
          system.ink,
        );
        const horizontal = study.getByRole('tablist', { name: 'Workspace views', exact: true });
        await expect(horizontal.locator('[data-zao-slot="graduation"]')).toHaveCount(0);
        expect(
          await horizontal
            .locator(':scope > [data-zao-slot="rail"]')
            .evaluate((node) => getComputedStyle(node, '::before').backgroundColor),
        ).toBe(system.ink);
        await expect(horizontal.locator('[data-zao-slot="selection-line"]')).toHaveCSS(
          'background-color',
          system.ink,
        );
        await expectStationary(list, reference, direction);
        await page.keyboard.press('Enter');
        await expect(security).toHaveAttribute('aria-selected', 'true');
        await settle(list);
        await expectSelectionCenter(list, security, (await tokens(list)).selection);
        await expectStationary(list, reference, direction);
        await expectGapMarks(list, true);
        await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
        await page.keyboard.down('Space');
        await expect(security).toHaveAttribute('data-zao-pressed', '');
        await expectSelectionCenter(list, security, (await tokens(list)).hairline);
        await expectStationary(list, reference, direction);
        await page.keyboard.up('Space');
        await expect(security).not.toHaveAttribute('data-zao-pressed');
        await expectSelectionCenter(list, security, (await tokens(list)).selection);
        await expectGapMarks(list, true);
      });
    }
