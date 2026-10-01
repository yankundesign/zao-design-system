'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  evaluateContrast,
  resolveStyle,
  validateStyle,
  type RampInput,
  type StyleFile,
} from '@zao/engine';
import StyleEditor from '@/components/style-editor';
import ExplorePanel from '@/components/explore-panel';
import RecordPanel from '@/components/record-panel';
import ReferenceBoard from '@/components/reference-board';
import { specimens } from '@/lib/specimens';
import { resolveExtraCss } from '@/lib/extra-css';
import { scopedExtraCss } from '@/lib/island-css';
import type { ContextId, ContextVariables } from '@/lib/token-data';

const contexts = [
  { id: 'su-light', theme: 'su', mode: 'light', label: 'Su · light' },
  { id: 'su-dark', theme: 'su', mode: 'dark', label: 'Su · dark' },
  { id: 'yu-dark', theme: 'yu', mode: 'dark', label: 'Yu · dark' },
] as const;

const baselineStyle: Record<'su' | 'yu', StyleFile> = {
  su: {
    id: 'su',
    name: 'Su baseline',
    extends: 'su',
    author: 'system:tokens',
    modes: ['light', 'dark'],
    params: {},
  },
  yu: {
    id: 'yu',
    name: 'Yu baseline',
    extends: 'yu',
    author: 'system:tokens',
    modes: ['dark'],
    params: {},
  },
};

type LabView = 'single' | 'contexts' | 'gallery';
type LabSection = 'preview' | 'references' | 'explore' | 'record';

interface LabShellProps {
  initialStyles: StyleFile[];
  initialLibraryError: string;
  baselineVars: ContextVariables;
  baselineParams: Record<ContextId, Record<string, unknown>>;
  fontFiles: { name: string; url: string }[];
  shellVars: Record<string, string>;
}

const draftKey = (id: string) => `zao-lab-draft:${id}`;
const draftIndexKey = 'zao-lab-unsaved-draft-ids';
const selectionKey = 'zao-lab-selected-style';

function restoredDraft(style: StyleFile) {
  try {
    const source = window.localStorage.getItem(draftKey(style.id));
    if (!source) return style;
    const candidate: unknown = JSON.parse(source);
    validateStyle(candidate);
    return candidate.id === style.id ? candidate : style;
  } catch {
    return style;
  }
}

function readUnsavedDrafts(savedStyles: StyleFile[]): Record<string, StyleFile> {
  const savedIds = new Set(['su', 'yu', ...savedStyles.map((style) => style.id)]);
  try {
    const ids: unknown = JSON.parse(window.localStorage.getItem(draftIndexKey) ?? '[]');
    if (!Array.isArray(ids)) return {};
    return Object.fromEntries(
      ids.flatMap((id) => {
        if (typeof id !== 'string' || savedIds.has(id)) return [];
        const source = window.localStorage.getItem(draftKey(id));
        if (!source) return [];
        try {
          const candidate: unknown = JSON.parse(source);
          validateStyle(candidate);
          return candidate.id === id ? [[id, candidate as StyleFile]] : [];
        } catch {
          return [];
        }
      }),
    );
  } catch {
    return {};
  }
}

function extraRampInputs(raw: unknown): Record<string, RampInput> {
  if (typeof raw !== 'string') return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, RampInput>)
      : {};
  } catch {
    return {};
  }
}

function asStyle(variables: Record<string, string>): CSSProperties {
  return variables as CSSProperties;
}

function specimenIsland(
  specimen: (typeof specimens)[number],
  context: (typeof contexts)[number],
  variables: Record<string, string>,
  extraCss: string,
) {
  const id = `${specimen.id}-${context.id}`;
  const Component = specimen.Component;
  return (
    <section key={id} className="min-w-0 overflow-hidden rounded-surface border border-subtle">
      <div className="flex items-center justify-between gap-3 border-b border-subtle bg-surface px-4 py-2">
        <div className="min-w-0">
          <p className="type-label font-medium">{specimen.title}</p>
          <p className="type-caption text-muted">{specimen.description}</p>
        </div>
        <span className="shrink-0 type-caption text-muted">{context.label}</span>
      </div>
      <div
        data-lab-island={id}
        data-zao-theme={context.theme}
        data-zao-mode={context.mode}
        className="lab-island"
        style={{ ...asStyle(variables), colorScheme: context.mode }}
      >
        {extraCss ? <style>{scopedExtraCss(extraCss, id)}</style> : null}
        <Component />
      </div>
    </section>
  );
}

