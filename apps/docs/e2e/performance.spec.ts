import { expect, test } from '@playwright/test';

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
