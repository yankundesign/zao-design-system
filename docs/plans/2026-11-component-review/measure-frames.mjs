// Frame and main-thread cost of every component and chart page's interactions.
//
// Serve a production build first, never `next dev`:
//   cd apps/docs
//   ZAO_DOCS_DIST_DIR=.next-review pnpm exec next build --webpack
//   ZAO_DOCS_DIST_DIR=.next-review pnpm exec next start --hostname 127.0.0.1 --port 3187
//
// Usage: node measure-frames.mjs <baseURL> <label> [cpuThrottle] [routeFilter]
//   node measure-frames.mjs http://127.0.0.1:3187 before 1
//   node measure-frames.mjs http://127.0.0.1:3187 before-4x 4 /components/tabs
//
// It glides the pointer through every control, presses each action, tabs through the page
// and sweeps each chart, and prints per phase: frame intervals (late = over 20ms), long
// animation frames, and main-thread milliseconds per second of interaction. Results are also
// written to results-<label>.json in the working directory. A single long frame that moves
// between runs is GPU warm-up: repeat before believing it.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(new URL('../../../apps/docs/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const base = process.argv[2] ?? 'http://127.0.0.1:3187';
const label = process.argv[3] ?? 'run';
const throttle = Number(process.argv[4] ?? 1);
const filter = process.argv[5];
const out = `results-${label}.json`;

const routes = [
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
  ].map((name) => `/components/${name}`),
  ...['ring', 'meter', 'share', 'bar', 'line', 'heatmap', 'histogram'].map(
    (name) => `/charts/${name}`,
  ),
  '/charts',
  '/foundations/motion',
  '/foundations/depth',
].filter((route) => !filter || route.includes(filter));

const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return {
    frames: sorted.length,
    p50: +at(0.5).toFixed(1),
    p95: +at(0.95).toFixed(1),
    max: +(sorted.at(-1) ?? 0).toFixed(1),
    late: sorted.filter((value) => value > 20).length,
  };
};

const browser = await chromium.launch({
  channel: 'chromium',
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'],
});

