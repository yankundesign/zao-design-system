import { expect, test } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';

/**
 * Next's webpack build merges the root page's client manifest into every route's, and where the
 * landing and a layout reference the same client module, the landing's chunk list wins. Every docs
 * route then loaded the whole landing (components/landing/shared-client.tsx explains the fix).
 * The root page's own chunk is the clearest sign: only `/` should load it. It appears as a script
 * tag in the static export and in the RSC payload's client references when rendered on demand.
 */
const rootPageChunk = /static\/chunks\/app\/page-[0-9a-f]+\.js/;

const docsRoutes = [
  '/foundations/space',
  '/components/button',
  '/components/plan',
  '/charts/ring',
  '/anatomy-source/button',
  '/no-such-page',
];

for (const route of docsRoutes) {
  test(`${route} loads none of the landing's chunks`, async ({ request }) => {
    const html = await (await request.get(route)).text();
    expect(html).toContain('/_next/static/chunks/');
    expect(html).not.toMatch(rootPageChunk);
  });
}

test('the landing still loads its own chunk', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(rootPageChunk);
});

test('the study stylesheet is versioned by its content', async ({ request }) => {
  // public/_headers caches the exported stylesheet for good, which holds only while its URL
  // changes whenever its content does.
  const html = await (await request.get('/components/button')).text();
  const href = html.match(/\/api\/style-studies\/quiet-instrument\/css\?v=([^"&]+)/)?.[1];
  expect(href).toMatch(/^[0-9a-f]{12}$/);
});

test('a static docs page paints its nav before hydration', async ({ request }) => {
  // On narrow screens the nav's disclosure sits above the page; drawn only after hydration, it
  // pushed the content down.
  // React separates interpolated text with empty comments.
  const html = (await (await request.get('/foundations/space')).text()).replaceAll('<!-- -->', '');
  expect(html).toContain('Browse docs · Foundations / Space');
  expect(html.match(/<nav aria-label="Docs"/g)).toHaveLength(2);
  expect(html).toContain('href="/components/button"');
});

/**
 * The most elements one style recalculation visits when an empty div is appended to `host`.
 * Chromium's trace reports the count; durations vary with the machine, and counts do not.
 */
async function restyledByAppend(browser: Browser, page: Page, host: 'body' | 'main') {
  await page.evaluate(() => void document.body.offsetHeight);
  await browser.startTracing(page, { categories: ['devtools.timeline'] });
  await page.evaluate((selector) => {
    const node = document.createElement('div');
    document.querySelector(selector)!.append(node);
    void document.body.offsetHeight;
    node.remove();
    void document.body.offsetHeight;
  }, host);
  const trace = JSON.parse((await browser.stopTracing()).toString()) as {
    traceEvents: { name: string; args?: { elementCount?: number } }[];
  };
  const counts = trace.traceEvents
    .filter((event) => event.name === 'UpdateLayoutTree')
    .map((event) => event.args?.elementCount)
    .filter((count): count is number => typeof count === 'number');
  expect(counts.length).toBeGreaterThan(0);
  return Math.max(...counts);
}

for (const host of ['body', 'main'] as const) {
  test(`an insertion into the landing's ${host} restyles a small part of the page`, async ({
    browser,
    page,
  }) => {
    // Two kinds of published rule once made an insertion restyle thousands of parts here: a
    // :has() on an ancestor (any insertion below body), and a :last-child on an ancestor (an
    // append to a page-level container). Each restyles whatever its last compound could match,
    // so that compound names a class, never a bare attribute such as data-zao-slot.
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    // The guard means something only once the workspace's parts are on the page.
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('[data-zao-slot]').length))
      .toBeGreaterThan(1000);
    await expect(page.locator('.zao-message').first()).toBeAttached();
    expect(await restyledByAppend(browser, page, host)).toBeLessThan(500);
  });
}
