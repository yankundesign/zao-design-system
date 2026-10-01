'use client';

import { useEffect, useState } from 'react';
import type { StyleFile } from '@zao/engine';
import ReactMarkdown from 'react-markdown';
import { specimens } from '@/lib/specimens';
import type { ContextId } from '@/lib/token-data';

type SnapshotImage = {
  style: string;
  specimen: string;
  context: ContextId;
  file: string;
  url: string;
};
type Snapshot = {
  id: string;
  private: boolean;
  createdAt: string;
  styles: string[];
  specimens: string[];
  contexts: ContextId[];
  images: SnapshotImage[];
  contactSheetUrl: string;
};
type JournalEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  styles: string[];
  specimen?: string;
  context?: ContextId;
  snapshot?: string;
  tags?: string[];
};

const contexts: { id: ContextId; label: string }[] = [
  { id: 'su-light', label: 'Su · light' },
  { id: 'su-dark', label: 'Su · dark' },
  { id: 'yu-dark', label: 'Yu · dark' },
];
const fieldClass =
  'h-8 min-w-0 rounded-control border border-default bg-surface px-2 type-body text-default outline-focus';
const buttonClass =
  'h-8 rounded-action border border-default bg-surface px-3 type-label trim-label text-default hover:bg-hover disabled:opacity-50';