const results = [];
for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  if (throttle > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: throttle });

  await page.evaluate(() => {
    const probe = { on: false, last: 0, intervals: [], loaf: [], why: [] };
    const tick = (now) => {
      if (probe.on) {
        if (probe.last) probe.intervals.push(now - probe.last);
        probe.last = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      new PerformanceObserver((list) => {
        if (!probe.on) return;
        for (const entry of list.getEntries()) {
          probe.loaf.push(entry.duration);
          probe.why.push(
            `${Math.round(entry.duration)}ms (render ${Math.round(entry.startTime + entry.duration - entry.renderStart)}, style+layout ${Math.round(entry.startTime + entry.duration - entry.styleAndLayoutStart)}): ` +
              entry.scripts
                .map(
                  (script) =>
                    `${script.invoker.slice(0, 60)} ${script.sourceFunctionName} ${Math.round(script.duration)}ms forced ${Math.round(script.forcedStyleAndLayoutDuration)}`,
                )
                .join('; '),
          );
        }
      }).observe({ type: 'long-animation-frame', buffered: false });
    } catch {}
    window.__probe = probe;
  });

  const metrics = async () => {
    const { metrics: list } = await client.send('Performance.getMetrics');
    const get = (name) => list.find((metric) => metric.name === name)?.value ?? 0;
    return {
      script: get('ScriptDuration'),
      style: get('RecalcStyleDuration'),
      layout: get('LayoutDuration'),
      task: get('TaskDuration'),
      styleCount: get('RecalcStyleCount'),
      layoutCount: get('LayoutCount'),
    };
  };

  const phase = async (name, run) => {
    const before = await metrics();
    const started = Date.now();
    await page.evaluate(() => {
      Object.assign(window.__probe, { on: true, last: 0, intervals: [], loaf: [], why: [] });
    });
    const detail = await run();
    await page.waitForTimeout(250);
    const probe = await page.evaluate(() => {
      window.__probe.on = false;
      return {
        intervals: window.__probe.intervals,
        loaf: window.__probe.loaf,
        why: window.__probe.why,
      };
    });
    const after = await metrics();
    const seconds = (Date.now() - started) / 1000;
    const per = (key) => +(((after[key] - before[key]) * 1000) / seconds).toFixed(1);
    results.push({
      route,
      phase: name,
      detail,
      why: probe.why,
      seconds: +seconds.toFixed(1),
      ...stats(probe.intervals),
      loaf: probe.loaf.length,
      loafMax: +Math.max(0, ...probe.loaf).toFixed(0),
      // Main-thread milliseconds spent per second of interaction.
      taskMsPerS: per('task'),
      scriptMsPerS: per('script'),
      styleMsPerS: per('style'),
      layoutMsPerS: per('layout'),
      styles: after.styleCount - before.styleCount,
      layouts: after.layoutCount - before.layoutCount,
    });
  };

  const controls = () =>
    page.evaluate(() => {
      const main = document.querySelector('main') ?? document.body;
      const selector =
        'button:not(:disabled):not([data-zao-slot="chart-datum"]), [role="tab"], [role="switch"], [role="checkbox"], input, textarea, [role="combobox"]';
      return [...main.querySelectorAll(selector)]
        .filter((node) => {
          const box = node.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && !node.closest('[inert]');
        })
        .map((node, index) => {
          node.setAttribute('data-measure', String(index));
          return {
            index,
            tag: node.tagName,
            role: node.getAttribute('role'),
            press: node.tagName === 'BUTTON' || node.getAttribute('role') === 'tab',
          };
        });
    });

  const boxOf = async (index) => {
    const locator = page.locator(`[data-measure="${index}"]`).first();
    if ((await locator.count()) === 0) return null;
    await locator.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
    return locator.boundingBox();
  };

  // Hover: glide the pointer through every control, as a hand crossing a toolbar would.
  await phase('hover', async () => {
    const list = await controls();
    let hovered = 0;
    for (const control of list.slice(0, 40)) {
      const box = await boxOf(control.index);
      if (!box) continue;
      const y = box.y + box.height / 2;
      await page.mouse.move(box.x - 12, y);
      for (let step = 0; step <= 6; step += 1) {
        await page.mouse.move(box.x - 12 + ((box.width + 24) * step) / 6, y);
        await page.waitForTimeout(16);
      }
      hovered += 1;
    }
    return `${hovered} controls`;
  });

  // Press: seat and release each action, then dismiss whatever it opened.
  await phase('press', async () => {
    const list = (await controls()).filter((control) => control.press);
    let pressed = 0;
    for (const control of list.slice(0, 30)) {
      const box = await boxOf(control.index);
      if (!box) continue;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(60);
      await page.mouse.down();
      await page.waitForTimeout(90);
      await page.mouse.up();
      await page.waitForTimeout(220);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(120);
      pressed += 1;
    }
    return `${pressed} presses`;
  });

  // Keyboard: Tab through the page so focus brackets and outlines arrive.
  await phase('tab', async () => {
    await page.mouse.move(4, 4);
    await page
      .locator('main')
      .first()
      .focus({ timeout: 500 })
      .catch(() => {});
    for (let index = 0; index < 30; index += 1) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }
    return '30 tabs';
  });

  const inspectors = await page.locator('[data-zao-slot="chart-inspector"]').count();
  if (inspectors > 0) {
    await phase('chart-sweep', async () => {
      for (let index = 0; index < inspectors; index += 1) {
        const locator = page.locator('[data-zao-slot="chart-inspector"]').nth(index);
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        const box = await locator.boundingBox();
        if (!box) continue;
        for (const row of [0.25, 0.5, 0.75]) {
          for (let step = 0; step <= 60; step += 1) {
            await page.mouse.move(
              box.x + 2 + ((box.width - 4) * step) / 60,
              box.y + box.height * row,
            );
            await page.waitForTimeout(8);
          }
        }
      }
      return `${inspectors} plots`;
    });
    await phase('chart-keys', async () => {
      await page.mouse.move(4, 4);
      for (let index = 0; index < inspectors; index += 1) {
        const datum = page
          .locator('[data-zao-slot="chart-inspector"]')
          .nth(index)
          .locator('[data-zao-slot="chart-datum"][tabindex="0"]');
        if ((await datum.count()) === 0) continue;
        await datum.first().focus();
        for (let key = 0; key < 30; key += 1) {
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(16);
        }
        for (let key = 0; key < 30; key += 1) {
          await page.keyboard.press('ArrowLeft');
          await page.waitForTimeout(16);
        }
      }
      return `${inspectors} plots`;
    });
  }

  await page.close();
  const rows = results.filter((row) => row.route === route);
  for (const row of rows) {
    console.log(
      `${row.route.padEnd(26)} ${row.phase.padEnd(12)} frames ${String(row.frames).padStart(4)} p95 ${String(row.p95).padStart(5)} max ${String(row.max).padStart(6)} late ${String(row.late).padStart(3)} loaf ${String(row.loaf).padStart(2)}/${String(row.loafMax).padStart(3)} task ${String(row.taskMsPerS).padStart(6)} script ${String(row.scriptMsPerS).padStart(6)} style ${String(row.styleMsPerS).padStart(6)} layout ${String(row.layoutMsPerS).padStart(6)} (${row.detail})`,
    );
    for (const why of row.why) console.log(`      loaf ${why}`.slice(0, 330));
  }
}

writeFileSync(out, JSON.stringify(results, null, 2));
await browser.close();