function makeUniqueId(name: string, existing: string[]) {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70) || 'new-style';
  let candidate = base;
  let suffix = 2;
  while (existing.includes(candidate)) candidate = `${base}-${suffix++}`;
  return candidate;
}

export function LabShell({
  initialStyles,
  initialLibraryError,
  baselineVars,
  baselineParams,
  fontFiles,
  shellVars,
}: LabShellProps) {
  const [styles, setStyles] = useState(initialStyles);
  const [unsavedDrafts, setUnsavedDrafts] = useState<Record<string, StyleFile>>({});
  const [selectedStyleId, setSelectedStyleId] = useState('su');
  const [draft, setDraft] = useState<StyleFile>(baselineStyle.su);
  const [specimenId, setSpecimenId] = useState(specimens[0]?.id ?? 'type');
  const [contextId, setContextId] = useState<ContextId>('su-light');
  const [view, setView] = useState<LabView>('single');
  const [section, setSection] = useState<LabSection>('preview');
  const [colorPickTarget, setColorPickTarget] = useState<string | null>(null);
  const [resolvedVars, setResolvedVars] = useState(baselineVars);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [libraryError, setLibraryError] = useState(initialLibraryError);
  const [message, setMessage] = useState('');
  const [past, setPast] = useState<StyleFile[]>([]);
  const [future, setFuture] = useState<StyleFile[]>([]);
  const [restoredSelection, setRestoredSelection] = useState(false);
  const reservedIds = useRef(new Set<string>());

  const isBaseline = selectedStyleId === 'su' || selectedStyleId === 'yu';
  const selectedSpecimen = specimens.find((specimen) => specimen.id === specimenId) ?? specimens[0];
  if (!selectedSpecimen) throw new Error('Add a specimen file to apps/lab/specimens.');
  const selectedContext = contexts.find((context) => context.id === contextId)!;
  const savedStyle = styles.find((style) => style.id === selectedStyleId);
  const dirty = !isBaseline && JSON.stringify(draft) !== JSON.stringify(savedStyle);

  const styleOptions = useMemo(
    () => [
      baselineStyle.su,
      baselineStyle.yu,
      ...styles,
      ...Object.values(unsavedDrafts).filter(
        (style) => !styles.some((saved) => saved.id === style.id),
      ),
      ...(!isBaseline && !savedStyle && !unsavedDrafts[draft.id] ? [draft] : []),
    ],
    [styles, unsavedDrafts, draft, isBaseline, savedStyle],
  );
  const fontFamilies = useMemo(
    () => [
      'Geist',
      'Newsreader',
      'Geist Mono',
      ...fontFiles.map((font) => font.name.replace(/\.(woff2?|otf|ttf)$/i, '')),
    ],
    [fontFiles],
  );
  const contrastResults = useMemo(
    () => evaluateContrast(resolvedVars[selectedContext.id]),
    [resolvedVars, selectedContext.id],
  );
  const extraCss = useMemo(
    () =>
      resolveExtraCss(draft, {
        ...baselineStyle,
        ...Object.fromEntries(styles.map((style) => [style.id, style])),
      }),
    [draft, styles],
  );
  const inheritedParams = useMemo(() => {
    const source: Record<string, StyleFile> = {
      ...baselineStyle,
      ...Object.fromEntries(styles.map((style) => [style.id, style])),
    };
    const parent = source[draft.extends];
    const values = { ...baselineParams[selectedContext.id] };
    if (parent)
      for (const [id, value] of Object.entries(resolveStyle(parent, source).params)) {
        if (id.startsWith('mode.') && value && typeof value === 'object' && !Array.isArray(value)) {
          const step = (value as Record<string, unknown>)[selectedContext.mode];
          if (step !== undefined) values[id] = step;
        } else values[id] = value;
      }
    return values;
  }, [baselineParams, draft.extends, selectedContext.id, styles]);

  useEffect(() => {
    const unsaved = readUnsavedDrafts(initialStyles);
    setUnsavedDrafts(unsaved);
    const id = window.localStorage.getItem(selectionKey);
    let selected = styleOptions.find((style) => style.id === id) ?? (id ? unsaved[id] : undefined);
    if (!selected && id) {
      try {
        const source = window.localStorage.getItem(draftKey(id));
        if (source) {
          const candidate: unknown = JSON.parse(source);
          validateStyle(candidate);
          if (candidate.id === id) selected = candidate;
        }
      } catch {
        // An invalid browser draft cannot replace a saved style.
      }
    }
    if (selected) {
      setSelectedStyleId(selected.id);
      setDraft(restoredDraft(selected));
    }
    setRestoredSelection(true);
    // The initial server list is complete when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restoredSelection) return;
    window.localStorage.setItem(selectionKey, selectedStyleId);
    if (selectedStyleId === 'su' || selectedStyleId === 'yu') return;
    if (dirty) {
      window.localStorage.setItem(draftKey(selectedStyleId), JSON.stringify(draft));
      if (!savedStyle) {
        setUnsavedDrafts((entries) =>
          entries[draft.id] === draft ? entries : { ...entries, [draft.id]: draft },
        );
      }
    } else window.localStorage.removeItem(draftKey(selectedStyleId));
  }, [draft, selectedStyleId, dirty, savedStyle, restoredSelection]);

  useEffect(() => {
    if (!restoredSelection) return;
    window.localStorage.setItem(draftIndexKey, JSON.stringify(Object.keys(unsavedDrafts)));
  }, [unsavedDrafts, restoredSelection]);

  useEffect(() => {
    if (draft.id === 'su' || draft.id === 'yu') {
      setResolvedVars(baselineVars);
      setRenderError('');
      setPending(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPending(true);
      try {
        const response = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
          signal: controller.signal,
        });
        const result: { variables?: ContextVariables; error?: string } = await response.json();
        if (!response.ok || !result.variables)
          throw new Error(result.error ?? 'Could not render the style.');
        setResolvedVars(result.variables);
        setRenderError('');
      } catch (error) {
        if (controller.signal.aborted) return;
        setRenderError(error instanceof Error ? error.message : 'Could not render the style.');
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }, 120);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [draft, baselineVars]);

  function selectStyle(id: string) {
    const next = styleOptions.find((style) => style.id === id);
    if (!next) return;
    setSelectedStyleId(id);
    setDraft(restoredDraft(structuredClone(next)));
    setPast([]);
    setFuture([]);
    setMessage('');
  }

  function changeDraft(next: StyleFile) {
    if (isBaseline) return;
    setPast((entries) => [...entries, draft]);
    setFuture([]);
    setDraft(next);
    setMessage('');
  }

  function undo() {
    const previous = past.at(-1);
    if (!previous) return;
    setPast((entries) => entries.slice(0, -1));
    setFuture((entries) => [draft, ...entries]);
    setDraft(previous);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture((entries) => entries.slice(1));
    setPast((entries) => [...entries, draft]);
    setDraft(next);
  }

  async function saveStyle() {
    if (isBaseline) return;
    setSaving(true);
    setMessage('Saving style…');
    try {
      const response = await fetch(
        savedStyle ? `/api/styles/${encodeURIComponent(draft.id)}` : '/api/styles',
        {
          method: savedStyle ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        },
      );
      const result: { style?: StyleFile; error?: string } = await response.json();
      if (!response.ok || !result.style)
        throw new Error(result.error ?? 'Could not save the style.');
      const saved = result.style;
      setStyles((entries) =>
        entries.some((entry) => entry.id === saved.id)
          ? entries.map((entry) => (entry.id === saved.id ? saved : entry))
          : [...entries, saved],
      );
      setUnsavedDrafts((entries) => {
        const next = { ...entries };
        delete next[saved.id];
        return next;
      });
      window.localStorage.removeItem(draftKey(saved.id));
      setMessage(`Saved ${saved.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the style.');
    } finally {
      setSaving(false);
    }
  }

  async function forkStyle(chosenName: string) {
    if (!chosenName.trim()) return;
    const id = makeUniqueId(
      chosenName,
      styleOptions.map((style) => style.id),
    );
    const fork: StyleFile = {
      id,
      name: chosenName.trim(),
      extends: dirty ? draft.extends : draft.id,
      author: 'yankun',
      modes: [...draft.modes],
      params: dirty ? structuredClone(draft.params) : {},
      ...(dirty && draft.extraCss?.trim() ? { extraCss: draft.extraCss } : {}),
    };
    setMessage('Creating style…');
    try {
      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fork),
      });
      const result: { style?: StyleFile; error?: string } = await response.json();
      if (!response.ok || !result.style)
        throw new Error(result.error ?? 'Could not create the style.');
      const saved = result.style;
      setStyles((entries) => [...entries, saved]);
      setSelectedStyleId(saved.id);
      setDraft(saved);
      window.localStorage.removeItem(draftKey(saved.id));
      setPast([]);
      setFuture([]);
      setMessage(`Created ${saved.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the style.');
    }
  }

  async function deleteStyle() {
    if (isBaseline || !window.confirm(`Delete ${draft.name}?`)) return;
    if (!savedStyle) {
      window.localStorage.removeItem(draftKey(draft.id));
      setUnsavedDrafts((entries) => {
        const next = { ...entries };
        delete next[draft.id];
        return next;
      });
      setSelectedStyleId('su');
      setDraft(baselineStyle.su);
      setPast([]);
      setFuture([]);
      setMessage(`Discarded ${draft.name}.`);
      return;
    }
    const child = styles.find((style) => style.extends === draft.id);
    if (child) {
      setMessage(`Delete ${child.name} first; it inherits from ${draft.name}.`);
      return;
    }
    try {
      const response = await fetch(`/api/styles/${encodeURIComponent(draft.id)}`, {
        method: 'DELETE',
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not delete the style.');
      setStyles((entries) => entries.filter((entry) => entry.id !== draft.id));
      window.localStorage.removeItem(draftKey(draft.id));
      setSelectedStyleId('su');
      setDraft(baselineStyle.su);
      setPast([]);
      setFuture([]);
      setMessage(`Deleted ${draft.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete the style.');
    }
  }

  function seedFromReference(style: StyleFile, mode: 'light' | 'dark') {
    const byId = new Map(styles.map((entry) => [entry.id, entry]));
    let ancestor = style.extends;
    while (ancestor !== 'su' && ancestor !== 'yu' && byId.has(ancestor)) {
      ancestor = byId.get(ancestor)!.extends;
    }
    setSelectedStyleId(style.id);
    setDraft(style);
    setUnsavedDrafts((entries) => ({ ...entries, [style.id]: style }));
    setContextId(mode === 'light' ? 'su-light' : ancestor === 'yu' ? 'yu-dark' : 'su-dark');
    setPast([]);
    setFuture([]);
    setSection('preview');
    setColorPickTarget(null);
    setMessage(`Review ${style.name}, then save it when ready.`);
  }

  function pickReferenceColor(color: string) {
    if (!colorPickTarget || isBaseline) return;
    const extraTarget = colorPickTarget.match(/^extra:([^:]+):(anchor|pin):(.*)$/);
    const extraAnchor = colorPickTarget.match(/^extra:([^:]+):anchor$/);
    if (extraAnchor || extraTarget) {
      const ramp = (extraAnchor ?? extraTarget)?.[1];
      const inputs = extraRampInputs(
        draft.params['color.ramp.extra'] ?? inheritedParams['color.ramp.extra'],
      );
      const current = ramp ? inputs[ramp] : undefined;
      if (!ramp || !current) {
        setMessage('This extra ramp is no longer available.');
        setSection('preview');
        setColorPickTarget(null);
        return;
      }
      let updated: RampInput;
      if (extraAnchor) updated = { ...current, anchor: color };
      else {
        const pin = colorPickTarget.match(/^extra:[^:]+:pin:(light|dark):(\d+)$/);
        const mode = pin?.[1] as 'light' | 'dark' | undefined;
        const step = Number(pin?.[2]);
        if (!mode || !Number.isInteger(step) || step < 1 || step > 12) return;
        updated = {
          ...current,
          pins: {
            ...current.pins,
            [mode]: { ...current.pins?.[mode], [step]: color },
          },
        };
      }
      changeDraft({
        ...draft,
        params: {
          ...draft.params,
          'color.ramp.extra': JSON.stringify({ ...inputs, [ramp]: updated }),
        },
      });
    } else changeDraft({ ...draft, params: { ...draft.params, [colorPickTarget]: color } });
    setSection('preview');
    setMessage(`Set ${colorPickTarget} to ${color}.`);
    setColorPickTarget(null);
  }

  async function saveGeneratedStyle(style: StyleFile, name: string) {
    const id = makeUniqueId(name, [
      ...styleOptions.map((entry) => entry.id),
      ...reservedIds.current,
    ]);
    reservedIds.current.add(id);
    const generated: StyleFile = {
      ...style,
      id,
      name,
      author: style.author.startsWith('agent:') ? style.author : 'agent:zao-engine',
      generated: false,
    };
    try {
      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generated),
      });
      const result: { style?: StyleFile; error?: string } = await response.json();
      if (!response.ok || !result.style)
        throw new Error(result.error ?? 'Could not save the generated style.');
      setStyles((entries) => [...entries, result.style!]);
    } catch (error) {
      reservedIds.current.delete(id);
      throw error;
    }
  }

  const visible =
    view === 'contexts'
      ? contexts.map((context) => ({ specimen: selectedSpecimen, context }))
      : view === 'gallery'
        ? specimens.map((specimen) => ({ specimen, context: selectedContext }))
        : [{ specimen: selectedSpecimen, context: selectedContext }];

  return (
    <div
      data-zao-theme="su"
      data-zao-mode="light"
      className="lab-shell min-h-dvh bg-canvas text-default"
      style={asStyle(shellVars)}
    >
      {fontFiles.length ? (
        <style>
          {fontFiles
            .map((font) => {
              const family = font.name.replace(/\.(woff2?|otf|ttf)$/i, '');
              return `@font-face { font-family: "${family}"; src: url("${font.url}"); font-display: swap; }`;
            })
            .join('\n')}
        </style>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-subtle bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <span className="type-heading">ZAO / Lab</span>
            <span className="type-caption text-muted">Style studies</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="type-caption text-muted">Local only</span>
            {pending ? (
              <span role="status" className="type-caption text-muted">
                Updating preview…
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={`grid min-h-dvh ${section === 'preview' ? 'lg:grid-cols-[240px_minmax(0,1fr)_320px]' : 'lg:grid-cols-[240px_minmax(0,1fr)]'}`}
      >
        <aside className="border-b border-subtle bg-surface p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-5 lg:sticky lg:top-20">
            <nav aria-label="Lab sections" className="flex flex-col gap-1">
              {(
                [
                  ['preview', 'Preview and edit'],
                  ['references', 'References'],
                  ['explore', 'Compare and generate'],
                  ['record', 'Snapshots and journal'],
                ] as const
              ).map(([id, label]) => (
                <button
                  aria-current={section === id ? 'page' : undefined}
                  className={`min-h-8 rounded-action px-2 text-left type-label trim-label ${section === id ? 'bg-hover text-default' : 'text-muted hover:bg-hover'}`}
                  key={id}
                  onClick={() => setSection(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="border-t border-subtle" />
            <div className="flex flex-col gap-2">
              <label htmlFor="lab-style" className="type-label font-medium">
                Style
              </label>
              <select
                id="lab-style"
                value={selectedStyleId}
                onChange={(event) => selectStyle(event.target.value)}
                className="h-8 w-full rounded-control border border-default bg-surface px-2 type-body text-default outline-focus"
              >
                {styleOptions.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
              {draft.author.startsWith('agent:') ? (
                <span className="type-caption text-muted">Agent-made</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lab-specimen" className="type-label font-medium">
                Specimen
              </label>
              <select
                id="lab-specimen"
                value={specimenId}
                onChange={(event) => setSpecimenId(event.target.value)}
                className="h-8 w-full rounded-control border border-default bg-surface px-2 type-body text-default outline-focus"
              >
                {specimens.map((specimen) => (
                  <option key={specimen.id} value={specimen.id}>
                    {specimen.title}
                  </option>
                ))}
              </select>
              <p className="type-caption text-muted">{selectedSpecimen?.description}</p>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 type-label font-medium">View</legend>
              {(
                [
                  ['single', 'One specimen · one context'],
                  ['contexts', 'One specimen · all contexts'],
                  ['gallery', 'All specimens · one context'],
                ] as const
              ).map(([id, label]) => (
                <label key={id} className="flex min-h-7 items-center gap-2 type-body">
                  <input
                    type="radio"
                    name="lab-view"
                    checked={view === id}
                    onChange={() => setView(id)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="lab-context" className="type-label font-medium">
                {view === 'contexts' ? 'Editing context' : 'Context'}
              </label>
              <select
                id="lab-context"
                value={contextId}
                onChange={(event) => setContextId(event.target.value as ContextId)}
                className="h-8 w-full rounded-control border border-default bg-surface px-2 type-body text-default outline-focus"
              >
                {contexts.map((context) => (
                  <option key={context.id} value={context.id}>
                    {context.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-canvas p-5 md:p-8">
          {section === 'preview' ? (
            <>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="type-caption text-muted">Preview</p>
                  <h1 className="type-title">{draft.name}</h1>
                </div>
                <p className="type-caption text-muted">
                  {view === 'gallery' ? `${specimens.length} specimens` : selectedSpecimen?.title}
                  {dirty ? ' · Unsaved changes' : ''}
                </p>
              </div>
              {renderError ? (
                <p role="alert" className="mb-4 type-body text-danger">
                  {renderError}
                </p>
              ) : null}
              {libraryError ? (
                <p role="alert" className="mb-4 type-body text-danger">
                  {libraryError}
                </p>
              ) : null}
              {message ? (
                <p role="status" className="mb-4 type-body text-muted">
                  {message}
                </p>
              ) : null}
              <div
                className={
                  view === 'contexts' ? 'grid gap-5 2xl:grid-cols-2' : 'flex flex-col gap-5'
                }
              >
                {visible.map(({ specimen, context }) =>
                  specimenIsland(specimen, context, resolvedVars[context.id], extraCss.css),
                )}
              </div>
            </>
          ) : section === 'references' ? (
            <ReferenceBoard
              styles={styles}
              reservedStyleIds={styleOptions.map((style) => style.id)}
              currentStyle={draft}
              onSeedDraft={seedFromReference}
              onPickColor={colorPickTarget ? pickReferenceColor : undefined}
              onClose={
                colorPickTarget
                  ? () => {
                      setColorPickTarget(null);
                      setSection('preview');
                    }
                  : undefined
              }
            />
          ) : section === 'explore' ? (
            <ExplorePanel
              styles={styles}
              currentStyle={draft}
              specimen={selectedSpecimen}
              context={contextId}
              baselineVars={baselineVars}
              baselineParams={baselineParams}
              onSaveStyle={saveGeneratedStyle}
            />
          ) : (
            <RecordPanel
              styles={[baselineStyle.su, baselineStyle.yu, ...styles]}
              currentStyle={draft}
              specimenId={specimenId}
              contextId={contextId}
              currentStyleDirty={dirty}
            />
          )}
        </main>

        {section === 'preview' ? (
          <aside className="border-t border-subtle bg-surface p-5 lg:border-t-0 lg:border-l">
            <div className="lg:sticky lg:top-20">
              <StyleEditor
                style={draft}
                mode={selectedContext.mode}
                resolvedVars={resolvedVars[selectedContext.id]}
                contrastResults={contrastResults}
                fontFamilies={fontFamilies}
                baselineParams={inheritedParams}
                inheritedExtraCssFrom={extraCss.inheritedFrom}
                onChange={changeDraft}
                onSave={saveStyle}
                onFork={(name) => void forkStyle(name)}
                onDelete={deleteStyle}
                onUndo={undo}
                onRedo={redo}
                canUndo={past.length > 0}
                canRedo={future.length > 0}
                saving={saving}
                onRequestColorPick={(parameterId) => {
                  setColorPickTarget(parameterId);
                  setSection('references');
                }}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