function toggle(items: string[], id: string) {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

function imageUrl(snapshot: string) {
  return `/api/snapshots/files/${snapshot.split('/').map(encodeURIComponent).join('/')}`;
}

function JournalMarkdown({ source }: { source: string }) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="type-body">{children}</p>,
          h1: ({ children }) => <h4 className="type-heading">{children}</h4>,
          h2: ({ children }) => <h4 className="type-heading">{children}</h4>,
          h3: ({ children }) => <h4 className="type-heading">{children}</h4>,
          strong: ({ children }) => <strong className="font-strong">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-5 type-body">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 type-body">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l border-subtle pl-3 type-body">{children}</blockquote>
          ),
          pre: ({ children }) => (
            <pre className="overflow-auto rounded-surface bg-sunken p-3 type-code">{children}</pre>
          ),
          code: ({ children }) => <code className="type-code">{children}</code>,
          a: ({ children, href }) => (
            <a className="text-accent underline" href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          img: () => null,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export default function RecordPanel({
  styles,
  currentStyle,
  specimenId,
  contextId,
  currentStyleDirty,
}: {
  styles: StyleFile[];
  currentStyle: StyleFile;
  specimenId: string;
  contextId: ContextId;
  currentStyleDirty: boolean;
}) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    styles.some((style) => style.id === currentStyle.id) ? [currentStyle.id] : [],
  );
  const [noteStyleIds, setNoteStyleIds] = useState<string[]>(
    styles.some((style) => style.id === currentStyle.id) ? [currentStyle.id] : [],
  );
  const [selectedSpecimens, setSelectedSpecimens] = useState<string[]>([specimenId]);
  const [selectedContexts, setSelectedContexts] = useState<ContextId[]>([contextId]);
  const [slug, setSlug] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotErrors, setSnapshotErrors] = useState<{ file: string; message: string }[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [journalErrors, setJournalErrors] = useState<{ file: string; message: string }[]>([]);
  const [snapshot, setSnapshot] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const styleOptions = styles;
  const styleIdsKey = styles.map((style) => style.id).join('|');
  const snapshotImages = snapshots.flatMap((item) =>
    item.images.map((image) => ({
      ...image,
      key: image.file,
    })),
  );
  const visibleEntries = entries.filter(
    (entry) =>
      (!filterStyle || entry.styles.includes(filterStyle)) &&
      (!filterTag || entry.tags?.includes(filterTag)),
  );
  const allTags = [...new Set(entries.flatMap((entry) => entry.tags ?? []))].sort();
  const timelineStyleIds = [
    ...new Set([...styles.map((style) => style.id), ...entries.flatMap((entry) => entry.styles)]),
  ].sort();

  useEffect(() => {
    setSelectedStyles(
      styleOptions.some((style) => style.id === currentStyle.id) ? [currentStyle.id] : [],
    );
    setNoteStyleIds(
      styleOptions.some((style) => style.id === currentStyle.id) ? [currentStyle.id] : [],
    );
    // styleIdsKey changes only when the saved style list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStyle.id, styleIdsKey]);
  useEffect(() => {
    setSelectedSpecimens([specimenId]);
  }, [specimenId]);
  useEffect(() => {
    setSelectedContexts([contextId]);
  }, [contextId]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSnapshots() {
      try {
        const response = await fetch('/api/snapshots', { signal: controller.signal });
        const payload: {
          snapshots?: Snapshot[];
          errors?: { file: string; message: string }[];
          error?: string;
        } = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Could not load snapshots.');
        if (!controller.signal.aborted) {
          setSnapshots(payload.snapshots ?? []);
          setSnapshotErrors(payload.errors ?? []);
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setMessage(error instanceof Error ? error.message : 'Could not load snapshots.');
      }
    }
    async function loadJournal() {
      try {
        const response = await fetch('/api/journal', { signal: controller.signal });
        const journalPayload: {
          entries?: JournalEntry[];
          errors?: { file: string; message: string }[];
          error?: string;
        } = await response.json();
        if (!response.ok)
          throw new Error(journalPayload.error ?? 'Could not load the journal.');
        if (!controller.signal.aborted) {
          setEntries(journalPayload.entries ?? []);
          setJournalErrors(journalPayload.errors ?? []);
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setMessage(error instanceof Error ? error.message : 'Could not load the journal.');
      }
    }
    void loadSnapshots();
    void loadJournal();
    return () => controller.abort();
  }, []);

  async function capture() {
    if (!selectedStyles.length || !selectedSpecimens.length || !selectedContexts.length) {
      setMessage('Choose at least one style, specimen, and context.');
      return;
    }
    setBusy(true);
    setMessage('Capturing snapshots…');
    try {
      const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styles: selectedStyles,
          specimens: selectedSpecimens,
          contexts: selectedContexts,
          ...(slug.trim() ? { slug: slug.trim() } : {}),
        }),
      });
      const payload: { snapshot?: Snapshot; error?: string } = await response.json();
      if (!response.ok || !payload.snapshot)
        throw new Error(payload.error ?? 'Could not capture snapshots.');
      setSnapshots((items) => [payload.snapshot!, ...items]);
      const first = payload.snapshot.images[0];
      if (first) setSnapshot(first.file);
      setMessage(`Captured ${payload.snapshot.images.length} snapshots.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not capture snapshots.');
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!title.trim() || !body.trim()) {
      setMessage('Add a title and note before saving.');
      return;
    }
    if (!noteStyleIds.length) {
      setMessage('Choose at least one saved style for this note.');
      return;
    }
    setBusy(true);
    setMessage('Saving journal entry…');
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          styles: noteStyleIds,
          specimen: specimenId,
          context: contextId,
          ...(snapshot ? { snapshot } : {}),
          tags: tags
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const payload: { entry?: JournalEntry; error?: string } = await response.json();
      if (!response.ok || !payload.entry)
        throw new Error(payload.error ?? 'Could not save the journal entry.');
      setEntries((items) => [payload.entry!, ...items]);
      setTitle('');
      setBody('');
      setTags('');
      setMessage(`Saved ${payload.entry.title}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the journal entry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Snapshots and journal" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-surface border border-subtle bg-surface p-4">
        <div>
          <h2 className="type-heading">Snapshots</h2>
          <p className="type-caption text-muted">
            Capture a chosen set of styles and specimens in the local lab.
          </p>
          {currentStyleDirty ? (
            <p className="type-caption text-muted">
              Snapshots use saved styles. Save your current draft before capturing its changes.
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <fieldset className="flex flex-col gap-1">
            <legend className="type-label font-medium">Styles</legend>
            {styleOptions.map((style) => (
              <label className="flex min-h-7 items-center gap-2 type-body" key={style.id}>
                <input
                  checked={selectedStyles.includes(style.id)}
                  onChange={() => setSelectedStyles((items) => toggle(items, style.id))}
                  type="checkbox"
                />
                {style.name}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className="type-label font-medium">Specimens</legend>
            {specimens.map((specimen) => (
              <label className="flex min-h-7 items-center gap-2 type-body" key={specimen.id}>
                <input
                  checked={selectedSpecimens.includes(specimen.id)}
                  onChange={() => setSelectedSpecimens((items) => toggle(items, specimen.id))}
                  type="checkbox"
                />
                {specimen.title}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className="type-label font-medium">Contexts</legend>
            {contexts.map((context) => (
              <label className="flex min-h-7 items-center gap-2 type-body" key={context.id}>
                <input
                  checked={selectedContexts.includes(context.id)}
                  onChange={() =>
                    setSelectedContexts((items) => toggle(items, context.id) as ContextId[])
                  }
                  type="checkbox"
                />
                {context.label}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 type-label">
            Name for this capture
            <input
              className={fieldClass}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => void capture()}
            type="button"
          >
            Capture snapshots
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="type-heading">Recent captures</h2>
        {snapshots.map((item) => (
          <article
            className="rounded-surface border border-subtle bg-surface p-3"
            key={`${item.private ? 'private-' : ''}${item.id}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="type-label font-medium">{item.id}</h3>
              <span className="type-caption text-muted">
                {item.images.length} images{item.private ? ' · Private' : ''}
              </span>
            </div>
            <p className="mt-1 type-caption text-muted">
              {item.styles.join(', ')} · {item.specimens.join(', ')} · {item.contexts.join(', ')}
            </p>
            {item.contactSheetUrl ? (
              <a
                className="mt-2 inline-block type-label text-accent underline"
                href={item.contactSheetUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open contact sheet
              </a>
            ) : null}
            {item.images[0] ? (
              <a className="mt-3 block" href={item.images[0].url} target="_blank" rel="noreferrer">
                <img
                  className="max-h-60 rounded-surface border border-subtle object-contain"
                  src={item.images[0].url}
                  alt={`First capture in ${item.id}`}
                />
              </a>
            ) : null}
          </article>
        ))}
        {!snapshots.length ? <p className="type-body text-muted">No snapshots yet.</p> : null}
        {snapshotErrors.length ? (
          <div role="alert" className="rounded-surface border border-subtle bg-surface p-3">
            <p className="type-label font-medium">Some snapshot manifests could not be read.</p>
            <ul className="mt-2 list-disc pl-5 type-caption">
              {snapshotErrors.map((error) => (
                <li key={error.file}>
                  {error.file}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-4 rounded-surface border border-subtle bg-surface p-4">
        <div>
          <h2 className="type-heading">Journal</h2>
          <p className="type-caption text-muted">
            Record what worked, what did not, and what you want to try next.
          </p>
          {currentStyleDirty ? (
            <p className="type-caption text-muted">
              Notes link to saved styles. Save your current draft before recording its changes.
            </p>
          ) : null}
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="type-label font-medium">Styles for this note</legend>
          {styleOptions.map((style) => (
            <label className="flex min-h-7 items-center gap-2 type-body" key={style.id}>
              <input
                checked={noteStyleIds.includes(style.id)}
                onChange={() => setNoteStyleIds((items) => toggle(items, style.id))}
                type="checkbox"
              />
              {style.name}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1 type-label">
          Title
          <input
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 type-label">
          Note
          <textarea
            className="min-h-20 rounded-control border border-default bg-surface p-2 type-body text-default outline-focus"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 type-label">
            Tags, separated by commas
            <input
              className={fieldClass}
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 type-label">
            Attach snapshot
            <select
              className={fieldClass}
              value={snapshot}
              onChange={(event) => setSnapshot(event.target.value)}
            >
              <option value="">No snapshot</option>
              {snapshotImages.map((image) => (
                <option key={image.key} value={image.key}>
                  {image.style} · {image.specimen} · {image.context}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => void saveNote()}
            type="button"
          >
            Save journal entry
          </button>
        </div>
      </div>

      {message ? (
        <p role="status" className="type-body text-muted">
          {message}
        </p>
      ) : null}
      {journalErrors.length ? (
        <div role="alert" className="rounded-surface border border-subtle bg-surface p-3">
          <p className="type-label font-medium">Some journal files could not be read.</p>
          <ul className="mt-2 list-disc pl-5 type-caption">
            {journalErrors.map((error) => (
              <li key={error.file}>
                {error.file}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="type-heading">Timeline</h2>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 type-label">
              Style
              <select
                className={fieldClass}
                value={filterStyle}
                onChange={(event) => setFilterStyle(event.target.value)}
              >
                <option value="">All styles</option>
                {timelineStyleIds.map((id) => (
                  <option key={id} value={id}>
                    {styleOptions.find((style) => style.id === id)?.name ?? id}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 type-label">
              Tag
              <select
                className={fieldClass}
                value={filterTag}
                onChange={(event) => setFilterTag(event.target.value)}
              >
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {visibleEntries.map((entry) => (
          <article className="rounded-surface border border-subtle bg-surface p-4" key={entry.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="type-heading">{entry.title}</h3>
              <time className="type-caption text-muted">{entry.date}</time>
            </div>
            <JournalMarkdown source={entry.body} />
            <p className="mt-3 type-caption text-muted">
              {entry.styles.join(', ')}
              {entry.specimen ? ` · ${entry.specimen}` : ''}
              {entry.context ? ` · ${entry.context}` : ''}
              {entry.tags?.length ? ` · ${entry.tags.join(', ')}` : ''}
            </p>
            {entry.snapshot ? (
              <a
                className="mt-3 block"
                href={imageUrl(entry.snapshot)}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="max-h-60 rounded-surface border border-subtle object-contain"
                  alt={`Snapshot attached to ${entry.title}`}
                  src={imageUrl(entry.snapshot)}
                />
              </a>
            ) : null}
          </article>
        ))}
        {!visibleEntries.length ? (
          <p className="type-body text-muted">No journal entries match these filters.</p>
        ) : null}
      </div>
    </section>
  );
}
