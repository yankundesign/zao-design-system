import type {
  AnatomyConfiguration,
  AnatomyPoint,
  AnatomyReading,
  AnatomyRect,
  AnatomyScene,
  AnatomyShape,
} from './anatomy';

const transparent = 'transparent';
const zero = { x: 0, y: 0 };

function required<T extends Element>(root: Element, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Anatomy source is missing ${selector}`);
  return element;
}

function style(element: Element, pseudo?: string): CSSStyleDeclaration {
  const view = element.ownerDocument.defaultView;
  if (!view) throw new Error('Anatomy source has no browsing context');
  return view.getComputedStyle(element, pseudo);
}

function rectangle(element: Element, origin: DOMRect): AnatomyRect {
  const rect = element.getBoundingClientRect();
  return { x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height };
}

function shifted(rect: AnatomyRect, offset: AnatomyPoint): AnatomyRect {
  return { ...rect, x: rect.x + offset.x, y: rect.y + offset.y };
}

function center(rect: AnatomyRect): AnatomyPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Resolve CSS expressions in the real source context without focus or flow changes. */
function probe<T>(
  element: Element,
  declarations: Partial<CSSStyleDeclaration>,
  read: (node: HTMLElement) => T,
  className = '',
): T {
  const document = element.ownerDocument;
  const node = document.createElement('span');
  node.className = className;
  node.setAttribute('aria-hidden', 'true');
  node.inert = true;
  Object.assign(node.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    display: 'block',
    blockSize: '0',
    padding: '0',
    margin: '0',
    border: '0',
    transition: 'none',
    animation: 'none',
    colorScheme: style(element).colorScheme,
    ...declarations,
  });
  // Inputs are replaced elements; their children cannot supply layout measurements.
  (element.parentElement ?? document.body).append(node);
  try {
    return read(node);
  } finally {
    node.remove();
  }
}

function length(element: Element, name: string): number {
  const expression = style(element).getPropertyValue(name).trim();
  return probe(
    element,
    { width: expression || '0px' },
    (node) => node.getBoundingClientRect().width,
  );
}

function color(element: Element, name: string): string {
  const expression = style(element).getPropertyValue(name).trim();
  return expression
    ? probe(element, { color: expression }, (node) => style(node).color)
    : transparent;
}

function shadowColor(shadow: string): string {
  if (shadow === 'none') return transparent;
  return shadow.match(/(?:rgba?|color|oklch|oklab|hsl|lab|lch)\([^)]*\)/)?.[0] ?? transparent;
}

function paint(element: Element, pseudo?: string) {
  const computed = style(element, pseudo);
  return {
    fill: computed.backgroundColor,
    ink: computed.color,
    border: computed.borderTopColor,
    borderWidth: Number.parseFloat(computed.borderTopWidth) || 0,
    radius: Number.parseFloat(computed.borderTopLeftRadius) || 0,
    shadow: computed.boxShadow,
    shadowColor: shadowColor(computed.boxShadow),
    transform: computed.transform,
  };
}

function readings(
  element: Element,
  origin: DOMRect,
  part: string,
  offset = zero,
): AnatomyReading[] {
  const document = element.ownerDocument;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const output: AnatomyReading[] = [];
  let textNode: Node | null;
  while ((textNode = walker.nextNode())) {
    const parent = textNode.parentElement;
    const text = textNode.textContent ?? '';
    if (!parent || !text.trim() || parent.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
    const computed = style(parent);
    if (computed.display === 'none' || computed.visibility === 'hidden') continue;
    const range = document.createRange();
    const lines: { text: string; left: number; right: number; top: number; height: number }[] = [];
    // Character ranges preserve actual wrapping and bidi positions, rather than guessed lines.
    for (let index = 0; index < text.length; index++) {
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      let line = lines.find((candidate) => Math.abs(candidate.top - rect.top) < 0.5);
      if (!line) {
        line = { text: '', left: rect.left, right: rect.right, top: rect.top, height: rect.height };
        lines.push(line);
      }
      line.text += text[index];
      line.left = Math.min(line.left, rect.left);
      line.right = Math.max(line.right, rect.right);
      line.height = Math.max(line.height, rect.height);
    }
    if (context)
      context.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    for (const line of lines) {
      const metrics = context?.measureText(line.text);
      const ascent =
        metrics?.fontBoundingBoxAscent ??
        metrics?.actualBoundingBoxAscent ??
        Number.parseFloat(computed.fontSize);
      const descent = metrics?.fontBoundingBoxDescent ?? metrics?.actualBoundingBoxDescent ?? 0;
      output.push({
        id: `${part}-reading-${output.length}`,
        part,
        text: line.text,
        x: line.left - origin.x + offset.x,
        y: line.top - origin.y + (line.height - ascent - descent) / 2 + ascent + offset.y,
        width: line.right - line.left,
        height: line.height,
        fill: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        direction: computed.direction,
      });
    }
  }
  return output;
}

function inputReading(
  input: HTMLInputElement,
  origin: DOMRect,
  offset: AnatomyPoint,
): AnatomyReading {
  const computed = style(input);
  const rect = input.getBoundingClientRect();
  const context = input.ownerDocument.createElement('canvas').getContext('2d');
  if (context) context.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
  const text = input.value || input.placeholder;
  const metrics = context?.measureText(text);
  const width = metrics?.width ?? 0;
  const ascent =
    metrics?.fontBoundingBoxAscent ??
    metrics?.actualBoundingBoxAscent ??
    Number.parseFloat(computed.fontSize);
  const descent = metrics?.fontBoundingBoxDescent ?? metrics?.actualBoundingBoxDescent ?? 0;
  const leftInset =
    Number.parseFloat(computed.paddingLeft) + Number.parseFloat(computed.borderLeftWidth);
  const rightInset =
    Number.parseFloat(computed.paddingRight) + Number.parseFloat(computed.borderRightWidth);
  return {
    id: 'control-reading',
    part: 'control',
    text,
    x:
      (computed.direction === 'rtl'
        ? rect.right - origin.x - rightInset - width
        : rect.left - origin.x + leftInset) + offset.x,
    y: rect.top - origin.y + (rect.height - ascent - descent) / 2 + ascent + offset.y,
    width,
    height: ascent + descent,
    fill: input.value ? computed.color : style(input, '::placeholder').color,
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    direction: computed.direction,
  };
}

interface MeasuredContext {
  scene: AnatomyScene;
  origin: DOMRect;
  offset: AnatomyPoint;
  rects: Record<string, AnatomyRect>;
  paints: Record<string, ReturnType<typeof paint>>;
}

function context(
  native: Element,
  configuration: AnatomyConfiguration,
  title: string,
  description: string,
): MeasuredContext {
  native.setAttribute('data-anatomy-native', '');
  const origin = native.getBoundingClientRect();
  const computed = style(native);
  const tokens = {
    contact: length(native, '--zao-depth-contact'),
    lift: length(native, '--zao-depth-lift'),
    hairline: length(native, '--zao-stroke-hairline'),
    fen: length(native, '--zao-space-1'),
    annotationLineHeight: probe(
      native,
      {},
      (node) => Number.parseFloat(style(node).lineHeight),
      'type-caption figures-id',
    ),
    axis: {
      x: Number.parseFloat(computed.getPropertyValue('--zao-depth-axis-x')) || 0,
      y: Number.parseFloat(computed.getPropertyValue('--zao-depth-axis-y')) || 0,
    },
  };
  const travel = tokens.contact * (configuration.parameters.explodeContactMultiplier - 1);
  const rects: Record<string, AnatomyRect> = {
    native: { x: 0, y: 0, width: origin.width, height: origin.height },
  };
  const paints: Record<string, ReturnType<typeof paint>> = {};
  return {
    origin,
    offset: { x: tokens.axis.x * travel, y: tokens.axis.y * travel },
    rects,
    paints,
    scene: {
      kind: configuration.kind,
      title,
      description,
      native: rects.native!,
      tokens,
      shapes: [],
      readings: [],
      parts: [],
      source: {
        geometry: rects,
        rects,
        paint: paints,
        parameters: configuration.parameters,
        direction: computed.direction,
      },
    },
  };
}

function capture(m: MeasuredContext, name: string, element: Element, pseudo?: string) {
  m.rects[name] = rectangle(element, m.origin);
  m.paints[name] = paint(element, pseudo);
  return { rect: m.rects[name]!, paint: m.paints[name]! };
}

function rect(
  m: MeasuredContext,
  id: string,
  part: string,
  geometry: AnatomyRect,
  fill: string,
  stroke?: string,
  radius = 0,
) {
  m.scene.shapes.push({
    type: 'rect',
    id,
    part,
    ...geometry,
    fill,
    stroke,
    strokeWidth: stroke ? m.scene.tokens.hairline : undefined,
    radius,
  });
}

function part(
  m: MeasuredContext,
  id: string,
  name: string,
  description: string,
  anchor: AnatomyPoint,
) {
  m.scene.parts.push({ id, name, description, anchor });
}

/** The source uses crisp inset shadows: expose their paint inside the measured border. */
function insetContacts(
  m: MeasuredContext,
  element: Element,
  box: AnatomyRect,
  id: string,
  owner: string,
  offset = zero,
  pseudo?: string,
) {
  const computed = style(element, pseudo);
  const inner = {
    x: box.x + (Number.parseFloat(computed.borderLeftWidth) || 0),
    y: box.y + (Number.parseFloat(computed.borderTopWidth) || 0),
    width: Math.max(
      0,
      box.width -
        (Number.parseFloat(computed.borderLeftWidth) || 0) -
        (Number.parseFloat(computed.borderRightWidth) || 0),
    ),
    height: Math.max(
      0,
      box.height -
        (Number.parseFloat(computed.borderTopWidth) || 0) -
        (Number.parseFloat(computed.borderBottomWidth) || 0),
    ),
  };
  const shadows: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < computed.boxShadow.length; index++) {
    const character = computed.boxShadow[index];
    if (character === '(') depth++;
    if (character === ')') depth--;
    if (character === ',' && depth === 0) {
      shadows.push(computed.boxShadow.slice(start, index));
      start = index + 1;
    }
  }
  shadows.push(computed.boxShadow.slice(start));
  const bands: { geometry: AnatomyRect; fill: string; shadow: string }[] = [];
  for (const shadow of shadows) {
    if (!shadow.includes('inset')) continue;
    const offsets = Array.from(
      shadow
        .replace(/(?:rgba?|color|oklch|oklab|hsl|lab|lch)\([^)]*\)/g, '')
        .matchAll(/(-?[\d.]+)px/g),
      (match) => Number(match[1]),
    );
    const [x = 0, y = 0, blur = 0, spread = 0] = offsets;
    if (blur || spread) continue;
    const fill = shadowColor(shadow);
    if (y) {
      const height = Math.min(inner.height, Math.abs(y));
      bands.push({
        geometry: {
          x: inner.x,
          y: y > 0 ? inner.y : inner.y + inner.height - height,
          width: inner.width,
          height,
        },
        fill,
        shadow,
      });
    }
    if (x) {
      const width = Math.min(inner.width, Math.abs(x));
      bands.push({
        geometry: {
          x: x > 0 ? inner.x : inner.x + inner.width - width,
          y: inner.y,
          width,
          height: inner.height,
        },
        fill,
        shadow,
      });
    }
  }
  bands.forEach((band, index) =>
    rect(m, `${id}-${index}`, owner, shifted(band.geometry, offset), band.fill),
  );
  const metadata = (m.scene.source.insetContacts ?? {}) as Record<string, unknown>;
  metadata[id] = { inner, bands, sourceShadow: computed.boxShadow };
  m.scene.source.insetContacts = metadata;
}

/** A construction-planes host's rest depth and resolved band tones (finish plan V2). */
function planeTones(host: Element) {
  return {
    rest: length(host, '--zao-plane-rest'),
    xNear: color(host, '--zao-plane-x-near'),
    xFar: color(host, '--zao-plane-x-far'),
    yNear: color(host, '--zao-plane-y-near'),
    yFar: color(host, '--zao-plane-y-far'),
  };
}

/**
 * The two banded side planes, drawn from the face's trailing edges back to the base, which sits
 * a rest depth behind the native box along the axis. Each plane splits at its midline into a
 * far band and a near band in the host's own tones. Returns the base for further drawing.
 */
function bandedPlanes(
  m: MeasuredContext,
  host: Element,
  native: AnatomyRect,
  face: AnatomyRect,
  id: string,
  owner: string,
) {
  const { axis } = m.scene.tokens;
  const tones = planeTones(host);
  const base = shifted(native, { x: -axis.x * tones.rest, y: -axis.y * tones.rest });
  const across = (r: AnatomyRect) => (axis.x >= 0 ? r.x : r.x + r.width);
  const along = (r: AnatomyRect) => (axis.y <= 0 ? r.y + r.height : r.y);
  const middle = (a: AnatomyPoint, b: AnatomyPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const bands = (front: [AnatomyPoint, AnatomyPoint], back: [AnatomyPoint, AnatomyPoint]) => {
    const joint: [AnatomyPoint, AnatomyPoint] = [
      middle(front[0], back[0]),
      middle(front[1], back[1]),
    ];
    return {
      far: [joint[0], joint[1], back[1], back[0]],
      near: [front[0], front[1], joint[1], joint[0]],
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
    m.scene.shapes.push({ type: 'polygon', id: `${id}-${suffix}`, part: owner, points, fill });
  }
  m.scene.source[`${id}Planes`] = { rest: tones.rest, base, tones, x, y };
  return base;
}

function buttonParts(
  m: MeasuredContext,
  button: HTMLElement,
  prefix = '',
  owner = 'face',
  offset = m.offset,
) {
  const face = required<HTMLElement>(button, '[data-zao-slot="face"]');
  const sideSlot = required<HTMLElement>(button, '[data-zao-slot="side"]');
  const native = capture(m, `${prefix}button`, button);
  const front = capture(m, `${prefix}face`, face);
  capture(m, `${prefix}side`, sideSlot);
  const faceGeometry = shifted(front.rect, offset);
  const edge = color(button, '--button-edge');
  // The base is where the planes end: an outline of the native box a rest depth back.
  const baseGeometry = bandedPlanes(
    m,
    button,
    native.rect,
    faceGeometry,
    `${prefix}side`,
    prefix ? owner : 'side',
  );
  rect(m, `${prefix}base`, prefix ? owner : 'base', baseGeometry, transparent, edge);
  rect(m, `${prefix}face`, owner, faceGeometry, front.paint.fill, edge, front.paint.radius);
  m.scene.readings.push(...readings(face, m.origin, owner, offset));
  m.scene.source[`${prefix}buttonTopology`] = {
    face: faceGeometry,
    base: baseGeometry,
    edge,
    sideSource: 'side slot ::before and ::after',
  };
  return { front: faceGeometry, base: baseGeometry };
}

function actualPaths(m: MeasuredContext, element: Element, part: string, offset: AnatomyPoint) {
  const paths = Array.from(element.querySelectorAll<SVGPathElement>('svg path')).map(
    (path, index) => {
      const matrix = path.getScreenCTM();
      const d = path.getAttribute('d');
      if (!matrix || !d) return null;
      const computed = style(path);
      const sourceStrokeWidth = Number.parseFloat(computed.strokeWidth) || 0;
      const scale = Math.hypot(matrix.a, matrix.b);
      const transform = `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e - m.origin.x + offset.x} ${matrix.f - m.origin.y + offset.y})`;
      const bounds = shifted(rectangle(path, m.origin), offset);
      m.scene.shapes.push({
        type: 'path',
        id: `${part}-path-${index}`,
        part,
        d,
        transform,
        bounds,
        fill: computed.fill,
        stroke: computed.stroke,
        strokeWidth: m.scene.tokens.hairline,
      });
      return {
        d,
        transform,
        bounds,
        sourceStrokeWidth,
        effectiveSourceStrokeWidth: sourceStrokeWidth * scale,
        drawingStrokeWidth: m.scene.tokens.hairline,
        scale,
        stroke: computed.stroke,
        fill: computed.fill,
      };
    },
  );
  m.scene.source[`${part}Paths`] = paths.filter((path) => path !== null);
}

function buttonScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const native = required<HTMLElement>(island, '[data-zao-component="button"]');
  const m = context(
    native,
    configuration,
    'Button',
    'The measured square face and its reading move together above two banded side planes and one fixed base a control depth behind.',
  );
  const shapes = buttonParts(m, native);
  part(
    m,
    'face',
    'Face',
    'The existing face slot carries the real action reading and semantic fill.',
    { x: shapes.front.x + shapes.front.width / 2, y: shapes.front.y },
  );
  part(
    m,
    'side',
    'Side',
    'The side slot paints two planes, each in a near and a far band, from the face back to the base.',
    {
      x: (shapes.front.x + shapes.base.x) / 2,
      y: (shapes.front.y + shapes.base.y + shapes.front.height + shapes.base.height) / 2,
    },
  );
  part(
    m,
    'base',
    'Base',
    'The fixed base is the native box moved the control rest depth back along the axis; the planes end at its edges.',
    { x: shapes.base.x + shapes.base.width / 2, y: shapes.base.y + shapes.base.height },
  );
  return m.scene;
}

function cardScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const native = required<HTMLElement>(island, '[data-zao-component="card"]');
  const m = context(
    native,
    configuration,
    'Card',
    'One passive content plane, its subtle semantic perimeter, and two banded side planes resting a surface depth above its base.',
  );
  const card = capture(m, 'card', native);
  const front = shifted(card.rect, m.offset);
  const base = bandedPlanes(m, native, card.rect, front, 'card-side', 'contact-edge');
  rect(
    m,
    'content-plane',
    'content-plane',
    front,
    card.paint.fill,
    card.paint.border,
    card.paint.radius,
  );
  m.scene.readings.push(...readings(native, m.origin, 'content-plane', m.offset));
  part(
    m,
    'content-plane',
    'Content plane',
    'The Card marker is the single stationary reading frame; Card authors no slot attributes.',
    { x: front.x + front.width / 2, y: front.y },
  );
  part(
    m,
    'contact-edge',
    'Side planes',
    'Two banded planes reach a surface rest depth back to the Card’s base; they are paint on the Card itself.',
    { x: base.x, y: base.y + base.height },
  );
  m.scene.source.contact = { hook: 'card ::before and ::after planes', base };
  return m.scene;
}

function nearEdges(
  trigger: AnatomyRect,
  popup: AnatomyRect,
  side: string,
): { from: AnatomyPoint; to: AnatomyPoint; gap: number } {
  if (side === 'left' || side === 'right') {
    const low = Math.max(trigger.y, popup.y);
    const high = Math.min(trigger.y + trigger.height, popup.y + popup.height);
    const y =
      high >= low
        ? (low + high) / 2
        : Math.max(popup.y, Math.min(trigger.y + trigger.height / 2, popup.y + popup.height));
    const from = { x: side === 'left' ? trigger.x : trigger.x + trigger.width, y };
    const to = { x: side === 'left' ? popup.x + popup.width : popup.x, y };
    return { from, to, gap: Math.abs(from.x - to.x) };
  }
  const low = Math.max(trigger.x, popup.x);
  const high = Math.min(trigger.x + trigger.width, popup.x + popup.width);
  const x =
    high >= low
      ? (low + high) / 2
      : Math.max(popup.x, Math.min(trigger.x + trigger.width / 2, popup.x + popup.width));
  const from = { x, y: side === 'top' ? trigger.y : trigger.y + trigger.height };
  const to = { x, y: side === 'top' ? popup.y + popup.height : popup.y };
  return { from, to, gap: Math.abs(from.y - to.y) };
}

function menuScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const menu = required<HTMLElement>(island, '[data-zao-component="menu"]');
  const trigger = required<HTMLElement>(menu, '[data-zao-slot="trigger"]');
  const popup = required<HTMLElement>(menu, '[data-zao-slot="popup"]');
  const m = context(
    trigger,
    configuration,
    'Menu',
    'The real Button trigger owns one collision-positioned stationary popup. Its joint is a placement relationship; the reveal lip finishes at the far frame edge.',
  );
  buttonParts(m, trigger, 'trigger-', 'trigger');
  actualPaths(m, trigger, 'trigger', m.offset);
  const popupCapture = capture(m, 'popup', popup);
  const items = capture(m, 'items', required(menu, '[data-zao-slot="items"]'));
  const lip = required<HTMLElement>(popup, '[data-zao-slot="reveal-edge"]');
  const lipStyle = style(lip, '::after');
  m.paints['reveal-edge'] = paint(lip, '::after');
  m.rects['reveal-edge'] = rectangle(lip, m.origin);
  const side = popup.dataset.side ?? popup.parentElement?.dataset.side ?? 'bottom';
  const front = shifted(popupCapture.rect, m.offset);
  const popupBase = bandedPlanes(m, popup, popupCapture.rect, front, 'popup-side', 'contact-edge');
  rect(
    m,
    'popup-frame',
    'popup',
    front,
    popupCapture.paint.fill,
    popupCapture.paint.border,
    popupCapture.paint.radius,
  );
  m.scene.readings.push(...readings(popup, m.origin, 'popup', m.offset));
  for (const [index, separator] of Array.from(
    popup.querySelectorAll('[data-zao-slot="separator"]'),
  ).entries()) {
    const measured = capture(m, `separator-${index}`, separator);
    m.scene.shapes.push({
      type: 'line',
      id: `separator-${index}`,
      part: 'popup',
      from: { x: measured.rect.x + m.offset.x, y: measured.rect.y + m.offset.y },
      to: {
        x: measured.rect.x + measured.rect.width + m.offset.x,
        y: measured.rect.y + m.offset.y,
      },
      fill: 'none',
      stroke: measured.paint.border,
      strokeWidth: m.scene.tokens.hairline,
    });
  }
  // At fully open, the measured pseudo-element is the far strip outside the popup.
  const lipBox = rectangle(lip, m.origin);
  const strip = {
    x: lipBox.x + (Number.parseFloat(lipStyle.left) || 0),
    y: lipBox.y + (Number.parseFloat(lipStyle.top) || 0),
    width: Number.parseFloat(lipStyle.width) || 0,
    height: Number.parseFloat(lipStyle.height) || 0,
  };
  m.scene.source.revealStrip = strip;
  rect(m, 'reveal-lip', 'reveal-edge', shifted(strip, m.offset), lipStyle.backgroundColor);
  const joint = nearEdges(m.scene.native, popupCapture.rect, side);
  const jointAnchor = {
    x: (joint.from.x + joint.to.x) / 2 + m.offset.x,
    y: (joint.from.y + joint.to.y) / 2 + m.offset.y,
  };
  m.scene.shapes.push({
    type: 'line',
    id: 'joint-reference',
    part: 'joint',
    fill: 'none',
    from: { x: joint.from.x + m.offset.x, y: joint.from.y + m.offset.y },
    to: { x: joint.to.x + m.offset.x, y: joint.to.y + m.offset.y },
    stroke: popupCapture.paint.border,
    strokeWidth: m.scene.tokens.hairline,
    dashed: true,
  });
  part(
    m,
    'trigger',
    'Trigger',
    'The unchanged shared secondary Button supplies face, banded side planes and base, with its real open-state fill.',
    { x: m.offset.x + m.scene.native.width / 2, y: m.offset.y },
  );
  part(
    m,
    'joint',
    'Joint',
    'The measured near-edge relationship follows actual collision placement; it is not a physical connector or public slot.',
    jointAnchor,
  );
  part(
    m,
    'popup',
    'Popup',
    'One full-sized floating frame contains stationary item readings and targets.',
    { x: front.x + front.width / 2, y: front.y + front.height / 2 },
  );
  part(
    m,
    'reveal-edge',
    'Reveal edge',
    'The decorative lip’s actual ::after paint is at the far edge when fully open.',
    center(shifted(strip, m.offset)),
  );
  part(
    m,
    'contact-edge',
    'Side planes',
    'The popup’s banded planes follow depth.axis independently of its collision side.',
    { x: popupBase.x, y: popupBase.y + popupBase.height },
  );
  m.scene.source.placement = {
    side,
    align: popup.dataset.align ?? popup.parentElement?.dataset.align,
    joint,
    popup: popupCapture.rect,
    trigger: m.scene.native,
    items: items.rect,
    lip: strip,
    revealProgress: style(popup).getPropertyValue('--zao-menu-reveal-progress'),
  };
  return m.scene;
}

function switchScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const native = required<HTMLElement>(island, '[data-zao-component="switch"]');
  const thumb = required<HTMLElement>(native, '[data-zao-slot="thumb"]');
  const face = required<HTMLElement>(thumb, '[data-zao-slot="face"]');
  const m = context(
    native,
    configuration,
    'Switch',
    'One fixed housing contains a recessed channel and a thumb assembly. The face is separated along the depth axis, the axis it seats on.',
  );
  const housing = capture(m, 'housing', native);
  const assembly = capture(m, 'thumb', thumb);
  const front = capture(m, 'face', face);
  // The face seats along the depth axis (finish plan V3), so it separates along it too.
  const faceGeometry = shifted(front.rect, m.offset);
  rect(
    m,
    'housing',
    'housing',
    housing.rect,
    housing.paint.fill,
    housing.paint.border,
    housing.paint.radius,
  );
  insetContacts(m, native, housing.rect, 'housing-inset-contact', 'housing');
  bandedPlanes(m, thumb, assembly.rect, faceGeometry, 'thumb-side', 'thumb');
  rect(
    m,
    'switch-face',
    'face',
    faceGeometry,
    front.paint.fill,
    front.paint.border,
    front.paint.radius,
  );
  const label = island.querySelector('[data-anatomy-source-label]');
  if (label) m.scene.readings.push(...readings(label, m.origin, 'housing'));
  part(
    m,
    'face',
    'Face',
    'The real face slot carries semantic fill and a fine perimeter; it rests a small depth above its base.',
    center(faceGeometry),
  );
  part(
    m,
    'thumb',
    'Thumb and planes',
    'The thumb carries the banded side planes and travels with its face; its base is not a separate part.',
    center(assembly.rect),
  );
  part(
    m,
    'housing',
    'Housing and channel',
    'The native root stays fixed; its fill, border and stepped inner walls define the recessed channel.',
    { x: housing.rect.x + housing.rect.width, y: housing.rect.y + housing.rect.height },
  );
  m.scene.source.checked = native.hasAttribute('data-checked');
  m.scene.source.seatingAxis = m.scene.tokens.axis;
  m.scene.source.thumbTopology = {
    face: faceGeometry,
    thumb: assembly.rect,
    source: 'thumb ::before and ::after planes beneath its face',
  };
  return m.scene;
}

function tabsScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const list = required<HTMLElement>(
    island,
    '[data-zao-slot="list"][data-zao-variant="secondary"]',
  );
  const indicator = required<HTMLElement>(list, '[data-zao-slot="indicator"]');
  const m = context(
    list,
    configuration,
    'Secondary Tabs',
    'One recessed track supports one selected face. The native tab targets and their readings remain in their measured positions while the selected face is separated for the drawing.',
  );
  const track = capture(m, 'list', list);
  const selected = capture(m, 'indicator', indicator);
  const front = shifted(selected.rect, m.offset);
  rect(
    m,
    'tabs-track',
    'list',
    track.rect,
    track.paint.fill,
    track.paint.border,
    track.paint.radius,
  );
  insetContacts(m, list, track.rect, 'track-inset-contact', 'list');
  bandedPlanes(m, indicator, selected.rect, front, 'selected-side', 'contact-edge');
  rect(
    m,
    'selection-face',
    'indicator',
    front,
    selected.paint.fill,
    selected.paint.border,
    selected.paint.radius,
  );
  for (const [index, tab] of Array.from(
    list.querySelectorAll<HTMLElement>('[data-zao-slot="tab"]'),
  ).entries()) {
    capture(m, `tab-${index}`, tab);
    m.scene.readings.push(...readings(tab, m.origin, 'tab'));
  }
  part(
    m,
    'indicator',
    'Selection face',
    'The functional indicator hook is the measured selected face; its size comes from the actual active tab.',
    { x: front.x + front.width / 2, y: front.y },
  );
  part(
    m,
    'contact-edge',
    'Side planes',
    'The selected indicator paints its own banded planes back to a small rest depth, without an invented base hook.',
    center(selected.rect),
  );
  part(
    m,
    'list',
    'Recessed track',
    'The secondary list paints one fixed sunken track and fine perimeter.',
    { x: track.rect.width, y: track.rect.height },
  );
  part(
    m,
    'tab',
    'Tabs and readings',
    'Native tab targets and labels stay stationary; only the selection face slides during use.',
    { x: track.rect.width / 2, y: track.rect.height / 2 },
  );
  return m.scene;
}

function fieldScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const field = required<HTMLElement>(island, '[data-zao-component="text-field"]');
  const input = required<HTMLInputElement>(field, '[data-zao-slot="control"]');
  const label = required<HTMLElement>(field, '[data-zao-slot="label"]');
  const m = context(
    input,
    configuration,
    'TextField',
    'The associated label sits outside one stationary native input. Its perimeter and value region are paint on the same control; there is no measured physical recess thickness or separate base.',
  );
  const control = capture(m, 'control', input);
  capture(m, 'label', label);
  const front = shifted(control.rect, m.offset);
  rect(
    m,
    'field-control',
    'control',
    front,
    control.paint.fill,
    control.paint.border,
    control.paint.radius,
  );
  m.scene.readings.push(
    ...readings(label, m.origin, 'label', m.offset),
    inputReading(input, m.origin, m.offset),
  );
  part(
    m,
    'label',
    'Label',
    'The real Base UI label names the input and remains outside its value region.',
    center(shifted(m.rects.label!, m.offset)),
  );
  part(
    m,
    'control',
    'Control and value plane',
    'One native input supplies the square field edge and recessed semantic value region. Drawing displacement uses the approved contact multiplier, not a new field depth.',
    { x: front.x + front.width, y: front.y + front.height / 2 },
  );
  m.scene.source.value = input.value;
  m.scene.source.physicalDepth = 'none; the input has no transform or contact shadow';
  return m.scene;
}

function progressScene(island: HTMLElement, configuration: AnatomyConfiguration) {
  const root = required<HTMLElement>(island, '[data-zao-component="progress"]');
  const track = required<HTMLElement>(root, '[data-zao-slot="track"]');
  const indicator = required<HTMLElement>(track, '[data-zao-slot="indicator"]');
  const m = context(
    track,
    configuration,
    'Progress',
    'The essential task and formatted reading stay outside a fixed reference track. The quantitative face retains its exact measured fraction, with its end contact painted inside that span.',
  );
  const reference = capture(m, 'track', track);
  const framePaint = capture(m, 'frame', track, '::before').paint;
  const quantitative = capture(m, 'indicator', indicator);
  const edgePaint = capture(m, 'end-edge', indicator, '::after').paint;
  const frontOffset = { x: 0, y: m.offset.y };
  const front = shifted(quantitative.rect, frontOffset);
  rect(
    m,
    'track-contact',
    'track',
    shifted(reference.rect, { x: 0, y: -m.scene.tokens.axis.y * m.scene.tokens.contact }),
    reference.paint.shadowColor,
  );
  rect(m, 'progress-track', 'track', reference.rect, reference.paint.fill, framePaint.border);
  insetContacts(m, track, reference.rect, 'frame-inset-contact', 'track', zero, '::before');
  rect(m, 'quantitative-face', 'indicator', front, quantitative.paint.fill);
  insetContacts(
    m,
    indicator,
    quantitative.rect,
    'indicator-inset-contact',
    'contact-edge',
    frontOffset,
  );
  const endStyle = style(indicator, '::after');
  const edgeWidth = Math.min(front.width, Number.parseFloat(endStyle.width) || 0);
  const rtl = style(indicator).direction === 'rtl';
  const edge = {
    x: rtl ? front.x : front.x + front.width - edgeWidth,
    y: front.y,
    width: edgeWidth,
    height: front.height,
  };
  m.scene.source.physicalEndEdge = shifted(edge, { x: -frontOffset.x, y: -frontOffset.y });
  rect(m, 'quantitative-end-edge', 'contact-edge', edge, edgePaint.fill);
  const header = required<HTMLElement>(root, '[data-zao-slot="header"]');
  capture(m, 'header', header);
  m.scene.readings.push(...readings(header, m.origin, 'reading', frontOffset));
  part(
    m,
    'reading',
    'Label and value',
    'The measured Base UI label and formatted value remain essential readings outside the quantitative track.',
    center(shifted(m.rects.header!, frontOffset)),
  );
  part(
    m,
    'indicator',
    'Quantitative face',
    'The actual indicator width is preserved during the drawing displacement; it is not enlarged by the contact edge.',
    { x: front.x + front.width / 2, y: front.y },
  );
  part(
    m,
    'contact-edge',
    'Contact edge',
    'The real indicator ::after end strip stays inside the measured face, including in RTL.',
    center(edge),
  );
  part(
    m,
    'track',
    'Track and frame',
    'The reference remains stationary; its ::before perimeter is drawn over the track without shortening the scale.',
    { x: reference.rect.width, y: reference.rect.height },
  );
  m.scene.source.ratio = quantitative.rect.width / reference.rect.width;
  m.scene.source.value = {
    now: root.getAttribute('aria-valuenow'),
    min: root.getAttribute('aria-valuemin'),
    max: root.getAttribute('aria-valuemax'),
    text: root.getAttribute('aria-valuetext'),
  };
  m.scene.source.endEdge = edge;
  return m.scene;
}

function drawingBounds(scene: AnatomyScene): AnatomyRect {
  const points: AnatomyPoint[] = [
    { x: 0, y: 0 },
    { x: scene.native.width, y: scene.native.height },
  ];
  for (const shape of scene.shapes) {
    if (shape.type === 'polygon') points.push(...shape.points);
    else if (shape.type === 'line') points.push(shape.from, shape.to);
    else if (shape.type === 'path')
      points.push(
        { x: shape.bounds.x, y: shape.bounds.y },
        { x: shape.bounds.x + shape.bounds.width, y: shape.bounds.y + shape.bounds.height },
      );
    else
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
      );
  }
  for (const reading of scene.readings)
    points.push(
      { x: reading.x, y: reading.y - reading.height },
      { x: reading.x + reading.width, y: reading.y },
    );
  const x = Math.min(...points.map((point) => point.x));
  const y = Math.min(...points.map((point) => point.y));
  return {
    x,
    y,
    width: Math.max(...points.map((point) => point.x)) - x,
    height: Math.max(...points.map((point) => point.y)) - y,
  };
}

/** Every scene reads the unchanged public component in its own document and JS realm. */
export function measureAnatomy(
  island: HTMLElement,
  configuration: AnatomyConfiguration,
): AnatomyScene {
  const measurements = {
    button: buttonScene,
    card: cardScene,
    menu: menuScene,
    switch: switchScene,
    tabs: tabsScene,
    'text-field': fieldScene,
    progress: progressScene,
  };
  const scene = measurements[configuration.kind](island, configuration);
  scene.readings = scene.readings.map((reading, index) => ({
    ...reading,
    id: `${reading.part}-reading-${index}`,
  }));
  scene.source.bounds = drawingBounds(scene);
  return scene;
}
