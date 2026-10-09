/** Pure promotion planning. Import this from local tooling only, never from the browser barrel. */
import { converter, parse, type Color } from 'culori';
import { LIGHTNESS } from './palette.ts';
import { parameterRegistry, registryById } from './registry/index.ts';
import { baselineStyles, resolveStyle } from './style.ts';
import type { FinishInput, RampInput, StyleFile } from './types.ts';

export const promotionPaths = [
  'packages/tokens/palette.config.ts',
  'packages/tokens/src/themes/su.tokens.json',
  'packages/tokens/src/themes/yu.tokens.json',
  'packages/tokens/src/modes/light.tokens.json',
  'packages/tokens/src/modes/dark.tokens.json',
  'packages/tokens/src/base/type.tokens.json',
  'packages/tokens/src/base/space.tokens.json',
] as const;

export type PromotionPath = (typeof promotionPaths)[number];
export type PromotionSources = Record<PromotionPath, string>;
export type PromotionMapping =
  | { kind: 'palette' | 'theme' | 'mode' | 'base-type' | 'base-space' }
  | { kind: 'unsupported'; reason: string };

export interface PromotionPlan {
  finish: 'su' | 'yu';
  styleId: string;
  files: Array<{ path: PromotionPath; before: string; after: string; parameters: string[] }>;
  skippedShared: string[];
  unsupported: Array<{ id: string; reason: string }>;
  sharedEffects: Array<{
    id: string;
    value: unknown;
    contexts: Array<'su-light' | 'su-dark' | 'yu-dark'>;
  }>;
  decisionLogDraft: string;
}

export interface PromotionInput {
  style: StyleFile;
  library: Record<string, StyleFile>;
  finish: 'su' | 'yu';
  includeShared?: boolean;
  groups?: string[];
  sources: PromotionSources;
  paletteInput: Record<'su' | 'yu', FinishInput>;
}

const ramps = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
type RampName = (typeof ramps)[number];
type JsonObject = Record<string, unknown>;
const toOklch = converter('oklch');

