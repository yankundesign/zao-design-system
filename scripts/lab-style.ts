/** File-based companion to the local lab editor. Run with `pnpm lab:style <command>`. */
import { readFile, readdir, mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  baseVariablesFromTokens,
  baselineParameterValues,
  baselineStyles,
  diff,
  interpolate,
  mix,
  paletteAliasesFromTokens,
  parameterRegistry,
  resolveStyle,
  sweep,
  toCssVars,
  validateStyle,
  vary,
  type StyleFile,
} from '../packages/engine/src/index.ts';
import { finishes } from '../packages/tokens/palette.config.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const stylesDir = join(root, 'explorations/styles');
const contexts = ['su-light', 'su-dark', 'yu-dark'] as const;

function pathFor(id: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error('Style id must contain lowercase letters, numbers and hyphens.');
  return join(stylesDir, `${id}.style.json`);
}

async function allStyles() {
  await mkdir(stylesDir, { recursive: true });
  const files = (await readdir(stylesDir)).filter((file) => file.endsWith('.style.json'));
  const entries = await Promise.all(files.map((file) => readFile(join(stylesDir, file), 'utf8')));
  const styles = entries.map((source) => JSON.parse(source) as unknown);
  for (const style of styles) validateStyle(style);
  return Object.fromEntries(styles.map((style) => [(style as StyleFile).id, style as StyleFile]));
}

async function savedStyle(id: string) {
  const styles = await allStyles();
  const style = styles[id];
  if (!style) throw new Error(`Style "${id}" was not found.`);
  return style;
}

async function save(style: StyleFile, exclusive = false) {
  validateStyle(style);
  await mkdir(stylesDir, { recursive: true });
  await writeFile(pathFor(style.id), `${JSON.stringify(style, null, 2)}\n`, {
    flag: exclusive ? 'wx' : 'w',
  });
}

function help() {
  console.log(`Commands:
  list
  show <id>
  fork <source> <new-id> <name> [author]   author defaults to agent:lab-cli
  set <id> <parameter> <value>            value is JSON or a CSS string
  unset <id> <parameter>
  rename <id> <name>
  extra-css <id> <file>
  diff <id>
  compare <id1> <id2> [id3 id4] [--context su-light|su-dark|yu-dark]
  render <id> <su-light|su-dark|yu-dark>
  mix <base> --color <id> --type <id> [--id <new-id>] [--context <context>]
  interpolate <from> <to> --at <0..1> [--id <new-id>] [--context <context>]
  sweep <style> <parameter> --values <JSON-array|comma-list> [--prefix <id>]
  vary <style> --params <glob,glob> [--spread 0.1] [--count 6] [--seed 1] [--prefix <id>]
  delete <id>

Mix group flags: --color, --type, --shape, --space, --depth, --motion, --mode.
Transforms default to the base style's native context, or dark when Su and Yu are mixed. Use --context su-light, su-dark or yu-dark to choose a mode. Yu has a dark baseline only.`);
}

function parseOptions(args: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]!;
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const key = argument.slice(2);
    const value = args[++index];
    if (!key || !value || value.startsWith('--') || key in flags)
      throw new Error(`Option --${key} needs one value and may appear only once.`);
    flags[key] = value;
  }
  return { positional, flags };
}

function onlyFlags(flags: Record<string, string>, allowed: string[]) {
  for (const flag of Object.keys(flags))
    if (!allowed.includes(flag)) throw new Error(`Unknown option --${flag}.`);
}

function requireStyle(id: string | undefined, styles: Record<string, StyleFile>) {
  const style = id ? styles[id] : undefined;
  if (!style) throw new Error(`Style "${id ?? ''}" was not found.`);
  return style;
}

function nativeContext(style: StyleFile, styles: Record<string, StyleFile>) {
  let parent = style.extends;
  const visited = new Set([style.id]);
  while (parent !== 'su' && parent !== 'yu') {
    if (visited.has(parent)) throw new Error(`Style inheritance cycle at "${parent}".`);
    visited.add(parent);
    parent = requireStyle(parent, styles).extends;
  }
  return parent === 'yu' ? 'yu-dark' : 'su-light';
}

