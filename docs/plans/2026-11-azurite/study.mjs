// Renders the option sheet's comparisons: each gate's candidates are injected into the real,
// built docs pages as study CSS (nothing in the source changes) and captured in light and dark
// under the azurite seal. Run ramp-candidates.ts first; see capture.mjs for serving the build.
//
// Usage: node study.mjs <baseURL> [gateFilter] [after]
//   node study.mjs http://127.0.0.1:3187            the option sheet's captures, in study/
//   node study.mjs http://127.0.0.1:3187 "" after   the same views as built, in screenshots/after/parts/
// A gate's "today" capture in study/ is its before; the after capture has the same name
// without the option.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../apps/docs/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const base = process.argv[2] ?? 'http://127.0.0.1:3187';
const filter = process.argv[3];
const after = process.argv[4] === 'after';
const outDir = fileURLToPath(
  new URL(after ? './screenshots/after/parts/' : './study/', import.meta.url),
);
mkdirSync(outDir, { recursive: true });
const ramps = JSON.parse(readFileSync(new URL('./ramp-candidates.json', import.meta.url), 'utf8'));

const solid = 'var(--zao-color-accent-solid)';
const rampCss = (name, mode) =>
  `:root, [data-zao-theme] {${Object.entries(ramps[name][mode])
    .map(([role, hex]) => `--zao-color-seal-azurite-${role}: ${hex} !important;`)
    .join('')}}`;

// Study CSS for each placement. Semantic roles only.
const css = {
  check: `[data-zao-slot='item-indicator'] { color: var(--zao-color-accent-text); }`,
  checkbox: `.table-checkbox:is(:checked, :indeterminate) { border-color: ${solid}; background-color: ${solid}; color: var(--zao-color-fg-on-accent); }`,
  row: `[data-zao-component='table'] tbody > tr[data-selected] { background-color: var(--zao-color-accent-subtle) !important; }`,
  rowWash: `[data-zao-component='table'] tbody > tr[data-selected] { background-color: color-mix(in oklch, ${solid} 8%, var(--zao-color-bg-surface)) !important; }`,
  tabsLabel: `.tabs-list[data-zao-variant='secondary'] > .tabs-tab[data-active] { color: var(--zao-color-accent-text); }`,
  tabsBase: `.tabs-list[data-zao-variant='secondary'] > .tabs-indicator {
      --zao-plane-x-near: ${solid} !important;
      --zao-plane-x-far: color-mix(in oklch, ${solid}, black 14%) !important;
      --zao-plane-y-near: color-mix(in oklch, ${solid}, black 8%) !important;
      --zao-plane-y-far: color-mix(in oklch, ${solid}, black 20%) !important; }`,
  tabsFace: `.tabs-list[data-zao-variant='secondary'] > .tabs-indicator { --zao-construction-face: ${solid}; border-color: var(--zao-color-accent-border); }
    .tabs-list[data-zao-variant='secondary'] > .tabs-tab[data-active] { color: var(--zao-color-fg-on-accent); }`,
  planRunning: `.zao-plan .zao-plan-step[data-zao-status='running']::before { border-color: ${solid}; }`,
  planDone: `.zao-plan .zao-plan-step[data-zao-status='done']::before { border-color: ${solid}; background: ${solid}; }
    .zao-plan .zao-plan-tick[data-zao-tick='done'] { border-color: ${solid}; }`,
  progress: `.progress-construction { --zao-color-seal-ink-solid: ${solid}; --zao-color-seal-ink-border: var(--zao-color-accent-border); }`,
  focus: `:root, [data-zao-theme] { --zao-color-focus-ring: ${solid} !important; }`,
  links: `main a[href]:not([class*='button']):not([data-zao-component]) { color: var(--zao-color-accent-text); }`,
  accentSquare: `.chart-accent, .storage-ring-study [data-zao-slot='chart-accent'] { fill: ${solid}; }
    .chart-accent-stroke { stroke: ${solid}; }
    .chart-accent-chip { background: ${solid}; }`,
  emphasized: `:is([data-zao-chart='bar'], [data-zao-chart='share'], [data-zao-chart='bar-prism']) .chart-plot :is([data-chart-ink='data'], [data-chart-fill]) { --zao-color-fg-default: ${solid}; }
    .chart-prism-plane-top { fill: color-mix(in oklab, ${solid} 35%, var(--zao-color-bg-canvas)); }
    .chart-prism-plane-side { fill: color-mix(in oklab, ${solid} 65%, var(--zao-color-bg-canvas)); }`,
  allData: `.chart-plot :is([data-chart-ink='data'], [data-chart-fill]):not([data-zao-slot='chart-unknown']) { --zao-color-fg-default: ${solid}; }
    .storage-ring-study [data-zao-slot='storage-mark'][data-state='used'] { stroke: ${solid}; }`,
  heatRamp: `[data-zao-chart='heatmap'] :is([data-zao-slot='chart-mark'], [data-zao-slot='chart-legend'] rect) { --zao-color-fg-default: ${solid}; }`,
  bracketPicked: `.landing-bracket[data-picking] .landing-bracket-part[data-picked] { color: ${solid}; }
    .landing-ruler-span { background-color: ${solid}; }`,
  sealGlyph: `[aria-label='Seal'] [role='radio'][data-study-seal='azurite'] > span[aria-hidden] { color: var(--zao-color-seal-azurite-text); }`,
};

