'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { StyleFile } from '@zao/engine';
import type { ReferenceInput, ReferenceRecord, ReferenceTeardown } from '@/lib/references-server';
import { makeReferenceSeedDraft } from '@/lib/reference-seed';

interface ReferenceBoardProps {
  styles: StyleFile[];
  reservedStyleIds: string[];
  currentStyle: StyleFile;
  onSeedDraft: (draft: StyleFile, mode: 'light' | 'dark') => void;
  onPickColor?: (color: string) => void;
  onClose?: () => void;
}

const emptyTeardown: ReferenceTeardown = {
  neutralTemperature: '',
  contrast: '',
  accentUse: '',
  density: '',
  radiusFamily: '',
  typeContrast: '',
  depth: '',
  motion: '',
};

const emptyInput: ReferenceInput = {
  title: '',
  tags: [],
  boards: [],
  notes: '',
  likes: '',
  dislikes: '',
  teardown: emptyTeardown,
};

const teardownLabels: Array<[keyof ReferenceTeardown, string, string]> = [
  ['neutralTemperature', 'Neutral temperature', 'Cool, neutral or warm; how tinted?'],
  ['contrast', 'Contrast', 'Soft, medium or crisp; light or dark first?'],
  ['accentUse', 'Accent use', 'Where does it appear and how much?'],
  ['density', 'Density', 'Control heights, spacing, content per screen'],
  ['radiusFamily', 'Shape', 'Sharp, soft or round; how consistent?'],
  ['typeContrast', 'Type', 'Faces, weight and size contrast, tracking'],
  ['depth', 'Depth', 'Borders, shadows, glass or flat; number of layers'],
  ['motion', 'Motion', 'Quick or soft, if visible'],
];

const inputClass =
  'h-8 w-full rounded-control border border-default bg-surface px-2 type-body text-default outline-focus';
const textAreaClass =
  'min-h-20 w-full rounded-control border border-default bg-surface p-2 type-body text-default outline-focus';
const buttonClass =
  'min-h-8 rounded-action border border-default bg-surface px-3 type-label text-default outline-focus';
const primaryButtonClass =
  'min-h-8 rounded-action bg-accent px-3 type-label text-on-accent outline-focus';

