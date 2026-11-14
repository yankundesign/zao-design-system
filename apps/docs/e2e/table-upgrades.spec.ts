import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Table upgrades (docs/plans/2026-10-table-upgrades). Each upgrade is opt-in: the basic Table
 * keeps its DOM and paint. WP 1.1 covers `stickyHeader` (U1).
 */
const modes = ['light', 'dark'] as const;
const directions = ['ltr', 'rtl'] as const;
type Mode = (typeof modes)[number];
type Direction = (typeof directions)[number];

interface Options {
  mode?: Mode;
  direction?: Direction;
  /** Serve the stylesheets as a browser without scroll timelines or scroll-state queries reads them. */
  withoutSupport?: boolean;
}

async function openStickyHeader(
  page: Page,
  { mode = 'light', direction = 'ltr', withoutSupport = false }: Options = {},
) {
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
  let rewritten = 0;
  if (withoutSupport) {
    await page.route('**/*.css', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        /@supports \((animation-timeline:\s*scroll\(\)|container-type:\s*scroll-state)\)/g,
        () => {
          rewritten += 1;
          return '@supports (zao-unsupported:none)';
        },
      );
      await route.fulfill({ response, body });
    });
  }
  await page.goto('/components/table');
  await expect(page.getByRole('heading', { level: 1, name: 'Table', exact: true })).toBeVisible();
  if (withoutSupport) expect(rewritten).toBeGreaterThan(0);
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-zao-mode', mode);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  const specimen = page.locator('[data-zao-specimen="table-sticky-header"]');
  await specimen.scrollIntoViewIfNeeded();
  return { specimen, ...parts(specimen) };
}

function parts(specimen: Locator) {
  return {
    frame: specimen.locator('[data-zao-component="table"]'),
    scroll: specimen.getByRole('region', { name: 'Requests by day scroll area', exact: true }),
    table: specimen.getByRole('table', { name: 'Requests by day', exact: true }),
  };
}

/** Wait for the scroll-driven paint to follow the latest scroll position. */
async function frames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function scrollTo(page: Page, scroll: Locator, top: number) {
  await scroll.evaluate((node, value) => {
    node.scrollTop = value;
  }, top);
  await frames(page);
}