/** Every registry entry gets one destination or a reason it cannot be promoted. */
export function promotionMapping(id: string): PromotionMapping {
  if (id === 'color.ramp.extra')
    return { kind: 'unsupported', reason: 'Extra ramps need new semantic roles before promotion.' };
  if (id === 'color.contrast' || /^color\.(neutral|accent|success|warning|danger)\./.test(id))
    return { kind: 'palette' };
  if (
    /^(depth\.|radius\.|material\.overlay\.|motion\.|font\.family\.display$|type\.(display|title)\.(weight|tracking)$)/.test(
      id,
    )
  )
    return { kind: 'theme' };
  if (id.startsWith('mode.') || /^shadow\.(soft|strong)$/.test(id)) return { kind: 'mode' };
  if (/^(font\.family\.(text|mono)$|font\.weight\.|type\..*\.(size|tracking)$)/.test(id))
    return { kind: 'base-type' };
  if (id === 'space.unit' || id === 'stroke.hairline' || id.startsWith('size.control.'))
    return { kind: 'base-space' };
  return { kind: 'unsupported', reason: 'No token-source mapping exists for this parameter.' };
}

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label} must be an object.`);
  return value as JsonObject;
}

function at(root: JsonObject, path: string[], label: string): JsonObject {
  let current = root;
  for (const part of path) current = object(current[part], `${label}.${part}`);
  return current;
}

function token(root: JsonObject, path: string[], label: string): JsonObject {
  const current = at(root, path, label);
  if (!('$value' in current)) throw new Error(`${label}.${path.join('.')} has no $value.`);
  return current;
}

function setToken(root: JsonObject, path: string[], value: unknown, label: string) {
  const target = token(root, path, label);
  if (JSON.stringify(target.$value) === JSON.stringify(value)) return false;
  target.$value = value;
  return true;
}

function dimension(value: unknown, unit: 'px' | 'ms') {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`A ${unit} token needs a finite number.`);
  return { value, unit };
}

function colorToken(value: unknown) {
  if (typeof value !== 'string') throw new Error('A color token needs a CSS color string.');
  const parsed = parse(value) as Color | undefined;
  if (!parsed) throw new Error(`Invalid CSS color "${value}".`);
  const color = parsed.mode === 'rgb' ? parsed : toOklch(parsed);
  if (!color) throw new Error(`Could not convert CSS color "${value}".`);
  if (color.mode === 'rgb') {
    return {
      colorSpace: 'srgb',
      components: [color.r, color.g, color.b],
      ...(color.alpha !== undefined && color.alpha < 1 ? { alpha: color.alpha } : {}),
    };
  }
  return {
    colorSpace: 'oklch',
    components: [color.l, color.c, color.h ?? 0],
    ...(color.alpha !== undefined && color.alpha < 1 ? { alpha: color.alpha } : {}),
  };
}

function fontValue(value: unknown) {
  if (Array.isArray(value) && value.every((part) => typeof part === 'string')) return [...value];
  if (typeof value !== 'string') throw new Error('A font token needs a family or family list.');
  if (!value.includes(',')) return value.replace(/^(["'])(.*)\1$/, '$2');
  return value
    .match(/(?:"[^"]*"|'[^']*'|[^,])+/g)!
    .map((part) => part.trim().replace(/^(["'])(.*)\1$/, '$2'));
}

function ensureThemeRole(theme: JsonObject, baseType: JsonObject, role: 'display' | 'title') {
  if (!theme.type) theme.type = { $type: 'typography' };
  const type = object(theme.type, 'theme.type');
  if (!type[role]) type[role] = structuredClone(at(baseType, ['type', role], 'base type'));
  return object(token(theme, ['type', role], 'theme').$value, `theme.type.${role}.$value`);
}

function applyPaletteParam(finish: FinishInput, id: string, value: unknown) {
  if (id === 'color.contrast') {
    if (finish.contrast === value) return false;
    finish.contrast = value as number;
    return true;
  }
  const parts = id.split('.');
  const rampName = parts[1] as RampName;
  const ramp = finish[rampName] as RampInput;
  const before = JSON.stringify(ramp);
  const field = parts[2];
  if (field === 'hue' || field === 'chroma') ramp[field] = value as number;
  else if (field === 'hue-drift') ramp.hueDrift = value as number;
  else if (field === 'anchor') ramp.anchor = value as string;
  else if (field === 'solid') ramp.solid = { ...(ramp.solid ?? {}), [parts[3]!]: value as number };
  else if (field === 'curve' && parts[3] === 'chroma') ramp.chromaCurve = value as number[];
  else if (field === 'curve' && parts[3] === 'lightness') {
    const mode = parts[4] as 'light' | 'dark';
    const family = rampName === 'neutral' ? 'neutral' : 'color';
    ramp.lightness = {
      light: [...(ramp.lightness?.light ?? LIGHTNESS[family].light)],
      dark: [...(ramp.lightness?.dark ?? LIGHTNESS[family].dark)],
      [mode]: value as number[],
    };
  } else if (field === 'pin') {
    const mode = parts[3] as 'light' | 'dark';
    const step = Number(parts[4]);
    ramp.pins = {
      ...(ramp.pins ?? {}),
      [mode]: { ...(ramp.pins?.[mode] ?? {}), [step]: value as string },
    };
  } else throw new Error(`No palette mapping for ${id}.`);
  return before !== JSON.stringify(ramp);
}

function applyThemeParam(theme: JsonObject, baseType: JsonObject, id: string, value: unknown) {
  if (id.startsWith('depth.'))
    return setToken(
      theme,
      id.split('.'),
      id.startsWith('depth.axis.') ? value : dimension(value, 'px'),
      'theme',
    );
  if (id.startsWith('radius.'))
    return setToken(theme, id.split('.'), dimension(value, 'px'), 'theme');
  if (id.startsWith('material.overlay.')) {
    const path = id.split('.');
    return setToken(
      theme,
      path,
      id.endsWith('.blur') ? dimension(value, 'px') : colorToken(value),
      'theme',
    );
  }
  if (id.startsWith('motion.duration.'))
    return setToken(theme, id.split('.'), dimension(value, 'ms'), 'theme');
  if (id === 'motion.easing.standard') return setToken(theme, id.split('.'), value, 'theme');
  if (id === 'font.family.display')
    return setToken(theme, id.split('.'), fontValue(value), 'theme');
  const role = id.split('.')[1] as 'display' | 'title';
  const type = ensureThemeRole(theme, baseType, role);
  if (id.endsWith('.weight')) {
    if (type.fontWeight === value) return false;
    type.fontWeight = value;
  } else {
    const tracking = dimension(value, 'px');
    if (JSON.stringify(type.letterSpacing) === JSON.stringify(tracking)) return false;
    type.letterSpacing = tracking;
  }
  return true;
}

function applyModeParam(
  modes: Record<'light' | 'dark', JsonObject>,
  id: string,
  value: unknown,
  tokenPath: string,
) {
  const changed: Array<'light' | 'dark'> = [];
  for (const mode of ['light', 'dark'] as const) {
    const selected =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)[mode]
        : value;
    if (selected === undefined) continue;
    if (id.startsWith('shadow.')) {
      if (setToken(modes[mode], tokenPath.split('.'), colorToken(selected), `mode ${mode}`))
        changed.push(mode);
      continue;
    }
    const current = token(modes[mode], tokenPath.split('.'), `mode ${mode}`);
    const reference = String(current.$value).match(
      /^\{palette\.([a-z-]+)\.(light|dark)\.(\d+|contrast)\}$/,
    );
    if (!reference || reference[2] !== mode)
      throw new Error(`${id} must currently alias a ${mode} palette step.`);
    if (
      setToken(
        modes[mode],
        tokenPath.split('.'),
        `{palette.${reference[1]}.${mode}.${selected}}`,
        `mode ${mode}`,
      )
    )
      changed.push(mode);
  }
  return changed;
}

function applyBaseTypeParam(base: JsonObject, id: string, value: unknown) {
  if (id.startsWith('font.family.'))
    return setToken(base, id.split('.'), fontValue(value), 'base type');
  if (id.startsWith('font.weight.')) return setToken(base, id.split('.'), value, 'base type');
  const [, role, property] = id.split('.');
  const type = object(token(base, ['type', role!], 'base type').$value, `type.${role}.$value`);
  const key = property === 'size' ? 'fontSize' : 'letterSpacing';
  const next = dimension(value, 'px');
  if (JSON.stringify(type[key]) === JSON.stringify(next)) return false;
  type[key] = next;
  return true;
}

function applyBaseSpaceParam(base: JsonObject, id: string, value: unknown) {
  if (id === 'stroke.hairline')
    return setToken(base, id.split('.'), dimension(value, 'px'), 'base space');
  if (id === 'space.unit') {
    let changed = setToken(base, ['unit'], dimension(value, 'px'), 'base space');
    for (const step of [
      '0',
      '0-5',
      '1',
      '1-5',
      '2',
      '3',
      '4',
      '5',
      '6',
      '8',
      '10',
      '12',
      '16',
      '20',
    ]) {
      const multiple = Number(step.replace('-', '.'));
      changed =
        setToken(
          base,
          ['space', step],
          dimension((value as number) * multiple, 'px'),
          'base space',
        ) || changed;
    }
    return changed;
  }
  const size = id.split('.').at(-1);
  const tokenSize = size === 'small' ? 'sm' : size === 'default' ? 'md' : 'lg';
  return setToken(base, ['size', 'control', tokenSize], dimension(value, 'px'), 'base space');
}

type TextEdit = { start: number; end: number; text: string };
type SourceBlock = { open: number; close: number };

function skipTrivia(source: string, start: number, end: number) {
  let index = start;
  while (index < end) {
    if (/\s/.test(source[index]!)) index++;
    else if (source.startsWith('//', index)) {
      index = source.indexOf('\n', index + 2);
      if (index < 0) return end;
    } else if (source.startsWith('/*', index)) {
      index = source.indexOf('*/', index + 2);
      if (index < 0) throw new Error('Unclosed comment in palette.config.ts.');
      index += 2;
    } else break;
  }
  return index;
}

function skipString(source: string, start: number) {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') index += 2;
    else if (source[index++] === quote) return index;
  }
  throw new Error('Unclosed string in palette.config.ts.');
}

function matchingBrace(source: string, open: number): number {
  if (source[open] !== '{') throw new Error('Expected an object in palette.config.ts.');
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    const character = source[index];
    if (character === '"' || character === "'" || character === '`') {
      index = skipString(source, index) - 1;
      continue;
    }
    if (source.startsWith('//', index) || source.startsWith('/*', index)) {
      index = skipTrivia(source, index, source.length) - 1;
      continue;
    }
    if (character === '{') depth++;
    if (character === '}' && --depth === 0) return index;
  }
  throw new Error('Unclosed object in palette.config.ts.');
}

