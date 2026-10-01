'use client';

import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
import { parameterRegistry, type Parameter, type RampInput, type StyleFile } from '@zao/engine';
import { CHROMA, LIGHTNESS } from '@zao/engine/palette';

type ContrastResult = { label: string; ratio: number; minimum: number; pass: boolean };

export interface StyleEditorProps {
  style: StyleFile;
  mode: 'light' | 'dark';
  resolvedVars: Record<string, string>;
  contrastResults: ContrastResult[];
  fontFamilies: string[];
  baselineParams?: Record<string, unknown>;
  inheritedExtraCssFrom?: string | null;
  onChange: (style: StyleFile) => void;
  onSave: () => void | Promise<void>;
  onFork: (name: string) => void;
  onDelete: () => void | Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  onRequestColorPick?: (parameterId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  saving?: boolean;
}

const ramps = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
const modes = ['light', 'dark'] as const;
const groupOrder = [
  'color',
  'type',
  'shape',
  'space and density',
  'depth and material',
  'motion',
  'mode',
];
const fieldClass =
  'h-8 min-w-0 rounded-control border border-default bg-surface px-2 type-body text-default';
const buttonClass =
  'h-8 rounded-action border border-default bg-surface px-3 type-label trim-label text-default hover:bg-hover disabled:opacity-50';

// The registry is authoritative. A Map also guards against duplicate ids while it evolves.
const parameters = Array.from(
  new Map(parameterRegistry.map((entry) => [entry.id, entry])).values(),
);
const byId = new Map(parameters.map((entry) => [entry.id, entry]));

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function oklchParts(value: string | undefined) {
  const match = value?.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.-]+)/i);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

function inferredValue(parameter: Parameter, vars: Record<string, string>): unknown {
  const rampMatch = parameter.id.match(
    /^color\.([^.]+)\.(hue|chroma|solid\.(?:light|dark)|hue-drift|curve\.(?:lightness\.(?:light|dark)|chroma))$/,
  );
  if (rampMatch) {
    const ramp = rampMatch[1]!;
    const property = rampMatch[2]!;
    const family = ramp === 'neutral' ? 'neutral' : 'color';
    if (property === 'hue-drift') return 0;
    if (property === 'curve.chroma') return CHROMA[family];
    if (property.startsWith('curve.lightness.'))
      return LIGHTNESS[family][property.endsWith('dark') ? 'dark' : 'light'];
    const mode = property.endsWith('dark') ? 'dark' : 'light';
    const parts = oklchParts(vars[`--zao-palette-${ramp}-${mode}-9`]);
    if (property === 'hue') return parts?.[2];
    if (property === 'chroma') return parts?.[1];
    if (property.startsWith('solid.')) return parts?.[0];
  }
  if (parameter.id === 'color.contrast') return 0.5;
  const raw = vars[parameter.cssVariables[0] ?? ''];
  if (raw === undefined) return undefined;
  if (parameter.kind === 'number' || parameter.kind === 'duration' || parameter.kind === 'step') {
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : undefined;
  }
  if (parameter.kind === 'easing') {
    const match = raw.match(/cubic-bezier\(([^)]+)\)/);
    const numbers = match?.[1]?.split(',').map((part) => Number(part.trim()));
    return numbers?.length === 4 && numbers.every(Number.isFinite) ? numbers : undefined;
  }
  if (parameter.kind === 'font' || parameter.kind === 'color' || parameter.kind === 'enum')
    return raw;
  return undefined;
}

function isPaletteDetail(id: string) {
  return /^color\.(neutral|accent|success|warning|danger)\./.test(id);
}

function isValidColor(value: string) {
  const acceptedSyntax =
    /^#(?:[\da-f]{3,4}|[\da-f]{6,8})$/i.test(value) || /^oklch\(.+\)$/i.test(value);
  return (
    acceptedSyntax &&
    (typeof CSS === 'undefined' ||
      typeof CSS.supports !== 'function' ||
      CSS.supports('color', value))
  );
}

