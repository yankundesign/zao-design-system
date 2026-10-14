import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { FrameLocator, Locator, Page } from '@playwright/test';
import { anatomyChannel, anatomyDefaults, anatomyKinds } from '../lib/anatomy';
import type {
  AnatomyConfiguration,
  AnatomyKind,
  AnatomyPoint,
  AnatomyRect,
  AnatomyScene,
} from '../lib/anatomy';

const modes = ['light', 'dark'] as const;
type Mode = (typeof modes)[number];
const viewports = [
  { width: 1440, height: 1000 },
  { width: 480, height: 1000 },
] as const;

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page), 'parent and source runtime errors').toEqual([]);
});

async function actualStudy(page: Page) {
  const css = await readFile(
    new URL('../../../explorations/su-studies/quiet-instrument/style.css', import.meta.url),
    'utf8',
  );
  await page.route('**/api/style-studies/quiet-instrument/css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css }),
  );
}

async function modeSwitch(page: Page, mode: Mode) {
  await page
    .getByRole('radiogroup', { name: 'Mode' })
    .getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
    .click();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
}

function sourceFrame(figure: Locator, kind: AnatomyKind): FrameLocator {
  return figure.locator(`iframe[data-anatomy-source="${kind}"]`).contentFrame();
}

async function colorPixels(source: FrameLocator, colors: string[]) {
  return source.locator('[data-anatomy-native]').evaluate((_, values) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    return values.map((value) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    });
  }, colors);
}

async function scene(figure: Locator): Promise<AnatomyScene> {
  return JSON.parse(
    (await figure.locator('script[type="application/json"][data-anatomy-scene]').textContent())!,
  ) as AnatomyScene;
}

async function openFigure(page: Page, kind: AnatomyKind, mode: Mode) {
  await actualStudy(page);
  await page.goto(`/components/${kind}?style=quiet-instrument`);
  await modeSwitch(page, mode);
  const figure = page.locator(`[data-anatomy-kind="${kind}"]`);
  await expect(figure).toHaveAttribute('data-anatomy-ready', 'true');
  await expect(figure).toHaveAttribute('data-zao-mode', mode);
  await expect
    .poll(() => sourceFrame(figure, kind).locator('html').getAttribute('data-zao-mode'))
    .toBe(mode);
  // Mode changes can leave the previous scene visible while the source settles.
  await expect
    .poll(async () => {
      const measured = await scene(figure);
      const actual = await physicalSource(sourceFrame(figure, kind), kind);
      const paints = measured.source.paint as typeof actual.paint;
      return Object.entries(paints).every(([name, paint]) =>
        (['fill', 'ink', 'border', 'radius'] as const).every(
          (property) => paint[property] === actual.paint[name]?.[property],
        ),
      );
    })
    .toBe(true);
  return figure;
}

async function nativeBox(source: FrameLocator) {
  return source.locator('[data-anatomy-native]').evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  });
}

async function physicalSource(source: FrameLocator, kind: AnatomyKind) {
  return source.locator('[data-anatomy-native]').evaluate((node, component) => {
    const native = node.getBoundingClientRect();
    const owner = node.closest(`[data-zao-component="${component}"]`) ?? node;
    const required = (selector: string) => {
      const part = owner.querySelector(selector);
      if (!part) throw new Error(`Missing real ${component} source part: ${selector}`);
      return part;
    };
    const rows: Record<string, { node: Element; pseudo?: string }> = { native: { node } };
    if (component === 'button') {
      rows.button = { node };
      rows.face = { node: required('[data-zao-slot="face"]') };
      rows.side = { node: required('[data-zao-slot="side"]') };
    } else if (component === 'card') rows.card = { node };
    else if (component === 'menu') {
      rows['trigger-button'] = { node };
      rows['trigger-face'] = { node: node.querySelector('[data-zao-slot="face"]')! };
      rows['trigger-side'] = { node: node.querySelector('[data-zao-slot="side"]')! };
      rows.popup = { node: required('[data-zao-slot="popup"]') };
      rows.items = { node: required('[data-zao-slot="items"]') };
      rows['reveal-edge'] = { node: required('[data-zao-slot="reveal-edge"]'), pseudo: '::after' };
      owner.querySelectorAll('[data-zao-slot="separator"]').forEach((separator, index) => {
        rows[`separator-${index}`] = { node: separator };
      });
    } else if (component === 'switch') {
      rows.housing = { node };
      rows.thumb = { node: required('[data-zao-slot="thumb"]') };
      rows.face = { node: required('[data-zao-slot="face"]') };
    } else if (component === 'tabs') {
      rows.list = { node };
      rows.indicator = { node: required('[data-zao-slot="indicator"]') };
      node.querySelectorAll('[data-zao-slot="tab"]').forEach((tab, index) => {
        rows[`tab-${index}`] = { node: tab };
      });
    } else if (component === 'text-field') {
      rows.control = { node };
      rows.label = { node: required('[data-zao-slot="label"]') };
    } else {
      rows.track = { node };
      rows.frame = { node, pseudo: '::before' };
      rows.indicator = { node: required('[data-zao-slot="indicator"]') };
      rows['end-edge'] = { node: rows.indicator.node, pseudo: '::after' };
      rows.header = { node: required('[data-zao-slot="header"]') };
    }
    const rects: Record<string, AnatomyRect> = {};
    const paint: Record<
      string,
      {
        fill: string;
        ink: string;
        border: string;
        radius: number;
        shadow: string;
        borders: { left: number; top: number; right: number; bottom: number };
      }
    > = {};
    for (const [name, part] of Object.entries(rows)) {
      const box = part.node.getBoundingClientRect();
      const css = getComputedStyle(part.node, part.pseudo);
      rects[name] = {
        x: box.x - native.x,
        y: box.y - native.y,
        width: box.width,
        height: box.height,
      };
      paint[name] = {
        fill: css.backgroundColor,
        ink: css.color,
        border: css.borderTopColor,
        radius: parseFloat(css.borderTopLeftRadius) || 0,
        shadow: css.boxShadow,
        borders: {
          left: parseFloat(css.borderLeftWidth) || 0,
          top: parseFloat(css.borderTopWidth) || 0,
          right: parseFloat(css.borderRightWidth) || 0,
          bottom: parseFloat(css.borderBottomWidth) || 0,
        },
      };
    }
    // Banded side planes (finish plan V2): each host's rest depth and resolved band tones.
    const hosts: Record<string, Element> =
      component === 'button'
        ? { side: node }
        : component === 'menu'
          ? { 'trigger-side': node, 'popup-side': rows.popup!.node }
          : component === 'card'
            ? { 'card-side': node }
            : component === 'switch'
              ? { 'thumb-side': rows.thumb!.node }
              : component === 'tabs'
                ? { 'selected-side': rows.indicator!.node }
                : {};
    const planes: Record<
      string,
      { rest: number; xNear: string; xFar: string; yNear: string; yFar: string }
    > = {};
    for (const [id, host] of Object.entries(hosts)) {
      const css = getComputedStyle(host);
      const probe = (declarations: Partial<CSSStyleDeclaration>) => {
        const span = document.createElement('span');
        Object.assign(span.style, {
          position: 'absolute',
          visibility: 'hidden',
          display: 'block',
          blockSize: '0',
          padding: '0',
          margin: '0',
          border: '0',
          colorScheme: css.colorScheme,
          ...declarations,
        });
        (host.parentElement ?? document.body).append(span);
        const result = {
          width: span.getBoundingClientRect().width,
          color: getComputedStyle(span).color,
        };
        span.remove();
        return result;
      };
      const tone = (name: string) => probe({ color: css.getPropertyValue(name).trim() }).color;
      planes[id] = {
        rest: probe({ width: css.getPropertyValue('--zao-plane-rest').trim() || '0px' }).width,
        xNear: tone('--zao-plane-x-near'),
        xFar: tone('--zao-plane-x-far'),
        yNear: tone('--zao-plane-y-near'),
        yFar: tone('--zao-plane-y-far'),
      };
    }
    return {
      rects,
      paint,
      planes,
      popupSide: rows.popup?.node.getAttribute('data-side'),
      progress: owner.getAttribute('aria-valuenow')
        ? {
            now: Number(owner.getAttribute('aria-valuenow')),
            min: Number(owner.getAttribute('aria-valuemin')),
            max: Number(owner.getAttribute('aria-valuemax')),
          }
        : null,
    };
  }, kind);
}