function propertyIn(source: string, block: SourceBlock, wanted: string) {
  let index = block.open + 1;
  while (index < block.close) {
    index = skipTrivia(source, index, block.close);
    if (source[index] === ',') {
      index++;
      continue;
    }
    if (index >= block.close) break;
    if (source.startsWith('...', index)) {
      index = source.indexOf(',', index);
      if (index < 0 || index > block.close) break;
      index++;
      continue;
    }
    const keyStart = index;
    let key: string;
    if (source[index] === '"' || source[index] === "'") {
      index = skipString(source, index);
      key = source.slice(keyStart + 1, index - 1);
    } else {
      while (/[\w-]/.test(source[index] ?? '')) index++;
      key = source.slice(keyStart, index);
    }
    index = skipTrivia(source, index, block.close);
    if (source[index] !== ':') throw new Error(`Expected a value for ${key} in palette.config.ts.`);
    index = skipTrivia(source, index + 1, block.close);
    const valueStart = index;
    let braces = 0,
      brackets = 0,
      parentheses = 0;
    while (index < block.close) {
      const character = source[index];
      if (character === '"' || character === "'" || character === '`') {
        index = skipString(source, index);
        continue;
      }
      if (source.startsWith('//', index) || source.startsWith('/*', index)) {
        index = skipTrivia(source, index, block.close);
        continue;
      }
      if (character === '{') braces++;
      else if (character === '}') braces--;
      else if (character === '[') brackets++;
      else if (character === ']') brackets--;
      else if (character === '(') parentheses++;
      else if (character === ')') parentheses--;
      else if (character === ',' && braces === 0 && brackets === 0 && parentheses === 0) break;
      index++;
    }
    const valueEnd = source.slice(valueStart, index).trimEnd().length + valueStart;
    if (key === wanted) return { start: valueStart, end: valueEnd };
    index++;
  }
  return undefined;
}

