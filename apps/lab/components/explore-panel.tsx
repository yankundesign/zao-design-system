'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  baselineStyles,
  interpolate,
  mix,
  parameterRegistry,
  resolveStyle,
  sweep,
  vary,
  type StyleFile,
} from '@zao/engine';
import { resolveExtraCss } from '@/lib/extra-css';
import { scopedExtraCss } from '@/lib/island-css';
import type { ContextId, ContextVariables } from '@/lib/token-data';
import type { specimens } from '@/lib/specimens';

type Specimen = (typeof specimens)[number];
type ExploreTool = 'compare' | 'mix' | 'interpolate' | 'sweep' | 'variations';
type Preview = { style: StyleFile; context: ContextId; label: string };

const contextDetails: Record<
  ContextId,
  { theme: 'su' | 'yu'; mode: 'light' | 'dark'; label: string }
> = {
  'su-light': { theme: 'su', mode: 'light', label: 'Su · light' },
  'su-dark': { theme: 'su', mode: 'dark', label: 'Su · dark' },
  'yu-dark': { theme: 'yu', mode: 'dark', label: 'Yu · dark' },
};
const groups = [...new Set(parameterRegistry.map((parameter) => parameter.group))];
const fieldClass =
  'h-8 min-w-0 rounded-control border border-default bg-surface px-2 type-body text-default outline-focus';
const buttonClass =
  'h-8 rounded-action border border-default bg-surface px-3 type-label trim-label text-default hover:bg-hover disabled:opacity-50';

function nativeContext(
  style: StyleFile,
  selected: ContextId,
  library: Record<string, StyleFile>,
): ContextId {
  if (rootFinish(style, library) === 'yu') return 'yu-dark';
  if (selected === 'yu-dark' || (selected === 'su-light' && !style.modes.includes('light')))
    return 'su-dark';
  return selected;
}

function rootFinish(style: StyleFile, library: Record<string, StyleFile>) {
  let parent = style.extends;
  const seen = new Set([style.id]);
  while (parent !== 'su' && parent !== 'yu' && library[parent] && !seen.has(parent)) {
    seen.add(parent);
    parent = library[parent]!.extends;
  }
  return parent;
}