function closeRect(actual: AnatomyRect, expected: AnatomyRect) {
  for (const property of ['x', 'y', 'width', 'height'] as const) {
    expect(actual[property], property).toBeCloseTo(expected[property], 4);
  }
}

async function assertPhysicalGeometry(figure: Locator, measured: AnatomyScene) {
  const physical = await physicalSource(sourceFrame(figure, measured.kind), measured.kind);
  const actualReadings = await sourceFrame(figure, measured.kind)
    .locator('[data-anatomy-native]')
    .evaluate((node) => {
      const root = node.closest('[data-anatomy-source]')!;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const output: {
        text: string;
        fill: string;
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        direction: string;
      }[] = [];
      const add = (element: Element, text: string) => {
        const css = getComputedStyle(element);
        if (
          !text.trim() ||
          element.namespaceURI !== 'http://www.w3.org/1999/xhtml' ||
          css.display === 'none' ||
          css.visibility === 'hidden'
        )
          return;
        output.push({
          text: text.replace(/\s+/g, ' ').trim(),
          fill: css.color,
          fontFamily: css.fontFamily,
          fontSize: css.fontSize,
          fontWeight: css.fontWeight,
          direction: css.direction,
        });
      };
      let text: Node | null;
      while ((text = walker.nextNode()))
        if (text.parentElement) add(text.parentElement, text.textContent ?? '');
      for (const input of root.querySelectorAll<HTMLInputElement>('input')) add(input, input.value);
      return output;
    });
  for (const reading of measured.readings) {
    const sameText = actualReadings.filter((actual) =>
      actual.text.includes(reading.text.replace(/\s+/g, ' ').trim()),
    );
    const pixels = await colorPixels(sourceFrame(figure, measured.kind), [
      reading.fill,
      ...sameText.map((actual) => actual.fill),
    ]);
    const [expectedFill, ...actualFills] = pixels;
    const match = sameText.find((actual, index) => {
      const fillMatches = expectedFill!.every(
        (channel, i) => Math.abs(channel! - actualFills[index]![i]!) <= 1,
      );
      return (
        fillMatches &&
        (['fontFamily', 'fontSize', 'fontWeight', 'direction'] as const).every(
          (key) => actual[key] === reading[key],
        )
      );
    });
    expect(match, `actual source text/value, color and typography: ${reading.text}`).toBeDefined();
  }
  const raw = measured.source.rects as Record<string, AnatomyRect>;
  const paint = measured.source.paint as Record<
    string,
    { fill: string; ink: string; border: string; radius: number }
  >;
  expect(Object.keys(raw).sort()).toEqual(Object.keys(physical.rects).sort());
  for (const [name, rectangle] of Object.entries(raw)) {
    closeRect(rectangle, physical.rects[name]!);
    if (paint[name]) {
      for (const property of ['fill', 'ink', 'border', 'radius'] as const) {
        expect(paint[name]![property], `${name} ${property}`).toBe(physical.paint[name]![property]);
      }
    }
  }
  expect(measured.source.parameters).toEqual(anatomyDefaults);
  expect(measured.source.geometry).toEqual(raw);
  const offset = {
    x: measured.tokens.axis.x * measured.tokens.contact * 17,
    y: measured.tokens.axis.y * measured.tokens.contact * 17,
  };
  const shifted = (rectangle: AnatomyRect, move: AnatomyPoint): AnatomyRect => ({
    ...rectangle,
    x: rectangle.x + move.x,
    y: rectangle.y + move.y,
  });
  const shape = (id: string) => {
    const drawing = measured.shapes.find((item) => item.id === id);
    expect(drawing, id).toBeDefined();
    if (!drawing || drawing.type !== 'rect') throw new Error(`Expected a real rectangle: ${id}`);
    return drawing;
  };
  const plane = (id: string, sourceName: string, move: AnatomyPoint) => {
    const drawing = shape(id);
    closeRect(drawing, shifted(physical.rects[sourceName]!, move));
    expect(drawing.fill).toBe(physical.paint[sourceName]!.fill);
    return drawing;
  };
  const { axis } = measured.tokens;
  /** Two banded planes from the drawn face back to the base, a rest depth behind the box. */
  const expectPlanes = (id: string, owner: string, box: AnatomyRect, face: AnatomyRect) => {
    const tones = physical.planes[id]!;
    expect(tones, id).toBeDefined();
    const base = shifted(box, { x: -axis.x * tones.rest, y: -axis.y * tones.rest });
    const across = (r: AnatomyRect) => (axis.x >= 0 ? r.x : r.x + r.width);
    const along = (r: AnatomyRect) => (axis.y <= 0 ? r.y + r.height : r.y);
    const middle = (a: AnatomyPoint, b: AnatomyPoint) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });
    const bands = (front: AnatomyPoint[], back: AnatomyPoint[]) => {
      const joint = [middle(front[0]!, back[0]!), middle(front[1]!, back[1]!)];
      return {
        far: [joint[0]!, joint[1]!, back[1]!, back[0]!],
        near: [front[0]!, front[1]!, joint[1]!, joint[0]!],
      };
    };
    const x = bands(
      [
        { x: across(face), y: face.y },
        { x: across(face), y: face.y + face.height },
      ],
      [
        { x: across(base), y: base.y },
        { x: across(base), y: base.y + base.height },
      ],
    );
    const y = bands(
      [
        { x: face.x, y: along(face) },
        { x: face.x + face.width, y: along(face) },
      ],
      [
        { x: base.x, y: along(base) },
        { x: base.x + base.width, y: along(base) },
      ],
    );
    for (const [suffix, points, fill] of [
      ['x-far', x.far, tones.xFar],
      ['y-far', y.far, tones.yFar],
      ['x-near', x.near, tones.xNear],
      ['y-near', y.near, tones.yNear],
    ] as const) {
      const drawing = measured.shapes.find((item) => item.id === `${id}-${suffix}`);
      expect(drawing, `${id}-${suffix}`).toBeDefined();
      if (!drawing || drawing.type !== 'polygon') throw new Error(`Expected a plane: ${id}`);
      expect(drawing.part).toBe(owner);
      expect(drawing.fill).toBe(fill);
      expect(drawing.points).toHaveLength(4);
      for (const [index, point] of drawing.points.entries()) {
        expect(point.x, `${id}-${suffix} x${index}`).toBeCloseTo(points[index]!.x, 4);
        expect(point.y, `${id}-${suffix} y${index}`).toBeCloseTo(points[index]!.y, 4);
      }
    }
    return { base, rest: tones.rest };
  };
  const contacts = measured.source.insetContacts as
    | Record<
        string,
        {
          inner: AnatomyRect;
          sourceShadow: string;
          bands: { geometry: AnatomyRect; fill: string; shadow: string }[];
        }
      >
    | undefined;
  const contactOwners = {
    'housing-inset-contact': { source: 'housing', move: { x: 0, y: 0 } },
    'track-inset-contact': { source: 'list', move: { x: 0, y: 0 } },
    'frame-inset-contact': { source: 'frame', move: { x: 0, y: 0 } },
    'indicator-inset-contact': { source: 'indicator', move: { x: 0, y: offset.y } },
  };
  for (const [id, contact] of Object.entries(contacts ?? {})) {
    const owner = contactOwners[id as keyof typeof contactOwners];
    expect(owner, id).toBeDefined();
    const css = physical.paint[owner.source]!;
    const bounds = physical.rects[owner.source]!;
    const inner = {
      x: bounds.x + css.borders.left,
      y: bounds.y + css.borders.top,
      width: Math.max(0, bounds.width - css.borders.left - css.borders.right),
      height: Math.max(0, bounds.height - css.borders.top - css.borders.bottom),
    };
    closeRect(contact.inner, inner);
    expect(contact.sourceShadow).toBe(css.shadow);
    const expected: { geometry: AnatomyRect; fill: string }[] = [];
    for (const shadow of css.shadow.split(/,(?![^()]*\))/)) {
      if (!shadow.includes('inset')) continue;
      const [x = 0, y = 0, blur = 0, spread = 0] = [...shadow.matchAll(/(-?[\d.]+)px/g)].map(
        (match) => Number(match[1]),
      );
      if (blur || spread) continue;
      const fill =
        shadow.match(/(?:rgba?|color|oklch|oklab|hsl|lab|lch)\([^)]*\)/)?.[0] ?? 'transparent';
      if (y) {
        const height = Math.min(inner.height, Math.abs(y));
        expected.push({
          geometry: {
            x: inner.x,
            y: y > 0 ? inner.y : inner.y + inner.height - height,
            width: inner.width,
            height,
          },
          fill,
        });
      }
      if (x) {
        const width = Math.min(inner.width, Math.abs(x));
        expected.push({
          geometry: {
            x: x > 0 ? inner.x : inner.x + inner.width - width,
            y: inner.y,
            width,
            height: inner.height,
          },
          fill,
        });
      }
    }
    expect(contact.bands).toHaveLength(expected.length);
    for (const [index, band] of expected.entries()) {
      closeRect(contact.bands[index]!.geometry, band.geometry);
      expect(contact.bands[index]!.fill).toBe(band.fill);
      closeRect(shape(`${id}-${index}`), shifted(band.geometry, owner.move));
      expect(shape(`${id}-${index}`).fill).toBe(band.fill);
    }
  }
  if (measured.kind === 'button' || measured.kind === 'menu') {
    const prefix = measured.kind === 'menu' ? 'trigger-' : '';
    const front = plane(`${prefix}face`, `${prefix}face`, offset);
    const { base, rest } = expectPlanes(
      `${prefix}side`,
      prefix ? 'trigger' : 'side',
      physical.rects[`${prefix}button`]!,
      front,
    );
    // The base is an outline where the planes end; nothing paints it on its own.
    const outline = shape(`${prefix}base`);
    closeRect(outline, base);
    expect(outline.fill).toBe('transparent');
    expect(front.radius).toBe(0);
    expect(front.x - base.x).toBeCloseTo(axis.x * (measured.tokens.contact * 17 + rest), 4);
    expect(front.y - base.y).toBeCloseTo(axis.y * (measured.tokens.contact * 17 + rest), 4);
    if (measured.kind === 'menu') {
      const popupFront = plane('popup-frame', 'popup', offset);
      expectPlanes('popup-side', 'contact-edge', physical.rects.popup!, popupFront);
      const placement = measured.source.placement as {
        side: string;
        joint: { from: AnatomyPoint; to: AnatomyPoint; gap: number };
      };
      expect(placement.side).toBe(physical.popupSide);
      const popup = physical.rects.popup!;
      const trigger = physical.rects.native!;
      const axis = placement.side === 'left' || placement.side === 'right' ? 'x' : 'y';
      const dimension = axis === 'x' ? 'width' : 'height';
      const before = placement.side === 'left' || placement.side === 'top';
      expect(placement.joint.from[axis]).toBe(trigger[axis] + (before ? 0 : trigger[dimension]));
      expect(placement.joint.to[axis]).toBe(popup[axis] + (before ? popup[dimension] : 0));
      expect(placement.joint.gap).toBe(
        Math.abs(placement.joint.from[axis] - placement.joint.to[axis]),
      );
      expect(measured.parts.some((part) => part.id === 'joint')).toBe(true);
      const joint = measured.shapes.filter((item) => item.part === 'joint');
      expect(joint).toHaveLength(1);
      expect(joint[0]!.type).toBe('line');
      if (joint[0]!.type !== 'line') throw new Error('The Menu joint is a placement reference');
      expect(joint[0]!.from).toEqual({
        x: placement.joint.from.x + offset.x,
        y: placement.joint.from.y + offset.y,
      });
      expect(joint[0]!.to).toEqual({
        x: placement.joint.to.x + offset.x,
        y: placement.joint.to.y + offset.y,
      });
      expect(joint[0]!.dashed).toBe(true);
      const paths = await sourceFrame(figure, 'menu')
        .locator('[data-anatomy-native] svg path')
        .evaluateAll((nodes) => {
          const origin = document.querySelector('[data-anatomy-native]')!.getBoundingClientRect();
          return nodes.map((node) => {
            const path = node as SVGPathElement;
            const matrix = path.getScreenCTM()!;
            const css = getComputedStyle(path);
            const bounds = path.getBoundingClientRect();
            return {
              d: path.getAttribute('d'),
              matrix: [
                matrix.a,
                matrix.b,
                matrix.c,
                matrix.d,
                matrix.e - origin.x,
                matrix.f - origin.y,
              ],
              bounds: {
                x: bounds.x - origin.x,
                y: bounds.y - origin.y,
                width: bounds.width,
                height: bounds.height,
              },
              fill: css.fill,
              stroke: css.stroke,
              strokeWidth: parseFloat(css.strokeWidth) * Math.hypot(matrix.a, matrix.b),
            };
          });
        });
      const drawn = measured.shapes.filter((item) => item.type === 'path');
      expect(drawn).toHaveLength(paths.length);
      expect(drawn.length).toBeGreaterThan(0);
      for (const [index, path] of paths.entries()) {
        const drawing = drawn[index]!;
        expect(drawing.d).toBe(path.d);
        const matrix = [...path.matrix];
        matrix[4]! += offset.x;
        matrix[5]! += offset.y;
        expect(drawing.transform).toBe(`matrix(${matrix.join(' ')})`);
        closeRect(drawing.bounds, shifted(path.bounds, offset));
        expect(drawing.fill).toBe(path.fill);
        expect(drawing.stroke).toBe(path.stroke);
        expect(drawing.strokeWidth).toBe(measured.tokens.hairline);
        const original = (
          measured.source.triggerPaths as { sourceStrokeWidth: number; scale: number }[]
        )[index]!;
        expect(original.sourceStrokeWidth * original.scale).toBeCloseTo(path.strokeWidth, 5);
      }
    }
  } else if (measured.kind === 'card') {
    const front = plane('content-plane', 'card', offset);
    expectPlanes('card-side', 'contact-edge', physical.rects.card!, front);
    expect(measured.shapes.some((item) => item.part === 'base')).toBe(false);
  } else if (measured.kind === 'switch') {
    plane('housing', 'housing', { x: 0, y: 0 });
    // The face seats along the depth axis, so the drawing separates it along that axis.
    const front = plane('switch-face', 'face', offset);
    const thumb = physical.rects.thumb!;
    expectPlanes('thumb-side', 'thumb', thumb, front);
    const topology = measured.source.thumbTopology as { face: AnatomyRect; thumb: AnatomyRect };
    closeRect(topology.face, front);
    expect(topology.thumb).toEqual(thumb);
  } else if (measured.kind === 'tabs') {
    plane('tabs-track', 'list', { x: 0, y: 0 });
    const face = plane('selection-face', 'indicator', offset);
    expectPlanes('selected-side', 'contact-edge', physical.rects.indicator!, face);
  } else if (measured.kind === 'text-field') {
    plane('field-control', 'control', offset);
    expect(measured.shapes.some((item) => item.part === 'base')).toBe(false);
  } else {
    plane('progress-track', 'track', { x: 0, y: 0 });
    const quantitative = plane('quantitative-face', 'indicator', { x: 0, y: offset.y });
    const actual = physical.progress!;
    const ratio = (actual.now - actual.min) / (actual.max - actual.min);
    expect(quantitative.width / physical.rects.track!.width).toBeCloseTo(ratio, 3);
    expect(measured.source.ratio).toBeCloseTo(ratio, 3);
    const edge = shape('quantitative-end-edge');
    expect(edge.x).toBeGreaterThanOrEqual(quantitative.x);
    expect(edge.x + edge.width).toBeLessThanOrEqual(quantitative.x + quantitative.width);
    expect(edge.y).toBe(quantitative.y);
    expect(edge.height).toBe(quantitative.height);
  }
}