const pad = (box, by = 16) => ({
  x: Math.max(0, box.x - by),
  y: Math.max(0, box.y - by),
  width: box.width + by * 2,
  height: box.height + by * 2,
});
const union = (boxes) => {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
};
/** Page-space boxes of every match (for full-page clips). */
const boxes = (page, selector) =>
  page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)].map((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
      }),
    selector,
  );
const clipOf = async (page, selector, by) => pad(union(await boxes(page, selector)), by);

const preview = '[data-preview-style]';
const views = {
  buttonRow: {
    route: '/components/button',
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} [data-zao-variant='primary']`);
      return { x: box.x - 16, y: box.y - 16, width: 640, height: box.height + 32 };
    },
  },
  switchOn: {
    route: '/components/switch',
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} .switch-construction[data-checked]`);
      return { x: box.x - 280, y: box.y - 16, width: 640, height: box.height + 32 };
    },
  },
  tabsPrimary: {
    route: '/components/tabs',
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} .tabs-list[data-zao-variant='primary']`);
      return { x: box.x - 16, y: box.y - 12, width: 640, height: box.height + 32 };
    },
  },
  record: {
    route: '/components/approval-gate',
    clip: async (page) => {
      const all = await boxes(page, `${preview} [data-zao-slot='impression']`);
      const box = all[1] ?? all[0];
      return {
        x: box.x + box.width + 16 - 640,
        y: box.y - 16,
        width: 640,
        height: box.height + 32,
      };
    },
  },
  selectOpen: {
    route: '/components/select',
    setup: async (page) => {
      await page.locator(`${preview} [data-zao-slot='trigger']`).first().click();
      await page.locator('[role="listbox"]').first().waitFor();
      await page.waitForTimeout(400);
    },
    clip: async (page) => {
      const trigger = await boxes(page, `${preview} [data-zao-slot='trigger']`);
      const list = await boxes(page, '[role="listbox"]');
      return pad(union([trigger[0], list[0]]), 20);
    },
  },
  tableSelected: {
    route: '/components/table',
    setup: async (page) => {
      const rows = page.locator(`${preview} tbody .table-checkbox`);
      await rows.nth(0).click();
      await rows.nth(2).click();
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);
    },
    clip: async (page) =>
      pad((await boxes(page, `${preview} [data-zao-component='table']`))[0], 12),
  },
  headerSwitch: {
    route: '/components/tabs',
    clip: (page) =>
      clipOf(page, `[aria-label='Seal'], [aria-label='Seal'] ~ *, header [role='tablist']`, 12),
  },
  tabsSecondary: {
    route: '/components/tabs',
    clip: async (page) => {
      const all = await boxes(page, `${preview} .tabs-list[data-zao-variant='secondary']`);
      return pad(all[0], 16);
    },
  },
  plan: {
    route: '/components/plan',
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} .zao-plan`);
      return { x: box.x - 12, y: box.y - 12, width: 400, height: box.height + 24 };
    },
  },
  planGauge: {
    route: '/components/plan',
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} .zao-plan-gauge`);
      return {
        x: box.x + box.width + 120 - 400,
        y: box.y - 16,
        width: 400,
        height: box.height + 32,
      };
    },
  },
  progress: {
    route: '/components/progress',
    clip: async (page) => {
      const all = await boxes(page, `${preview} .progress-construction`);
      const box = union(all.slice(0, 3));
      return { x: box.x - 12, y: box.y - 40, width: box.width + 24, height: box.height + 64 };
    },
  },
  focusButton: {
    route: '/components/button',
    setup: async (page) => {
      await page.keyboard.press('Tab');
      await page.locator(`${preview} [data-zao-variant='secondary']`).first().focus();
      await page.waitForTimeout(500);
    },
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} [data-zao-variant='primary']`);
      return { x: box.x - 16, y: box.y - 16, width: 400, height: box.height + 32 };
    },
  },
  focusField: {
    route: '/components/text-field',
    setup: async (page) => {
      await page.keyboard.press('Tab');
      await page.locator(`${preview} input`).first().focus();
      await page.waitForTimeout(300);
    },
    clip: async (page) => {
      const [box] = await boxes(page, `${preview} input`);
      return { x: box.x - 16, y: box.y - 36, width: 400, height: box.height + 52 };
    },
  },
  links: {
    route: '/charts',
    clip: async (page) => {
      const [box] = await boxes(page, 'main h1');
      return { x: box.x - 24, y: box.y - 16, width: 640, height: 130 };
    },
  },
  chartRing: {
    route: '/charts',
    clip: async (page) => pad((await boxes(page, `[data-zao-gallery-item='ring']`))[0], 4),
  },
  chartShare: {
    route: '/charts',
    clip: async (page) => pad((await boxes(page, `[data-zao-gallery-item='share']`))[0], 4),
  },
  chartBar: {
    route: '/charts',
    clip: async (page) => pad((await boxes(page, `[data-zao-gallery-item='bar']`))[0], 4),
  },
  chartHistogram: {
    route: '/charts',
    clip: async (page) => pad((await boxes(page, `[data-zao-gallery-item='histogram']`))[0], 4),
  },
  barInspected: {
    route: '/charts/bar',
    setup: async (page) => {
      const [box] = await boxes(page, `[data-zao-chart='bar'] .chart-plot`);
      await page.mouse.move(box.x + box.width * 0.33, box.y - scrollYOf(page) + box.height * 0.5);
      await page.waitForTimeout(300);
    },
    clip: async (page) => pad((await boxes(page, `[data-zao-chart='bar'] .chart-plot`))[0], 28),
  },
  prismSelected: {
    route: '/charts/bar',
    setup: async (page) => {
      const frame = page.locator(`[data-zao-chart='bar-prism']`).first();
      await frame.scrollIntoViewIfNeeded();
      const box = await frame.locator('.chart-plot').boundingBox();
      await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.7);
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7);
      await page.waitForTimeout(300);
    },
    clip: async (page) =>
      pad((await boxes(page, `[data-zao-chart='bar-prism'] .chart-plot`))[0], 28),
  },
  heatmap: {
    route: '/charts/heatmap',
    clip: async (page) => pad((await boxes(page, `[data-zao-chart='heatmap'] .chart-plot`))[0], 20),
  },
  bracket: {
    route: '/',
    viewport: { width: 1000, height: 800 },
    motion: true,
    setup: async (page) => {
      const figure = page.locator('.landing-bracket').first();
      await figure.scrollIntoViewIfNeeded();
      const box = await figure.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.45);
      await page.waitForTimeout(900);
    },
    clip: (page) => clipOf(page, '.landing-hero-figure', 12),
  },
  sealSwitch: {
    route: '/components/tabs',
    setup: (page) =>
      page.evaluate(() => {
        for (const radio of document.querySelectorAll(`[aria-label='Seal'] [role='radio']`))
          radio.setAttribute(
            'data-study-seal',
            radio.textContent.includes('Azurite') ? 'azurite' : 'ink',
          );
      }),
    clip: (page) => clipOf(page, `[aria-label='Seal']`, 12),
  },
};
const scrollYOf = () => 0;

