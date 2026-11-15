// Captures every component, chart and landing page under one seal, in light and dark, and
// lists where a blue paint appears on each page (the audit of where the seal is used).
//
// Serve a production build first, never `next dev`:
//   cd apps/docs
//   ZAO_DOCS_DIST_DIR=.next-azurite pnpm exec next build --webpack
//   ZAO_DOCS_DIST_DIR=.next-azurite pnpm exec next start --hostname 127.0.0.1 --port 3187
//
// Usage: node capture.mjs <baseURL> <label> [seal] [routeFilter]
//   node capture.mjs http://127.0.0.1:3187 before
//   node capture.mjs http://127.0.0.1:3187 after azurite /charts
//
// Writes screenshots/<label>/<route>-<mode>.png and screenshots/<label>/seal-map.json.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../apps/docs/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const base = process.argv[2] ?? 'http://127.0.0.1:3187';
const label = process.argv[3] ?? 'before';
const seal = process.argv[4] ?? 'azurite';
const filter = process.argv[5];
const outDir = fileURLToPath(new URL(`./screenshots/${label}/`, import.meta.url));
mkdirSync(outDir, { recursive: true });

const routes = [
  '/',
  ...[
    'button',
    'icon-button',
    'card',
    'menu',
    'select',
    'combobox',
    'text-field',
    'dialog',
    'tabs',
    'switch',
    'progress',
    'table',
    'conversation',
    'composer',
    'plan',
    'approval-gate',
  ].map((slug) => `/components/${slug}`),
  '/charts',
  ...['ring', 'meter', 'share', 'bar', 'line', 'heatmap', 'histogram'].map(
    (slug) => `/charts/${slug}`,
  ),
  '/foundations/color',
  '/foundations/data-visualization',
].filter((route) => !filter || route.startsWith(filter));

/** Runs in the page: every element or pseudo-element painted in a blue. */
function findSealPaint() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const isBlue = (value) => {
    if (!value || value === 'none' || value === 'transparent') return false;
    if (cache.has(value)) return cache.get(value);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000';
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    const blue = a > 40 && b - r >= 14 && b >= g;
    cache.set(value, blue);
    return blue;
  };
  const properties = [
    'background-color',
    'color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'fill',
    'stroke',
  ];
  const found = new Map();
  const describe = (element) => {
    const part = element.closest('[data-zao-component]')?.getAttribute('data-zao-component');
    const slot = element.closest('[data-zao-slot]')?.getAttribute('data-zao-slot');
    const name =
      typeof element.className === 'string'
        ? element.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
        : element.getAttribute('class')?.split(/\s+/).slice(0, 3).join('.');
    return [element.tagName.toLowerCase(), part && `part=${part}`, slot && `slot=${slot}`, name]
      .filter(Boolean)
      .join(' ');
  };
  for (const element of document.querySelectorAll('body *')) {
    const box = element.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    for (const pseudo of [null, '::before', '::after']) {
      const style = getComputedStyle(element, pseudo);
      if (pseudo && (style.content === 'none' || style.content === 'normal')) continue;
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      for (const property of properties) {
        const value = style.getPropertyValue(property);
        if (
          property.startsWith('border') &&
          style.getPropertyValue(property.replace('color', 'width')) === '0px'
        )
          continue;
        if (property === 'outline-color' && style.outlineStyle === 'none') continue;
        if (property === 'color' && !pseudo && !element.childNodes.length) continue;
        if (!isBlue(value)) continue;
        const key = `${describe(element)}${pseudo ?? ''} | ${property.replace(/-(top|right|bottom|left)/, '')}`;
        found.set(key, (found.get(key) ?? 0) + 1);
      }
      const shadow = style.boxShadow;
      if (shadow && shadow !== 'none') {
        const colors = shadow.match(/(oklch|oklab|rgba?|color)\([^)]*\)/g) ?? [];
        if (colors.some(isBlue)) {
          const key = `${describe(element)}${pseudo ?? ''} | box-shadow`;
          found.set(key, (found.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return [...found].map(([where, count]) => `${where} ×${count}`);
}

const browser = await chromium.launch();
const map = {};
for (const mode of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: mode,
  });
  await context.addInitScript(
    ([modeValue, sealValue]) => {
      localStorage.setItem('zao-mode', modeValue);
      localStorage.setItem('zao-seal', sealValue);
    },
    [mode, seal],
  );
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const name = route === '/' ? 'landing' : route.slice(1).replaceAll('/', '-');
    await page.screenshot({ path: `${outDir}${name}-${mode}.png`, fullPage: true });
    map[`${route} ${mode}`] = await page.evaluate(findSealPaint);
    console.log(`${route} ${mode}: ${map[`${route} ${mode}`].length} blue paints`);
  }
  await context.close();
}
await browser.close();
writeFileSync(`${outDir}seal-map.json`, JSON.stringify(map, null, 2) + '\n');