/** The header's and group heads' geometry and paint, with every color resolved to sRGB bytes. */
async function reading(frame: Locator) {
  return frame.evaluate((node) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const probe = document.createElement('span');
    // Read each role at once: a focused docs scroll region transitions inherited colors.
    probe.style.transition = 'none';
    node.append(probe);
    const role = (value: string) => {
      probe.style.color = value;
      return rgba(getComputedStyle(probe).color);
    };
    const area = node.querySelector<HTMLElement>(':scope > [data-zao-slot="scroll-area"]')!;
    const table = area.querySelector('table')!;
    const top = area.getBoundingClientRect().top;
    const head = table.tHead!.rows[0]!.cells[0]!;
    const headCss = getComputedStyle(head);
    const shadows =
      headCss.boxShadow === 'none'
        ? []
        : headCss.boxShadow.split(/,(?![^(]*\))/).map((shadow) => {
            const color = shadow.match(/^\s*([a-z]+\([^)]*\)|[a-z]+)/i)![1]!;
            const lengths = shadow
              .slice(shadow.indexOf(color) + color.length)
              .trim()
              .split(/\s+/)
              .map((length) => Number.parseFloat(length));
            return {
              color: rgba(color),
              x: lengths[0],
              y: lengths[1],
              blur: lengths[2],
              spread: lengths[3],
            };
          });
    const groups = [...table.querySelectorAll<HTMLElement>('[data-zao-group-head]')].map(
      (group) => {
        const bounds = group.getBoundingClientRect();
        const css = getComputedStyle(group);
        const mark = getComputedStyle(group, '::before');
        const rule = getComputedStyle(group, '::after');
        return {
          top: bounds.top - top,
          height: bounds.height,
          position: css.position,
          fill: rgba(css.backgroundColor),
          ink: rgba(css.color),
          fontSize: css.fontSize,
          fontWeight: css.fontWeight,
          topRule: Number.parseFloat(css.borderBlockStartWidth),
          marked: mark.content !== 'none',
          markStart: Number.parseFloat(mark.borderInlineStartWidth),
          markInk: rgba(mark.borderInlineStartColor),
          markOffset: Number.parseFloat(mark.insetInlineStart),
          underRule: Number.parseFloat(rule.borderBlockEndWidth),
          underRuleInk: rgba(rule.borderBlockEndColor),
        };
      },
    );
    const result = {
      scrollTop: area.scrollTop,
      clientHeight: area.clientHeight,
      scrollHeight: area.scrollHeight,
      clientWidth: area.clientWidth,
      scrollWidth: area.scrollWidth,
      scrollPadding: Number.parseFloat(getComputedStyle(area).scrollPaddingBlockStart),
      headerSize: Number.parseFloat(area.style.getPropertyValue('--zao-table-header-size')),
      groupSize: Number.parseFloat(area.style.getPropertyValue('--zao-table-group-size')),
      borderCollapse: getComputedStyle(table).borderCollapse,
      header: {
        top: head.getBoundingClientRect().top - top,
        bottom: head.getBoundingClientRect().bottom - top,
        position: headCss.position,
        fill: rgba(headCss.backgroundColor),
        rule: rgba(headCss.borderBlockEndColor),
        ruleWidth: Number.parseFloat(headCss.borderBlockEndWidth),
        shadows,
        animation: headCss.animationName,
        timelines: head.getAnimations().map((animation) => animation.timeline?.constructor.name),
        timed: table
          .getAnimations({ subtree: true })
          .filter((animation) => animation.timeline instanceof DocumentTimeline)
          // The docs' own scroll thumbs fade on an inherited property; that is page chrome.
          .filter(
            (animation) => (animation as CSSTransition).transitionProperty !== 'scrollbar-color',
          )
          .map((animation) =>
            [
              (animation.effect as KeyframeEffect).target?.tagName,
              (animation as CSSAnimation).animationName ??
                (animation as CSSTransition).transitionProperty,
            ].join(' '),
          ),
      },
      groups,
      firstRowTop: table.tBodies[0]!.rows[1]!.getBoundingClientRect().top - top,
      roles: {
        canvas: role('var(--zao-color-bg-canvas)'),
        sunken: role('var(--zao-color-bg-sunken)'),
        ink: role('var(--zao-color-fg-default)'),
        subtle: role('var(--zao-color-border-subtle)'),
        planeNear: role('var(--zao-plane-y-near)'),
        planeFar: role('var(--zao-plane-y-far)'),
        canvasText: role('CanvasText'),
        systemCanvas: role('Canvas'),
      },
      support: {
        timeline: CSS.supports('animation-timeline', 'scroll()'),
        scrollState: CSS.supports('container-type', 'scroll-state'),
      },
    };
    probe.remove();
    return result;
  });
}

function expectColor(actual: number[], expected: number[]) {
  for (const channel of [0, 1, 2, 3]) {
    expect(Math.abs(actual[channel]! - expected[channel]!)).toBeLessThanOrEqual(1);
  }
}