async function baselineParams(contextId: (typeof contexts)[number]) {
  const [theme] = contextId.split('-') as ['su' | 'yu'];
  const document = JSON.parse(
    await readFile(join(root, 'packages/tokens/dist/json', `${contextId}.json`), 'utf8'),
  ) as {
    tokens: Record<string, { type: string; cssVar: string; value: unknown; aliasOf?: string }>;
  };
  const variables = baseVariablesFromTokens(document.tokens);
  return baselineParameterValues(
    finishes[theme],
    variables,
    paletteAliasesFromTokens(document.tokens),
  );
}

async function transformContext(
  requested: string | undefined,
  base: StyleFile,
  styles: Record<string, StyleFile>,
) {
  const contextId = requested ?? nativeContext(base, styles);
  if (!contexts.includes(contextId as (typeof contexts)[number]))
    throw new Error('Context must be su-light, su-dark or yu-dark.');
  const mode = contextId.endsWith('-dark') ? 'dark' : 'light';
  return {
    baselines: styles,
    baselineParams: await baselineParams(contextId as (typeof contexts)[number]),
    baselineParamsByRoot: {
      su: await baselineParams(mode === 'dark' ? 'su-dark' : 'su-light'),
      yu: await baselineParams('yu-dark'),
    },
  };
}

function parseValues(raw: string | undefined) {
  if (!raw) throw new Error('Sweep needs --values with a JSON array or comma-separated values.');
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Continue with a comma-separated list.
  }
  return raw.split(',').map((item) => {
    const trimmed = item.trim();
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed;
    }
  });
}

