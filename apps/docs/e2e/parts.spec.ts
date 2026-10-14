import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { inventoryBlocks } from '../components/motion-inventory';

// Use the parser already bundled with Next; JSX attributes, comments and CSS selectors
// must not be confused by a text search. No additional parser dependency is needed.
const require = createRequire(import.meta.url);
type AstNode = {
  type?: string;
  name?: string | AstNode;
  value?: unknown;
  key?: AstNode;
  [key: string]: unknown;
};
const parser = require('next/dist/compiled/babel/bundle.js').parser() as {
  parse(source: string, options: { sourceType: string; plugins: string[] }): AstNode;
};
type Hook = { attribute: 'data-zao-slot' | 'data-zao-component'; value: string };

function sourceHooks(source: string): Hook[] {
  const hooks: Hook[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const node = value as AstNode;
    const name =
      node.type === 'JSXAttribute'
        ? (node.name as AstNode)?.name
        : node.type === 'ObjectProperty'
          ? (node.key?.value ?? node.key?.name)
          : undefined;
    if (name === 'data-zao-slot' || name === 'data-zao-component') {
      let literal = node.value as AstNode | undefined;
      if (literal?.type === 'JSXExpressionContainer') literal = literal.expression as AstNode;
      if (literal?.type !== 'StringLiteral' || typeof literal.value !== 'string') {
        throw new Error('Document a static authored hook: ' + name);
      }
      hooks.push({ attribute: name, value: literal.value });
    }
    Object.values(node).forEach(visit);
  };
  visit(parser.parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] }));
  return hooks;
}

async function sourceFiles(directory: URL): Promise<URL[]> {
  const files: URL[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.[jt]sx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

const sourceDirectory = new URL('../../../packages/react/src/components/', import.meta.url);
const catalogFile = new URL('../../../docs/parts.md', import.meta.url);
const rows = (markdown: string, heading: string) => {
  const table = inventoryBlocks(markdown).find(
    (block) => 'headers' in block && block.headers[0] === heading,
  );
  if (!table || !('rows' in table)) throw new Error('Missing catalog table: ' + heading);
  return table.rows;
};
const unquote = (value: string) => value.replace(/^`|`$/g, '');

test('every authored slot and component marker has an exact catalog entry and source owner', async () => {
  const markdown = await readFile(catalogFile, 'utf8');
  const authored = new Map<string, Set<string>>();
  const markers = new Set<string>();
  for (const file of await sourceFiles(sourceDirectory)) {
    const owner = basename(file.pathname, '.tsx')
      .split('-')
      .map((part) => part[0]!.toUpperCase() + part.slice(1))
      .join('');
    for (const hook of sourceHooks(await readFile(file, 'utf8'))) {
      if (hook.attribute === 'data-zao-component') markers.add(hook.value);
      else {
        const owners = authored.get(hook.value) ?? new Set<string>();
        owners.add(owner);
        authored.set(hook.value, owners);
      }
    }
  }
  const catalog = rows(markdown, 'Part name');
  expect(catalog.map((row) => unquote(row[0]!)).sort()).toEqual([...authored.keys()].sort());
  for (const row of catalog) {
    expect(row[1]!.length).toBeGreaterThan(0);
    expect(
      row[2]!
        .split(',')
        .map((owner) => owner.trim())
        .sort(),
    ).toEqual([...authored.get(unquote(row[0]!))!].sort());
  }
  expect(
    rows(markdown, 'Value')
      .map((row) => unquote(row[0]!))
      .sort(),
  ).toEqual([...markers].sort());
});

test('the source contract detects unknown hooks and rejects dynamic names', async () => {
  const listed = new Set(
    rows(await readFile(catalogFile, 'utf8'), 'Part name').map((row) => unquote(row[0]!)),
  );
  const source = `// data-zao-slot="comment"
    const selector = '[data-zao-slot="selector"]';
    const known = <div data-zao-slot="face" />;
    const unknown = <div data-zao-slot="unlisted-fixture" />;`;
  const hooks = sourceHooks(source);
  expect(hooks.map((hook) => hook.value)).toEqual(['face', 'unlisted-fixture']);
  expect(hooks.filter((hook) => !listed.has(hook.value)).map((hook) => hook.value)).toEqual([
    'unlisted-fixture',
  ]);
  expect(() => sourceHooks('const part = <div data-zao-slot={name} />;')).toThrow(
    'static authored hook',
  );
  expect(() => sourceHooks('const props = { "data-zao-slot": name };')).toThrow(
    'static authored hook',
  );
});

for (const mode of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 480, height: 900 },
  ]) {
    test(`${mode}, ${viewport.width}px: Parts source tables remain readable and keyboard reachable`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/foundations/parts');
      await expect(page.getByRole('heading', { name: 'Parts', level: 1 })).toBeVisible();
      await page
        .getByRole('radiogroup', { name: 'Mode' })
        .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
        .click();
      const inventory = page.locator('[data-parts-inventory]');
      const tables = inventory.getByRole('table');
      await expect(tables).toHaveCount(3);
      await expect(tables.nth(0).locator('tbody tr')).toHaveCount(17);
      await expect(tables.nth(1).locator('tbody tr')).toHaveCount(84);
      await expect(
        inventory.getByRole('heading', { name: 'Construction concepts and DOM paint' }),
      ).toBeVisible();
      const region = inventory.getByRole('region').nth(1);
      await page.keyboard.press('Tab');
      await region.focus();
      await expect(region).toBeFocused();
      const outline = await region.evaluate((node) => {
        const css = getComputedStyle(node);
        return { style: css.outlineStyle, width: parseFloat(css.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThan(0);
      await page.keyboard.press('Tab');
      await expect(inventory.getByRole('region').nth(2)).toBeFocused();
      for (const direction of ['ltr', 'rtl']) {
        await page.evaluate((dir) => {
          document.documentElement.dir = dir;
        }, direction);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
        for (const table of await tables.all()) {
          await expect(table.locator('th').first()).toHaveAttribute('scope', 'col');
        }
      }
      const result = await new AxeBuilder({ page }).include('[data-parts-inventory]').analyze();
      expect(result.violations).toEqual([]);
      if (viewport.width < 768) {
        await page.locator('summary').click();
      }
      await expect(page.getByRole('link', { name: 'Parts', exact: true })).toHaveAttribute(
        'href',
        '/foundations/parts',
      );
    });
  }
}