function dynamicParameter(
  id: string,
  label: string,
  kind: Parameter['kind'],
  range?: [number, number],
): Parameter {
  return {
    id,
    label,
    kind,
    group: 'color',
    layer: 'finish',
    perMode: false,
    cssVariables: [],
    tokenPath: id,
    unit: kind === 'hue' ? '°' : '',
    ...(range ? { range } : {}),
  };
}

function readExtraRampInputs(raw: unknown): Record<string, RampInput> {
  if (typeof raw !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, RampInput>)
      : {};
  } catch {
    return {};
  }
}

function NumericEditor({
  parameter,
  value,
  onChange,
  disabled,
}: {
  parameter: Parameter;
  value: unknown;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  const current = asNumber(value);
  const [draft, setDraft] = useState(current === undefined ? '' : String(current));
  useEffect(() => setDraft(current === undefined ? '' : String(current)), [current, parameter.id]);
  const range = parameter.range;
  const sliderValue = current ?? (range ? (range[0] + range[1]) / 2 : 0);
  const accepts = (next: number) =>
    Number.isFinite(next) &&
    (!range || (next >= range[0] && next <= range[1])) &&
    (parameter.kind !== 'step' || Number.isInteger(next));
  return (
    <div className="flex items-center gap-2">
      {range && (
        <input
          aria-label={`${parameter.label} slider`}
          type="range"
          className="h-8 min-w-0 flex-1"
          style={{ accentColor: 'var(--zao-color-accent-solid)' }}
          min={range[0]}
          max={range[1]}
          step={parameter.kind === 'step' ? 1 : 'any'}
          value={sliderValue}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      )}
      <input
        aria-label={`${parameter.label} exact value`}
        className={`${fieldClass} w-20 figures-tabular`}
        type="number"
        step={parameter.kind === 'step' ? 1 : 'any'}
        min={range?.[0]}
        max={range?.[1]}
        value={draft}
        placeholder="Inherit"
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (next !== '' && accepts(Number(next))) onChange(Number(next));
        }}
        onBlur={() => setDraft(current === undefined ? '' : String(current))}
      />
      {parameter.unit && <span className="type-caption text-muted">{parameter.unit}</span>}
    </div>
  );
}

function CurveEditor({
  parameter,
  value,
  onChange,
  disabled,
}: {
  parameter: Parameter;
  value: unknown;
  onChange: (value: number[]) => void;
  disabled: boolean;
}) {
  const curve = Array.isArray(value) && value.length === 12 ? (value as number[]) : undefined;
  const [selected, setSelected] = useState(0);
  const changeStep = (index: number, next: number) => {
    if (!curve || !Number.isFinite(next)) return;
    const [min, max] = parameter.range ?? [-Infinity, Infinity];
    if (next < min || next > max) return;
    const copy = [...curve];
    copy[index] = next;
    onChange(copy);
  };
  return (
    <div className="flex flex-col gap-2">
      {curve ? (
        <>
          <div className="grid grid-cols-6 gap-1">
            {curve.map((entry, index) => (
              <button
                aria-pressed={index === selected}
                aria-label={`${parameter.label} step ${index + 1}: ${entry}`}
                className={`${buttonClass} px-1 figures-tabular ${index === selected ? 'border-accent' : ''}`}
                disabled={disabled}
                key={index}
                onClick={() => setSelected(index)}
                type="button"
              >
                {index + 1}
              </button>
            ))}
          </div>
          <NumericEditor
            parameter={{
              ...parameter,
              label: `${parameter.label} step ${selected + 1}`,
              kind: 'number',
            }}
            value={curve[selected]}
            onChange={(next) => changeStep(selected, next)}
            disabled={disabled}
          />
        </>
      ) : (
        <p className="type-caption text-muted">This curve has no inherited values to edit.</p>
      )}
    </div>
  );
}