async function parentState(page: Page) {
  return page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      scroll: { x: scrollX, y: scrollY },
      body: { overflow: body.overflow, position: body.position, top: body.top },
      html: { overflow: html.overflow, direction: html.direction },
      mode: document.documentElement.dataset.zaoMode,
      storedMode: localStorage.getItem('zao-mode'),
      inert: document.body.inert,
      hidden: document.body.getAttribute('aria-hidden'),
    };
  });
}

async function assertRenderedScene(figure: Locator, measured: AnatomyScene) {
  const svg = figure.locator('svg[data-anatomy-drawing]');
  const reference = svg.locator('[data-anatomy-shape="native-reference"]');
  for (const [attribute, value] of Object.entries(measured.native)) {
    expect(Number(await reference.getAttribute(attribute))).toBeCloseTo(value, 4);
  }
  await expect(reference).toHaveAttribute('fill', 'none');
  await expect(reference).toHaveAttribute(
    'stroke-dasharray',
    `${measured.tokens.fen} ${measured.tokens.fen}`,
  );
  await expect(reference).toHaveAttribute('vector-effect', 'non-scaling-stroke');
  expect(Number(await reference.getAttribute('stroke-width'))).toBe(measured.tokens.hairline);
  await expect(svg.locator('[data-anatomy-shape]')).toHaveCount(measured.shapes.length + 1);
  for (const shape of measured.shapes) {
    const painted = svg.locator(`[data-anatomy-shape="${shape.id}"]`);
    await expect(painted).toHaveAttribute('data-anatomy-part', shape.part);
    await expect(painted).toHaveAttribute('fill', shape.fill);
    await expect(painted).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    if (shape.stroke !== undefined) await expect(painted).toHaveAttribute('stroke', shape.stroke);
    if (shape.strokeWidth !== undefined) {
      expect(Number(await painted.getAttribute('stroke-width'))).toBeCloseTo(shape.strokeWidth, 5);
    }
    if (shape.type === 'rect') {
      for (const attribute of ['x', 'y', 'width', 'height'] as const) {
        expect(Number(await painted.getAttribute(attribute))).toBeCloseTo(shape[attribute], 4);
      }
      expect(Number(await painted.getAttribute('rx'))).toBe(shape.radius ?? 0);
    } else if (shape.type === 'polygon') {
      const points = (await painted.getAttribute('points'))!
        .trim()
        .split(/\s+/)
        .map((point) => point.split(',').map(Number));
      expect(points).toHaveLength(shape.points.length);
      shape.points.forEach((point, index) => {
        expect(points[index]![0]).toBeCloseTo(point.x, 4);
        expect(points[index]![1]).toBeCloseTo(point.y, 4);
      });
    } else if (shape.type === 'path') {
      await expect(painted).toHaveAttribute('d', shape.d);
      await expect(painted).toHaveAttribute('transform', shape.transform);
    } else {
      for (const [attribute, value] of Object.entries({
        x1: shape.from.x,
        y1: shape.from.y,
        x2: shape.to.x,
        y2: shape.to.y,
      })) {
        expect(Number(await painted.getAttribute(attribute))).toBeCloseTo(value, 4);
      }
    }
    if (shape.dashed) {
      await expect(painted).toHaveAttribute(
        'stroke-dasharray',
        `${measured.tokens.fen} ${measured.tokens.fen}`,
      );
    } else expect(await painted.getAttribute('stroke-dasharray')).toBeNull();
  }
  if (measured.kind === 'tabs') {
    const face = measured.shapes.find((shape) => shape.id === 'selection-face');
    if (!face || face.type !== 'rect')
      throw new Error('Tabs must retain its measured selection face');
    const painted = svg.locator('[data-anatomy-shape="selection-face"]');
    const clip = await painted.getAttribute('clip-path');
    expect(clip).toMatch(/^url\(#.+\)$/);
    const clipId = clip!.slice(5, -1);
    const cuts = svg.locator(`clipPath[id="${clipId}"] > path`);
    await expect(cuts).toHaveCount(1);
    await expect(cuts).toHaveAttribute('clip-rule', 'evenodd');
    const bounds = measured.source.bounds as AnatomyRect;
    const margin = measured.tokens.fen * 4;
    const expectedCuts = [
      `M ${bounds.x - margin} ${bounds.y - margin} H ${bounds.x + bounds.width + margin} V ${bounds.y + bounds.height + margin} H ${bounds.x - margin} Z`,
      ...measured.readings.map((reading) => {
        const left = reading.x - measured.tokens.fen;
        const right = reading.x + reading.width + measured.tokens.fen;
        const top = reading.y - reading.height - measured.tokens.fen;
        const bottom = reading.y + measured.tokens.fen;
        return `M ${left},${top} L ${right},${top} L ${right},${bottom} L ${left},${bottom} Z`;
      }),
    ].join(' ');
    await expect(cuts).toHaveAttribute('d', expectedCuts);
    const fill = svg.locator('[data-anatomy-fill="selection-face"]');
    await expect(fill).toHaveCount(1);
    for (const attribute of ['x', 'y', 'width', 'height'] as const) {
      expect(Number(await fill.getAttribute(attribute))).toBeCloseTo(face[attribute], 4);
    }
    expect(Number(await fill.getAttribute('rx'))).toBe(face.radius ?? 0);
    await expect(fill).toHaveAttribute('fill', face.fill);
    expect(await fill.getAttribute('stroke')).toBeNull();
    expect(await fill.getAttribute('stroke-width')).toBeNull();
    expect(await fill.getAttribute('clip-path')).toBeNull();
    await expect(fill).toHaveCSS('stroke', 'none');
  }
  for (const reading of measured.readings) {
    const label = svg.locator(`[data-anatomy-reading="${reading.id}"]`);
    await expect(label).toHaveText(reading.text);
    await expect(label).toHaveAttribute('data-anatomy-part', reading.part);
    const renderedFill = await label.getAttribute('fill');
    expect(renderedFill).not.toBeNull();
    const [expectedFill, actualFill] = await colorPixels(sourceFrame(figure, measured.kind), [
      reading.fill,
      renderedFill!,
    ]);
    expect(
      expectedFill!.every((channel, index) => Math.abs(channel! - actualFill![index]!) <= 1),
    ).toBe(true);
    await expect(label).toHaveAttribute('direction', reading.direction);
    expect(Number(await label.getAttribute('x'))).toBeCloseTo(reading.x, 4);
    expect(Number(await label.getAttribute('y'))).toBeCloseTo(reading.y, 4);
  }
  const bounds = await svg.evaluate((node) => {
    const outer = node.getBoundingClientRect();
    const inner = [...node.querySelectorAll('[data-anatomy-shape], text')].map((part) => {
      const box = part.getBoundingClientRect();
      return {
        name: part.getAttribute('data-anatomy-shape') ?? part.textContent,
        inside:
          box.left >= outer.left - 0.5 &&
          box.right <= outer.right + 0.5 &&
          box.top >= outer.top - 0.5 &&
          box.bottom <= outer.bottom + 0.5,
      };
    });
    const caption = node.closest('figure')!.querySelector('figcaption')!.getBoundingClientRect();
    return { inner, beforeCaption: outer.bottom <= caption.top + 0.5 };
  });
  expect(bounds.inner.filter((part) => !part.inside)).toEqual([]);
  expect(bounds.beforeCaption).toBe(true);
}

async function assertAlternative(figure: Locator, measured: AnatomyScene) {
  const drawing = figure.getByRole('img', { name: new RegExp(`${measured.title} anatomy`) });
  await expect(drawing).toHaveCount(1);
  await expect(drawing).toHaveAttribute('aria-labelledby', /\S+ \S+/);
  const alternatives = await drawing.evaluate((node) =>
    node
      .getAttribute('aria-labelledby')!
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent),
  );
  expect(alternatives[0]).toBe(`${measured.title} anatomy`);
  expect(alternatives[1]).toContain(measured.description);
  expect(alternatives[1]).toContain('stationary native reference');
  const parts = figure.locator('ol[data-anatomy-parts] > li');
  await expect(parts).toHaveCount(measured.parts.length);
  for (const [index, part] of measured.parts.entries()) {
    await expect(parts.nth(index)).toContainText(part.name);
    await expect(parts.nth(index)).toContainText(part.description);
  }
  const iframe = figure.locator('iframe[data-anatomy-source]');
  await expect(iframe).toHaveAttribute('aria-hidden', 'true');
  await expect(iframe).toHaveAttribute('inert', '');
  await expect(iframe).toHaveAttribute('tabindex', '-1');
  await expect(iframe).toHaveCSS('visibility', 'hidden');
  await expect(iframe).toHaveCSS('pointer-events', 'none');
  await expect(iframe).toHaveCSS('position', 'absolute');
  expect(
    await sourceFrame(figure, measured.kind)
      .locator('body')
      .evaluate((node) => (node as HTMLElement).inert),
  ).toBe(true);
}

async function assertDepthChange(page: Page, figure: Locator, before: AnatomyScene) {
  const source = sourceFrame(figure, before.kind);
  const native = await nativeBox(source);
  const parentBefore = await parentState(page);
  const next = { contact: before.tokens.contact * 3, lift: before.tokens.lift * 3 };
  await figure.evaluate((node, values) => {
    node.style.setProperty('--zao-depth-contact', `${values.contact}px`);
    node.style.setProperty('--zao-depth-lift', `${values.lift}px`);
  }, next);
  await expect.poll(async () => (await scene(figure)).tokens.contact).toBe(next.contact);
  await expect.poll(async () => (await scene(figure)).tokens.lift).toBe(next.lift);
  const changed = await scene(figure);
  expect(changed.shapes).not.toEqual(before.shapes);
  expect(changed.readings.map((reading) => reading.id)).toEqual(
    before.readings.map((reading) => reading.id),
  );
  const distance =
    (next.contact - before.tokens.contact) * (anatomyDefaults.explodeContactMultiplier - 1);
  const stationary = before.kind === 'tabs' || before.kind === 'switch';
  for (const [index, reading] of before.readings.entries()) {
    const moved = changed.readings[index]!;
    expect(moved.text).toBe(reading.text);
    expect(moved.x - reading.x).toBeCloseTo(
      stationary || before.kind === 'progress' ? 0 : before.tokens.axis.x * distance,
      4,
    );
    expect(moved.y - reading.y).toBeCloseTo(stationary ? 0 : before.tokens.axis.y * distance, 4);
  }
  expect(changed.tokens.hairline).toBe(before.tokens.hairline);
  expect(changed.native.width).toBe(before.native.width);
  expect(changed.native.height).toBe(before.native.height);
  expect(await nativeBox(source)).toEqual(native);
  expect(await parentState(page)).toEqual(parentBefore);
  await assertPhysicalGeometry(figure, changed);
  await assertRenderedScene(figure, changed);
  await figure.evaluate((node) => {
    node.style.removeProperty('--zao-depth-contact');
    node.style.removeProperty('--zao-depth-lift');
  });
  await expect.poll(async () => (await scene(figure)).tokens.contact).toBe(before.tokens.contact);
  await expect.poll(async () => (await scene(figure)).tokens.lift).toBe(before.tokens.lift);
  expect(await nativeBox(source)).toEqual(native);
}

for (const mode of modes) {
  for (const viewport of viewports) {
    for (const kind of anatomyKinds) {
      test(`Anatomy ${kind}, Su ${mode}, ${viewport.width}px: measured drawing, alternatives and local depth`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        const figure = await openFigure(page, kind, mode);
        const measured = await scene(figure);
        expect(measured.kind).toBe(kind);
        expect(anatomyDefaults).toEqual({
          explodeContactMultiplier: 18,
          projectionAngleDegrees: 0,
          strokeHairlineMultiplier: 1,
        });
        const native = await nativeBox(sourceFrame(figure, kind));
        expect(measured.native.width).toBeCloseTo(native.width, 4);
        expect(measured.native.height).toBeCloseTo(native.height, 4);
        expect(measured.tokens.contact).toBeGreaterThan(0);
        expect(measured.tokens.hairline).toBeGreaterThan(0);
        await assertPhysicalGeometry(figure, measured);
        await assertRenderedScene(figure, measured);
        await assertAlternative(figure, measured);
        expect(
          await figure.evaluate((node) =>
            Boolean(
              node.compareDocumentPosition(document.getElementById('preview-heading')!) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          ),
        ).toBe(true);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
        const { violations, incomplete } = await new AxeBuilder({ page })
          .include(`[data-anatomy-kind="${kind}"]`)
          .analyze();
        await test.info().attach('anatomy-axe', {
          body: JSON.stringify({
            violations: violations.length,
            incomplete: incomplete.map(({ id, nodes }) => ({
              id,
              nodes: nodes.length,
              targets: nodes.map(({ target }) => target),
            })),
          }),
          contentType: 'application/json',
        });
        expect(
          violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
        ).toEqual([]);
        await assertDepthChange(page, figure, measured);
      });
    }
  }
}

for (const mode of modes) {
  for (const kind of anatomyKinds) {
    for (const preference of ['none', 'reduced-motion', 'forced-colors'] as const) {
      test(`Anatomy ${kind}, Su ${mode}, RTL 480px: ${preference}`, async ({ page }) => {
        await page.setViewportSize({ width: 480, height: 1000 });
        await page.emulateMedia({
          reducedMotion: preference === 'reduced-motion' ? 'reduce' : 'no-preference',
          forcedColors: preference === 'forced-colors' ? 'active' : 'none',
        });
        await page.addInitScript(() => {
          const apply = () => {
            if (!document.documentElement) return false;
            document.documentElement.dir = 'rtl';
            return true;
          };
          if (!apply()) {
            const observer = new MutationObserver(() => {
              if (apply()) observer.disconnect();
            });
            observer.observe(document, { childList: true });
          }
        });
        const figure = await openFigure(page, kind, mode);
        await expect.poll(async () => (await scene(figure)).source.direction).toBe('rtl');
        const measured = await scene(figure);
        const source = sourceFrame(figure, kind);
        await expect(source.locator('html')).toHaveAttribute('dir', 'rtl');
        expect(
          await source.locator('body').evaluate(() => ({
            reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
            forced: matchMedia('(forced-colors: active)').matches,
          })),
        ).toEqual({
          reduced: preference === 'reduced-motion',
          forced: preference === 'forced-colors',
        });
        expect(measured.readings.length).toBeGreaterThan(0);
        expect(measured.readings.every((reading) => reading.direction === 'rtl')).toBe(true);
        await assertPhysicalGeometry(figure, measured);
        await assertRenderedScene(figure, measured);
        await assertAlternative(figure, measured);
        expect(
          await figure
            .locator('svg[data-anatomy-drawing]')
            .evaluate((node) => node.getAnimations({ subtree: true }).length),
        ).toBe(0);
        expect(
          await source
            .locator('[data-anatomy-native]')
            .evaluate(
              (node) =>
                node
                  .getAnimations({ subtree: true })
                  .filter((animation) => animation.playState === 'running').length,
            ),
        ).toBe(0);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
      });
    }
  }

  test(`Su ${mode}: isolated Menu measurement preserves parent focus, scroll and native Menu behavior`, async ({
    page,
  }) => {
    await actualStudy(page);
    await page.addInitScript((value) => {
      localStorage.setItem('zao-mode', value);
    }, mode);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/anatomy-source/menu', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/components/menu?style=quiet-instrument', { waitUntil: 'domcontentloaded' });
    await modeSwitch(page, mode);
    const figure = page.locator('[data-anatomy-kind="menu"]');
    await expect(figure).toHaveAttribute('data-anatomy-ready', 'false');
    const specimen = page.locator('[data-zao-specimen="menu"]').first();
    const trigger = specimen.getByRole('button', { name: 'Workspace actions', exact: true });
    await trigger.evaluate((node) => {
      (node as HTMLElement).focus({ preventScroll: true });
    });
    await page.evaluate(() => scrollTo(0, 0));
    await expect(trigger).toBeFocused();
    const before = await parentState(page);
    release();
    await expect(figure).toHaveAttribute('data-anatomy-ready', 'true');
    await expect(trigger).toBeFocused();
    expect(await parentState(page)).toEqual(before);
    await expect(specimen.getByRole('menu')).toHaveCount(0);
    expect(
      await sourceFrame(figure, 'menu')
        .locator('[data-zao-slot="trigger"]')
        .getAttribute('aria-expanded'),
    ).toBe('true');
    await trigger.scrollIntoViewIfNeeded();
    const nativeTarget = await trigger.boundingBox();
    const restingScroll = (await parentState(page)).scroll;
    await page.keyboard.press('Enter');
    const popup = specimen.getByRole('menu');
    await expect(popup).toBeVisible();
    await expect(
      popup.getByRole('menuitem', { name: 'Rename workspace', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(
      popup.getByRole('menuitem', { name: 'Copy workspace ID', exact: true }),
    ).toBeFocused();
    expect(await trigger.boundingBox()).toEqual(nativeTarget);
    expect((await parentState(page)).scroll).toEqual(restingScroll);
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await trigger.boundingBox()).toEqual(nativeTarget);
    expect((await parentState(page)).scroll).toEqual(restingScroll);
    await expect(figure).toHaveAttribute('data-anatomy-ready', 'true');
  });

  test(`Su ${mode}: a real Menu source in its own realm cannot disturb a parent Dialog`, async ({
    page,
  }) => {
    await actualStudy(page);
    await page.goto('/components/dialog?style=quiet-instrument');
    await modeSwitch(page, mode);
    const specimen = page.locator('[data-zao-specimen="dialog"]').first();
    const trigger = specimen.getByRole('button', { name: 'Review access', exact: true });
    await trigger.click();
    const popup = specimen.getByRole('dialog', { name: 'Review workspace access', exact: true });
    await expect(popup).toBeVisible();
    const cancel = popup.getByRole('button', { name: 'Cancel', exact: true });
    const approve = popup.getByRole('button', { name: 'Approve access', exact: true });
    await cancel.focus();
    // The native modal scroll effect can settle after its popup becomes visible.
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    const locked = await parentState(page);
    // Dialog is not an Anatomy kind. This fixture mounts the actual Menu route and
    // protocol in another document while the parent modal is already active.
    await page.evaluate(
      ({ channel, parameters, mode: selected }) => {
        const study = document.querySelector('[data-zao-specimen="dialog"]')!.closest('.study')!;
        const css = getComputedStyle(study);
        const variables: Record<string, string> = {};
        for (const property of css)
          if (property.startsWith('--zao-'))
            variables[property] = css.getPropertyValue(property).trim();
        const configuration: AnatomyConfiguration = {
          kind: 'menu',
          mode: selected,
          direction: css.direction === 'rtl' ? 'rtl' : 'ltr',
          parameters,
          variables,
        };
        const iframe = document.createElement('iframe');
        iframe.dataset.anatomyIsolationFixture = '';
        iframe.title = 'Isolated real Menu measurement fixture';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.inert = true;
        iframe.tabIndex = -1;
        iframe.style.cssText =
          'position:absolute;inset:0 auto auto 0;width:480px;height:640px;visibility:hidden;pointer-events:none;border:0';
        const configure = () =>
          iframe.contentWindow?.postMessage(
            { channel, type: 'configure', configuration },
            location.origin,
          );
        const receive = (event: MessageEvent) => {
          if (
            event.origin !== location.origin ||
            event.source !== iframe.contentWindow ||
            event.data?.channel !== channel
          )
            return;
          if (event.data.type === 'ready') configure();
          if (event.data.type === 'scene') iframe.dataset.anatomyMeasured = 'true';
        };
        window.addEventListener('message', receive);
        iframe.addEventListener('load', configure);
        iframe.addEventListener(
          'anatomy-fixture-remove',
          () => {
            window.removeEventListener('message', receive);
            iframe.remove();
          },
          { once: true },
        );
        iframe.src = '/anatomy-source/menu';
        document.body.append(iframe);
      },
      { channel: anatomyChannel, parameters: anatomyDefaults, mode },
    );
    const iframe = page.locator('iframe[data-anatomy-isolation-fixture]');
    await expect(iframe).toHaveAttribute('data-anatomy-measured', 'true');
    await expect(cancel).toBeFocused();
    expect(await parentState(page)).toEqual(locked);
    const source = iframe.contentFrame();
    expect(await source.locator('body').evaluate((node) => (node as HTMLElement).inert)).toBe(true);
    await expect(source.locator('[data-zao-slot="trigger"]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.keyboard.press('Tab');
    await expect(approve).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(approve).toBeFocused();
    await page.mouse.move(2, 2);
    await page.mouse.wheel(0, 400);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect((await parentState(page)).scroll).toEqual(locked.scroll);
    await iframe.evaluate((node) => node.dispatchEvent(new Event('anatomy-fixture-remove')));
    await expect(popup).toBeVisible();
    await expect(approve).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    // Scroll unlock can reach the compositor after popup cleanup and focus return.
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 400);
        return page.evaluate(() => scrollY);
      })
      .toBeGreaterThan(locked.scroll.y);
  });
}