/** The largest per-channel difference between two screenshots of one size. */
async function largestDifference(page: Page, first: Buffer, second: Buffer) {
  return page.evaluate(
    async (images) => {
      const pixels = await Promise.all(
        images.map(async (png) => {
          const image = new Image();
          image.src = `data:image/png;base64,${png}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, canvas.width, canvas.height).data;
        }),
      );
      const [a, b] = pixels as [Uint8ClampedArray, Uint8ClampedArray];
      if (a.length !== b.length || a.length === 0) return 255;
      let largest = 0;
      for (let index = 0; index < a.length; index += 1)
        largest = Math.max(largest, Math.abs(a[index]! - b[index]!));
      return largest;
    },
    [first.toString('base64'), second.toString('base64')],
  );
}

test('the basic Table keeps its DOM, slots and collapsed rules', async ({ page }) => {
  const { specimen } = await openStickyHeader(page);
  await specimen.getByRole('tab', { name: 'Basic', exact: true }).click();
  const basics = [
    page.locator('[data-zao-specimen="table"] [data-zao-component="table"]'),
    specimen.locator('[data-zao-component="table"]'),
  ];
  for (const frame of basics) {
    await expect(frame).toHaveCount(1);
    await expect(frame).not.toHaveAttribute('data-zao-sticky-header');
    await expect(frame).toHaveClass(
      'card-construction construction-shading construction-planes min-w-0 rounded-none border border-subtle bg-canvas text-default',
    );
    const area = frame.locator(':scope > [data-zao-slot="scroll-area"]');
    await expect(area).toHaveClass('overflow-x-auto outline-focus');
    await expect(area).not.toHaveAttribute('style');
    const table = area.locator(':scope > table');
    await expect(table).toHaveClass('table-plane w-full border-collapse text-left');
    await expect(table).toHaveCSS('border-collapse', 'collapse');
    await expect(frame.locator('[data-zao-group-head]')).toHaveCount(0);
    await expect(table.locator('thead th').first()).toHaveCSS('position', 'static');
    await expect(table.locator('thead th').first()).toHaveCSS('border-bottom-width', '0px');
    await expect(table.locator('thead')).toHaveCSS('border-bottom-width', '1px');
    await expect(table.locator('tbody tr').nth(1)).toHaveCSS('border-top-width', '1px');
    await expect(frame).toHaveCSS('display', 'block');
  }
  // A rowgroup heading that spans columns stays an ordinary heading without the upgrade.
  const heading = specimen.locator('th[scope="rowgroup"]').first();
  await expect(heading).toHaveClass('px-3 py-2 align-middle type-body text-default text-left');
  await expect(heading).toHaveCSS('position', 'static');
  // Without a height bound, every row shows and nothing scrolls on the block axis.
  await expect(specimen.locator('tbody tr')).toHaveCount(31);
  const area = specimen.locator('[data-zao-slot="scroll-area"]');
  expect(await area.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  await expect(specimen.locator('[data-zao-slot="readout"]')).toHaveCount(0);
});

for (const mode of modes)
  for (const direction of directions) {
    test(`${mode}, ${direction}: a held header at rest paints as the basic Table does`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const { specimen, frame, scroll } = await openStickyHeader(page, { mode, direction });

      /** Pin the frame to one viewport position, then cut the header strip and five rows. */
      const capture = async () => {
        await frames(page);
        await frame.evaluate((node) => {
          const top = node.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, Math.round(top) - 120);
        });
        await page.mouse.move(0, 0);
        await frames(page);
        const geometry = await frame.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          const table = node.querySelector('table')!;
          const text = (row: HTMLTableRowElement) => {
            const range = document.createRange();
            range.selectNodeContents(row.cells[0]!);
            return range.getBoundingClientRect().top;
          };
          const rows = [...table.tBodies[0]!.rows].slice(1);
          return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            headerText: text(table.tHead!.rows[0]!) - bounds.y,
            rowText: rows.map((row) => text(row)),
            columns: [...table.tHead!.rows[0]!.cells].map((cell) => {
              const cellBounds = cell.getBoundingClientRect();
              return [cellBounds.x - bounds.x, cellBounds.width];
            }),
          };
        });
        const pitch = geometry.rowText[1]! - geometry.rowText[0]!;
        const header = await page.screenshot({
          clip: { x: geometry.x, y: geometry.y, width: geometry.width, height: 34 },
        });
        const rows = await page.screenshot({
          clip: {
            x: geometry.x,
            y: geometry.rowText[0]! - 9,
            width: geometry.width,
            height: pitch * geometry.rowText.length,
          },
        });
        return { geometry, pitch, header, rows };
      };

      const upgraded = await capture();
      const stuck = await reading(frame);
      expect(stuck.borderCollapse).toBe('separate');
      expect(stuck.headerSize).toBe(33);
      expect(stuck.header.bottom).toBe(33);
      expect(stuck.header.ruleWidth).toBe(1);
      expectColor(stuck.header.rule, stuck.roles.subtle);
      expectColor(stuck.header.fill, stuck.roles.canvas);
      for (const shadow of stuck.header.shadows) expect(shadow.color[3]).toBe(0);
      expect(await scroll.evaluate((node) => node.scrollTop)).toBe(0);

      await specimen.getByRole('tab', { name: 'Basic', exact: true }).click();
      await expect(specimen.locator('[data-zao-sticky-header]')).toHaveCount(0);
      await expect(frame).toHaveCount(1);
      const basic = await capture();

      expect(upgraded.geometry.x).toBe(basic.geometry.x);
      expect(upgraded.geometry.y).toBe(basic.geometry.y);
      expect(upgraded.geometry.width).toBe(basic.geometry.width);
      expect(upgraded.geometry.headerText).toBe(basic.geometry.headerText);
      expect(upgraded.geometry.columns).toEqual(basic.geometry.columns);
      expect(upgraded.pitch).toBe(basic.pitch);
      expect(upgraded.geometry.rowText.length).toBe(5);
      // Rules, fills and the header strip match exactly; glyph edges may round one step apart
      // where a sticky cell changes how the text is composited.
      expect(upgraded.header.equals(basic.header)).toBe(true);
      expect(await largestDifference(page, upgraded.rows, basic.rows)).toBeLessThanOrEqual(1);
    });

    test(`${mode}, ${direction}: the header sticks, and its rule and plane follow the scroll`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const { specimen, frame, scroll } = await openStickyHeader(page, { mode, direction });
      await expect(frame).toHaveAttribute('data-zao-sticky-header', '');
      await expect(frame).toHaveCSS('display', 'flex');
      const frameBounds = (await frame.boundingBox())!;
      expect(frameBounds.height).toBe(384);

      const rest = await reading(frame);
      expect(rest.support).toEqual({ timeline: true, scrollState: true });
      expect(rest.scrollHeight).toBeGreaterThan(rest.clientHeight);
      expect(rest.header.position).toBe('sticky');
      expect(rest.header.top).toBe(0);
      expect(rest.header.animation).toBe('zao-table-header-stuck');
      expect(rest.header.timelines).toEqual(['ScrollTimeline']);
      expect(rest.header.timed).toEqual([]);
      expectColor(rest.header.rule, rest.roles.subtle);
      for (const shadow of rest.header.shadows) expect(shadow.color[3]).toBe(0);
      await expect(specimen.locator('[data-zao-slot="readout"]')).toHaveText(
        'Header restingGroup Today',
      );

      // Halfway through the first space.4 of scroll, the plane is half drawn.
      await scrollTo(page, scroll, 8);
      const half = await reading(frame);
      expect(half.header.top).toBe(0);
      expect(half.header.shadows.map((shadow) => shadow.y)).toEqual([0.5, 1]);
      expect(half.firstRowTop).toBe(rest.firstRowTop - 8);

      await scrollTo(page, scroll, 300);
      const stuck = await reading(frame);
      expect(stuck.scrollTop).toBe(300);
      expect(stuck.header.top).toBe(0);
      expect(stuck.header.bottom).toBe(33);
      expect(stuck.firstRowTop).toBe(rest.firstRowTop - 300);
      expectColor(stuck.header.rule, stuck.roles.ink);
      expectColor(stuck.header.fill, stuck.roles.canvas);
      expect(stuck.header.shadows).toHaveLength(2);
      expect(stuck.header.shadows.map(({ x, y, blur, spread }) => [x, y, blur, spread])).toEqual([
        [0, 1, 0, 0],
        [0, 2, 0, 0],
      ]);
      expectColor(stuck.header.shadows[0]!.color, stuck.roles.planeNear);
      expectColor(stuck.header.shadows[1]!.color, stuck.roles.planeFar);
      expect(stuck.header.timed).toEqual([]);
      await expect(specimen.locator('[data-zao-slot="readout"]')).toHaveText(
        'Header stuckGroup Yesterday',
      );
      // The frame holds still while its rows move.
      expect(await frame.boundingBox()).toEqual(frameBounds);

      await scrollTo(page, scroll, 0);
      const back = await reading(frame);
      expectColor(back.header.rule, back.roles.subtle);
      for (const shadow of back.header.shadows) expect(shadow.color[3]).toBe(0);

      const result = await new AxeBuilder({ page })
        .include('[data-zao-specimen="table-sticky-header"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    });

    test(`${mode}, ${direction}: group heads stack under the header and mark the current group`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const { frame, scroll, table } = await openStickyHeader(page, { mode, direction });
      const rest = await reading(frame);
      expect(rest.groups).toHaveLength(5);
      expect(rest.groupSize).toBe(33);
      expect(rest.scrollPadding).toBe(rest.headerSize + rest.groupSize);
      const label = await frame.evaluate((node) => {
        const probe = document.createElement('span');
        probe.className = 'type-label font-medium';
        node.append(probe);
        const css = getComputedStyle(probe);
        const role = { fontSize: css.fontSize, fontWeight: css.fontWeight };
        probe.remove();
        return role;
      });
      for (const [index, group] of rest.groups.entries()) {
        expect(group.position).toBe('sticky');
        expectColor(group.fill, rest.roles.sunken);
        expectColor(group.ink, rest.roles.ink);
        expect(group.fontSize).toBe(label.fontSize);
        expect(group.fontWeight).toBe(label.fontWeight);
        expect(group.topRule).toBe(index === 0 ? 0 : 1);
        expect(group.marked).toBe(false);
        expect(group.underRule).toBe(1);
        expectColor(group.underRuleInk, rest.roles.subtle);
      }
      // At rest the first group head sits directly under the header's rule.
      expect(rest.groups[0]!.top).toBe(rest.header.bottom);

      // The second group arrives: it slides over the first, which stays where it stuck.
      const second = await table.evaluate((node: HTMLTableElement) => node.tBodies[1]!.offsetTop);
      await scrollTo(page, scroll, second - rest.headerSize - 12);
      const sliding = await reading(frame);
      expect(sliding.groups[0]!.top).toBe(sliding.header.bottom);
      expect(sliding.groups[0]!.marked).toBe(true);
      expect(sliding.groups[1]!.top).toBe(sliding.header.bottom + 12);
      expect(sliding.groups[1]!.marked).toBe(false);
      const covering = await table.evaluate((node: HTMLTableElement) => {
        const head = node.tBodies[1]!.rows[0]!.cells[0]!;
        const bounds = head.getBoundingClientRect();
        const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + 4);
        return head.contains(hit);
      });
      expect(covering).toBe(true);

      // Stuck, the later head's own top rule tucks under the header's rule.
      await scrollTo(page, scroll, second + 40);
      const stacked = await reading(frame);
      expect(stacked.groups[0]!.top).toBe(stacked.header.bottom);
      expect(stacked.groups[1]!.top).toBe(stacked.header.bottom - 1);
      expect(stacked.groups[2]!.top).toBeGreaterThan(stacked.header.bottom);
      const current = stacked.groups[1]!;
      expect(current.marked).toBe(true);
      expect(current.markStart).toBe(2);
      expect(current.markOffset).toBe(0);
      expectColor(current.markInk, stacked.roles.ink);
      expect(stacked.groups[2]!.marked).toBe(false);
      const onTop = await table.evaluate((node: HTMLTableElement) => {
        const head = node.tBodies[1]!.rows[0]!.cells[0]!;
        const bounds = head.getBoundingClientRect();
        const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + 12);
        return head.contains(hit);
      });
      expect(onTop).toBe(true);

      // A row scrolled into view lands clear of the header and the stuck group head.
      const landed = await table.evaluate((node: HTMLTableElement) => {
        const row = node.tBodies[2]!.rows[3]!;
        row.scrollIntoView({ block: 'start' });
        const area = node.parentElement!;
        return row.getBoundingClientRect().top - area.getBoundingClientRect().top;
      });
      expect(landed).toBeGreaterThanOrEqual(stacked.headerSize + stacked.groupSize - 1);
      expect(landed).toBeLessThanOrEqual(stacked.headerSize + stacked.groupSize + 1);
    });
  }

test('keyboard scrolling keeps the header in place, with reduced motion too', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  const { frame, scroll } = await openStickyHeader(page);
  await expect(scroll).toHaveAttribute('tabindex', '0');
  await scroll.focus();
  await page.keyboard.press('End');
  await expect
    .poll(() => scroll.evaluate((node) => node.scrollTop + node.clientHeight - node.scrollHeight))
    .toBeGreaterThanOrEqual(-1);
  await frames(page);
  await expect(scroll).toBeFocused();
  const end = await reading(frame);
  expect(end.header.top).toBe(0);
  expectColor(end.header.rule, end.roles.ink);
  expect(end.header.shadows.map((shadow) => shadow.y)).toEqual([1, 2]);
  expect(end.header.timed).toEqual([]);
  // The last group is shorter than the view, so the one before it is still the stuck head.
  expect(end.groups[3]!.top).toBe(end.header.bottom - 1);
  expect(end.groups[4]!.top).toBeGreaterThan(end.header.bottom);
  await page.keyboard.press('Home');
  await expect.poll(() => scroll.evaluate((node) => node.scrollTop)).toBe(0);
  await frames(page);
  const home = await reading(frame);
  expectColor(home.header.rule, home.roles.subtle);
});

test('forced colors keep the stuck rule in CanvasText and drop the plane and fills', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 1280, height: 900 });
  const { frame, scroll } = await openStickyHeader(page);
  await scrollTo(page, scroll, 300);
  const stuck = await reading(frame);
  expect(stuck.header.top).toBe(0);
  expect(stuck.header.animation).toBe('none');
  expect(stuck.header.shadows).toEqual([]);
  expectColor(stuck.header.rule, stuck.roles.canvasText);
  expectColor(stuck.header.fill, stuck.roles.systemCanvas);
  const current = stuck.groups[1]!;
  expect(current.top).toBe(stuck.header.bottom - 1);
  expectColor(current.fill, stuck.roles.systemCanvas);
  expect(current.marked).toBe(true);
  expectColor(current.markInk, stuck.roles.canvasText);
  expectColor(current.underRuleInk, stuck.roles.canvasText);
});

test('without scroll timelines or scroll-state queries the header still sticks at rest', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { frame, scroll } = await openStickyHeader(page, { withoutSupport: true });
  await scrollTo(page, scroll, 300);
  const stuck = await reading(frame);
  expect(stuck.header.position).toBe('sticky');
  expect(stuck.header.top).toBe(0);
  expect(stuck.header.animation).toBe('none');
  expect(stuck.header.shadows).toEqual([]);
  expectColor(stuck.header.rule, stuck.roles.subtle);
  expect(stuck.groups[1]!.top).toBe(stuck.header.bottom - 1);
  expect(stuck.groups.every((group) => !group.marked)).toBe(true);
});

test('a drawing table keeps its held header and group heads transparent', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { frame } = await openStickyHeader(page);
  await frame.evaluate((node) => {
    node.setAttribute('data-zao-drawing', '');
    node.classList.add('construction-drawing');
  });
  const drawing = await reading(frame);
  expect(drawing.header.fill[3]).toBe(0);
  expect(drawing.header.animation).toBe('none');
  for (const group of drawing.groups) expect(group.fill[3]).toBe(0);
});

test('390px: the held header fits the page and scrolls with its columns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { frame, scroll } = await openStickyHeader(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await scrollTo(page, scroll, 300);
  const stuck = await reading(frame);
  expect(stuck.header.top).toBe(0);
  expect(stuck.header.shadows.map((shadow) => shadow.y)).toEqual([1, 2]);
  if (stuck.scrollWidth > stuck.clientWidth) {
    await scroll.evaluate((node) => {
      node.scrollLeft = node.scrollWidth;
    });
    await frames(page);
    const across = await reading(frame);
    expect(across.header.top).toBe(0);
    expect(across.scrollTop).toBe(300);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
