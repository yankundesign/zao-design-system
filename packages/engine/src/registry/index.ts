import type { Parameter, ParameterKind, Layer } from '../types.ts';

const entries: Parameter[] = [];
function add(
  id: string,
  group: string,
  kind: ParameterKind,
  layer: Layer,
  range?: [number, number],
  unit = '',
  tokenPath = id,
  perMode = false,
) {
  const rampMatch = id.match(/^color\.(neutral|accent|success|warning|danger)\./);
  let cssVariables = [`--zao-${tokenPath.replaceAll('.', '-')}`];
  if (rampMatch) {
    const ramp = rampMatch[1]!;
    const stepMatch = id.match(/\.pin\.(?:light|dark)\.(\d+)$/);
    const pinMode = id.match(/\.pin\.(light|dark)\./)?.[1];
    const modeMatch = id.match(/\.(light|dark)$/);
    const selectedMode = pinMode ?? modeMatch?.[1];
    const modes = selectedMode ? [selectedMode] : ['light', 'dark'];
    const steps = stepMatch
      ? [stepMatch[1]!]
      : id.includes('.solid.')
        ? ['9', '10']
        : Array.from({ length: 12 }, (_, i) => String(i + 1));
    cssVariables = modes.flatMap((mode) =>
      steps.map((step) => `--zao-palette-${ramp}-${mode}-${step}`),
    );
  }
  if (id === 'color.contrast')
    cssVariables = ['neutral', 'accent', 'success', 'warning', 'danger'].flatMap((ramp) =>
      ['light', 'dark'].flatMap((mode) =>
        [11, 12].map((step) => `--zao-palette-${ramp}-${mode}-${step}`),
      ),
    );
  if (id === 'color.ramp.extra') cssVariables = ['--zao-palette-{name}-{mode}-{step}'];
  if (id === 'font.family.display')
    cssVariables = [
      '--zao-font-family-display',
      '--zao-type-display-font-family',
      '--zao-type-title-font-family',
    ];
  if (id === 'font.family.text')
    cssVariables = [
      '--zao-font-family-text',
      ...['heading', 'body', 'button', 'label', 'caption'].map(
        (role) => `--zao-type-${role}-font-family`,
      ),
    ];
  if (id === 'font.family.mono')
    cssVariables = ['--zao-font-family-mono', '--zao-type-code-font-family'];
  if (id.startsWith('font.weight.')) {
    const weight = id.split('.').at(-1);
    const roles =
      weight === 'strong'
        ? ['display', 'title', 'heading']
        : weight === 'medium'
          ? ['label']
          : ['body', 'caption', 'code'];
    cssVariables = [
      `--zao-font-weight-${weight}`,
      ...roles.map((role) => `--zao-type-${role}-font-weight`),
    ];
  }
  entries.push({
    id,
    group,
    label: id.split('.').slice(1).join(' ').replaceAll('-', ' '),
    kind,
    ...(range ? { range } : {}),
    unit,
    layer,
    perMode,
    tokenPath,
    cssVariables,
  });
}

for (const ramp of ['neutral', 'accent', 'success', 'warning', 'danger']) {
  add(`color.${ramp}.hue`, 'color', 'hue', 'finish', [0, 360], '°');
  add(`color.${ramp}.chroma`, 'color', 'chroma', 'finish', [0, 0.4]);
  for (const mode of ['light', 'dark'])
    add(
      `color.${ramp}.curve.lightness.${mode}`,
      'color',
      'curve',
      'finish',
      [0, 1],
      '',
      `palette.${ramp}.${mode}.lightness`,
      true,
    );
  add(`color.${ramp}.curve.chroma`, 'color', 'curve', 'finish', [0, 1]);
  add(`color.${ramp}.hue-drift`, 'color', 'hue', 'finish', [-180, 180], '°');
  add(`color.${ramp}.anchor`, 'color', 'color', 'finish');
  for (const mode of ['light', 'dark'])
    add(
      `color.${ramp}.solid.${mode}`,
      'color',
      'lightness',
      'finish',
      [0, 1],
      '',
      `palette.${ramp}.${mode}.9`,
    );
  for (const mode of ['light', 'dark'])
    for (let step = 1; step <= 12; step++)
      add(
        `color.${ramp}.pin.${mode}.${step}`,
        'color',
        'color',
        'finish',
        undefined,
        '',
        `palette.${ramp}.${mode}.${step}`,
        true,
      );
}
add('color.contrast', 'color', 'number', 'finish', [0, 1]);
add('color.ramp.extra', 'color', 'enum', 'finish', undefined, '', 'palette.<name>');

