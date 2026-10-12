import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Locator, Page, TestInfo } from '@playwright/test';

// These probes observe running CSS transitions. They never pause, finish, slow,
// or seek an animation: every reversal comes from native keyboard/pointer input.
// Progress has no interactive data editor, so its separate cases exercise the
// actual component's width paint path with successive incoming CSS readings.
const contexts = ['light', 'dark'].flatMap((mode) =>
  ['ltr', 'rtl'].map((direction) => ({ mode, direction })),
);
const tabKinds = ['primary', 'secondary', 'vertical'] as const;
type TabKind = (typeof tabKinds)[number];
type Rect = { x: number; y: number; width: number; height: number };
type AnimationSample = {
  property: string;
  currentTimeMs: number | null;
  durationMs: number;
  progress: number | null;
  easing: string;
  keyframes: Record<string, unknown>[];
};
type Sample = {
  timeMs: number;
  value: string;
  rect: Rect;
  fixed: Rect[];
  rows: Rect[];
  transform: string;
  opacity: string;
  durationRoleMs: number;
  easingRole: string;
  focusSlot: string | null;
  animations: AnimationSample[];
};
type InputSample = { type: string; key: string | null; before: Sample | null };
type MotionProbe = {
  sample: () => Sample | null;
  runs: Sample[];
  inputs: InputSample[];
  cancellations: { elapsedTimeMs: number; outgoing: AnimationSample }[];
  dispose: () => void;
};
declare global {
  interface Window {
    zaoInterruption?: MotionProbe;
  }
}