function TextEditor({
  parameter,
  value,
  onChange,
  disabled,
  fontFamilies,
}: {
  parameter: Parameter;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
  fontFamilies: string[];
}) {
  const fontListId = useId();
  const current = Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';
  const [draft, setDraft] = useState(current);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(current);
    setError('');
  }, [current, parameter.id]);
  const isExtraRamp = parameter.id === 'color.ramp.extra';
  const isColor = parameter.kind === 'color';
  const isEasing = parameter.kind === 'easing';
  const commit = () => {
    if (draft === current) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Enter a value or use Reset to inherit.');
      return;
    }
    if (isColor && !isValidColor(trimmed)) {
      setError('Enter a hex or oklch() color.');
      return;
    }
    if (isEasing) {
      const numbers = trimmed
        .replace(/^cubic-bezier\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map(Number);
      if (numbers.length !== 4 || numbers.some((number) => !Number.isFinite(number))) {
        setError('Enter four comma-separated cubic Bézier numbers.');
        return;
      }
      onChange(numbers);
    } else if (isExtraRamp) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
        onChange(JSON.stringify(parsed));
      } catch {
        setError('Enter a JSON object of ramp names and inputs.');
        return;
      }
    } else onChange(trimmed);
    setError('');
  };
  const common = {
    'aria-label': parameter.label,
    'aria-invalid': Boolean(error) as boolean,
    className: `${fieldClass} w-full ${isExtraRamp ? 'h-20 py-2 type-code' : ''}`,
    value: draft,
    disabled,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      setError('');
      if (isColor && isValidColor(event.target.value.trim())) onChange(event.target.value.trim());
      if (
        (parameter.kind === 'font' || (parameter.kind === 'enum' && !isExtraRamp)) &&
        event.target.value.trim()
      )
        onChange(event.target.value);
    },
    onBlur: commit,
  };
  return (
    <div className="flex flex-col gap-1">
      {isExtraRamp ? (
        <textarea {...common} placeholder={'{"custom": {"hue": ..., "chroma": ...}}'} />
      ) : (
        <input
          {...common}
          type="text"
          list={parameter.kind === 'font' ? fontListId : undefined}
          placeholder={isColor ? '#… or oklch(…)' : isEasing ? 'x1, y1, x2, y2' : 'Inherit'}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      )}
      {parameter.kind === 'font' && (
        <datalist id={fontListId}>
          {fontFamilies.map((family) => (
            <option key={family} value={family} />
          ))}
        </datalist>
      )}
      {error && (
        <p className="type-caption text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ExtraRampControls({
  ramp,
  style,
  baselineParams,
  selectedPin,
  onChange,
  onRequestColorPick,
  disabled,
}: {
  ramp: string;
  style: StyleFile;
  baselineParams?: Record<string, unknown>;
  selectedPin: { mode: 'light' | 'dark'; step: number } | null;
  onChange: (style: StyleFile) => void;
  onRequestColorPick?: (parameterId: string) => void;
  disabled: boolean;
}) {
  const inputs = readExtraRampInputs(
    style.params['color.ramp.extra'] ?? baselineParams?.['color.ramp.extra'],
  );
  const input = inputs[ramp];
  if (!input) {
    return (
      <p className="type-caption text-muted">Edit the extra ramps JSON to change this ramp.</p>
    );
  }
  const update = (next: RampInput) =>
    onChange({
      ...style,
      params: {
        ...style.params,
        'color.ramp.extra': JSON.stringify({ ...inputs, [ramp]: next }),
      },
    });
  const number = (key: 'hue' | 'chroma' | 'hueDrift', label: string, range: [number, number]) => (
    <div className="flex flex-col gap-1" key={key}>
      <span className="type-label">{label}</span>
      <NumericEditor
        parameter={dynamicParameter(
          `color.${ramp}.${key}`,
          label,
          key === 'chroma' ? 'chroma' : 'hue',
          range,
        )}
        value={input[key] ?? 0}
        disabled={disabled}
        onChange={(value) => update({ ...input, [key]: value })}
      />
    </div>
  );
  return (
    <div className="flex flex-col gap-3 border-t border-subtle pt-3">
      <p className="type-caption text-muted">
        These controls update this ramp in the extra ramps JSON.
      </p>
      {number('hue', 'Hue', [0, 360])}
      {number('chroma', 'Chroma', [0, 0.4])}
      {number('hueDrift', 'Hue drift', [-180, 180])}
      <div className="flex flex-col gap-1">
        <span className="type-label">Anchor color</span>
        <TextEditor
          parameter={dynamicParameter(`color.${ramp}.anchor`, 'Anchor color', 'color')}
          value={input.anchor}
          onChange={(value) => update({ ...input, anchor: String(value) })}
          disabled={disabled}
          fontFamilies={[]}
        />
        {onRequestColorPick && (
          <button
            className="self-start type-caption text-accent underline"
            disabled={disabled}
            onClick={() => onRequestColorPick(`extra:${ramp}:anchor`)}
            type="button"
          >
            Pick from reference
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="type-label">Chroma curve</span>
        <CurveEditor
          parameter={dynamicParameter(
            `color.${ramp}.curve.chroma`,
            'Chroma curve',
            'curve',
            [0, 1],
          )}
          value={input.chromaCurve ?? CHROMA.color}
          onChange={(value) => update({ ...input, chromaCurve: value })}
          disabled={disabled}
        />
      </div>
      {modes.map((mode) => (
        <div className="flex flex-col gap-1" key={mode}>
          <span className="type-label">{sentenceCase(mode)} solid lightness</span>
          <NumericEditor
            parameter={dynamicParameter(
              `color.${ramp}.solid.${mode}`,
              `${mode} solid lightness`,
              'lightness',
              [0, 1],
            )}
            value={input.solid?.[mode] ?? input.lightness?.[mode]?.[8] ?? LIGHTNESS.color[mode][8]}
            onChange={(value) => update({ ...input, solid: { ...input.solid, [mode]: value } })}
            disabled={disabled}
          />
          <span className="type-label">{sentenceCase(mode)} lightness curve</span>
          <CurveEditor
            parameter={dynamicParameter(
              `color.${ramp}.curve.lightness.${mode}`,
              `${mode} lightness curve`,
              'curve',
              [0, 1],
            )}
            value={input.lightness?.[mode] ?? LIGHTNESS.color[mode]}
            onChange={(value) =>
              update({
                ...input,
                lightness: {
                  light: input.lightness?.light ?? LIGHTNESS.color.light,
                  dark: input.lightness?.dark ?? LIGHTNESS.color.dark,
                  [mode]: value,
                },
              })
            }
            disabled={disabled}
          />
        </div>
      ))}
      {selectedPin && (
        <div className="flex flex-col gap-1 rounded-control border border-subtle bg-canvas p-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 type-label">
              {sentenceCase(selectedPin.mode)} step {selectedPin.step} pin
            </span>
            {input.pins?.[selectedPin.mode]?.[selectedPin.step] && (
              <button
                className="type-caption text-accent underline"
                disabled={disabled}
                onClick={() => {
                  const pinsForMode = { ...input.pins?.[selectedPin.mode] };
                  delete pinsForMode[selectedPin.step];
                  update({ ...input, pins: { ...input.pins, [selectedPin.mode]: pinsForMode } });
                }}
                type="button"
              >
                Reset
              </button>
            )}
          </div>
          <TextEditor
            parameter={dynamicParameter(
              `color.${ramp}.pin.${selectedPin.mode}.${selectedPin.step}`,
              'Pin color',
              'color',
            )}
            value={input.pins?.[selectedPin.mode]?.[selectedPin.step]}
            onChange={(value) =>
              update({
                ...input,
                pins: {
                  ...input.pins,
                  [selectedPin.mode]: {
                    ...input.pins?.[selectedPin.mode],
                    [selectedPin.step]: String(value),
                  },
                },
              })
            }
            disabled={disabled}
            fontFamilies={[]}
          />
          {onRequestColorPick && (
            <button
              className="self-start type-caption text-accent underline"
              disabled={disabled}
              onClick={() =>
                onRequestColorPick(`extra:${ramp}:pin:${selectedPin.mode}:${selectedPin.step}`)
              }
              type="button"
            >
              Pick from reference
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ParameterControl({
  parameter,
  style,
  mode,
  baselineParams,
  resolvedVars,
  fontFamilies,
  onChange,
  onRequestColorPick,
  disabled,
  compact = false,
}: {
  parameter: Parameter;
  style: StyleFile;
  mode: 'light' | 'dark';
  baselineParams?: Record<string, unknown>;
  resolvedVars: Record<string, string>;
  fontFamilies: string[];
  onChange: (style: StyleFile) => void;
  onRequestColorPick?: (parameterId: string) => void;
  disabled: boolean;
  compact?: boolean;
}) {
  const modeScoped = parameter.perMode && parameter.layer === 'mode' && parameter.kind === 'step';
  const raw = style.params[parameter.id];
  const overridden = modeScoped
    ? typeof raw === 'number' ||
      (raw !== null && typeof raw === 'object' && !Array.isArray(raw) && Object.hasOwn(raw, mode))
    : Object.hasOwn(style.params, parameter.id);
  const value = overridden
    ? modeScoped && raw !== null && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)[mode]
      : raw
    : (baselineParams?.[parameter.id] ?? inferredValue(parameter, resolvedVars));
  const update = (next: unknown) => {
    const inherited = baselineParams?.[parameter.id];
    const params = { ...style.params };
    if (modeScoped) {
      const current: Record<string, unknown> =
        raw !== null && typeof raw === 'object' && !Array.isArray(raw)
          ? { ...(raw as Record<string, unknown>) }
          : typeof raw === 'number'
            ? { light: raw, dark: raw }
            : {};
      if (next === inherited) delete current[mode];
      else current[mode] = next;
      if (Object.keys(current).length) params[parameter.id] = current;
      else delete params[parameter.id];
    } else if (JSON.stringify(next) === JSON.stringify(inherited)) delete params[parameter.id];
    else params[parameter.id] = next;
    onChange({ ...style, params });
  };
  const reset = () => {
    const params = { ...style.params };
    if (modeScoped && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      const current = { ...(raw as Record<string, unknown>) };
      delete current[mode];
      if (Object.keys(current).length) params[parameter.id] = current;
      else delete params[parameter.id];
    } else if (modeScoped && typeof raw === 'number') {
      params[parameter.id] = { [mode === 'light' ? 'dark' : 'light']: raw };
    } else delete params[parameter.id];
    onChange({ ...style, params });
  };
  return (
    <div
      className={`flex flex-col gap-2 ${compact ? '' : 'border-t border-subtle pt-3'}`}
      id={`parameter-${parameter.id}`}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 type-label font-medium">{parameter.label}</span>
        {parameter.layer !== 'finish' && (
          <span
            className="rounded-pill border border-subtle px-2 type-caption text-muted"
            title="Affects both finishes if promoted"
          >
            Shared if promoted
          </span>
        )}
        {overridden ? (
          <button
            className="type-caption text-accent underline"
            disabled={disabled}
            onClick={reset}
            type="button"
          >
            Reset
          </button>
        ) : (
          <span className="type-caption text-muted">Inherited</span>
        )}
      </div>
      {parameter.kind === 'color' && onRequestColorPick ? (
        <button
          className="self-start type-caption text-accent underline"
          disabled={disabled}
          onClick={() => onRequestColorPick(parameter.id)}
          type="button"
        >
          Pick from reference
        </button>
      ) : null}
      {parameter.kind === 'curve' ? (
        <CurveEditor parameter={parameter} value={value} onChange={update} disabled={disabled} />
      ) : ['number', 'hue', 'chroma', 'lightness', 'step', 'duration'].includes(parameter.kind) ? (
        <NumericEditor parameter={parameter} value={value} onChange={update} disabled={disabled} />
      ) : (
        <TextEditor
          parameter={parameter}
          value={value}
          onChange={update}
          disabled={disabled}
          fontFamilies={fontFamilies}
        />
      )}
    </div>
  );
}

export default function StyleEditor({
  style,
  mode,
  resolvedVars,
  contrastResults,
  fontFamilies,
  baselineParams,
  inheritedExtraCssFrom,
  onChange,
  onSave,
  onFork,
  onDelete,
  onUndo,
  onRedo,
  onRequestColorPick,
  canUndo,
  canRedo,
  saving = false,
}: StyleEditorProps) {
  const [query, setQuery] = useState('');
  const [tagsDraft, setTagsDraft] = useState((style.tags ?? []).join(', '));
  const [forking, setForking] = useState(false);
  const [forkName, setForkName] = useState('');
  const [selectedPin, setSelectedPin] = useState<{
    ramp: string;
    mode: 'light' | 'dark';
    step: number;
  } | null>(null);
  const readOnly = style.id === 'su' || style.id === 'yu';
  useEffect(() => setTagsDraft((style.tags ?? []).join(', ')), [style.id, style.tags]);
  const matches = (parameter: Parameter) =>
    !query ||
    `${parameter.id} ${parameter.label} ${parameter.group}`
      .toLowerCase()
      .includes(query.toLowerCase());
  const filtered = useMemo(() => parameters.filter(matches), [query]);
  const extraRamps = useMemo(() => {
    const raw = style.params['color.ramp.extra'];
    if (typeof raw !== 'string') return [];
    try {
      const value: unknown = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : [];
    } catch {
      return [];
    }
  }, [style.params]);
  const resolvedRamps = Object.keys(resolvedVars).flatMap((variable) => {
    const match = variable.match(/^--zao-palette-(.+)-(?:light|dark)-1$/);
    return match ? [match[1]!] : [];
  });
  const allRamps = [...new Set([...ramps, ...extraRamps, ...resolvedRamps])];
  const renderControl = (parameter: Parameter, compact = false) => (
    <ParameterControl
      key={parameter.id}
      parameter={parameter}
      style={style}
      mode={mode}
      baselineParams={baselineParams}
      resolvedVars={resolvedVars}
      fontFamilies={fontFamilies}
      onChange={onChange}
      onRequestColorPick={onRequestColorPick}
      disabled={readOnly}
      compact={compact}
    />
  );
  return (
    <section aria-label="Style editor" className="flex flex-col gap-6 bg-canvas text-default">
      <header className="flex flex-col gap-3 border-b border-subtle pb-4">
        <div className="flex items-center gap-2">
          <h2 className="type-heading">Style editor</h2>
          {style.author.startsWith('agent:') && (
            <span className="rounded-pill border border-subtle px-2 type-caption">Agent-made</span>
          )}
          {style.generated && (
            <span className="rounded-pill border border-subtle px-2 type-caption">Generated</span>
          )}
        </div>
        <label className="flex flex-col gap-1 type-label">
          Name
          <input
            className={`${fieldClass} w-full`}
            value={style.name}
            disabled={readOnly}
            onChange={(event) => onChange({ ...style, name: event.target.value })}
          />
        </label>
        <p className="type-caption text-muted">
          Based on {style.extends}. Edits update the draft and specimen immediately.
        </p>
        {readOnly && (
          <p className="type-caption text-muted">
            The token baseline is read only. Fork it to make a style.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            className={buttonClass}
            type="button"
            onClick={() => {
              setForkName(`${style.name} study`);
              setForking(true);
            }}
          >
            Fork style
          </button>
          <button
            className={buttonClass}
            type="button"
            disabled={readOnly || saving || !style.name.trim()}
            onClick={() => void onSave()}
          >
            {saving ? 'Saving…' : 'Save style'}
          </button>
          <button
            className={buttonClass}
            type="button"
            disabled={readOnly || saving}
            onClick={() => void onDelete()}
          >
            Delete style
          </button>
          <button className={buttonClass} type="button" disabled={!canUndo} onClick={onUndo}>
            Undo
          </button>
          <button className={buttonClass} type="button" disabled={!canRedo} onClick={onRedo}>
            Redo
          </button>
        </div>
        {forking && (
          <form
            className="flex flex-col gap-2 rounded-surface border border-subtle bg-surface p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!forkName.trim()) return;
              onFork(forkName.trim());
              setForking(false);
            }}
          >
            <label className="flex flex-col gap-1 type-label">
              New style name
              <input
                autoFocus
                className={`${fieldClass} w-full`}
                value={forkName}
                onChange={(event) => setForkName(event.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <button className={buttonClass} type="submit" disabled={!forkName.trim()}>
                Create style
              </button>
              <button className={buttonClass} type="button" onClick={() => setForking(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </header>

      <section className="flex flex-col gap-3 rounded-surface border border-subtle bg-surface p-3">
        <h3 className="type-heading">Style notes</h3>
        <label className="flex flex-col gap-1 type-label">
          Tags, separated by commas
          <input
            className={`${fieldClass} w-full`}
            disabled={readOnly}
            value={tagsDraft}
            onChange={(event) => setTagsDraft(event.target.value)}
            onBlur={() => {
              const tags = [
                ...new Set(
                  tagsDraft
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                ),
              ];
              if (JSON.stringify(tags) !== JSON.stringify(style.tags ?? []))
                onChange({ ...style, tags });
            }}
          />
        </label>
        <label className="flex flex-col gap-1 type-label">
          Notes
          <textarea
            className="min-h-20 rounded-control border border-default bg-surface p-2 type-body text-default outline-focus"
            disabled={readOnly}
            value={style.notes ?? ''}
            onChange={(event) => onChange({ ...style, notes: event.target.value })}
          />
        </label>
        {style.references?.length ? (
          <div className="flex flex-col gap-2">
            <p className="type-label">Linked references</p>
            {style.references.map((id) => (
              <div className="flex items-center justify-between gap-2 type-caption" key={id}>
                <span>{id}</span>
                <button
                  className="text-accent underline"
                  disabled={readOnly}
                  onClick={() =>
                    onChange({
                      ...style,
                      references: style.references?.filter((reference) => reference !== id),
                    })
                  }
                  type="button"
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <label className="flex flex-col gap-1 type-label">
        Find a parameter
        <input
          className={`${fieldClass} w-full`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or group"
        />
      </label>

      {!query && (
        <section aria-labelledby="palette-heading" className="flex flex-col gap-3">
          <div>
            <h3 className="type-heading" id="palette-heading">
              Palette
            </h3>
            <p className="type-caption text-muted">
              Select a step to pin an exact hex or OKLCH color. Pins may change contrast.
            </p>
          </div>
          {allRamps.map((ramp) => (
            <details className="rounded-surface border border-subtle bg-surface p-3" key={ramp}>
              <summary className="cursor-pointer type-label font-medium">
                {sentenceCase(ramp)}
              </summary>
              <div className="mt-3 flex flex-col gap-4">
                {modes.map((mode) => (
                  <div className="flex flex-col gap-2" key={mode}>
                    <p className="type-caption text-muted">{sentenceCase(mode)} · steps 1–12</p>
                    <div className="grid grid-cols-12 gap-1">
                      {Array.from({ length: 12 }, (_, index) => {
                        const step = index + 1;
                        const variable = `--zao-palette-${ramp}-${mode}-${step}`;
                        const active =
                          selectedPin?.ramp === ramp &&
                          selectedPin.mode === mode &&
                          selectedPin.step === step;
                        return (
                          <button
                            aria-label={`${ramp} ${mode} step ${step}: ${resolvedVars[variable] ?? 'unavailable'}`}
                            aria-pressed={active}
                            className={`flex h-10 min-w-0 items-end justify-center rounded-control border pb-1 type-caption figures-tabular ${active ? 'border-accent' : 'border-subtle'}`}
                            key={step}
                            onClick={() => setSelectedPin({ ramp, mode, step })}
                            style={{
                              backgroundColor:
                                resolvedVars[variable] ?? 'var(--zao-color-bg-sunken)',
                            }}
                            title={resolvedVars[variable] ?? 'No resolved value'}
                            type="button"
                          >
                            <span className="rounded-pill bg-surface px-1 text-default">
                              {step}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedPin?.ramp === ramp &&
                      selectedPin.mode === mode &&
                      byId.has(`color.${ramp}.pin.${mode}.${selectedPin.step}`) && (
                        <div className="rounded-control border border-subtle bg-canvas p-2">
                          {renderControl(
                            byId.get(`color.${ramp}.pin.${mode}.${selectedPin.step}`)!,
                            true,
                          )}
                        </div>
                      )}
                  </div>
                ))}
                {byId.has(`color.${ramp}.hue`) ? (
                  parameters
                    .filter(
                      (parameter) =>
                        parameter.id.startsWith(`color.${ramp}.`) &&
                        !parameter.id.includes('.pin.'),
                    )
                    .map((parameter) => renderControl(parameter))
                ) : (
                  <ExtraRampControls
                    ramp={ramp}
                    style={style}
                    baselineParams={baselineParams}
                    selectedPin={selectedPin?.ramp === ramp ? selectedPin : null}
                    onChange={onChange}
                    onRequestColorPick={onRequestColorPick}
                    disabled={readOnly}
                  />
                )}
              </div>
            </details>
          ))}
        </section>
      )}

      {groupOrder.map((group) => {
        const items = filtered.filter(
          (parameter) => parameter.group === group && (query || !isPaletteDetail(parameter.id)),
        );
        if (!items.length) return null;
        return (
          <section className="flex flex-col gap-3" key={group}>
            <h3 className="type-heading">{sentenceCase(group)}</h3>
            <div className="flex flex-col gap-3">
              {items.map((parameter) => renderControl(parameter))}
            </div>
          </section>
        );
      })}
      {query && !filtered.length && (
        <p className="type-body text-muted">No parameter matches “{query}”.</p>
      )}

      <section className="flex flex-col gap-2 border-t border-subtle pt-4">
        <h3 className="type-heading">Contrast</h3>
        <p className="type-caption text-muted">Live checks for the current specimen context.</p>
        <ul className="flex flex-col gap-1">
          {contrastResults.map((result) => (
            <li className="flex items-center gap-2 type-caption" key={result.label}>
              <span className={result.pass ? 'text-success' : 'text-danger'}>
                {result.pass ? 'Pass' : 'Fail'}
              </span>
              <span className="min-w-0 flex-1">{result.label}</span>
              <span className="figures-tabular">
                {result.ratio.toFixed(2)}:1 / {result.minimum}:1
              </span>
            </li>
          ))}
          {!contrastResults.length && (
            <li className="type-caption text-muted">No checks available for this context.</li>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-2 border-t border-subtle pt-4">
        <h3 className="type-heading">Changes from {style.extends}</h3>
        {Object.entries(style.params).length ? (
          <ul className="flex flex-col gap-2">
            {Object.entries(style.params).map(([id, value]) => (
              <li
                className="flex items-start gap-2 border-b border-subtle pb-2 type-caption"
                key={id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{byId.get(id)?.label ?? id}</p>
                  <p className="type-code break-all text-muted">
                    {Array.isArray(value)
                      ? value.join(', ')
                      : value && typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                  </p>
                  {byId.get(id)?.layer !== 'finish' && (
                    <p className="text-muted">Affects both finishes if promoted.</p>
                  )}
                </div>
                <button
                  className="text-accent underline"
                  disabled={readOnly}
                  onClick={() => {
                    const params = { ...style.params };
                    delete params[id];
                    onChange({ ...style, params });
                  }}
                  type="button"
                >
                  Reset
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-caption text-muted">This style inherits every parameter.</p>
        )}
      </section>

      <label className="flex flex-col gap-2 border-t border-subtle pt-4 type-label">
        Extra CSS
        <textarea
          className={`${fieldClass} h-20 w-full py-2 type-code`}
          value={style.extraCss ?? ''}
          disabled={readOnly}
          onChange={(event) => onChange({ ...style, extraCss: event.target.value })}
          placeholder="CSS scoped to this style’s island"
          spellCheck={false}
        />
        <span className="type-caption text-muted">
          {inheritedExtraCssFrom
            ? `Preview inherits CSS from ${inheritedExtraCssFrom}. Type here to override it. `
            : ''}
          If the same treatment returns in another style, consider adding a parameter.
        </span>
      </label>
    </section>
  );
}