const rampOptions = {
  today: { ramp: 'today' },
  mineral: { ramp: 'mineral' },
  vivid: { ramp: 'vivid' },
  qing: { ramp: 'qing' },
};
const gates = [
  { id: 'Z1', views: ['buttonRow', 'tabsPrimary', 'switchOn', 'record'], options: rampOptions },
  {
    id: 'Z2',
    modes: ['dark'],
    views: ['buttonRow', 'tabsPrimary', 'switchOn', 'record'],
    options: { light: { ramp: 'mineral' }, deep: { ramp: 'deep' } },
  },
  { id: 'S1', views: ['selectOpen'], options: { today: {}, a: { css: css.check } } },
  {
    id: 'S2',
    views: ['tableSelected'],
    options: {
      today: {},
      a: { css: css.checkbox },
      b: { css: css.checkbox + css.row },
      c: { css: css.checkbox + css.rowWash },
    },
  },
  {
    id: 'S3',
    views: ['headerSwitch', 'tabsSecondary'],
    options: {
      today: {},
      a: { css: css.tabsLabel },
      b: { css: css.tabsBase },
      c: { css: css.tabsFace },
    },
  },
  {
    id: 'S4',
    views: ['plan', 'planGauge'],
    options: { today: {}, a: { css: css.planRunning }, b: { css: css.planRunning + css.planDone } },
  },
  { id: 'S5', views: ['progress'], options: { today: {}, a: { css: css.progress } } },
  { id: 'S6', views: ['focusButton', 'focusField'], options: { today: {}, a: { css: css.focus } } },
  { id: 'S7', views: ['links'], options: { today: {}, a: { css: css.links } } },
  {
    id: 'C1',
    views: ['chartRing', 'chartShare', 'chartBar', 'chartHistogram'],
    options: {
      today: {},
      a: { css: css.accentSquare },
      b: { css: css.accentSquare + css.emphasized },
      c: { css: css.accentSquare + css.allData },
    },
  },
  {
    id: 'C2',
    views: ['barInspected', 'prismSelected'],
    options: {
      today: {},
      a: { css: css.accentSquare },
      b: { css: css.accentSquare + css.emphasized },
    },
  },
  {
    id: 'C3',
    views: ['heatmap'],
    options: {
      today: {},
      a: { css: css.accentSquare },
      b: { css: css.accentSquare + css.heatRamp },
    },
  },
  { id: 'L1', views: ['bracket'], options: { today: {}, a: { css: css.bracketPicked } } },
  { id: 'L2', views: ['sealSwitch'], options: { today: {}, a: { css: css.sealGlyph } } },
].filter((gate) => !filter || gate.id.startsWith(filter));