async function openPage(page: Page, component: string, context: (typeof contexts)[number]) {
  // Apply direction before hydration so Base UI measures the initial indicator
  // in the same layout that subsequent native selections use.
  await page.addInitScript((direction) => {
    const apply = () => {
      if (document.documentElement) document.documentElement.dir = direction;
    };
    new MutationObserver(apply).observe(document, { childList: true });
    apply();
  }, context.direction);
  await page.goto(`/components/${component}`);
  await page
    .getByRole('radio', { name: context.mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  await expect(page.locator('.study')).toHaveAttribute('data-zao-mode', context.mode);
  await page.addStyleTag({
    content: await readFile(
      new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
      'utf8',
    ),
  });
  await page.locator('.study').evaluate((node, direction) => {
    node.setAttribute('dir', direction);
  }, context.direction);
  await page.evaluate(() => document.fonts.ready);
  if (component === 'tabs' || component === 'progress') {
    await expect(page.locator(`[data-anatomy-kind="${component}"]`)).toHaveAttribute(
      'data-anatomy-ready',
      'true',
    );
  }
  await page.mouse.move(0, 0);
}

async function settle(root: Locator) {
  await root.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function arm(
  root: Locator,
  options: { paint: string; property: string; role: string; fixed: string; rows?: string },
) {
  await root.evaluate((node, options) => {
    window.zaoInterruption?.dispose();
    const toRect = (element: Element): Rect => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const sample = (): Sample | null => {
      const paint = node.querySelector<HTMLElement>(options.paint);
      if (!paint) return null;
      const css = getComputedStyle(paint);
      const duration = css.getPropertyValue(`--zao-motion-duration-${options.role}`).trim();
      const value = options.property.startsWith('--')
        ? css.getPropertyValue(options.property).trim()
        : css.getPropertyValue(options.property);
      return {
        timeMs: performance.now(),
        value,
        rect: toRect(paint),
        fixed: [toRect(node), ...Array.from(node.querySelectorAll(options.fixed), toRect)],
        rows: options.rows ? Array.from(node.querySelectorAll(options.rows), toRect) : [],
        transform: css.transform,
        opacity: css.opacity,
        durationRoleMs: parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000),
        easingRole: css
          .getPropertyValue(
            `--zao-motion-easing-${options.role === 'reveal-exit' ? 'exit' : options.role}`,
          )
          .trim(),
        focusSlot: document.activeElement?.getAttribute('data-zao-slot') ?? null,
        animations: paint
          .getAnimations()
          .filter(
            (animation) =>
              'transitionProperty' in animation &&
              animation.transitionProperty === options.property,
          )
          .map((animation) => {
            const timing = animation.effect!.getComputedTiming();
            return {
              property: (animation as CSSTransition).transitionProperty,
              currentTimeMs:
                typeof animation.currentTime === 'number' ? animation.currentTime : null,
              durationMs: Number(timing.duration),
              progress: timing.progress ?? null,
              easing: animation.effect!.getTiming().easing!,
              keyframes: (animation.effect as KeyframeEffect).getKeyframes() as Record<
                string,
                unknown
              >[],
            };
          }),
      };
    };
    const runs: Sample[] = [];
    const inputs: InputSample[] = [];
    const cancellations: { elapsedTimeMs: number; outgoing: AnimationSample }[] = [];
    const run = (event: Event) => {
      if ((event as TransitionEvent).propertyName !== options.property) return;
      if (event.target !== node.querySelector(options.paint)) return;
      const current = sample();
      if (current) runs.push(current);
    };
    // Window capture precedes Base UI's document dismissal handlers and React's
    // event handlers, including Select's Escape handler that stops propagation.
    const input = (event: Event) => {
      inputs.push({
        type: event.type,
        key: 'key' in event ? String(event.key) : null,
        before: sample(),
      });
    };
    const cancel = (event: Event) => {
      if ((event as TransitionEvent).propertyName !== options.property) return;
      const outgoing = runs.at(-1)?.animations[0];
      if (outgoing)
        cancellations.push({
          elapsedTimeMs: (event as TransitionEvent).elapsedTime * 1000,
          outgoing,
        });
    };
    node.addEventListener('transitionrun', run);
    node.addEventListener('transitioncancel', cancel);
    window.addEventListener('keydown', input, true);
    window.addEventListener('pointerdown', input, true);
    window.addEventListener('click', input, true);
    window.zaoInterruption = {
      sample,
      runs,
      inputs,
      cancellations,
      dispose: () => {
        node.removeEventListener('transitionrun', run);
        node.removeEventListener('transitioncancel', cancel);
        window.removeEventListener('keydown', input, true);
        window.removeEventListener('pointerdown', input, true);
        window.removeEventListener('click', input, true);
      },
    };
  }, options);
}

async function unfinished(page: Page, minimumProgress = 0.05) {
  return page.evaluate(async (minimumProgress) => {
    const deadline = performance.now() + 1_200;
    while (performance.now() < deadline) {
      const current = window.zaoInterruption!.sample();
      const animation = current?.animations[0];
      if (
        animation &&
        animation.progress !== null &&
        animation.progress > minimumProgress &&
        animation.progress < 0.98
      ) {
        return current!;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    throw new Error(
      `No unfinished natural transition: ${JSON.stringify(window.zaoInterruption!.sample())}`,
    );
  }, minimumProgress);
}

async function report(page: Page) {
  return page.evaluate(() => ({
    runs: window.zaoInterruption!.runs,
    inputs: window.zaoInterruption!.inputs,
    cancellations: window.zaoInterruption!.cancellations,
    current: window.zaoInterruption!.sample(),
  }));
}

function assertUnfinished(sample: Sample) {
  const animation = sample.animations[0]!;
  expect(animation.currentTimeMs, 'outgoing currentTime in ms').toBeGreaterThan(0);
  expect(animation.currentTimeMs!, 'outgoing currentTime in ms').toBeLessThan(animation.durationMs);
  expect(animation.progress, 'outgoing eased progress, unitless').toBeGreaterThan(0);
  expect(animation.progress, 'outgoing eased progress, unitless').toBeLessThan(1);
}

function sameRects(actual: Rect[], expected: Rect[]) {
  expect(actual).toHaveLength(expected.length);
  for (const [index, rect] of actual.entries()) {
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(rect[key], `fixed ${index} ${key} in CSS px`).toBeCloseTo(expected[index]![key], 2);
    }
  }
}

function cancelledProgress(cancelled: { elapsedTimeMs: number; outgoing: AnimationSample }) {
  const { elapsedTimeMs, outgoing } = cancelled;
  expect(elapsedTimeMs, 'natural cancellation elapsed time in ms').toBeGreaterThan(0);
  expect(elapsedTimeMs, 'natural cancellation elapsed time in ms').toBeLessThan(
    outgoing.durationMs,
  );
  const x = elapsedTimeMs / outgoing.durationMs;
  // Su's spatial roles use the faceted 举折 curves (finish plan V5): piecewise linear stops.
  const linear = outgoing.easing.match(/^linear\((.*)\)$/);
  if (linear) {
    const stops = linear[1]!.split(',').map((stop) => stop.trim().split(/\s+/));
    const points = stops.map(([output, position], index) => ({
      y: Number(output),
      x: position ? parseFloat(position) / 100 : index / (stops.length - 1),
    }));
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1]!;
      const end = points[index]!;
      if (x <= end.x) return start.y + ((end.y - start.y) * (x - start.x)) / (end.x - start.x);
    }
    return 1;
  }
  const values = outgoing.easing
    .match(/cubic-bezier\(([^)]+)\)/)![1]!
    .split(',')
    .map(Number);
  const [x1, y1, x2, y2] = values as [number, number, number, number];
  const curve = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 40; iteration++) {
    const middle = (low + high) / 2;
    if (curve(middle, x1, x2) < x) low = middle;
    else high = middle;
  }
  return curve((low + high) / 2, y1, y2);
}