function objectProperty(source: string, block: SourceBlock, name: string): SourceBlock {
  const value = propertyIn(source, block, name);
  if (!value || source[value.start] !== '{')
    throw new Error(`palette.config.ts needs an object for ${name}.`);
  return { open: value.start, close: matchingBrace(source, value.start) };
}

function applyTextEdits(source: string, edits: TextEdit[]) {
  let next = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    next = `${next.slice(0, edit.start)}${edit.text}${next.slice(edit.end)}`;
  return next;
}

function renderObject(value: unknown, indent: number) {
  return JSON.stringify(value, null, 2).replaceAll('\n', `\n${' '.repeat(indent)}`);
}

type JsonNode = {
  start: number;
  end: number;
  members?: Map<string, JsonNode>;
};

function parseJsonPositions(source: string): JsonNode {
  const whitespace = (start: number) => {
    let index = start;
    while (/\s/.test(source[index] ?? '')) index++;
    return index;
  };
  const stringEnd = (start: number) => {
    let index = start + 1;
    while (index < source.length) {
      if (source[index] === '\\') index += 2;
      else if (source[index++] === '"') return index;
    }
    throw new Error('Invalid JSON string in token source.');
  };
  const value = (atIndex: number): JsonNode => {
    const start = whitespace(atIndex);
    let index = start;
    if (source[index] === '{') {
      const members = new Map<string, JsonNode>();
      index = whitespace(index + 1);
      while (source[index] !== '}') {
        if (source[index] !== '"') throw new Error('Invalid JSON object in token source.');
        const keyEnd = stringEnd(index);
        const key = JSON.parse(source.slice(index, keyEnd)) as string;
        index = whitespace(keyEnd);
        if (source[index++] !== ':') throw new Error('Invalid JSON property in token source.');
        const child = value(index);
        members.set(key, child);
        index = whitespace(child.end);
        if (source[index] === ',') index = whitespace(index + 1);
        else if (source[index] !== '}') throw new Error('Invalid JSON separator in token source.');
      }
      return { start, end: index + 1, members };
    }
    if (source[index] === '[') {
      index = whitespace(index + 1);
      while (source[index] !== ']') {
        const child = value(index);
        index = whitespace(child.end);
        if (source[index] === ',') index = whitespace(index + 1);
        else if (source[index] !== ']') throw new Error('Invalid JSON array in token source.');
      }
      return { start, end: index + 1 };
    }
    if (source[index] === '"') return { start, end: stringEnd(index) };
    while (index < source.length && !/[\s,}\]]/.test(source[index]!)) index++;
    return { start, end: index };
  };
  return value(0);
}

