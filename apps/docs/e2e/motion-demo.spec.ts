import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { expectFocusBrackets } from './focus-mark';
import { seat as seatDepth } from './construction-values';

const roles = ['lift', 'seat', 'slide', 'reveal', 'reveal-exit'] as const;
const labels = ['Lift', 'Seat', 'Slide', 'Reveal', 'Reveal exit'] as const;
/** Su's derived role values (finish plan V5 and V6, Oct 11): grade durations and 举折 curves. */
const baseline = [157.5, 80, 157.5, 198, 80];
const roleCurves = ['enter', 'standard', 'enter', 'enter', 'exit'] as const;
type Curves = Awaited<ReturnType<typeof curves>>;

/** The published curves, as token text and as the browser serializes a timing function. */
async function curves(page: Page) {
  return page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue('--zao-motion-easing-' + name).trim();
    const computed = (value: string) => {
      const probe = document.createElement('span');
      probe.style.transitionTimingFunction = value;
      document.body.append(probe);
      const result = getComputedStyle(probe).transitionTimingFunction;
      probe.remove();
      return result;
    };
    const values = {
      enter: token('fold-enter'),
      exit: token('fold-exit'),
      standard: token('standard'),
    };
    return {
      token: values,
      computed: {
        enter: computed(values.enter),
        exit: computed(values.exit),
        standard: computed(values.standard),
      },
    };
  });
}

/** One spelling for a timing function, whether minified CSS or token JSON wrote it. */
function canonical(value: string) {
  return value
    .trim()
    .replace(/\s*,\s*/g, ',')
    .replace(/(^|[(,\s])0\./g, '$1.')
    .replace(/\s+/g, ' ');
}

function publishedRoles(published: Curves) {
  return baseline.map((value, index) => ({
    duration: value,
    easing: canonical(published.token[roleCurves[index]!]),
  }));
}
type Mode = 'light' | 'dark';
type Direction = 'ltr' | 'rtl';

async function open(page: Page, mode: Mode, direction: Direction = 'ltr') {
  await page.addInitScript((dir) => {
    const apply = () => {
      if (!document.documentElement) return false;
      document.documentElement.dir = dir;
      return true;
    };
    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect();
      });
      observer.observe(document, { childList: true });
    }
  }, direction);
  const studyCss = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: studyCss }),
  );
  await page.goto('/foundations/motion');
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  const island = page.locator('[data-motion-island]');
  await expect(island).toHaveAttribute('data-zao-theme', 'su');
  await expect(island).toHaveAttribute('data-zao-mode', mode);
  await expect
    .poll(() =>
      island.evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--zao-color-border-field').trim(),
      ),
    )
    .not.toBe('');
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  return island;
}

async function settle(element: Locator) {
  await element.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function box(element: Locator) {
  return element.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
  });
}

async function translation(element: Locator) {
  return element.evaluate((node) => {
    const transform = getComputedStyle(node).transform;
    const matrix =
      transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(transform);
    return [matrix.m41, matrix.m42];
  });
}

async function transition(element: Locator, property: string, pseudo?: string) {
  return element.evaluate(
    (node, options) => {
      const css = getComputedStyle(node, options.pseudo);
      const properties = css.transitionProperty.split(',').map((part) => part.trim());
      const index = properties.indexOf(options.property);
      if (index < 0) return { property: css.transitionProperty, duration: null, easing: null };
      const durations = css.transitionDuration.split(',').map((part) => parseFloat(part));
      const curves = css.transitionTimingFunction.split(/,(?![^()]*\))/).map((part) => part.trim());
      return {
        property: properties[index],
        duration: Math.round(durations[index % durations.length]! * 100000) / 100,
        easing: curves[index % curves.length],
      };
    },
    { property, pseudo },
  );
}