function revealContinuity(
  cancelled: { elapsedTimeMs: number; outgoing: AnimationSample },
  reversal: Sample,
) {
  const progress = cancelledProgress(cancelled);
  const frames = cancelled.outgoing.keyframes;
  const from = Number(frames[0]!['--zao-menu-reveal-progress']);
  const to = Number(frames.at(-1)!['--zao-menu-reveal-progress']);
  const expected = from + (to - from) * progress;
  const actual = Number(reversal.animations[0]!.keyframes[0]!['--zao-menu-reveal-progress']);
  expect(actual, 'reversal starts at outgoing paint value at natural cancellation').toBeCloseTo(
    expected,
    4,
  );
  return {
    expectedProgress: expected,
    reversalStartProgress: actual,
    outgoingEasedProgress: progress,
  };
}

async function attach(info: TestInfo, evidence: unknown) {
  await info.attach('natural-interruption.json', {
    body: JSON.stringify(
      { units: { geometry: 'CSS px', time: 'ms', progress: 'unitless' }, evidence },
      null,
      2,
    ),
    contentType: 'application/json',
  });
}

function tabList(page: Page, kind: TabKind) {
  return page.getByRole('tablist', {
    name:
      kind === 'primary'
        ? 'Workspace views'
        : kind === 'secondary'
          ? 'Overview views'
          : 'Account sections',
    exact: true,
  });
}