const browser = await chromium.launch();
for (const mode of ['light', 'dark']) {
  for (const gate of gates) {
    if (gate.modes && !gate.modes.includes(mode)) continue;
    if (after && gate.id === 'Z2') continue;
    for (const viewName of gate.views) {
      const view = views[viewName];
      const context = await browser.newContext({
        viewport: view.viewport ?? { width: 1280, height: 900 },
        deviceScaleFactor: 2,
        reducedMotion: view.motion ? 'no-preference' : 'reduce',
        colorScheme: mode,
      });
      await context.addInitScript(
        ([modeValue]) => {
          localStorage.setItem('zao-mode', modeValue);
          localStorage.setItem('zao-seal', 'azurite');
        },
        [mode],
      );
      const page = await context.newPage();
      for (const [optionName, option] of after ? [['built', {}]] : Object.entries(gate.options)) {
        await page.goto(base + view.route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({
          content: after ? ':root {}' : rampCss(option.ramp ?? 'today', mode) + (option.css ?? ''),
        });
        await page.waitForTimeout(250);
        try {
          await view.setup?.(page);
          const clip = await view.clip(page);
          const file = after
            ? `${gate.id}-${viewName}-${mode}.png`
            : `${gate.id}-${viewName}-${optionName}-${mode}.png`;
          await page.screenshot({ path: outDir + file, clip, fullPage: true });
        } catch (error) {
          console.log(
            `FAILED ${gate.id} ${viewName} ${optionName} ${mode}: ${error.message.split('\n')[0]}`,
          );
        }
      }
      await context.close();
    }
    console.log(`${gate.id} ${mode}`);
  }
}
await browser.close();