function splitList(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function imageUrl(id: string, updatedAt: string) {
  return `/api/references/${encodeURIComponent(id)}/image?updated=${encodeURIComponent(updatedAt)}`;
}

function prettyPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function hexFromPixel(data: Uint8ClampedArray) {
  return `#${[data[0]!, data[1]!, data[2]!]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

function TextField({
  label,
  value,
  onChange,
  hint,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 type-label">
      <span>{label}</span>
      {hint ? <span className="type-caption text-muted">{hint}</span> : null}
      {multiline ? (
        <textarea
          className={textAreaClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export default function ReferenceBoard({
  styles,
  reservedStyleIds,
  currentStyle,
  onSeedDraft,
  onPickColor,
  onClose,
}: ReferenceBoardProps) {
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState<ReferenceInput>(emptyInput);
  const [tagsText, setTagsText] = useState('');
  const [boardsText, setBoardsText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [imageMissing, setImageMissing] = useState(false);
  const [sampledColor, setSampledColor] = useState<string | null>(null);
  const [sampledAlpha, setSampledAlpha] = useState(1);
  const [pixelX, setPixelX] = useState(0);
  const [pixelY, setPixelY] = useState(0);
  const [neutralChoice, setNeutralChoice] = useState('');
  const [accentChoice, setAccentChoice] = useState('');
  const [targetMode, setTargetMode] = useState<'light' | 'dark' | ''>('');
  const [neutralStep, setNeutralStep] = useState<number | ''>('');
  const [accentStep, setAccentStep] = useState<number | ''>('');
  const [seedName, setSeedName] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);

  const selected = references.find((entry) => entry.id === selectedId);
  const boards = useMemo(
    () => [...new Set(references.flatMap((entry) => entry.boards))].sort(),
    [references],
  );
  const visible = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return references.filter(
      (reference) =>
        (boardFilter === 'all' || reference.boards.includes(boardFilter)) &&
        (!query ||
          [
            reference.title,
            reference.sourceUrl ?? '',
            reference.notes,
            ...reference.tags,
            ...reference.boards,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)),
    );
  }, [references, filter, boardFilter]);
  const linkedStyles = styles.filter(
    (style) => selected && style.references?.includes(selected.id),
  );
  const swatches = selected?.analysis?.swatches ?? [];
  const swatchOptions = [
    ...swatches.map((swatch) => ({
      id: swatch.id,
      hex: swatch.hex,
      label: `${swatch.hex} · ${prettyPercent(swatch.share)}`,
    })),
    ...(sampledColor
      ? [{ id: 'sampled', hex: sampledColor, label: `${sampledColor} · exact pixel` }]
      : []),
  ];

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch('/api/references', { signal: controller.signal });
        const result: { references?: ReferenceRecord[]; error?: string } = await response.json();
        if (!response.ok || !result.references)
          throw new Error(result.error ?? 'Could not load references.');
        setReferences(result.references);
      } catch (error) {
        if (!controller.signal.aborted)
          setMessage(error instanceof Error ? error.message : 'Could not load references.');
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function selectReference(reference: ReferenceRecord) {
    setSelectedId(reference.id);
    setCreating(false);
    setInput({
      title: reference.title,
      ...(reference.sourceUrl ? { sourceUrl: reference.sourceUrl } : {}),
      tags: [...reference.tags],
      boards: [...reference.boards],
      notes: reference.notes,
      likes: reference.likes,
      dislikes: reference.dislikes,
      teardown: { ...reference.teardown },
    });
    setTagsText(reference.tags.join(', '));
    setBoardsText(reference.boards.join(', '));
    setImage(null);
    setImageMissing(false);
    setSampledColor(null);
    setNeutralChoice('');
    setAccentChoice('');
    setTargetMode('');
    setNeutralStep('');
    setAccentStep('');
    setSeedName(`${reference.title} study`);
    setMessage('');
  }

  function startNew() {
    setSelectedId(null);
    setCreating(true);
    setInput({ ...emptyInput, tags: [], boards: [], teardown: { ...emptyTeardown } });
    setTagsText('');
    setBoardsText('');
    setImage(null);
    setSampledColor(null);
    setMessage('');
  }

  function acceptImage(file: File | null) {
    if (!file) return;
    if (!creating && !selected) startNew();
    setImage(file);
    setMessage(`Ready to save ${file.name}.`);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const file = [...event.dataTransfer.files].find((entry) => entry.type.startsWith('image/'));
    if (file) acceptImage(file);
  }

  async function saveReference() {
    setBusy(true);
    setMessage('Saving reference…');
    try {
      const path = creating ? '/api/references' : `/api/references/${selectedId}`;
      const method = creating ? 'POST' : 'PUT';
      const editable = { ...input, tags: splitList(tagsText), boards: splitList(boardsText) };
      let response: Response;
      if (image) {
        const data = new FormData();
        data.set('metadata', JSON.stringify(editable));
        data.set('image', image);
        response = await fetch(path, { method, body: data });
      } else {
        response = await fetch(path, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editable),
        });
      }
      const result: { reference?: ReferenceRecord; error?: string } = await response.json();
      if (!response.ok || !result.reference)
        throw new Error(result.error ?? 'Could not save the reference.');
      const saved = result.reference;
      setReferences((entries) =>
        creating
          ? [...entries, saved]
          : entries.map((entry) => (entry.id === saved.id ? saved : entry)),
      );
      selectReference(saved);
      setMessage(`Saved ${saved.title}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the reference.');
    } finally {
      setBusy(false);
    }
  }

  async function removeReference() {
    if (!selected || !window.confirm(`Delete ${selected.title}?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/references/${selected.id}`, { method: 'DELETE' });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not delete the reference.');
      setReferences((entries) => entries.filter((entry) => entry.id !== selected.id));
      setSelectedId(null);
      setImage(null);
      setMessage(`Deleted ${selected.title}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete the reference.');
    } finally {
      setBusy(false);
    }
  }

  function samplePixel(x: number, y: number) {
    const source = imageRef.current;
    if (!source?.complete || !source.naturalWidth || !source.naturalHeight) return;
    const boundedX = Math.max(0, Math.min(source.naturalWidth - 1, Math.floor(x)));
    const boundedY = Math.max(0, Math.min(source.naturalHeight - 1, Math.floor(y)));
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.drawImage(source, boundedX, boundedY, 1, 1, 0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    setSampledColor(hexFromPixel(pixel));
    setSampledAlpha(pixel[3]! / 255);
    setPixelX(boundedX);
    setPixelY(boundedY);
  }

  function seedDraft() {
    if (!selected) return;
    const neutral = swatchOptions.find((option) => option.id === neutralChoice);
    const accent = swatchOptions.find((option) => option.id === accentChoice);
    if (!neutral || !accent || !seedName.trim() || !targetMode || !neutralStep || !accentStep) {
      setMessage('Name the draft and choose both swatches, the mode, and each palette step.');
      return;
    }
    try {
      const draft = makeReferenceSeedDraft({
        referenceId: selected.id,
        referenceTitle: selected.title,
        name: seedName,
        currentStyle,
        savedStyles: styles,
        reservedStyleIds,
        mode: targetMode,
        neutralStep,
        accentStep,
        neutralHex: neutral.hex,
        accentHex: accent.hex,
      });
      onSeedDraft(draft, targetMode);
      setMessage(
        `Created an unsaved draft, ${draft.name}. Review its palette and contrast before saving.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not seed the draft.');
    }
  }

  return (
    <section
      aria-label="Reference board"
      className="rounded-surface border border-subtle bg-canvas p-5 text-default"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onPaste={(event) => {
        const file = [...event.clipboardData.files].find((entry) =>
          entry.type.startsWith('image/'),
        );
        if (file) {
          event.preventDefault();
          acceptImage(file);
        }
      }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-caption text-muted">Collect</p>
          <h2 className="type-title">Reference board</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" className={primaryButtonClass} onClick={startNew}>
            Add reference
          </button>
          {onClose ? (
            <button type="button" className={buttonClass} onClick={onClose}>
              Close board
            </button>
          ) : null}
        </div>
      </div>
      <p className="mb-5 type-body text-muted">
        Drop or paste a PNG or JPG, or save a source URL. Local images stay on this machine.
      </p>
      {message ? (
        <p role="status" className="mb-4 type-body text-muted">
          {message}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 type-label">
            <span>Find references</span>
            <input
              className={inputClass}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search title, tags or notes"
            />
          </label>
          <label className="flex flex-col gap-1 type-label">
            <span>Board</span>
            <select
              className={inputClass}
              value={boardFilter}
              onChange={(event) => setBoardFilter(event.target.value)}
            >
              <option value="all">All boards</option>
              {boards.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>
          </label>
          {visible.length ? (
            <ul className="flex flex-col gap-2">
              {visible.map((reference) => (
                <li key={reference.id}>
                  <button
                    type="button"
                    className="flex min-h-10 w-full flex-col gap-1 rounded-control border border-subtle bg-surface p-3 text-left outline-focus"
                    aria-pressed={selectedId === reference.id}
                    onClick={() => selectReference(reference)}
                  >
                    <span className="type-label font-medium">{reference.title}</span>
                    <span className="type-caption text-muted">
                      {reference.tags.join(' · ') || reference.sourceUrl || reference.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-body text-muted">
              {references.length ? 'No references match these filters.' : 'No references yet.'}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {creating || selected ? (
            <>
              <div className="flex flex-col gap-3 rounded-surface border border-subtle bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="type-heading">
                    {creating ? 'New reference' : 'Reference details'}
                  </h3>
                  {selected ? <span className="type-caption text-muted">{selected.id}</span> : null}
                </div>
                <TextField
                  label="Title"
                  value={input.title}
                  onChange={(title) => setInput((current) => ({ ...current, title }))}
                />
                <TextField
                  label="Source URL"
                  hint="Saved as a link. The lab does not fetch it."
                  value={input.sourceUrl ?? ''}
                  onChange={(sourceUrl) => setInput((current) => ({ ...current, sourceUrl }))}
                />
                <label className="flex flex-col gap-1 type-label">
                  <span>Image or local screenshot</span>
                  <input
                    className="min-h-8 w-full type-body"
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      acceptImage(event.target.files?.[0] ?? null)
                    }
                  />
                  {image ? (
                    <span className="type-caption text-muted">Selected {image.name}</span>
                  ) : null}
                </label>
                <TextField
                  label="Vibe words"
                  hint="Separate free tags with commas."
                  value={tagsText}
                  onChange={setTagsText}
                />
                <TextField
                  label="Boards"
                  hint="For example, Su candidates or Yu candidates. Separate names with commas."
                  value={boardsText}
                  onChange={setBoardsText}
                />
                <TextField
                  label="Notes"
                  value={input.notes}
                  multiline
                  onChange={(notes) => setInput((current) => ({ ...current, notes }))}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="What I like"
                    value={input.likes}
                    multiline
                    onChange={(likes) => setInput((current) => ({ ...current, likes }))}
                  />
                  <TextField
                    label="What I don't like"
                    value={input.dislikes}
                    multiline
                    onChange={(dislikes) => setInput((current) => ({ ...current, dislikes }))}
                  />
                </div>
                <details>
                  <summary className="min-h-7 cursor-pointer type-label font-medium outline-focus">
                    Teardown
                  </summary>
                  <div className="mt-3 grid gap-3">
                    {teardownLabels.map(([key, label, hint]) => (
                      <TextField
                        key={key}
                        label={label}
                        hint={hint}
                        value={input.teardown[key]}
                        onChange={(value) =>
                          setInput((current) => ({
                            ...current,
                            teardown: { ...current.teardown, [key]: value },
                          }))
                        }
                      />
                    ))}
                  </div>
                </details>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    disabled={busy}
                    onClick={() => void saveReference()}
                  >
                    {creating ? 'Add reference' : 'Save reference'}
                  </button>
                  {selected ? (
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={busy}
                      onClick={() => void removeReference()}
                    >
                      Delete reference
                    </button>
                  ) : null}
                </div>
              </div>

              {selected ? (
                <div className="flex flex-col gap-4 rounded-surface border border-subtle bg-surface p-4">
                  <h3 className="type-heading">Source and colors</h3>
                  {selected.sourceUrl ? (
                    <a
                      className="min-h-7 type-body text-accent underline outline-focus"
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source URL
                    </a>
                  ) : null}
                  {selected.imageFile && !imageMissing ? (
                    <>
                      <button
                        type="button"
                        className="w-full overflow-hidden rounded-surface border border-subtle bg-sunken outline-focus"
                        aria-label="Sample a pixel from the reference image"
                        onClick={(event) => {
                          const rectangle = event.currentTarget.getBoundingClientRect();
                          const source = imageRef.current;
                          if (!source) return;
                          samplePixel(
                            ((event.clientX - rectangle.left) / rectangle.width) *
                              source.naturalWidth,
                            ((event.clientY - rectangle.top) / rectangle.height) *
                              source.naturalHeight,
                          );
                        }}
                      >
                        <img
                          ref={imageRef}
                          src={imageUrl(selected.id, selected.updatedAt)}
                          alt={selected.title}
                          className="h-auto w-full object-contain"
                          onError={() => setImageMissing(true)}
                        />
                      </button>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <label className="type-label">
                          Pixel X
                          <input
                            className={inputClass}
                            type="number"
                            min={0}
                            max={(selected.analysis?.width ?? 1) - 1}
                            value={pixelX}
                            onChange={(event) => setPixelX(Number(event.target.value))}
                          />
                        </label>
                        <label className="type-label">
                          Pixel Y
                          <input
                            className={inputClass}
                            type="number"
                            min={0}
                            max={(selected.analysis?.height ?? 1) - 1}
                            value={pixelY}
                            onChange={(event) => setPixelY(Number(event.target.value))}
                          />
                        </label>
                        <button
                          type="button"
                          className={`${buttonClass} self-end`}
                          onClick={() => samplePixel(pixelX, pixelY)}
                        >
                          Sample pixel
                        </button>
                      </div>
                      {sampledColor ? (
                        <div className="flex flex-wrap items-center gap-2 type-body">
                          <span
                            aria-hidden="true"
                            className="h-7 w-7 rounded-control border border-default"
                            style={{ backgroundColor: sampledColor }}
                          />
                          <span>
                            {sampledColor} at {pixelX}, {pixelY}
                            {sampledAlpha < 1 ? ` · ${prettyPercent(sampledAlpha)} opacity` : ''}
                          </span>
                          {onPickColor ? (
                            <button
                              type="button"
                              className={buttonClass}
                              onClick={() => onPickColor(sampledColor)}
                            >
                              Use color in editor
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : selected.imageFile ? (
                    <p className="type-body text-muted">
                      The local image is missing on this machine. Its metadata and extracted
                      swatches remain available.
                    </p>
                  ) : (
                    <p className="type-body text-muted">
                      Add a local screenshot to extract colors and sample pixels.
                    </p>
                  )}
                  {selected.analysis?.neutrals ? (
                    <p className="type-caption text-muted">
                      Near-neutrals cover {prettyPercent(selected.analysis.neutrals.share)}. Average
                      hue{' '}
                      {selected.analysis.neutrals.averageHue === null
                        ? 'undefined for near-gray pixels'
                        : `${selected.analysis.neutrals.averageHue.toFixed(1)}°`}
                      ; average chroma {selected.analysis.neutrals.averageChroma.toFixed(3)};
                      lightness {selected.analysis.neutrals.lightnessMin.toFixed(3)}–
                      {selected.analysis.neutrals.lightnessMax.toFixed(3)}.
                    </p>
                  ) : null}
                  {(['neutral', 'color'] as const).map((kind) => {
                    const members = swatches.filter((swatch) => swatch.kind === kind);
                    return members.length ? (
                      <div key={kind} className="flex flex-col gap-2">
                        <h4 className="type-label font-medium">
                          {kind === 'neutral' ? 'Near-neutrals' : 'Colors'}
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {members.map((swatch) => (
                            <div
                              key={swatch.id}
                              className="flex items-center gap-2 rounded-control border border-subtle p-2"
                            >
                              <span
                                aria-hidden="true"
                                className="h-8 w-8 rounded-control border border-default"
                                style={{ backgroundColor: swatch.hex }}
                              />
                              <span className="min-w-0 flex-1 type-caption">
                                {swatch.hex} · {prettyPercent(swatch.share)}
                              </span>
                              {onPickColor ? (
                                <button
                                  type="button"
                                  className={buttonClass}
                                  onClick={() => onPickColor(swatch.hex)}
                                >
                                  Use
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })}
                  {linkedStyles.length ? (
                    <p className="type-caption text-muted">
                      Inspired styles: {linkedStyles.map((style) => style.name).join(', ')}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {selected && swatchOptions.length ? (
                <div className="flex flex-col gap-3 rounded-surface border border-subtle bg-surface p-4">
                  <h3 className="type-heading">Seed a draft style</h3>
                  <p className="type-body text-muted">
                    Choose both source colors and where each belongs in the palette. The draft stays
                    unsaved until you save it in the style editor.
                  </p>
                  <TextField label="Draft name" value={seedName} onChange={setSeedName} />
                  <label className="flex flex-col gap-1 type-label">
                    <span>Neutral swatch</span>
                    <select
                      className={inputClass}
                      value={neutralChoice}
                      onChange={(event) => setNeutralChoice(event.target.value)}
                    >
                      <option value="">Choose a swatch</option>
                      {swatchOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 type-label">
                    <span>Accent swatch</span>
                    <select
                      className={inputClass}
                      value={accentChoice}
                      onChange={(event) => setAccentChoice(event.target.value)}
                    >
                      <option value="">Choose a swatch</option>
                      {swatchOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="type-label">
                      Mode
                      <select
                        className={inputClass}
                        value={targetMode}
                        onChange={(event) => setTargetMode(event.target.value as 'light' | 'dark')}
                      >
                        <option value="">Choose a mode</option>
                        {currentStyle.modes.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(
                      [
                        ['Neutral step', neutralStep, setNeutralStep],
                        ['Accent step', accentStep, setAccentStep],
                      ] as const
                    ).map(([label, value, setter]) => (
                      <label key={label} className="type-label">
                        {label}
                        <select
                          className={inputClass}
                          value={value}
                          onChange={(event) =>
                            setter(event.target.value ? Number(event.target.value) : '')
                          }
                        >
                          <option value="">Choose a step</option>
                          {Array.from({ length: 12 }, (_, index) => index + 1).map((step) => (
                            <option key={step} value={step}>
                              {step}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <p className="type-caption text-muted">
                    Steps 1–2 are backgrounds, 3–5 fills, 6–8 borders, 9–10 solid fills, and 11–12
                    text. A pin may break palette order or contrast; check the editor warnings.
                  </p>
                  <button type="button" className={primaryButtonClass} onClick={seedDraft}>
                    Create draft from reference
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-surface border border-subtle bg-surface p-5">
              <p className="type-body text-muted">
                Select a reference to inspect it, or add an image or source URL.
              </p>
            </div>
          )}
        </div>
      </div>
      {previewUrl ? (
        <div className="mt-5 rounded-surface border border-subtle bg-surface p-4">
          <p className="mb-2 type-label font-medium">Image ready to save</p>
          <img
            src={previewUrl}
            alt="New reference preview"
            className="max-h-80 w-full object-contain"
          />
        </div>
      ) : null}
    </section>
  );
}