for (const context of contexts) {
  for (const kind of tabKinds) {
    test(`Su ${context.mode} ${context.direction}: ${kind} Tabs reverse an unfinished native selection`, async ({
      page,
    }, info) => {
      await openPage(page, 'tabs', context);
      const list = tabList(page, kind);
      const tabs = list.getByRole('tab');
      const first = tabs.nth(0);
      const second = tabs.nth(1);
      await first.scrollIntoViewIfNeeded();
      await settle(list);
      await first.focus();
      const centers = await list.evaluate((node) =>
        Array.from(node.querySelectorAll('[data-zao-slot="tab"]'), (tab) => {
          const rect = tab.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }),
      );
      await arm(list, {
        paint: '[data-zao-slot="indicator"]',
        property: 'transform',
        role: 'slide',
        fixed: '[data-zao-slot="tab"]',
      });
      const resting = (await report(page)).current!;
      const forward =
        kind === 'vertical'
          ? 'ArrowDown'
          : context.direction === 'rtl'
            ? 'ArrowLeft'
            : 'ArrowRight';
      const backward =
        kind === 'vertical' ? 'ArrowUp' : context.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (context.direction === 'rtl' && kind !== 'vertical')
        await page.mouse.click(centers[1]!.x, centers[1]!.y);
      else await page.keyboard.press(forward);
      if (kind === 'vertical') await page.keyboard.press('Enter');
      const outgoing = await unfinished(page);
      assertUnfinished(outgoing);
      expect(outgoing.animations[0]!.durationMs).toBe(resting.durationRoleMs);
      if (context.direction === 'rtl' && kind !== 'vertical')
        await page.mouse.click(centers[0]!.x, centers[0]!.y);
      else await page.keyboard.press(backward);
      if (kind === 'vertical') await page.keyboard.press('Enter');
      await settle(list);
      await expect(first).toHaveAttribute('aria-selected', 'true');
      await expect(first).toBeFocused();
      await expect(second).toHaveAttribute('aria-selected', 'false');
      const evidence = await report(page);
      const key = kind === 'vertical' ? 'Enter' : backward;
      const reversalInput = evidence.inputs
        .filter((input) =>
          context.direction === 'rtl' && kind !== 'vertical'
            ? input.type === 'pointerdown'
            : input.key === key,
        )
        .at(-1)!;
      assertUnfinished(reversalInput.before!);
      const reversal = evidence.runs.at(-1)!;
      const start = String(reversal.animations[0]!.keyframes[0]!.transform);
      const cancelled = evidence.cancellations.at(-1)!;
      const progress = cancelledProgress(cancelled);
      const continuity = await page.evaluate(
        ({ frames, progress, start }) => {
          const from = new DOMMatrixReadOnly(String(frames[0]!.transform));
          const to = new DOMMatrixReadOnly(String(frames.at(-1)!.transform));
          const next = new DOMMatrixReadOnly(start);
          return {
            xPx: next.m41 - (from.m41 + (to.m41 - from.m41) * progress),
            yPx: next.m42 - (from.m42 + (to.m42 - from.m42) * progress),
          };
        },
        { frames: cancelled.outgoing.keyframes, progress, start },
      );
      expect(Math.abs(continuity.xPx)).toBeLessThan(0.05);
      expect(Math.abs(continuity.yPx)).toBeLessThan(0.05);
      expect(start).not.toBe(
        String(resting.animations[0]?.keyframes[0]?.transform ?? resting.value),
      );
      for (const sample of [outgoing, reversalInput.before!, reversal, evidence.current!])
        sameRects(sample.fixed, resting.fixed);
      sameRects([evidence.current!.rect], [resting.rect]);
      // Pointer activation may suppress :focus-visible. Re-enter the selected
      // native tab through Tab/Shift+Tab before checking its outside outline.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(first).toBeFocused();
      await expect(first).toHaveCSS('outline-width', '2px');
      sameRects((await report(page)).current!.fixed, resting.fixed);
      await attach(info, { context, kind, resting, outgoing, continuity, ...evidence });
    });
  }

  for (const field of ['select', 'combobox'] as const) {
    test(`Su ${context.mode} ${context.direction}: ${field} reverses native opening and closing without resetting its reveal`, async ({
      page,
    }, info) => {
      await openPage(page, field, context);
      const root = page
        .locator(`[data-zao-specimen="${field}"] [data-zao-component="${field}"]`)
        .first();
      const trigger = root.locator('[data-zao-slot="trigger"]');
      const frame = root.locator('[data-zao-field-frame]');
      const popup = root.locator('[data-zao-slot="popup"]');
      await trigger.scrollIntoViewIfNeeded();
      const center = await trigger.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      });
      const frameRect = await frame.boundingBox();
      await trigger.focus();
      const probeOptions = {
        paint: '[data-zao-slot="popup"]',
        property: '--zao-menu-reveal-progress',
        role: 'reveal',
        fixed: '[data-zao-field-frame], [data-zao-slot="label"]',
        rows: '[data-zao-slot="item"]',
      };
      await arm(root, probeOptions);
      await page.keyboard.press('Space');
      const opening = await unfinished(page, 0.55);
      assertUnfinished(opening);
      expect(opening.animations[0]!.durationMs).toBe(opening.durationRoleMs);
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
      const openingEvidence = await report(page);
      const closingInput = openingEvidence.inputs.find((input) => input.key === 'Escape')!;
      assertUnfinished(closingInput.before!);
      const closingRun = openingEvidence.runs.at(-1)!;
      const closingStart = Number(
        closingRun.animations[0]!.keyframes[0]!['--zao-menu-reveal-progress'],
      );
      const openingContinuity = revealContinuity(openingEvidence.cancellations.at(-1)!, closingRun);
      expect(closingStart).toBeGreaterThan(0);
      expect(closingStart).toBeLessThan(1);
      expect(
        Number(closingRun.animations[0]!.keyframes.at(-1)!['--zao-menu-reveal-progress']),
      ).toBe(0);
      sameRects(closingRun.fixed, opening.fixed);
      sameRects(closingRun.rows, opening.rows);
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Space');
      await expect(popup).toHaveAttribute('data-open', '');
      await settle(popup);
      await arm(root, { ...probeOptions, role: 'reveal-exit' });
      const open = (await report(page)).current!;
      expect(Number(open.value)).toBe(1);
      await page.keyboard.press('Escape');
      const closing = await unfinished(page);
      assertUnfinished(closing);
      expect(closing.animations[0]!.durationMs).toBe(closing.durationRoleMs);
      // Coordinates were measured before opening. Locator click's stability wait
      // would consume this short natural close, so use the fixed native target.
      await page.mouse.click(center.x, center.y);
      await expect(popup).toHaveAttribute('data-open', '');
      await settle(popup);
      const closingEvidence = await report(page);
      const reopeningInput = closingEvidence.inputs.find((input) => input.type === 'pointerdown')!;
      assertUnfinished(reopeningInput.before!);
      const reopeningRun = closingEvidence.runs.at(-1)!;
      const reopeningStart = Number(
        reopeningRun.animations[0]!.keyframes[0]!['--zao-menu-reveal-progress'],
      );
      const closingContinuity = revealContinuity(
        closingEvidence.cancellations.at(-1)!,
        reopeningRun,
      );
      expect(reopeningStart).toBeGreaterThan(0);
      expect(reopeningStart).toBeLessThan(1);
      expect(
        Number(reopeningRun.animations[0]!.keyframes.at(-1)!['--zao-menu-reveal-progress']),
      ).toBe(1);
      expect(Number(closingEvidence.current!.value)).toBe(1);
      for (const sample of [
        closing,
        reopeningInput.before!,
        reopeningRun,
        closingEvidence.current!,
      ]) {
        sameRects(sample.fixed, open.fixed);
        sameRects(sample.rows, open.rows);
        sameRects([sample.rect], [open.rect]);
        expect(sample.transform).toBe('none');
        expect(sample.opacity).toBe('1');
      }
      expect(await frame.boundingBox()).toEqual(frameRect);
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
      await expect(
        field === 'combobox' ? root.locator('[data-zao-slot="input"]') : trigger,
      ).toBeFocused();
      await attach(info, {
        context,
        field,
        opening,
        openingEvidence,
        openingContinuity,
        closing,
        closingEvidence,
        closingContinuity,
      });
    });
  }

  test(`Su ${context.mode} ${context.direction}: Progress width reverses an unfinished incoming reading`, async ({
    page,
  }, info) => {
    await openPage(page, 'progress', context);
    const root = page.getByRole('progressbar', { name: 'Upload files' });
    await root.scrollIntoViewIfNeeded();
    await settle(root);
    const evidence = await root.evaluate(async (node) => {
      const face = node.querySelector<HTMLElement>('[data-zao-slot="indicator"]')!;
      const track = node.querySelector<HTMLElement>('[data-zao-slot="track"]')!;
      const rect = (element: Element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const fixed = [rect(node), rect(track)];
      const css = getComputedStyle(face);
      const role = css.getPropertyValue('--zao-motion-duration-slide').trim();
      const durationRoleMs = parseFloat(role) * (role.endsWith('ms') ? 1 : 1000);
      const resting = rect(face);
      face.style.width = '100%';
      getComputedStyle(face).width;
      const outgoing = face
        .getAnimations()
        .find(
          (animation) =>
            'transitionProperty' in animation && animation.transitionProperty === 'width',
        )!;
      await outgoing.ready;
      let timing = outgoing.effect!.getComputedTiming();
      while (!(
        typeof timing.progress === 'number' &&
        timing.progress > 0.05 &&
        timing.progress < 1
      )) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        timing = outgoing.effect!.getComputedTiming();
        if (outgoing.playState === 'finished')
          throw new Error('Progress outgoing width completed before reversal');
      }
      const before = rect(face);
      const outgoingCurrentTimeMs = Number(outgoing.currentTime);
      const outgoingDurationMs = Number(timing.duration);
      const outgoingProgress = timing.progress;
      face.style.width = '20%';
      const immediate = rect(face);
      const reverse = face
        .getAnimations()
        .find(
          (animation) =>
            'transitionProperty' in animation && animation.transitionProperty === 'width',
        )!;
      const reverseStart = String((reverse.effect as KeyframeEffect).getKeyframes()[0]!.width);
      const reverseStartPx =
        parseFloat(reverseStart) * (reverseStart.endsWith('%') ? rect(track).width / 100 : 1);
      await reverse.finished;
      return {
        durationRoleMs,
        outgoingCurrentTimeMs,
        outgoingDurationMs,
        outgoingProgress,
        resting,
        before,
        immediate,
        reverseStartPx,
        final: rect(face),
        trackWidthPx: rect(track).width,
        fixedBefore: fixed,
        fixedAfter: [rect(node), rect(track)],
        rootValue: node.getAttribute('aria-valuenow'),
      };
    });
    expect(evidence.outgoingDurationMs).toBe(evidence.durationRoleMs);
    expect(evidence.outgoingCurrentTimeMs).toBeGreaterThan(0);
    expect(evidence.outgoingCurrentTimeMs).toBeLessThan(evidence.outgoingDurationMs);
    expect(evidence.outgoingProgress).toBeGreaterThan(0);
    expect(evidence.outgoingProgress).toBeLessThan(1);
    expect(evidence.before.width).toBeGreaterThan(evidence.resting.width);
    expect(evidence.before.width).toBeLessThan(evidence.trackWidthPx);
    expect(evidence.immediate.width).toBeCloseTo(evidence.before.width, 2);
    expect(Math.abs(evidence.reverseStartPx - evidence.before.width)).toBeLessThan(0.02);
    expect(evidence.final.width / evidence.trackWidthPx).toBeCloseTo(0.2, 3);
    sameRects(evidence.fixedAfter, evidence.fixedBefore);
    // This tests painting, not React data/formatting: semantics intentionally
    // retain the specimen's 68% reading while the probe supplies CSS widths.
    expect(evidence.rootValue).toBe('68');
    await attach(info, {
      context,
      scope: 'actual Progress CSS width paint path; no controlled React data update',
      ...evidence,
    });
  });
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const context of contexts) {
    test(`Su ${context.mode} ${context.direction}: interruptions use immediate reduced-motion endpoints`, async ({
      page,
    }, info) => {
      const evidence: unknown[] = [];
      await openPage(page, 'tabs', context);
      for (const kind of tabKinds) {
        const list = tabList(page, kind);
        const first = list.getByRole('tab').nth(0);
        const second = list.getByRole('tab').nth(1);
        await first.scrollIntoViewIfNeeded();
        await first.focus();
        await arm(list, {
          paint: '[data-zao-slot="indicator"]',
          property: 'transform',
          role: 'slide',
          fixed: '[data-zao-slot="tab"]',
        });
        const resting = (await report(page)).current!;
        if (context.direction === 'rtl' && kind !== 'vertical') await second.click();
        else
          await page.keyboard.press(
            kind === 'vertical'
              ? 'ArrowDown'
              : context.direction === 'rtl'
                ? 'ArrowLeft'
                : 'ArrowRight',
          );
        if (kind === 'vertical') await page.keyboard.press('Enter');
        await expect(second).toHaveAttribute('aria-selected', 'true');
        const destination = (await report(page)).current!;
        expect(destination.animations).toEqual([]);
        expect(destination.value).not.toBe(resting.value);
        if (context.direction === 'rtl' && kind !== 'vertical') await first.click();
        else
          await page.keyboard.press(
            kind === 'vertical'
              ? 'ArrowUp'
              : context.direction === 'rtl'
                ? 'ArrowRight'
                : 'ArrowLeft',
          );
        if (kind === 'vertical') await page.keyboard.press('Enter');
        await expect(first).toHaveAttribute('aria-selected', 'true');
        await expect(first).toBeFocused();
        const final = await report(page);
        expect(final.runs).toEqual([]);
        expect(final.current!.animations).toEqual([]);
        sameRects(final.current!.fixed, resting.fixed);
        sameRects([final.current!.rect], [resting.rect]);
        evidence.push({ kind, resting, destination, ...final });
      }
      for (const field of ['select', 'combobox'] as const) {
        await openPage(page, field, context);
        const root = page
          .locator(`[data-zao-specimen="${field}"] [data-zao-component="${field}"]`)
          .first();
        const trigger = root.locator('[data-zao-slot="trigger"]');
        const popup = root.locator('[data-zao-slot="popup"]');
        await trigger.scrollIntoViewIfNeeded();
        await trigger.focus();
        await arm(root, {
          paint: '[data-zao-slot="popup"]',
          property: '--zao-menu-reveal-progress',
          role: 'reveal',
          fixed: '[data-zao-field-frame]',
        });
        for (let cycle = 0; cycle < 2; cycle++) {
          await page.keyboard.press('Space');
          await expect(popup).toHaveAttribute('data-open', '');
          await expect(popup).toHaveCSS('transition-property', 'none');
          const open = await report(page);
          expect(Number(open.current!.value)).toBe(1);
          expect(open.current!.animations).toEqual([]);
          await page.keyboard.press('Escape');
          await expect(popup).not.toBeVisible();
          await expect(trigger).toBeFocused();
          expect((await report(page)).runs).toEqual([]);
          evidence.push({ field, cycle, open });
        }
      }
      await openPage(page, 'progress', context);
      const progress = page.getByRole('progressbar', { name: 'Upload files' });
      const result = await progress.evaluate((node) => {
        const face = node.querySelector<HTMLElement>('[data-zao-slot="indicator"]')!;
        const track = node.querySelector<HTMLElement>('[data-zao-slot="track"]')!;
        const ratios = [1, 0.2].map((value) => {
          face.style.width = `${value * 100}%`;
          return face.getBoundingClientRect().width / track.getBoundingClientRect().width;
        });
        return {
          ratios,
          animations: face.getAnimations().length,
          transition: getComputedStyle(face).transitionProperty,
        };
      });
      expect(result.ratios[0]).toBe(1);
      expect(result.ratios[1]).toBeCloseTo(0.2, 3);
      expect(result.animations).toBe(0);
      expect(result.transition).toBe('none');
      await attach(info, { context, reducedMotion: true, evidence, progressPaintOnly: result });
    });
  }
});