async function saveDerived(styles: StyleFile[], ids: string[]) {
  if (styles.length !== ids.length) throw new Error('Each generated style needs an id.');
  if (new Set(ids).size !== ids.length) throw new Error('Generated style ids must be unique.');
  const existing = await allStyles();
  for (const id of ids) {
    pathFor(id);
    if (id in existing || id === 'su' || id === 'yu')
      throw new Error(`Style "${id}" already exists. Choose another --id or --prefix.`);
  }
  for (const [index, style] of styles.entries()) {
    const output = {
      ...style,
      id: ids[index]!,
      author: 'agent:lab-cli',
      ...(style.generated ? { generated: false } : {}),
    };
    await save(output, true);
    console.log(`Created ${pathFor(output.id)}.`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === 'help') return help();
  if (command === 'list') {
    const styles = await allStyles();
    console.log(
      JSON.stringify([...Object.values(baselineStyles()), ...Object.values(styles)], null, 2),
    );
    return;
  }
  if (command === 'show') {
    const style = (await allStyles())[args[0]!] ?? baselineStyles()[args[0] as 'su' | 'yu'];
    if (!style) throw new Error(`Style "${args[0]}" was not found.`);
    console.log(JSON.stringify(style, null, 2));
    return;
  }
  if (command === 'compare') {
    const { positional, flags } = parseOptions(args);
    onlyFlags(flags, ['context']);
    if (
      positional.length < 2 ||
      positional.length > 4 ||
      new Set(positional).size !== positional.length
    )
      throw new Error(
        'Usage: compare <id1> <id2> [id3 id4] [--context su-light|su-dark|yu-dark]. Choose 2–4 distinct styles.',
      );
    const styles = { ...baselineStyles(), ...(await allStyles()) } as Record<string, StyleFile>;
    const selected = positional.map((id) => requireStyle(id, styles));
    const hasYu = selected.some((style) => nativeContext(style, styles) === 'yu-dark');
    const native = nativeContext(selected[0]!, styles);
    const contextId = flags.context ?? (hasYu && native === 'su-light' ? 'su-dark' : native);
    if (!contexts.includes(contextId as (typeof contexts)[number]))
      throw new Error('Context must be su-light, su-dark or yu-dark.');
    const selectedContexts = selected.map((style) =>
      nativeContext(style, styles) === 'yu-dark'
        ? 'yu-dark'
        : contextId === 'yu-dark' || (contextId === 'su-light' && !style.modes.includes('light'))
          ? 'su-dark'
          : contextId,
    ) as Array<(typeof contexts)[number]>;
    const baselines = Object.fromEntries(
      await Promise.all(
        [...new Set(selectedContexts)].map(async (id) => [id, await baselineParams(id)]),
      ),
    ) as Record<(typeof contexts)[number], Record<string, unknown>>;
    const values = selected.map((style, index) => {
      const inherited = resolveStyle(style, styles).params;
      return Object.fromEntries(
        parameterRegistry.map((parameter) => [
          parameter.id,
          inherited[parameter.id] ?? baselines[selectedContexts[index]!]![parameter.id],
        ]),
      );
    });
    const differences = parameterRegistry
      .filter((parameter) => {
        const first = JSON.stringify(values[0]?.[parameter.id]);
        return values.slice(1).some((entry) => JSON.stringify(entry[parameter.id]) !== first);
      })
      .map((parameter) => ({
        id: parameter.id,
        label: parameter.label,
        group: parameter.group,
        values: values.map((entry) => entry[parameter.id] ?? null),
      }));
    console.log(
      JSON.stringify(
        {
          context: contextId,
          styles: selected.map(({ id, name }, index) => ({
            id,
            name,
            context: selectedContexts[index],
          })),
          differences,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'fork') {
    const [sourceId, id, name, author = 'agent:lab-cli'] = args;
    if (!sourceId || !id || !name) throw new Error('Usage: fork <source> <new-id> <name> [author]');
    const source = (await allStyles())[sourceId] ?? baselineStyles()[sourceId as 'su' | 'yu'];
    if (!source) throw new Error(`Source style "${sourceId}" was not found.`);
    const fork: StyleFile = {
      $schema: '../../packages/engine/schema/style.schema.json',
      id,
      name,
      extends: sourceId,
      author,
      modes: [...source.modes],
      params: {},
    };
    await save(fork, true);
    console.log(`Created ${pathFor(id)}.`);
    return;
  }
  if (command === 'render') {
    const [id, contextId] = args;
    if (!id || !contexts.includes(contextId as (typeof contexts)[number]))
      throw new Error('Usage: render <id> <su-light|su-dark|yu-dark>');
    const styles = await allStyles();
    const roots = baselineStyles();
    const style = styles[id] ?? roots[id as 'su' | 'yu'];
    if (!style) throw new Error(`Style "${id}" was not found.`);
    const [theme, mode] = contextId!.split('-') as ['su' | 'yu', 'light' | 'dark'];
    const document = JSON.parse(
      await readFile(join(root, 'packages/tokens/dist/json', `${contextId}.json`), 'utf8'),
    ) as {
      tokens: Record<string, { type: string; cssVar: string; value: unknown; aliasOf?: string }>;
    };
    const variables = toCssVars(style, {
      theme,
      mode,
      baseVariables: baseVariablesFromTokens(document.tokens),
      baselines: { ...roots, ...styles },
      paletteInput: finishes[theme],
      paletteAliases: paletteAliasesFromTokens(document.tokens),
    });
    console.log(JSON.stringify(variables, null, 2));
    return;
  }
  if (['mix', 'interpolate', 'sweep', 'vary'].includes(command)) {
    const { positional, flags } = parseOptions(args);
    const styles = { ...baselineStyles(), ...(await allStyles()) } as Record<string, StyleFile>;
    const source = requireStyle(positional[0], styles);
    if (command === 'mix') {
      const groups = {
        color: 'color',
        type: 'type',
        shape: 'shape',
        space: 'space and density',
        depth: 'depth and material',
        motion: 'motion',
        mode: 'mode',
      } as const;
      onlyFlags(flags, [...Object.keys(groups), 'id', 'name', 'context']);
      if (positional.length !== 1)
        throw new Error('Usage: mix <base> --color <id> [--type <id> …]');
      const selected = Object.fromEntries(
        Object.entries(groups)
          .filter(([flag]) => flag in flags)
          .map(([flag, group]) => [group, requireStyle(flags[flag], styles)]),
      );
      if (!Object.keys(selected).length)
        throw new Error('Choose at least one source group to mix.');
      const useDark = Object.values(selected).some(
        (entry) => nativeContext(entry, styles) === 'yu-dark',
      );
      const context = await transformContext(
        flags.context ??
          (useDark && nativeContext(source, styles) === 'su-light' ? 'su-dark' : undefined),
        source,
        styles,
      );
      const result = mix(source, selected, context);
      if (flags.name) result.name = flags.name;
      await saveDerived([result], [flags.id ?? `${source.id}-mix`]);
      return;
    }
    if (command === 'interpolate') {
      onlyFlags(flags, ['at', 'id', 'name', 'context']);
      if (positional.length !== 2 || flags.at === undefined)
        throw new Error('Usage: interpolate <from> <to> --at <0..1> [--id <new-id>]');
      const target = requireStyle(positional[1], styles);
      const amount = Number(flags.at);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1)
        throw new Error('--at must be a number from 0 to 1.');
      const context = await transformContext(
        flags.context ??
          (nativeContext(source, styles) === 'su-light' &&
          nativeContext(target, styles) === 'yu-dark'
            ? 'su-dark'
            : undefined),
        source,
        styles,
      );
      const result = interpolate(source, target, amount, context);
      if (flags.name) result.name = flags.name;
      const slug = String(amount).replace('.', '-');
      await saveDerived([result], [flags.id ?? `${source.id}-to-${target.id}-${slug}`]);
      return;
    }
    if (command === 'sweep') {
      onlyFlags(flags, ['values', 'prefix']);
      if (positional.length !== 2)
        throw new Error('Usage: sweep <style> <parameter> --values <JSON-array|comma-list>');
      const values = parseValues(flags.values);
      const results = sweep(source, positional[1]!, values);
      const prefix = flags.prefix ?? `${source.id}-sweep`;
      await saveDerived(
        results,
        results.map((_, index) => `${prefix}-${index + 1}`),
      );
      return;
    }
    onlyFlags(flags, ['params', 'spread', 'count', 'seed', 'prefix', 'context']);
    if (positional.length !== 1 || !flags.params)
      throw new Error(
        'Usage: vary <style> --params <glob,glob> [--spread 0.1] [--count 6] [--seed 1]',
      );
    const count = Number(flags.count ?? 6);
    const seed = Number(flags.seed ?? 1);
    const spread = Number(flags.spread ?? 0.1);
    const context = await transformContext(flags.context, source, styles);
    const results = vary(source, {
      ...context,
      params: flags.params
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
      spread,
      count,
      seed,
    });
    const prefix = flags.prefix ?? `${source.id}-variation-${seed}`;
    await saveDerived(
      results,
      results.map((_, index) => `${prefix}-${index + 1}`),
    );
    return;
  }
  const id = args[0];
  if (!id) throw new Error('A saved style id is required.');
  const style = await savedStyle(id);
  if (command === 'delete') {
    const child = Object.values(await allStyles()).find((candidate) => candidate.extends === id);
    if (child) throw new Error(`Style "${id}" is the parent of "${child.id}".`);
    await unlink(pathFor(id));
    console.log(`Deleted ${id}.`);
    return;
  }
  if (command === 'diff') {
    const styles = await allStyles();
    const all: Record<string, StyleFile> = { ...baselineStyles(), ...styles };
    const parent = all[style.extends];
    if (!parent) throw new Error(`Parent style "${style.extends}" was not found.`);
    console.log(JSON.stringify(diff(resolveStyle(parent, all), resolveStyle(style, all)), null, 2));
    return;
  }
  if (command === 'rename') {
    if (!args[1]) throw new Error('Usage: rename <id> <name>');
    style.name = args[1];
  } else if (command === 'set') {
    const [, parameter, raw] = args;
    if (!parameter || raw === undefined) throw new Error('Usage: set <id> <parameter> <value>');
    let value: unknown = raw;
    if (parameter !== 'color.ramp.extra') {
      try {
        value = JSON.parse(raw);
      } catch {
        // CSS colors, font family names and other strings need no JSON quoting.
      }
    }
    style.params[parameter] = value;
  } else if (command === 'unset') {
    if (!args[1]) throw new Error('Usage: unset <id> <parameter>');
    delete style.params[args[1]];
  } else if (command === 'extra-css') {
    if (!args[1]) throw new Error('Usage: extra-css <id> <file>');
    style.extraCss = await readFile(args[1], 'utf8');
  } else {
    throw new Error(`Unknown command "${command}". Run help for usage.`);
  }
  await save(style);
  console.log(`Saved ${pathFor(id)}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
