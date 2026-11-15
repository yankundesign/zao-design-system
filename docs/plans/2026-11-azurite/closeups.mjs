// Close-ups, at 2x, of each page's preview under one seal in light and dark, plus the primary
// Button's hover and pressed poses. See capture.mjs for serving the build.
//
// Usage: node closeups.mjs <baseURL> <label> [seal]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../apps/docs/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const base = process.argv[2] ?? 'http://127.0.0.1:3187';
const label = process.argv[3] ?? 'before';
const seal = process.argv[4] ?? 'azurite';
const outDir = fileURLToPath(new URL(`./screenshots/${label}/closeups/`, import.meta.url));
mkdirSync(outDir, { recursive: true });

const previews = [
  'button',
  'tabs',
  'switch',
  'progress',
  'menu',
  'select',
  'table',
  'plan',
  'approval-gate',
  'composer',
  'conversation',
].map((slug) => `/components/${slug}`);
const charts = ['', '/ring', '/meter', '/share', '/bar', '/line', '/heatmap', '/histogram'].map(
  (slug) => `/charts${slug}`,
);

const browser = await chromium.launch();
for (const mode of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
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
  const open = async (route) => {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
  };
  const name = (route) => route.slice(1).replaceAll('/', '-');

  for (const route of previews) {
    await open(route);
    await page
      .locator('[data-preview-style]')
      .first()
      .screenshot({ path: `${outDir}${name(route)}-${mode}.png` });
  }
  for (const route of charts) {
    await open(route);
    const main = page.locator('main').first();
    const box = await main.boundingBox();
    await page.screenshot({
      path: `${outDir}${name(route)}-${mode}.png`,
      clip: { x: box.x, y: 0, width: box.width, height: 900 },
    });
  }

  // The primary Button's poses.
  await open('/components/button');
  const primary = page
    .locator('[data-preview-style] [data-zao-component="button"][data-zao-variant="primary"]')
    .first();
  const box = await primary.boundingBox();
  const clip = { x: box.x - 24, y: box.y - 24, width: box.width + 48, height: box.height + 48 };
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${outDir}button-primary-rest-${mode}.png`, clip });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}button-primary-hover-${mode}.png`, clip });
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}button-primary-pressed-${mode}.png`, clip });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await primary.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}button-primary-focus-${mode}.png`, clip });

  // The landing page's first screen and its workspace.
  await open('/');
  await page.screenshot({ path: `${outDir}landing-top-${mode}.png` });
  await context.close();
}
await browser.close();