for (const radius of ['control', 'action', 'surface', 'overlay'])
  add(`radius.${radius}`, 'shape', 'number', 'finish', [0, radius === 'action' ? 9999 : 48], 'px');
add('stroke.hairline', 'shape', 'number', 'structure', undefined, 'px');
for (const distance of ['contact', 'lift'])
  add(`depth.${distance}`, 'depth and material', 'number', 'finish', undefined, 'px');
for (const axis of ['x', 'y']) add(`depth.axis.${axis}`, 'depth and material', 'number', 'finish');
for (const key of ['fill', 'fill-solid', 'border', 'highlight'])
  add(`material.overlay.${key}`, 'depth and material', 'color', 'finish');
add('material.overlay.blur', 'depth and material', 'number', 'finish', [0, 48], 'px');
for (const duration of ['fast', 'base', 'loading'])
  add(`motion.duration.${duration}`, 'motion', 'duration', 'finish', [0, 2000], 'ms');
add('motion.easing.standard', 'motion', 'easing', 'finish');
add('font.family.display', 'type', 'font', 'finish');
add('font.family.text', 'type', 'font', 'structure');
add('font.family.mono', 'type', 'font', 'structure');
for (const role of ['display', 'title']) {
  add(
    `type.${role}.weight`,
    'type',
    'number',
    'finish',
    [100, 900],
    '',
    `type.${role}.font-weight`,
  );
}
const modeTokenPaths: Record<string, string> = {
  canvas: 'color.bg.canvas',
  surface: 'color.bg.surface',
  sunken: 'color.bg.sunken',
  overlay: 'color.bg.overlay',
  hover: 'color.bg.hover',
  active: 'color.bg.active',
  'fg.default': 'color.fg.default',
  'fg.muted': 'color.fg.muted',
  'fg.disabled': 'color.fg.disabled',
  'border.subtle': 'color.border.subtle',
  'border.default': 'color.border.default',
  'border.strong': 'color.border.strong',
  'accent.solid': 'color.accent.solid',
  'accent.solid-hover': 'color.accent.solid-hover',
  'accent.subtle': 'color.accent.subtle',
  'accent.subtle-hover': 'color.accent.subtle-hover',
  'accent.border': 'color.accent.border',
  'accent.text': 'color.accent.text',
  'focus.ring': 'color.focus.ring',
  'success.solid': 'color.success.solid',
  'success.subtle': 'color.success.subtle',
  'success.border': 'color.success.border',
  'success.text': 'color.success.text',
  'warning.solid': 'color.warning.solid',
  'warning.subtle': 'color.warning.subtle',
  'warning.border': 'color.warning.border',
  'warning.text': 'color.warning.text',
  'danger.solid': 'color.danger.solid',
  'danger.subtle': 'color.danger.subtle',
  'danger.border': 'color.danger.border',
  'danger.text': 'color.danger.text',
};
for (const [role, tokenPath] of Object.entries(modeTokenPaths)) {
  add(`mode.${role.replaceAll('.', '-')}`, 'mode', 'step', 'mode', [1, 12], '', tokenPath, true);
}
for (const shadow of ['soft', 'strong'])
  add(
    `shadow.${shadow}`,
    'depth and material',
    'color',
    'mode',
    undefined,
    '',
    `color.shadow.${shadow}`,
  );
for (const weight of ['regular', 'medium', 'strong'])
  add(`font.weight.${weight}`, 'type', 'number', 'structure', [100, 900]);
for (const role of ['display', 'title', 'heading', 'body', 'button', 'label', 'caption', 'code']) {
  add(`type.${role}.size`, 'type', 'number', 'structure', [8, 96], 'px', `type.${role}.font-size`);
  add(
    `type.${role}.tracking`,
    'type',
    'number',
    role === 'display' || role === 'title' ? 'finish' : 'structure',
    [-4, 4],
    'px',
    `type.${role}.letter-spacing`,
  );
}
add('space.unit', 'space and density', 'number', 'structure', [1, 16], 'px', 'unit');
for (const [size, tokenSize] of [
  ['small', 'sm'],
  ['default', 'md'],
  ['large', 'lg'],
])
  add(
    `size.control.${size}`,
    'space and density',
    'number',
    'structure',
    [20, 64],
    'px',
    `size.control.${tokenSize}`,
  );

export const parameterRegistry = Object.freeze(entries);
export const registryById = new Map(
  parameterRegistry.map((parameter) => [parameter.id, parameter]),
);