async function roleValues(element: Locator) {
  return element
    .evaluate(
      (node, keys) => {
        const css = getComputedStyle(node);
        return keys.map((role) => ({
          duration: parseFloat(css.getPropertyValue('--zao-motion-duration-' + role)),
          easing: css
            .getPropertyValue('--zao-motion-easing-' + (role === 'reveal-exit' ? 'exit' : role))
            .trim(),
        }));
      },
      [...roles],
    )
    .then((values) => values.map((value) => ({ ...value, easing: canonical(value.easing) })));
}

async function outside(page: Page) {
  return {
    root: await roleValues(page.locator('html')),
    nav: await page
      .locator('.docs-nav-desktop a[aria-current="page"] .docs-nav-paper')
      .evaluate((node) => ({
        duration: getComputedStyle(node).transitionDuration,
        easing: getComputedStyle(node).transitionTimingFunction,
      })),
    button: await transition(
      page.getByRole('button', { name: 'Reset motion', exact: true }),
      '--zao-face-offset',
    ),
  };
}

async function endingTiming(popup: Locator, trigger: Locator, page: Page) {
  await popup.evaluate((node) => {
    const target = window as typeof window & {
      __motionEnding?: { duration: string; easing: string; property: string };
    };
    delete target.__motionEnding;
    const observer = new MutationObserver(() => {
      if (!node.hasAttribute('data-ending-style')) return;
      const css = getComputedStyle(node);
      target.__motionEnding = {
        duration: css.transitionDuration,
        easing: css.transitionTimingFunction,
        property: css.transitionProperty,
      };
      observer.disconnect();
    });
    observer.observe(node, { attributes: true, attributeFilter: ['data-ending-style'] });
  });
  await trigger.click();
  return expect.poll(() =>
    page.evaluate(() => (window as typeof window & { __motionEnding?: unknown }).__motionEnding),
  );
}