function lineIndent(source: string, position: number) {
  const line = source.slice(source.lastIndexOf('\n', position - 1) + 1, position);
  return line.match(/^\s*/)?.[0] ?? '';
}

function rewriteJsonSource(source: string, next: JsonObject) {
  const original = object(JSON.parse(source) as unknown, 'token source');
  const positions = parseJsonPositions(source);
  const edits: TextEdit[] = [];
  const visit = (before: unknown, after: unknown, node: JsonNode) => {
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    if (
      before &&
      after &&
      typeof before === 'object' &&
      typeof after === 'object' &&
      !Array.isArray(before) &&
      !Array.isArray(after) &&
      node.members
    ) {
      const left = before as JsonObject;
      const right = after as JsonObject;
      if (Object.keys(left).some((key) => !(key in right))) {
        const indent = lineIndent(source, node.start);
        edits.push({
          start: node.start,
          end: node.end,
          text: JSON.stringify(after, null, 2).replaceAll('\n', `\n${indent}`),
        });
        return;
      }
      for (const [key, value] of Object.entries(right)) {
        const child = node.members.get(key);
        if (child) visit(left[key], value, child);
      }
      const added = Object.entries(right).filter(([key]) => !node.members!.has(key));
      if (added.length) {
        let insertion = node.end - 1;
        while (insertion > node.start + 1 && /\s/.test(source[insertion - 1]!)) insertion--;
        const indent = lineIndent(source, node.start);
        const childIndent = `${indent}  `;
        const values = added.map(
          ([key, value]) =>
            `${childIndent}${JSON.stringify(key)}: ${JSON.stringify(value, null, 2).replaceAll('\n', `\n${childIndent}`)}`,
        );
        const empty = node.members.size === 0;
        edits.push({
          start: insertion,
          end: insertion,
          text: `${empty ? '' : ','}\n${values.join(',\n')}${empty ? `\n${indent}` : ''}`,
        });
      }
      return;
    }
    const indent = lineIndent(source, node.start);
    edits.push({
      start: node.start,
      end: node.end,
      text: JSON.stringify(after, null, 2).replaceAll('\n', `\n${indent}`),
    });
  };
  visit(original, next, positions);
  const output = applyTextEdits(source, edits);
  if (JSON.stringify(JSON.parse(output)) !== JSON.stringify(next))
    throw new Error('Token source edit did not match the planned values.');
  return output;
}