function valueLabel(value: unknown) {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function PreviewCard({
  preview,
  index,
  specimen,
  variables,
  css,
  onScroll,
  footer,
}: {
  preview: Preview;
  index: number;
  specimen: Specimen;
  variables?: Record<string, string>;
  css: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  footer?: React.ReactNode;
}) {
  const details = contextDetails[preview.context];
  const id = `explore-${index}-${specimen.id}-${preview.context}`;
  const Component = specimen.Component;
  return (
    <section className="min-w-0 overflow-hidden rounded-surface border border-subtle bg-surface">
      <div className="flex items-start justify-between gap-2 border-b border-subtle px-3 py-2">
        <div className="min-w-0">
          <h3 className="type-label font-medium">{preview.label}</h3>
          <p className="type-caption text-muted">{details.label}</p>
        </div>
        {preview.style.generated ? (
          <span className="rounded-pill border border-subtle px-2 type-caption">Generated</span>
        ) : null}
      </div>
      <div className="max-h-screen overflow-auto" data-compare-scroll onScroll={onScroll}>
        {variables ? (
          <div
            data-lab-island={id}
            data-zao-theme={details.theme}
            data-zao-mode={details.mode}
            className="lab-island"
            style={{ ...(variables as CSSProperties), colorScheme: details.mode }}
          >
            {css ? <style>{scopedExtraCss(css, id)}</style> : null}
            <Component />
          </div>
        ) : (
          <p role="status" className="p-4 type-body text-muted">
            Rendering preview…
          </p>
        )}
      </div>
      {footer ? <div className="border-t border-subtle p-3">{footer}</div> : null}
    </section>
  );
}

export default function ExplorePanel({
  styles,
  currentStyle,
  specimen,
  context,
  baselineVars,
  baselineParams,
  onSaveStyle,
}: {
  styles: StyleFile[];
  currentStyle: StyleFile;
  specimen: Specimen;
  context: ContextId;
  baselineVars: ContextVariables;
  baselineParams: Record<ContextId, Record<string, unknown>>;
  onSaveStyle: (style: StyleFile, name: string) => Promise<void>;
}) {
  const [tool, setTool] = useState<ExploreTool>('compare');
  const [compareIds, setCompareIds] = useState<string[]>([currentStyle.id]);
  const [baseId, setBaseId] = useState(currentStyle.id);
  const [sourceIds, setSourceIds] = useState<Record<string, string>>({});
  const [fromId, setFromId] = useState(currentStyle.id);
  const [toId, setToId] = useState('');
  const [position, setPosition] = useState(0.5);
  const [parameterId, setParameterId] = useState('');
  const [valuesText, setValuesText] = useState('');
  const [varyParams, setVaryParams] = useState('');
  const [spread, setSpread] = useState(0.05);
  const [count, setCount] = useState(6);
  const [seed, setSeed] = useState(1);
  const [starred, setStarred] = useState<string[]>([]);
  const [saveNames, setSaveNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, ContextVariables>>({});
  const [renderError, setRenderError] = useState('');
  const synchronizing = useRef(false);

  const styleOptions = useMemo(() => {
    const saved = styles.filter((style) => style.id !== currentStyle.id);
    return [
      ...Object.values(baselineStyles()).filter((style) => style.id !== currentStyle.id),
      ...saved,
      currentStyle,
    ];
  }, [styles, currentStyle]);
  const library = useMemo(
    () => Object.fromEntries(styleOptions.map((style) => [style.id, style])),
    [styleOptions],
  );
  const styleById = (id: string) => library[id];
  const contextValues = baselineParams[context];

  useEffect(() => {
    setCompareIds([currentStyle.id]);
    setBaseId(currentStyle.id);
    setFromId(currentStyle.id);
  }, [currentStyle.id]);

  const generated = useMemo(() => {
    try {
      if (tool === 'compare')
        return {
          previews: compareIds.flatMap((id) => {
            const style = library[id];
            return style
              ? [{ style, context: nativeContext(style, context, library), label: style.name }]
              : [];
          }),
          error: '',
        };
      const transformContext = {
        baselines: library,
        baselineParams: contextValues,
        baselineParamsByRoot: {
          su: baselineParams[context === 'su-light' ? 'su-light' : 'su-dark'],
          yu: baselineParams['yu-dark'],
        },
      };
      if (tool === 'mix') {
        const base = styleById(baseId);
        if (!base || !Object.values(sourceIds).some(Boolean)) return { previews: [], error: '' };
        const sources = Object.fromEntries(
          Object.entries(sourceIds).flatMap(([group, id]) =>
            id && styleById(id) ? [[group, styleById(id)!]] : [],
          ),
        );
        const style = mix(base, sources, transformContext);
        return { previews: [{ style, context, label: style.name }], error: '' };
      }
      if (tool === 'interpolate') {
        const from = styleById(fromId);
        const to = styleById(toId);
        if (!from || !to || from.id === to.id) return { previews: [], error: '' };
        const fromRoot = rootFinish(from, library);
        const crossFinish = fromRoot !== rootFinish(to, library);
        const previewContext: ContextId = crossFinish
          ? fromRoot === 'yu'
            ? 'yu-dark'
            : 'su-dark'
          : context;
        const style = interpolate(from, to, position, {
          ...transformContext,
          baselineParams: baselineParams[previewContext],
          baselineParamsByRoot: {
            su: baselineParams[
              crossFinish ? 'su-dark' : context === 'su-light' ? 'su-light' : 'su-dark'
            ],
            yu: baselineParams['yu-dark'],
          },
        });
        return {
          previews: [
            {
              style,
              context: previewContext,
              label: `${Math.round(position * 100)}% toward ${to.name}`,
            },
          ],
          error: '',
        };
      }
      if (tool === 'sweep') {
        const source = styleById(baseId);
        if (!source || !parameterId || !valuesText.trim()) return { previews: [], error: '' };
        const values: unknown = JSON.parse(valuesText);
        if (!Array.isArray(values) || values.length < 2 || values.length > 12)
          throw new Error('Enter a JSON array of 2–12 values.');
        const variants = sweep(source, parameterId, values);
        return {
          previews: variants.map((style, index) => ({
            style,
            context,
            label: `${parameterId}: ${valueLabel(values[index])}`,
          })),
          error: '',
        };
      }
      const source = styleById(baseId);
      if (!source || !varyParams.trim()) return { previews: [], error: '' };
      const params = varyParams
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const variants = vary(source, {
        params,
        spread,
        count,
        seed,
        baselineParams: contextValues,
        baselines: library,
      });
      return {
        previews: variants.map((style) => ({ style, context, label: style.name })),
        error: '',
      };
    } catch (error) {
      return {
        previews: [],
        error: error instanceof Error ? error.message : 'Could not generate previews.',
      };
    }
    // The lookup function reads library; listing it keeps style changes reactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool,
    compareIds,
    library,
    context,
    contextValues,
    baselineParams,
    baseId,
    sourceIds,
    fromId,
    toId,
    position,
    parameterId,
    valuesText,
    varyParams,
    spread,
    count,
    seed,
  ]);

  const previews = generated.previews;
  const previewKey = JSON.stringify(previews.map(({ style, context: id }) => [style, id]));

  useEffect(() => {
    const controller = new AbortController();
    setVariables({});
    async function load() {
      try {
        const result: Record<string, ContextVariables> = {};
        await Promise.all(
          previews.map(async ({ style }) => {
            if (style.id === 'su' || style.id === 'yu') return;
            const response = await fetch('/api/render', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(style),
              signal: controller.signal,
            });
            const payload: { variables?: ContextVariables; error?: string } = await response.json();
            if (!response.ok || !payload.variables)
              throw new Error(payload.error ?? `Could not render ${style.name}.`);
            result[style.id] = payload.variables;
          }),
        );
        if (!controller.signal.aborted) {
          setVariables(result);
          setRenderError('');
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setRenderError(error instanceof Error ? error.message : 'Could not render previews.');
      }
    }
    void load();
    return () => controller.abort();
    // previewKey holds the exact style content and context for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  useEffect(() => setStarred([]), [previewKey]);

  const differences = useMemo(() => {
    if (tool !== 'compare' || previews.length < 2) return [];
    const resolved = previews.map(({ style, context: previewContext }) => {
      const inherited = resolveStyle(style, library).params;
      return Object.fromEntries(
        parameterRegistry.map((parameter) => [
          parameter.id,
          inherited[parameter.id] ?? baselineParams[previewContext][parameter.id],
        ]),
      );
    });
    return parameterRegistry
      .filter((parameter) => {
        const first = JSON.stringify(resolved[0]?.[parameter.id]);
        return resolved.slice(1).some((values) => JSON.stringify(values[parameter.id]) !== first);
      })
      .map((parameter) => ({ parameter, values: resolved.map((values) => values[parameter.id]) }));
  }, [tool, previews, library, baselineParams]);

  async function saveOne(style: StyleFile) {
    setSaving(true);
    setMessage('Saving generated style…');
    try {
      await onSaveStyle(style, saveNames[style.id]?.trim() || style.name);
      setMessage(`Saved ${saveNames[style.id]?.trim() || style.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the style.');
    } finally {
      setSaving(false);
    }
  }

  async function saveStarred() {
    setSaving(true);
    setMessage('Saving starred variations…');
    try {
      for (const { style } of previews.filter((entry) => starred.includes(entry.style.id)))
        await onSaveStyle(style, saveNames[style.id]?.trim() || style.name);
      setMessage(`Saved ${starred.length} starred variations.`);
      setStarred([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save variations.');
    } finally {
      setSaving(false);
    }
  }

  function synchronizeScroll(event: React.UIEvent<HTMLDivElement>) {
    if (synchronizing.current) return;
    synchronizing.current = true;
    const source = event.currentTarget;
    const ratio = source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight);
    source
      .closest('[data-explore-grid]')
      ?.querySelectorAll<HTMLElement>('[data-compare-scroll]')
      .forEach((target) => {
        if (target !== source)
          target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
      });
    window.requestAnimationFrame(() => {
      synchronizing.current = false;
    });
  }

  return (
    <section aria-label="Explore styles" className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2 border-b border-subtle pb-3">
        {(['compare', 'mix', 'interpolate', 'sweep', 'variations'] as const).map((item) => (
          <button
            aria-pressed={tool === item}
            className={`${buttonClass} ${tool === item ? 'border-accent' : ''}`}
            key={item}
            onClick={() => {
              setTool(item);
              setMessage('');
            }}
            type="button"
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {tool === 'compare' ? (
        <div className="flex flex-wrap items-end gap-3">
          {compareIds.map((id, index) => (
            <label className="flex min-w-0 flex-col gap-1 type-label" key={index}>
              Style {index + 1}
              <span className="flex gap-1">
                <select
                  className={fieldClass}
                  value={id}
                  onChange={(event) =>
                    setCompareIds((entries) =>
                      entries.map((entry, position) =>
                        position === index ? event.target.value : entry,
                      ),
                    )
                  }
                >
                  {styleOptions.map((style) => (
                    <option
                      disabled={compareIds.includes(style.id) && style.id !== id}
                      key={style.id}
                      value={style.id}
                    >
                      {style.name}
                    </option>
                  ))}
                </select>
                {index > 0 ? (
                  <button
                    aria-label={`Remove style ${index + 1}`}
                    className={buttonClass}
                    onClick={() =>
                      setCompareIds((entries) =>
                        entries.filter((_, position) => position !== index),
                      )
                    }
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </span>
            </label>
          ))}
          <button
            className={buttonClass}
            disabled={compareIds.length >= 4 || compareIds.length >= styleOptions.length}
            onClick={() => {
              const next = styleOptions.find((style) => !compareIds.includes(style.id));
              if (next) setCompareIds((entries) => [...entries, next.id]);
            }}
            type="button"
          >
            Add style
          </button>
          <p className="type-caption text-muted">
            Scroll one preview to scroll the others. Virtual baselines use their native finish when
            this context differs.
          </p>
        </div>
      ) : null}

      {tool === 'mix' ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 type-label">
            Base style
            <select
              className={fieldClass}
              value={baseId}
              onChange={(event) => setBaseId(event.target.value)}
            >
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <label className="flex flex-col gap-1 type-label" key={group}>
                {group}
                <select
                  className={fieldClass}
                  value={sourceIds[group] ?? ''}
                  onChange={(event) =>
                    setSourceIds((entries) => ({ ...entries, [group]: event.target.value }))
                  }
                >
                  <option value="">Keep base</option>
                  {styleOptions.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="type-caption text-muted">Choose at least one source group to make a mix.</p>
        </div>
      ) : null}

      {tool === 'interpolate' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 type-label">
            From
            <select
              className={fieldClass}
              value={fromId}
              onChange={(event) => setFromId(event.target.value)}
            >
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 type-label">
            Toward
            <select
              className={fieldClass}
              value={toId}
              onChange={(event) => setToId(event.target.value)}
            >
              <option value="">Choose a style</option>
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 type-label md:col-span-2">
            Position · {Math.round(position * 100)}%
            <input
              className="h-8 w-full"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
            />
          </label>
          <p className="type-caption text-muted md:col-span-2">
            When finishes differ, the preview uses the first style’s dark context. The saved result
            inherits from that finish.
          </p>
        </div>
      ) : null}

      {tool === 'sweep' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 type-label">
            Source style
            <select
              className={fieldClass}
              value={baseId}
              onChange={(event) => setBaseId(event.target.value)}
            >
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 type-label">
            Parameter
            <select
              className={fieldClass}
              value={parameterId}
              onChange={(event) => setParameterId(event.target.value)}
            >
              <option value="">Choose a parameter</option>
              {parameterRegistry.map((parameter) => (
                <option key={parameter.id} value={parameter.id}>
                  {parameter.label} · {parameter.id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 type-label md:col-span-2">
            Values as a JSON array
            <input
              className={fieldClass}
              value={valuesText}
              onChange={(event) => setValuesText(event.target.value)}
              placeholder="For example: [4, 8, 12]"
            />
          </label>
        </div>
      ) : null}

      {tool === 'variations' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 type-label">
            Source style
            <select
              className={fieldClass}
              value={baseId}
              onChange={(event) => setBaseId(event.target.value)}
            >
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 type-label">
            Groups, parameter IDs or globs
            <input
              className={fieldClass}
              value={varyParams}
              onChange={(event) => setVaryParams(event.target.value)}
              placeholder="Choose what to vary"
              list="vary-options"
            />
            <datalist id="vary-options">
              {groups.map((group) => (
                <option key={group} value={group} />
              ))}
              {parameterRegistry.map((parameter) => (
                <option key={parameter.id} value={parameter.id} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 type-label">
            Spread
            <input
              className={fieldClass}
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={spread}
              onChange={(event) => setSpread(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 type-label">
            Count
            <input
              className={fieldClass}
              type="number"
              min="1"
              max="12"
              step="1"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 type-label">
            Seed
            <input
              className={fieldClass}
              type="number"
              step="1"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
            />
          </label>
          <div className="flex items-end">
            <button
              className={buttonClass}
              disabled={!starred.length || saving}
              onClick={() => void saveStarred()}
              type="button"
            >
              Save {starred.length} starred
            </button>
          </div>
        </div>
      ) : null}

      {generated.error || renderError ? (
        <p role="alert" className="type-body text-danger">
          {generated.error || renderError}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="type-body text-muted">
          {message}
        </p>
      ) : null}
      {previews.length ? (
        <div data-explore-grid className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {previews.map((preview, index) => {
            const isGenerated = tool !== 'compare';
            const footer = isGenerated ? (
              <div className="flex flex-wrap items-end gap-2">
                {tool === 'variations' ? (
                  <button
                    aria-pressed={starred.includes(preview.style.id)}
                    className={buttonClass}
                    onClick={() =>
                      setStarred((entries) =>
                        entries.includes(preview.style.id)
                          ? entries.filter((id) => id !== preview.style.id)
                          : [...entries, preview.style.id],
                      )
                    }
                    type="button"
                  >
                    {starred.includes(preview.style.id) ? 'Starred' : 'Star'}
                  </button>
                ) : null}
                <label className="flex min-w-0 flex-1 flex-col gap-1 type-caption">
                  Style name
                  <input
                    className={fieldClass}
                    value={saveNames[preview.style.id] ?? preview.style.name}
                    onChange={(event) =>
                      setSaveNames((entries) => ({
                        ...entries,
                        [preview.style.id]: event.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  className={buttonClass}
                  disabled={saving}
                  onClick={() => void saveOne(preview.style)}
                  type="button"
                >
                  Save style
                </button>
              </div>
            ) : undefined;
            return (
              <PreviewCard
                key={`${preview.style.id}-${index}`}
                preview={preview}
                index={index}
                specimen={specimen}
                variables={
                  preview.style.id === 'su' || preview.style.id === 'yu'
                    ? baselineVars[preview.context]
                    : variables[preview.style.id]?.[preview.context]
                }
                css={resolveExtraCss(preview.style, library).css}
                onScroll={tool === 'compare' ? synchronizeScroll : undefined}
                footer={footer}
              />
            );
          })}
        </div>
      ) : (
        <p className="type-body text-muted">Choose styles or inputs to see previews.</p>
      )}

      {tool === 'compare' && previews.length > 1 ? (
        <div className="overflow-auto rounded-surface border border-subtle bg-surface">
          <table className="w-full border-collapse type-caption">
            <caption className="p-3 text-left type-heading">Parameter differences</caption>
            <thead>
              <tr>
                <th className="border-b border-subtle p-2 text-left">Parameter</th>
                {previews.map((preview, index) => (
                  <th className="border-b border-subtle p-2 text-left" key={index}>
                    {preview.style.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {differences.map(({ parameter, values }) => (
                <tr key={parameter.id}>
                  <th className="border-t border-subtle p-2 text-left font-medium">
                    {parameter.label}
                    <span className="block text-muted">{parameter.id}</span>
                  </th>
                  {values.map((value, index) => (
                    <td className="border-t border-subtle p-2 align-top" key={index}>
                      {valueLabel(value)}
                    </td>
                  ))}
                </tr>
              ))}
              {!differences.length ? (
                <tr>
                  <td className="p-3 text-muted" colSpan={previews.length + 1}>
                    No parameter values differ in these contexts.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