for (const mode of ['light', 'dark'] as const) {
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`${mode}, ${direction}: real lift, seat, slide and reveal retain published timing and fixed native targets`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const island = await open(page, mode, direction);
      const published = await curves(page);
      expect(await roleValues(island)).toEqual(publishedRoles(published));
      for (const [index, label] of labels.entries())
        await expect(
          page.getByRole('slider', { name: label + ' duration', exact: true }),
        ).toHaveValue(String(baseline[index]));
      const lift = island.getByRole('button', { name: 'Inspect lift', exact: true });
      const face = lift.locator('[data-zao-slot="face"]');
      await lift.scrollIntoViewIfNeeded();
      const initial = await box(lift);
      // The face rides the button's registered offset (finish plan V3).
      expect(await transition(lift, '--zao-face-offset')).toEqual({
        property: '--zao-face-offset',
        duration: 157.5,
        easing: published.computed.enter,
      });
      await lift.hover();
      await settle(lift);
      expect(await translation(face)).toEqual([2, -2]);
      expect(await box(lift)).toEqual(initial);
      const seat = island.getByRole('button', { name: 'Inspect seat', exact: true });
      await page.keyboard.press('Tab');
      await seat.focus();
      const beforeSeat = await box(seat);
      await expect(seat).toBeFocused();
      await expectFocusBrackets(seat);
      await page.keyboard.down('Space');
      await expect(seat).toHaveAttribute('data-zao-pressed', '');
      await settle(seat);
      expect(await translation(seat.locator('[data-zao-slot="face"]'))).toEqual([
        -seatDepth,
        seatDepth,
      ]);
      expect(await box(seat)).toEqual(beforeSeat);
      await page.keyboard.up('Space');
      await settle(seat);
      const setting = island.getByRole('switch', { name: 'Email updates', exact: true });
      const thumb = setting.locator('[data-zao-slot="thumb"]');
      const settingBox = await box(setting);
      expect(await transition(thumb, 'transform')).toEqual({
        property: 'transform',
        duration: 157.5,
        easing: published.computed.enter,
      });
      await expect(setting).not.toBeChecked();
      await setting.click();
      await settle(setting);
      await expect(setting).toBeChecked();
      expect(await translation(thumb)).toEqual([direction === 'rtl' ? -16 : 16, 0]);
      expect(await box(setting)).toEqual(settingBox);
      const trigger = island.getByRole('button', { name: 'Inspect reveal', exact: true });
      await trigger.click();
      const popup = island.getByRole('menu');
      await expect(popup).toBeVisible();
      await settle(popup);
      expect(await transition(popup, '--zao-menu-reveal-progress')).toEqual({
        property: '--zao-menu-reveal-progress',
        duration: 198,
        easing: published.computed.enter,
      });
      await expect(
        popup.getByRole('menuitem', { name: 'Archive workspace', exact: true }),
      ).toBeDisabled();
      const ending = await endingTiming(popup, trigger, page);
      await ending.toEqual({
        duration: '0.08s',
        easing: published.computed.exit,
        property: '--zao-menu-reveal-progress',
      });
      await expect(popup).not.toBeVisible();
      await expect(trigger).toBeFocused();
      // Base UI's existing keyboard path intentionally opens immediately.
      await page.mouse.move(0, 0);
      await trigger.press('Enter');
      await expect(popup).toBeVisible();
      await expect(popup).toHaveAttribute('data-instant');
      await expect(popup).toHaveCSS('transition-property', 'none');
      await expect(
        popup.getByRole('menuitem', { name: 'Review workspace', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });

    test(`${mode}, ${direction}: keyboard tuning and playback remain inside the specimen island and reset`, async ({
      page,
    }) => {
      const island = await open(page, mode, direction);
      const published = await curves(page);
      const before = await outside(page);
      const lift = island.getByRole('button', { name: 'Inspect lift', exact: true });
      const liftRange = page.getByRole('slider', { name: 'Lift duration', exact: true });
      await liftRange.focus();
      await liftRange.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(liftRange).toHaveValue('158');
      await expect(liftRange).toHaveAttribute('aria-valuetext', '158 milliseconds');
      await liftRange.press('End');
      await expect(liftRange).toHaveValue('2000');
      await liftRange.press('Home');
      await expect(liftRange).toHaveValue('0');
      await page.getByRole('button', { name: 'Reset motion', exact: true }).click();
      await expect(liftRange).toHaveValue('157.5');
      const speed = page.getByRole('combobox', { name: 'Playback speed', exact: true });
      await speed.focus();
      // Native typeahead works without opening the operating system's select popup.
      await speed.press('0');
      await expect(speed).toHaveValue('0.5');
      await speed.press('0');
      await expect(speed).toHaveValue('0.25');
      await expect(island).toHaveAttribute('data-motion-speed', '0.25');
      expect(await transition(lift, '--zao-face-offset')).toEqual({
        property: '--zao-face-offset',
        duration: 630,
        easing: published.computed.enter,
      });
      const seatRange = page.getByRole('slider', { name: 'Seat duration', exact: true });
      await seatRange.focus();
      await seatRange.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(seatRange).toHaveValue('80.5');
      await page.getByRole('textbox', { name: 'Lift easing', exact: true }).fill('linear');
      expect(await transition(lift, '--zao-face-offset')).toEqual({
        property: '--zao-face-offset',
        duration: 630,
        easing: 'linear',
      });
      await lift.focus();
      await page.keyboard.down('Space');
      await expect(lift).toHaveAttribute('data-zao-pressed', '');
      expect(await transition(lift, '--zao-face-offset')).toEqual({
        property: '--zao-face-offset',
        duration: 322,
        easing: published.computed.standard,
      });
      await page.keyboard.up('Space');
      expect(await transition(lift, '--zao-face-offset')).toEqual({
        property: '--zao-face-offset',
        duration: 630,
        easing: 'linear',
      });
      expect(await outside(page)).toEqual(before);
      const output = page.getByRole('textbox', { name: 'Role values', exact: true });
      await expect(output).toHaveAttribute('readonly', '');
      expect(await output.inputValue()).toContain('--zao-motion-duration-seat: 80.5ms;');
      expect(await output.inputValue()).not.toContain('322ms');
      await page.getByRole('button', { name: 'Reset motion', exact: true }).click();
      await expect(speed).toHaveValue('1');
      await expect(seatRange).toHaveValue('80');
      expect(await roleValues(island)).toEqual(publishedRoles(published));
      expect(await outside(page)).toEqual(before);
    });
  }

  test(`${mode}: invalid curves retain the last valid role and copy publishes unscaled values with accessible feedback`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const island = await open(page, mode, 'rtl');
    const published = await curves(page);
    const input = page.getByRole('textbox', { name: 'Slide easing', exact: true });
    const thumb = island
      .getByRole('switch', { name: 'Email updates', exact: true })
      .locator('[data-zao-slot="thumb"]');
    const outsideBefore = await outside(page);
    await input.fill('cubic-bezier(0.1, 0, 0.8, 1)');
    expect((await transition(thumb, 'transform')).easing).toBe('cubic-bezier(0.1, 0, 0.8, 1)');
    for (const invalid of [
      'cubic-bezier(0.1,,0.8,1)',
      'cubic-bezier(0.1,0,0.8,2)',
      'steps(2)',
      'cubic-bezier(NaN,0,0.8,1)',
      'cubic-bezier(0x1,0,0.8,1)',
    ]) {
      await input.fill(invalid);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      const error = input.locator('..').locator('[data-zao-slot="error"]');
      await expect(error).toBeVisible();
      const association = await input.getAttribute('aria-describedby');
      expect(association?.split(' ')).toContain(await error.getAttribute('id'));
      expect((await transition(thumb, 'transform')).easing).toBe('cubic-bezier(0.1, 0, 0.8, 1)');
    }
    await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption('0.1');
    expect((await transition(thumb, 'transform')).duration).toBe(1575);
    const output = page.getByRole('textbox', { name: 'Role values', exact: true });
    const text = await output.inputValue();
    expect(text).toContain('--zao-motion-duration-slide: 157.5ms;');
    expect(text).toContain('--zao-motion-easing-slide: cubic-bezier(0.1, 0, 0.8, 1);');
    expect(text).not.toContain('NaN');
    await expect(output).toHaveAttribute('readonly', '');
    await output.focus();
    await page.keyboard.press('End');
    await page.keyboard.type('unwanted edit');
    await expect(output).toHaveValue(text);
    await page.getByRole('button', { name: 'Copy role values', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Copied role values.' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
    expect(await outside(page)).toEqual(outsideBefore);
    await page.getByRole('button', { name: 'Reset motion', exact: true }).click();
    await expect
      .poll(async () => canonical(await input.inputValue()))
      .toBe(canonical(published.token.enter));
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  test(`${mode}: reduced motion shows real destinations at once while the tuner stays keyboard operable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const island = await open(page, mode, 'rtl');
    await expect(page.locator('[data-motion-preference]')).toHaveText(
      'Reduced motion is on. Specimens show the destination immediately; spatial playback is disabled.',
    );
    await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption('0.1');
    const lift = island.getByRole('button', { name: 'Inspect lift', exact: true });
    const face = lift.locator('[data-zao-slot="face"]');
    await lift.scrollIntoViewIfNeeded();
    const before = await box(lift);
    await lift.hover();
    await settle(lift);
    expect(await translation(face)).toEqual([0, 0]);
    await lift.focus();
    await page.keyboard.down('Space');
    await expect(lift).toHaveAttribute('data-zao-pressed', '');
    expect(await translation(face)).toEqual([0, 0]);
    expect(await box(lift)).toEqual(before);
    await expect(face).toHaveCSS('transition-property', 'none');
    await page.keyboard.up('Space');
    const setting = island.getByRole('switch', { name: 'Email updates', exact: true });
    const housing = await box(setting);
    await setting.focus();
    await setting.press('Space');
    await expect(setting).toBeChecked();
    expect(await translation(setting.locator('[data-zao-slot="thumb"]'))).toEqual([-16, 0]);
    expect(await box(setting)).toEqual(housing);
    await expect(setting.locator('[data-zao-slot="thumb"]')).toHaveCSS(
      'transition-property',
      'none',
    );
    const trigger = island.getByRole('button', { name: 'Inspect reveal', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const popup = island.getByRole('menu');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS('transition-property', 'none');
    expect(
      await popup.evaluate((node) =>
        parseFloat(getComputedStyle(node).getPropertyValue('--zao-menu-reveal-progress')),
      ),
    ).toBe(1);
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
    await expect(trigger).toBeFocused();
    const slider = page.getByRole('slider', { name: 'Reveal exit duration', exact: true });
    await slider.focus();
    await slider.press('ArrowLeft');
    await expect(slider).toHaveValue('80.5');
    expect(await page.locator('html').evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
  });

  for (const placement of ['top', 'bottom'] as const) {
    test(`${mode}, ${placement}: the real Reveal remains inside its narrow specimen frame and Escape returns focus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      const island = await open(page, mode);
      const part = island.locator('[data-motion-part="reveal"]');
      const trigger = part.getByRole('button', { name: 'Inspect reveal', exact: true });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.evaluate((node, side) => {
        const rect = node.getBoundingClientRect();
        const desired = side === 'top' ? innerHeight - rect.height - 8 : 150;
        scrollTo(0, scrollY + rect.y - desired);
      }, placement);
      await trigger.focus();
      const triggerBefore = await box(trigger);
      const partBefore = await box(part);
      const islandBefore = await box(island);
      await trigger.press('Enter');
      const popup = island.getByRole('menu');
      await expect(popup).toBeVisible();
      await settle(popup);
      await expect(popup).toHaveAttribute('data-side', placement);
      const frame = await box(popup);
      expect(frame.x - 4).toBeGreaterThanOrEqual(islandBefore.x);
      expect(frame.x + frame.width + 4).toBeLessThanOrEqual(islandBefore.x + islandBefore.width);
      expect(frame.y - 4).toBeGreaterThanOrEqual(partBefore.y);
      expect(frame.y + frame.height + 4).toBeLessThanOrEqual(partBefore.y + partBefore.height);
      expect(await box(trigger)).toEqual(triggerBefore);
      expect(await box(part)).toEqual(partBefore);
      expect(await page.locator('html').evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
        360,
      );
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });
  }

  test(`${mode}: the maintained inventory renders as accessible tables without heading, contrast or narrow overflow failures`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await open(page, mode, 'rtl');
    const markdown = await readFile(new URL('../../../docs/motion.md', import.meta.url), 'utf8');
    const sourceRows = [...markdown.matchAll(/^\|\s*([A-Z]\d{2})\s*·/gm)].map((match) => match[1]);
    const inventory = page.getByRole('region', { name: 'Motion inventory', exact: true });
    await expect(
      page.getByRole('heading', { name: 'Motion', level: 1, exact: true }),
    ).toBeVisible();
    const renderedRows = await inventory.locator('tbody tr').allTextContents();
    const ids = renderedRows.flatMap((row) => row.match(/^[A-Z]\d{2}/)?.[0] ?? []);
    expect(ids).toEqual(sourceRows);
    const tables = inventory.getByRole('table');
    expect(await tables.count()).toBeGreaterThanOrEqual(3);
    for (const table of await tables.all()) {
      for (const header of await table.getByRole('columnheader').all())
        await expect(header).toHaveAttribute('scope', 'col');
    }
    await page.keyboard.press('Tab');
    for (const region of await inventory.getByRole('region').all()) {
      await region.focus();
      await expect(region).toBeFocused();
      expect(await region.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
    }
    expect(await page.locator('html').evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    const results = await new AxeBuilder({ page }).include('main').analyze();
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
      })),
    ).toEqual([]);
  });
}