function rewritePaletteConfig(
  source: string,
  finish: 'su' | 'yu',
  current: FinishInput,
  next: FinishInput,
  changedRamps: Set<RampName>,
) {
  const declaration = source.match(/\bexport\s+const\s+finishes\b[^=]*=\s*\{/);
  if (!declaration || declaration.index === undefined)
    throw new Error('palette.config.ts needs an object literal named finishes.');
  const open = declaration.index + declaration[0].lastIndexOf('{');
  const finishLiteral = objectProperty(
    source,
    { open, close: matchingBrace(source, open) },
    finish,
  );
  const edits: TextEdit[] = [];
  const added: string[] = [];
  for (const ramp of changedRamps) {
    if (JSON.stringify(current[ramp]) === JSON.stringify(next[ramp])) continue;
    const existing = propertyIn(source, finishLiteral, ramp);
    const replacement = renderObject(next[ramp], 4);
    if (existing) {
      edits.push({
        start: existing.start,
        end: existing.end,
        text: replacement,
      });
    } else added.push(`    ${ramp}: ${replacement},`);
  }
  if (added.length) {
    const beforeClose = source.slice(finishLiteral.open, finishLiteral.close).trimEnd();
    const separator = beforeClose.endsWith(',') ? '' : ',';
    edits.push({
      start: finishLiteral.close,
      end: finishLiteral.close,
      text: `${separator}\n${added.join('\n')}\n  `,
    });
  }
  if (current.contrast !== next.contrast) {
    const contrast = propertyIn(source, finishLiteral, 'contrast');
    if (!contrast) throw new Error(`${finish} needs a contrast property in palette.config.ts.`);
    edits.push({
      start: contrast.start,
      end: contrast.end,
      text: String(next.contrast),
    });
  }
  const needsExtendedType = [...changedRamps].some((ramp) => {
    const input = next[ramp];
    return !!(
      input.lightness ||
      input.chromaCurve ||
      input.hueDrift !== undefined ||
      input.pins ||
      input.anchor ||
      (input.solid && (input.solid.light === undefined || input.solid.dark === undefined))
    );
  });
  if (needsExtendedType) {
    const interfaceMatch = source.match(/\bexport\s+interface\s+RampInput\s*\{/);
    if (!interfaceMatch || interfaceMatch.index === undefined)
      throw new Error('palette.config.ts needs a RampInput interface.');
    const interfaceOpen = interfaceMatch.index + interfaceMatch[0].lastIndexOf('{');
    const interfaceClose = matchingBrace(source, interfaceOpen);
    const interfaceSource = source.slice(interfaceOpen, interfaceClose);
    const fields: Record<string, string> = {
      lightness: 'lightness?: { light: number[]; dark: number[] };',
      chromaCurve: 'chromaCurve?: number[];',
      hueDrift: 'hueDrift?: number;',
      pins: "pins?: Partial<Record<'light' | 'dark', Record<number, string>>>;",
      anchor: 'anchor?: string;',
    };
    const additions = Object.entries(fields)
      .filter(([name]) => !new RegExp(`\\b${name}\\?\\s*:`).test(interfaceSource))
      .map(([, definition]) => `  ${definition}`);
    if (additions.length)
      edits.push({
        start: interfaceClose,
        end: interfaceClose,
        text: `${additions.join('\n')}\n`,
      });
    const solid = /\bsolid\?\s*:\s*\{[^}]*\}/.exec(interfaceSource);
    if (solid)
      edits.push({
        start: interfaceOpen + solid.index,
        end: interfaceOpen + solid.index + solid[0].length,
        text: "solid?: Partial<Record<'light' | 'dark', number>>",
      });
  }
  return applyTextEdits(source, edits);
}

export function planPromotion(input: PromotionInput): PromotionPlan {
  const { style, finish, sources, includeShared = false } = input;
  if (finish !== 'su' && finish !== 'yu') throw new Error('Finish must be su or yu.');
  const library = { ...baselineStyles(), ...input.library, [style.id]: style };
  const resolved = resolveStyle(style, library);
  const groups = input.groups ? new Set(input.groups) : undefined;
  if (groups)
    for (const group of groups)
      if (!parameterRegistry.some((parameter) => parameter.group === group))
        throw new Error(`Unknown parameter group "${group}".`);
  const palette = structuredClone(input.paletteInput);
  const initialPalette = structuredClone(input.paletteInput);
  const documents = Object.fromEntries(
    promotionPaths
      .filter((path) => path.endsWith('.json'))
      .map((path) => [path, object(JSON.parse(sources[path]) as unknown, path)]),
  ) as Record<Exclude<PromotionPath, 'packages/tokens/palette.config.ts'>, JsonObject>;
  const themePath = `packages/tokens/src/themes/${finish}.tokens.json` as
    'packages/tokens/src/themes/su.tokens.json' | 'packages/tokens/src/themes/yu.tokens.json';
  const lightPath = 'packages/tokens/src/modes/light.tokens.json' as const;
  const darkPath = 'packages/tokens/src/modes/dark.tokens.json' as const;
  const baseTypePath = 'packages/tokens/src/base/type.tokens.json' as const;
  const baseSpacePath = 'packages/tokens/src/base/space.tokens.json' as const;
  const modes = { light: documents[lightPath], dark: documents[darkPath] };
  const touched = new Map<PromotionPath, string[]>();
  const mark = (path: PromotionPath, id: string) =>
    touched.set(path, [...(touched.get(path) ?? []), id]);
  const changedRamps = new Set<RampName>();
  const skippedShared: string[] = [];
  const unsupported: PromotionPlan['unsupported'] = [];
  const sharedEffects: PromotionPlan['sharedEffects'] = [];
  if (resolved.extraCss?.trim())
    unsupported.push({ id: 'extraCss', reason: 'Make this a registry parameter first.' });

  for (const [id, value] of Object.entries(resolved.params)) {
    const parameter = registryById.get(id);
    if (!parameter) {
      unsupported.push({ id, reason: 'Unknown registry parameter.' });
      continue;
    }
    if (groups && !groups.has(parameter.group)) continue;
    const mapping = promotionMapping(id);
    if (mapping.kind === 'unsupported') {
      unsupported.push({ id, reason: mapping.reason });
      continue;
    }
    if (parameter.layer !== 'finish' && !includeShared) {
      skippedShared.push(id);
      continue;
    }
    try {
      let changed = false;
      let changedModes: Array<'light' | 'dark'> = [];
      if (mapping.kind === 'palette') {
        changed = applyPaletteParam(palette[finish], id, value);
        if (changed) {
          if (id !== 'color.contrast') changedRamps.add(id.split('.')[1] as RampName);
          mark('packages/tokens/palette.config.ts', id);
        }
      } else if (mapping.kind === 'theme') {
        changed = applyThemeParam(documents[themePath], documents[baseTypePath], id, value);
        if (changed) mark(themePath, id);
      } else if (mapping.kind === 'mode') {
        changedModes = applyModeParam(modes, id, value, parameter.tokenPath);
        changed = changedModes.length > 0;
        for (const mode of changedModes) mark(mode === 'light' ? lightPath : darkPath, id);
      } else if (mapping.kind === 'base-type') {
        changed = applyBaseTypeParam(documents[baseTypePath], id, value);
        if (changed) mark(baseTypePath, id);
        if (/^type\.(display|title)\.size$/.test(id)) {
          const role = id.split('.')[1]!;
          for (const theme of ['su', 'yu'] as const) {
            const path = `packages/tokens/src/themes/${theme}.tokens.json` as
              | 'packages/tokens/src/themes/su.tokens.json'
              | 'packages/tokens/src/themes/yu.tokens.json';
            const typeGroup = documents[path].type;
            if (!typeGroup || !object(typeGroup, `${theme}.type`)[role]) continue;
            const roleValue = object(
              token(documents[path], ['type', role], `${theme} theme`).$value,
              `${theme}.type.${role}.$value`,
            );
            const size = dimension(value, 'px');
            if (JSON.stringify(roleValue.fontSize) !== JSON.stringify(size)) {
              roleValue.fontSize = size;
              mark(path, id);
              changed = true;
            }
          }
        }
      } else if (mapping.kind === 'base-space') {
        changed = applyBaseSpaceParam(documents[baseSpacePath], id, value);
        if (changed) mark(baseSpacePath, id);
      }
      if (changed && parameter.layer !== 'finish') {
        const contexts: PromotionPlan['sharedEffects'][number]['contexts'] =
          mapping.kind === 'mode'
            ? finish === 'su'
              ? changedModes.includes('dark')
                ? ['yu-dark']
                : []
              : changedModes.map((mode) => `su-${mode}` as 'su-light' | 'su-dark')
            : finish === 'su'
              ? ['yu-dark']
              : ['su-light', 'su-dark'];
        if (contexts.length) sharedEffects.push({ id, value, contexts });
      }
    } catch (error) {
      unsupported.push({
        id,
        reason: error instanceof Error ? error.message : 'Could not map this parameter.',
      });
    }
  }

  const files: PromotionPlan['files'] = [];
  for (const path of promotionPaths) {
    const parameters = touched.get(path);
    if (!parameters?.length) continue;
    const after =
      path === 'packages/tokens/palette.config.ts'
        ? rewritePaletteConfig(
            sources[path],
            finish,
            initialPalette[finish],
            palette[finish],
            changedRamps,
          )
        : rewriteJsonSource(
            sources[path],
            documents[path as Exclude<PromotionPath, 'packages/tokens/palette.config.ts'>],
          );
    if (after !== sources[path]) files.push({ path, before: sources[path], after, parameters });
  }
  const decisionLogDraft = `| YYYY-MM-DD | Promote ${style.name} (${style.id}) to ${finish} | ${[...new Set(files.flatMap((file) => file.parameters))].join(', ') || 'No token changes'} | ${style.notes?.trim() || 'Add decision rationale.'} |`;
  return {
    finish,
    styleId: style.id,
    files,
    skippedShared,
    unsupported,
    sharedEffects,
    decisionLogDraft,
  };
}

export interface PromotionOperations {
  writeSource: (path: PromotionPath, contents: string) => Promise<void>;
  formatPalette: () => Promise<void>;
  runPalette: () => Promise<void>;
  runTokens: () => Promise<void>;
  runTests: () => Promise<void>;
  checkContrast: () => Promise<void>;
  restoreDerived: () => Promise<void>;
}

/** Apply planned sources and checks, restoring the exact prior source bytes on failure. */
export async function applyPromotionPlan(plan: PromotionPlan, operations: PromotionOperations) {
  let startedWriting = false;
  try {
    for (const file of plan.files) {
      startedWriting = true;
      await operations.writeSource(file.path, file.after);
    }
    if (plan.files.some((file) => file.path === 'packages/tokens/palette.config.ts'))
      await operations.formatPalette();
    await operations.runPalette();
    await operations.runTokens();
    await operations.runTests();
    await operations.checkContrast();
  } catch (error) {
    if (!startedWriting) throw error;
    const rollbackErrors: string[] = [];
    for (const file of plan.files) {
      try {
        await operations.writeSource(file.path, file.before);
      } catch (rollbackError) {
        rollbackErrors.push(`restore ${file.path}: ${errorMessage(rollbackError)}`);
      }
    }
    for (const [label, action] of [
      ['regenerate palettes', operations.runPalette],
      ['regenerate tokens', operations.runTokens],
      ['restore prior derived files', operations.restoreDerived],
    ] as const) {
      try {
        await action();
      } catch (rollbackError) {
        rollbackErrors.push(`${label}: ${errorMessage(rollbackError)}`);
      }
    }
    throw new Error(
      `Promotion failed: ${errorMessage(error)}\n${
        rollbackErrors.length
          ? `Rollback incomplete: ${rollbackErrors.join('; ')}`
          : 'Restored prior token source and derived files.'
      }`,
      { cause: error },
    );
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
