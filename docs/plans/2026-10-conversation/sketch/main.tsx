/*
 * Reference only: the host for the Oct 12 Conversation and Composer sketch
 * (https://claude.ai/artifact/Q9MuCg95MtKUqi7XMfSLcU). It is not built, typechecked or published.
 * It fakes some component behavior in the host; see ../README.md before porting anything.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { ArrowDown, Copy, Database, Folder, Page } from 'iconoir-react';
import {
  Button,
  Card,
  Composer,
  ComposerContextChip,
  Conversation,
  IconButton,
  Message,
  Progress,
  Switch,
  Table,
} from '@zao/react';
import type { ComposerAttachment, ComposerDraft } from '@zao/react';

/* ------------------------------------------------------------------ proposals */

type Group = 'Composer' | 'Conversation';
interface Proposal {
  key: string;
  code: string;
  group: Group;
  name: string;
  summary: string;
  options: [string, string][];
  lean: string;
  decided?: string;
  tryIt: string;
}

const STRUCTURES: Record<string, { name: string; line: string }> = {
  today: {
    name: 'Today',
    line: 'Both turns share the left edge, padding, type and header. The request’s only mark is a faint fill.',
  },
  ledger: {
    name: 'Ledger',
    line: 'Each request becomes the heading of its exchange: a full-width recessed band that stays pinned while its answer scrolls.',
  },
  slip: {
    name: 'Slip',
    line: 'Requests move to the trailing edge as small built slips, the tray’s material, carrying what they were sent with. Answers keep the full width.',
  },
  tray: {
    name: 'Tray',
    line: 'Requests are plain medium text on the canvas. Each answer sits in a recessed tray, so its cards and tables stand up from a field.',
  },
  spine: {
    name: 'Spine',
    line: 'An ink rule binds each answer and everything in it; the request sits outside it in medium weight. Lightest, but still linework.',
  },
};

const PROPOSALS: Proposal[] = [
  {
    key: 'tray',
    code: 'C1',
    group: 'Composer',
    name: 'Tray material',
    summary:
      'Raised uses Card’s surface recipe: 4px banded planes and the facet. Well uses TextField’s recess. Both take the field’s invalid edge and sit flat when disabled.',
    options: [
      ['today', 'Today'],
      ['raised', 'Raised'],
      ['well', 'Well'],
    ],
    lean: 'raised',
    tryIt: 'Compare the tray with the Cards in the answers, then check the states below.',
  },
  {
    key: 'focus',
    code: 'C2',
    group: 'Composer',
    name: 'Keyboard focus',
    summary:
      'Brackets close in around the whole tray, the way they do on Button, instead of an outline around the text inside it.',
    options: [
      ['today', 'Today'],
      ['brackets', 'Brackets'],
    ],
    lean: 'brackets',
    tryIt: 'Click the draft, press Shift+Tab, then Tab.',
  },
  {
    key: 'send',
    code: 'C3',
    group: 'Composer',
    name: 'Send and Stop',
    summary:
      'One part tells the request’s life: a draft raises Send, a press seats it and it stays seated while the host accepts, then it rises as Stop.',
    options: [
      ['today', 'Today'],
      ['story', 'Seat and rise'],
    ],
    lean: 'story',
    tryIt: 'Clear the draft, type a word, send, then let it finish.',
  },
  {
    key: 'parts',
    code: 'C4',
    group: 'Composer',
    name: 'Files and context',
    summary:
      'Files become small built parts that rise when added. Removing a file or a context chip returns it to its drawing for one beat before it leaves.',
    options: [
      ['today', 'Today'],
      ['placed', 'Placed'],
    ],
    lean: 'placed',
    tryIt: 'Add example files, then remove one. Remove the context chip.',
  },
  {
    key: 'structure',
    code: 'T1',
    group: 'Conversation',
    name: 'Transcript structure',
    summary:
      'Decided: Slip. Requests sit at the trailing edge as small built slips with the files and context they were sent with; answers keep the full width.',
    options: [
      ['today', 'Today'],
      ['ledger', 'Ledger'],
      ['slip', 'Slip'],
      ['tray', 'Tray'],
      ['spine', 'Spine'],
    ],
    lean: 'slip',
    decided: 'slip',
    tryIt: 'Add example files and send: the slip lands on Send’s side and carries them.',
  },
  {
    key: 'line',
    code: 'T2',
    group: 'Conversation',
    name: 'Under construction',
    summary:
      'A dashed ink line marks a response while it is written. Stopped and failed responses keep it, so partial output stays recognizable.',
    options: [
      ['today', 'Today'],
      ['line', 'Ink line'],
    ],
    lean: 'line',
    tryIt: 'Send, then Stop. Turn on Fail next response and send again.',
  },
  {
    key: 'handoff',
    code: 'T3',
    group: 'Conversation',
    name: 'Request hand-off',
    summary:
      'A sent request reveals upward from its bottom edge, toward the tray it came from, with Menu’s Reveal and front edge.',
    options: [
      ['today', 'Today'],
      ['reveal', 'Reveal'],
    ],
    lean: 'reveal',
    tryIt: 'Send a request, at ¼ speed the first time.',
  },
  {
    key: 'latest',
    code: 'T4',
    group: 'Conversation',
    name: 'Latest response',
    summary:
      'Docked over the transcript’s bottom edge and revealed from it, so the transcript keeps its height when you scroll back.',
    options: [
      ['today', 'Today'],
      ['docked', 'Docked'],
    ],
    lean: 'docked',
    tryIt: 'Scroll up in the transcript, then return.',
  },
  {
    key: 'eaves',
    code: 'T5',
    group: 'Conversation',
    name: 'Scroll edges',
    summary:
      'An eave rule appears at the top or bottom edge only while content is hidden past it. Scroll position drives it; nothing is timed.',
    options: [
      ['today', 'Today'],
      ['eaves', 'Eaves'],
    ],
    lean: 'eaves',
    tryIt: 'Scroll the transcript to its top, then back down.',
  },
];

type Choices = Record<string, string>;
const TODAY: Choices = Object.fromEntries(PROPOSALS.map((p) => [p.key, 'today']));
const PROPOSED: Choices = Object.fromEntries(PROPOSALS.map((p) => [p.key, p.lean]));

/* ------------------------------------------------------------------ storage */

const STORE_KEY = 'zao-cc-sketch-v3';
function load<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function save(value: unknown) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    /* per-viewer convenience only */
  }
}

/* ------------------------------------------------------------------ transcript */

type Status = 'complete' | 'streaming' | 'stopped' | 'error';
type Asset = 'table' | 'capacity' | 'approvals' | 'retention';
interface TranscriptMessage {
  id: string;
  kind: 'user' | 'assistant';
  text: string;
  metadata?: string;
  status?: Status;
  error?: string;
  assets?: Asset[];
  /** Context and files included with a request, recorded on its slip. */
  sent?: { kind: 'context' | 'file'; label: string }[];
  isNew?: boolean;
}

const INITIAL: TranscriptMessage[] = [
  {
    id: 'r1',
    kind: 'user',
    text: 'How much storage is the North workspace using?',
    sent: [{ kind: 'context', label: 'Storage snapshot' }],
  },
  {
    id: 'a1',
    kind: 'assistant',
    metadata: 'Storage snapshot',
    text: 'North uses **340 GB of 500 GB**: 68% used, 32% available. Photos are the largest category.',
    assets: ['table', 'capacity'],
  },
  {
    id: 'r2',
    kind: 'user',
    text: 'Which requests need my approval today? Include anything blocked, and tell me what happens if I approve them now.',
    sent: [{ kind: 'file', label: 'requests-export.csv' }],
  },
  {
    id: 'a2',
    kind: 'assistant',
    metadata: 'Requests',
    text: 'Two requests are waiting for you. Approving them starts both jobs tonight; Archive export stays blocked until its owner responds.',
    assets: ['approvals'],
  },
  { id: 'r3', kind: 'user', text: 'What should I check before adding capacity?' },
  {
    id: 'a3',
    kind: 'assistant',
    status: 'stopped',
    text: '## Before changing capacity\n\n1. Compare the current reading with recent growth.\n2. Check whether retention settings',
  },
];

const RESPONSES: { text: string; assets?: Asset[] }[] = [
  {
    text: '## Retention check\n\nRecordings keep 12 months by default; documents follow the workspace policy; photos never expire.\n\nShortening recording retention to six months would free about 30 GB in this example.',
    assets: ['retention'],
  },
  {
    text: 'North has **160 GB available** in this snapshot. Usage alone does not show how quickly that space will be used.\n\n```json\n{"workspace":"north","available_gb":160}\n```\n\nCompare a recent storage trend with the workspace owners before changing capacity.',
  },
];

interface Exchange {
  key: string;
  isNew: boolean;
  messages: TranscriptMessage[];
}

function toExchanges(messages: TranscriptMessage[]): Exchange[] {
  const out: Exchange[] = [];
  for (const m of messages) {
    if (m.kind === 'user' || out.length === 0) {
      out.push({ key: m.id, isNew: Boolean(m.isNew), messages: [m] });
    } else {
      out[out.length - 1].messages.push(m);
    }
  }
  return out;
}

const markdown: Components = {
  h1: ({ children }) => <h4 className="type-heading">{children}</h4>,
  h2: ({ children }) => <h4 className="type-heading">{children}</h4>,
  h3: ({ children }) => <h5 className="type-label">{children}</h5>,
  p: ({ children }) => <p className="type-body">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-4 type-body">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-4 type-body">{children}</ol>,
  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
  pre: ({ children }) => (
    <pre
      tabIndex={0}
      role="region"
      aria-label="Example code"
      className="max-w-full overflow-x-auto border border-subtle bg-sunken p-3 type-code outline-focus"
    >
      {children}
    </pre>
  ),
  code: ({ children }) => <code className="type-code">{children}</code>,
};

/* ------------------------------------------------------------------ helpers */

/** Resolve a duration token (including the slow-motion calc) through a probe's computed style. */
function readMs(el: Element | null, name: string) {
  if (!el) return 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  const probe = document.createElement('span');
  probe.style.transitionDuration = `var(${name})`;
  el.appendChild(probe);
  const value = getComputedStyle(probe).transitionDuration;
  probe.remove();
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return value.endsWith('ms') ? n : n * 1000;
}

function cssVar(el: Element, name: string) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** A small example chart image drawn from the current ink tokens. */
async function exampleImage(el: Element): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = cssVar(el, '--zao-color-bg-surface') || '#fff';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = cssVar(el, '--zao-color-fg-default') || '#222';
    [36, 22, 14].forEach((h, i) => ctx.fillRect(10 + i * 16, 56 - h, 10, h));
    ctx.fillStyle = cssVar(el, '--zao-color-border-default') || '#999';
    ctx.fillRect(6, 56, 52, 1);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new File([blob ?? new Blob()], 'usage-by-category.png', { type: 'image/png' });
}

/* ------------------------------------------------------------------ segmented radio */

function Segmented({
  name,
  label,
  value,
  options,
  lean,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
  lean?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sk-seg" role="radiogroup" aria-label={label}>
      {options.map(([id, text]) => (
        <label key={id} className="sk-seg-option" data-checked={value === id ? '' : undefined}>
          <input
            type="radio"
            name={name}
            id={`${name}-${id}`}
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
          />
          <span>{text}</span>
          {lean === id ? (
            <span className="sk-lean" aria-label="(lean)" title="Reviewer’s lean" />
          ) : null}
        </label>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ assets */

function StorageTable({ id }: { id: string }) {
  return (
    <Table.Root aria-label="North workspace storage snapshot" id={id}>
      <Table.Header>
        <Table.Row>
          <Table.Head className="w-full">Category</Table.Head>
          <Table.Head numeric className="whitespace-nowrap">
            Used
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {[
          ['Photos', '180 GB'],
          ['Documents', '96 GB'],
          ['Recordings', '64 GB'],
        ].map(([category, used]) => (
          <Table.Row key={category}>
            <Table.Cell>{category}</Table.Cell>
            <Table.Cell numeric className="whitespace-nowrap">
              {used}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Head scope="row">Total used</Table.Head>
          <Table.Cell numeric className="whitespace-nowrap">
            340 GB
          </Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  );
}

function CapacityCard() {
  const [reviewed, setReviewed] = useState(false);
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h4 className="type-heading">Capacity review</h4>
        <p className="type-caption text-muted">North workspace · example record</p>
      </div>
      <Progress label="Storage used" value={68} />
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-subtle pt-3">
        <p role="status" className="type-caption text-muted">
          {reviewed ? 'Marked as reviewed.' : 'Keep capacity while reviewing growth.'}
        </p>
        <Button
          variant="secondary"
          size="small"
          disabled={reviewed}
          onClick={() => setReviewed(true)}
        >
          {reviewed ? 'Reviewed' : 'Mark reviewed'}
        </Button>
      </div>
    </Card>
  );
}

function ApprovalCards() {
  const [approved, setApproved] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="sk-asset-grid">
        {[
          ['Policy update', 'REQ-0137', '8 items', 'Starts 22:00'],
          ['Storage audit', 'REQ-2048', '52 items', 'Starts 23:30'],
        ].map(([title, id, items, when]) => (
          <Card key={id} className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <h4 className="type-label font-medium">{title}</h4>
              <span className="type-caption figures-id text-muted">{id}</span>
            </div>
            <p className="type-caption text-muted">
              {items} · {approved ? 'Approved' : when}
            </p>
          </Card>
        ))}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button size="small" disabled={approved} onClick={() => setApproved(true)}>
          {approved ? 'Approved 2 requests' : 'Approve 2 requests'}
        </Button>
        <span className="type-caption text-muted">Archive export · blocked</span>
      </div>
    </div>
  );
}

function RetentionCard() {
  const [on, setOn] = useState(false);
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h4 className="type-heading">Recording retention</h4>
        <p className="type-caption text-muted">Example setting · not applied to your workspace</p>
      </div>
      <label className="flex min-w-0 items-center justify-between gap-3 type-body">
        Keep recordings for six months
        <Switch checked={on} onCheckedChange={setOn} />
      </label>
    </Card>
  );
}

function AssetView({ asset, id }: { asset: Asset; id: string }) {
  if (asset === 'table') return <StorageTable id={id} />;
  if (asset === 'capacity') return <CapacityCard />;
  if (asset === 'approvals') return <ApprovalCards />;
  return <RetentionCard />;
}

/* ------------------------------------------------------------------ transcript view */

function TranscriptMessageView({
  m,
  copied,
  onCopy,
  onRetry,
  retryDisabled,
}: {
  m: TranscriptMessage;
  copied?: boolean;
  onCopy?: (m: TranscriptMessage) => void;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}) {
  const baseId = useId();
  return (
    <Message.Root
      author={m.kind === 'user' ? 'You' : 'ZAO assistant'}
      kind={m.kind}
      metadata={m.metadata}
      status={m.status}
      error={m.error}
    >
      <Message.Content>
        <div className="flex min-w-0 flex-col gap-3 break-words">
          {m.kind === 'user' ? (
            <>
              <p className="whitespace-pre-wrap type-body">{m.text}</p>
              {m.sent && m.sent.length > 0 ? (
                <ul className="sk-sent" aria-label="Sent with this request">
                  {m.sent.map((item) => {
                    const Icon = item.kind === 'context' ? Database : Page;
                    return (
                      <li key={`${item.kind}-${item.label}`} className="sk-sent-item">
                        <Icon aria-hidden="true" focusable="false" className="sk-sent-icon" />
                        <span className="min-w-0">{item.label}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </>
          ) : (
            <Markdown components={markdown}>{m.text}</Markdown>
          )}
          {(m.assets ?? []).map((asset) => (
            <AssetView key={asset} asset={asset} id={`${baseId}-${asset}`} />
          ))}
        </div>
      </Message.Content>
      {m.kind === 'assistant' && m.text ? (
        <Message.Actions>
          <IconButton
            icon={Copy}
            aria-label="Copy response"
            variant="quiet"
            size="small"
            disabled={m.status === 'streaming'}
            onClick={() => onCopy?.(m)}
          />
          {copied ? (
            <span role="status" className="type-caption text-muted">
              Copied response.
            </span>
          ) : null}
          {m.status === 'error' && onRetry ? (
            <Button
              variant="secondary"
              size="small"
              disabled={retryDisabled}
              onClick={() => onRetry(m.id)}
            >
              Retry response
            </Button>
          ) : null}
        </Message.Actions>
      ) : null}
    </Message.Root>
  );
}

function TranscriptList({
  messages,
  copied,
  onCopy,
  onRetry,
  retryDisabled,
}: {
  messages: TranscriptMessage[];
  copied?: string | null;
  onCopy?: (m: TranscriptMessage) => void;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}) {
  return (
    <Conversation.List>
      {toExchanges(messages).map((exchange) => (
        <Conversation.Item
          key={exchange.key}
          className="sk-exchange"
          data-sk-new={exchange.isNew ? '' : undefined}
        >
          {exchange.messages.map((m) => (
            <TranscriptMessageView
              key={m.id}
              m={m}
              copied={copied === m.id}
              onCopy={onCopy}
              onRetry={onRetry}
              retryDisabled={retryDisabled}
            />
          ))}
        </Conversation.Item>
      ))}
    </Conversation.List>
  );
}

/* ------------------------------------------------------------------ assistant specimen */

function AssistantSpecimen({
  choices,
  stageRef,
}: {
  choices: Choices;
  stageRef: RefObject<HTMLDivElement | null>;
}) {
  const [messages, setMessages] = useState<TranscriptMessage[]>(INITIAL);
  const [value, setValue] = useState('What should we review next?');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [context, setContext] = useState([
    { id: 'snapshot', label: 'Storage snapshot', icon: Database },
  ]);
  const [removingChips, setRemovingChips] = useState<string[]>([]);
  const [failNext, setFailNext] = useState(false);
  const [run, setRun] = useState<{
    id: string;
    fail: boolean;
    text: string;
    assets?: Asset[];
  } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const nextId = useRef(10);
  const responseIndex = useRef(0);
  const mounted = useRef(true);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!run) return;
    let length = 0;
    const timer = setInterval(() => {
      length = Math.min(length + 12, run.text.length);
      const failed = run.fail && length >= run.text.length * 0.45;
      const complete = length === run.text.length;
      setMessages((current) =>
        current.map((m) =>
          m.id === run.id
            ? {
                ...m,
                text: run.text.slice(0, length),
                status: failed ? 'error' : complete ? 'complete' : 'streaming',
                assets: complete ? run.assets : undefined,
                error: failed
                  ? 'The example response stopped unexpectedly. Retry the response.'
                  : undefined,
              }
            : m,
        ),
      );
      if (failed || complete) {
        clearInterval(timer);
        setRun(null);
        setAnnouncement(
          failed ? 'The example response failed.' : 'Completed the example response.',
        );
      }
    }, 80);
    return () => clearInterval(timer);
  }, [run]);

  async function send(draft: ComposerDraft) {
    const id = nextId.current++;
    const fail = failNext;
    setAccepting(true);
    await new Promise((resolve) => setTimeout(resolve, 520));
    if (!mounted.current) return;
    const response = RESPONSES[responseIndex.current++ % RESPONSES.length];
    setMessages((current) => [
      ...current,
      {
        id: `r${id}`,
        kind: 'user',
        isNew: true,
        text: draft.text.trim() || 'Review the attached files.',
        sent: [
          ...context.map((c) => ({ kind: 'context' as const, label: c.label })),
          ...draft.attachments.map((a) => ({ kind: 'file' as const, label: a.file.name })),
        ],
      },
      {
        id: `a${id}`,
        kind: 'assistant',
        text: '',
        status: 'streaming',
        metadata: 'Local simulation',
      },
    ]);
    setValue((current) => (current === draft.text ? '' : current));
    const sent = new Set(draft.attachments.map((a) => a.id));
    setAttachments((current) => current.filter((a) => !sent.has(a.id)));
    setFailNext(false);
    setAccepting(false);
    setRun({ id: `a${id}`, fail, ...response });
  }

  function stop() {
    if (!run) return;
    const id = run.id;
    setRun(null);
    setMessages((current) => current.map((m) => (m.id === id ? { ...m, status: 'stopped' } : m)));
    setAnnouncement('Stopped the example response.');
  }

  function retry(id: string) {
    const response = RESPONSES[0];
    setMessages((current) =>
      current.map((m) =>
        m.id === id ? { ...m, text: '', status: 'streaming', error: undefined } : m,
      ),
    );
    setRun({ id, fail: false, ...response });
  }

  async function copy(message: TranscriptMessage) {
    try {
      await navigator.clipboard.writeText(message.text);
    } catch {
      /* the sketch only shows feedback */
    }
    setCopied(message.id);
  }

  const placed = choices.parts === 'placed';

  const removeAttachment = useCallback(
    (id: string) => {
      const attachment = attachments.find((a) => a.id === id);
      const commit = () => setAttachments((current) => current.filter((a) => a.id !== id));
      const ms = placed ? readMs(stageRef.current, '--zao-motion-duration-grade-8') : 0;
      const tile = attachment
        ? trayRef.current?.querySelector(
            `.composer-attachment:has([title="${CSS.escape(attachment.file.name)}"])`,
          )
        : null;
      if (!ms || !tile) return commit();
      tile.setAttribute('data-sk-removing', '');
      setTimeout(commit, ms);
    },
    [attachments, placed, stageRef],
  );

  function removeChip(id: string) {
    const commit = () => {
      setContext((current) => current.filter((c) => c.id !== id));
      setRemovingChips((current) => current.filter((c) => c !== id));
    };
    const ms = placed ? readMs(stageRef.current, '--zao-motion-duration-grade-8') : 0;
    if (!ms) return commit();
    setRemovingChips((current) => [...current, id]);
    setTimeout(commit, ms);
  }

  async function addExampleFiles() {
    const el = stageRef.current ?? document.documentElement;
    const image = await exampleImage(el);
    const pdf = new File([new Uint8Array(240_000)], 'storage-report-q3.pdf', {
      type: 'application/pdf',
    });
    setAttachments((current) => [
      ...current,
      { id: `f${nextId.current++}`, file: image },
      { id: `f${nextId.current++}`, file: pdf },
    ]);
  }

  function reset() {
    setRun(null);
    setMessages(INITIAL);
    setValue('What should we review next?');
    setAttachments([]);
    setContext([{ id: 'snapshot', label: 'Storage snapshot', icon: Database }]);
    setFailNext(false);
    setAnnouncement('Reset the example conversation.');
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="sk-panel card-construction border border-subtle bg-canvas">
        <header className="sk-panel-header flex min-w-0 flex-wrap items-baseline justify-between gap-2 border-b border-subtle px-3 py-2">
          <h3 className="type-label font-medium">ZAO assistant</h3>
          <p className="type-caption text-muted">North workspace</p>
        </header>
        <Conversation.Root aria-label="North workspace conversation" announcement={announcement}>
          <Conversation.Viewport className="sk-viewport py-2">
            <TranscriptList
              messages={messages}
              copied={copied}
              onCopy={(m) => void copy(m)}
              onRetry={retry}
              retryDisabled={accepting || run !== null}
            />
          </Conversation.Viewport>
          <Conversation.Latest
            className="ml-3"
            trailingIcon={choices.latest === 'docked' ? ArrowDown : undefined}
          />
        </Conversation.Root>

        <div className="p-3">
          <div className="sk-tray" ref={trayRef}>
            <Composer
              label="Follow-up request"
              value={value}
              onValueChange={setValue}
              onSend={send}
              attachments={attachments}
              onFilesSelect={(files) =>
                setAttachments((current) => [
                  ...current,
                  ...files.map((file) => ({ id: `f${nextId.current++}`, file })),
                ])
              }
              onRemoveAttachment={removeAttachment}
              responding={run !== null}
              onStop={stop}
              placeholder="Ask a follow-up…"
              context={
                context.length > 0 ? (
                  <ul aria-label="Included context" className="flex min-w-0 flex-wrap gap-1.5">
                    {context.map((item) => (
                      <li key={item.id} className="min-w-0">
                        <ComposerContextChip
                          label={item.label}
                          icon={item.icon}
                          className={removingChips.includes(item.id) ? 'sk-removing' : undefined}
                          onRemove={() => removeChip(item.id)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      <div className="sk-sim flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 type-caption text-muted">
          <Switch
            checked={failNext}
            onCheckedChange={setFailNext}
            disabled={accepting || run !== null}
          />
          Fail next response
        </label>
        <Button variant="quiet" size="small" onClick={() => void addExampleFiles()}>
          Add example files
        </Button>
        <Button
          variant="quiet"
          size="small"
          disabled={context.length > 0}
          onClick={() =>
            setContext([{ id: 'snapshot', label: 'Storage snapshot', icon: Database }])
          }
        >
          Restore context
        </Button>
        <Button variant="quiet" size="small" onClick={reset}>
          Reset conversation
        </Button>
      </div>
    </div>
  );
}

/** A transcript without a tray, at side-panel width, for comparing structures. */
function ComparePanel({ structure, attrs }: { structure: string; attrs: Record<string, string> }) {
  const info = STRUCTURES[structure];
  return (
    <figure className="sk-compare-item">
      <div className="sk sk-compare-stage" {...attrs} data-sk-structure={structure}>
        <div className="sk-panel card-construction border border-subtle bg-canvas">
          <header className="sk-panel-header flex min-w-0 items-baseline justify-between gap-2 border-b border-subtle px-3 py-2">
            <h3 className="type-label font-medium">ZAO assistant</h3>
            <p className="type-caption text-muted">{info.name}</p>
          </header>
          <Conversation.Root aria-label={`${info.name} structure example`} announcement="">
            <Conversation.Viewport className="sk-compare-viewport py-2">
              <TranscriptList messages={INITIAL} />
            </Conversation.Viewport>
          </Conversation.Root>
        </div>
      </div>
      <figcaption className="flex min-w-0 flex-col gap-1">
        <span className="type-label font-medium">
          {info.name}
          {structure === 'slip' ? <span className="sk-decided">Chosen</span> : null}
        </span>
        <span className="type-caption text-muted">{info.line}</span>
      </figcaption>
    </figure>
  );
}

function StaticComposer({
  label,
  initial,
  disabled,
  error,
  withContext,
}: {
  label: string;
  initial: string;
  disabled?: boolean;
  error?: string;
  withContext?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="sk-tray">
      <Composer
        label={label}
        value={value}
        onValueChange={setValue}
        onSend={() => {
          if (error) throw new Error('Example rejection');
          setValue('');
        }}
        onFilesSelect={() => {}}
        disabled={disabled}
        error={error}
        placeholder="Write a request…"
        context={
          withContext ? (
            <ComposerContextChip label="Project files" icon={Folder} onRemove={() => {}} />
          ) : undefined
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ notes */

function Finding({ code, title, children }: { code: string; title: string; children: ReactNode }) {
  return (
    <li className="sk-finding">
      <span className="sk-code">{code}</span>
      <div className="flex min-w-0 flex-col gap-1">
        <h4 className="type-label font-medium">{title}</h4>
        <div className="sk-prose type-body text-muted">{children}</div>
      </div>
    </li>
  );
}

function Notes() {
  return (
    <section className="sk-notes" aria-labelledby="notes-title">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="sk-eyebrow">Review · Oct 12 build, commit 28a85b8</p>
        <h2 id="notes-title" className="type-heading">
          What I found
        </h2>
        <p className="sk-prose type-body text-muted">
          Both components kept their Oct 7 construction while everything around them moved to the
          finish. The Send button is now the most built thing in the assistant; the tray, the
          transcript and the messages around it read as linework. That is the opposite of drawn →
          built: here the drawing is the default and only a 28px button is solid.
        </p>
      </div>

      <div className="sk-notes-grid">
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="sk-eyebrow">Conversation and Message</h3>
          <ol className="sk-findings">
            <Finding code="T1" title="Requests and answers blend, and assets make it worse">
              The two turns share the left edge, the padding, the type role and the header; the
              request’s only mark is a surface fill a small step from the canvas, with a 1px{' '}
              <code>border-subtle</code> rule. Answers are full of Cards and Tables, which are also
              bounded rectangles on that left edge, so the request reads as one more asset. Spacing
              and color tweaks can’t fix that. The request needs something assets never use: a
              full-width band (Ledger), the trailing edge (Slip), or a field behind the answer
              (Tray). Spine showed what a line alone does: clearer ownership, still linework. You
              chose Slip on Oct 12.
            </Finding>
            <Finding code="T1" title="Slip, in detail">
              The slip lands on the trailing edge, the same side as Send, so the hand-off reads as
              one movement from the tray into the record. It carries what it was sent with: context
              and files show as flat chips inlaid in the slip, so each request keeps a record of
              what it included, while the answer’s built cards stay on the other side. “You” leaves
              the visible header; position names the author, and “You” stays the accessible name.
            </Finding>
            <Finding code="T1" title="Around the slip">
              Authors step back to muted ink, code sits in a well, and Copy moves into the author
              row, so it never adds a stray row under a card or table. On older exchanges it waits
              for hover or focus; on touch it stays visible.
            </Finding>
            <Finding code="T2" title="Status has no form">
              A streaming response is the one place where “drawn, then built” is literally true, and
              today it is a static 4px square and the word Responding. The ink line uses the drawing
              convention for unfinished work. The Responding square becomes Button’s loading arc, so
              the system still has one pending animation, not two.
            </Finding>
            <Finding code="T3" title="The hand-off has no continuity">
              The draft clears and the request appears in the transcript in the same frame. Reveal
              moves the eye from the tray to the record. It only plays for requests sent in the
              session; nothing animates on load.
            </Finding>
            <Finding code="T4" title="Latest response moves the layout">
              It mounts in the flow between the transcript and the tray, so the transcript shrinks
              by 28px plus a gap at the moment the reader scrolls up, and it reads like a heading.
            </Finding>
            <Finding code="T5" title="Edges are cut, not built">
              Text clips under the panel header and above the tray. Eaves draw an edge only where
              content is hidden past it, so the resting state at the latest message stays open.
            </Finding>
            <Finding code="—" title="Keep: following stays instant">
              Smooth-scrolling a stream makes text drift while you read and would fight the
              scroll-back detection. Direct writes are the right call.
            </Finding>
          </ol>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="sk-eyebrow">Composer</h3>
          <ol className="sk-findings">
            <Finding code="C1" title="The tray is the last pre-finish surface">
              A 1px perimeter and a 1px contact edge, around a Send button with 3px banded planes
              and a facet. <em>Raised</em> carries forward your Oct 7 “raised writing tray” approval
              into the finish. <em>Well</em> reads the tray as a large field. Either way the invalid
              tray takes <code>border-field-invalid</code>; today only the caption turns red.
            </Finding>
            <Finding code="C2" title="Focus is either faint or nested">
              Pointer focus moves one 1px edge from <code>border-default</code> to{' '}
              <code>border-strong</code>. Keyboard focus draws a 2px outline around the textarea,
              inside the tray, so it reads as an input nested in a box. The tray is a form, so it
              can carry pseudo-elements; the “inputs cannot carry brackets” exception does not
              apply.
            </Finding>
            <Finding code="C3" title="Send’s lifecycle is a swap">
              Typing makes Send appear raised in one frame. A press seats it for 80ms, it pops back,
              then drops flat and gray while the host accepts, and Stop is swapped in. The proposal
              uses only Seat and Lift: rest depth when a draft exists, seated while accepted, risen
              as Stop, flat again when the draft is empty.
            </Finding>
            <Finding code="C4" title="Files and context have no weight">
              Attachment tiles are hairline boxes that appear and vanish; removing a chip or a file
              reflows the tray with no trace. Placed tiles rest at <code>depth.rest.small</code> and
              rise over grade 8. Removal shows the part’s drawing (dashed edge, no face) for one
              grade-8 beat, then it leaves.
            </Finding>
            <Finding code="—" title="Keep: the writing plane grows without animation">
              Animating textarea height while typing makes the caret and the toolbar drift. The
              current stillness is right.
            </Finding>
          </ol>
        </div>
      </div>

      <div className="sk-notes-grid">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="sk-eyebrow">Rules check</h3>
          <p className="sk-prose type-body text-muted">
            Every option uses existing parts: Lift, Seat and Reveal, the fold curves, grades 5, 7
            and 8, the small, control and surface rest depths, the facet, wells, brackets and
            existing color roles. No new color, duration, curve or blur. Nothing plays on load.
            Native targets and neighbors stay fixed; removals reflow after their beat, as today,
            just later. Reduced motion keeps end states: rises and reveals are instant, the loading
            arc is still.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="sk-eyebrow">What the sketch fakes, and what it reopens</h3>
          <p className="sk-prose type-body text-muted">
            Slip itself is CSS on Message’s user kind; it needs no new API. The sketch groups each
            request and its answer into one Conversation.Item for rhythm, which spacing on the user
            kind could do as well. The chips inside a slip are host content in Message.Content; a
            reusable sent-item part would belong to the components plan. Composer needs a removal
            state so a file or chip can stay mounted for its beat. Items need to know they were
            added after mount, so only new requests reveal. Latest needs a face variant and to stay
            mounted through its exit. A raised tray needs a side slot, as Button has. Slip reopens
            the Oct 7 “shared reading alignment, restrained user surface” approval and its visible
            “You” label.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ app */

type ModeSetting = 'system' | 'light' | 'dark';

function useMode(setting: ModeSetting) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      let mode: 'light' | 'dark';
      if (setting !== 'system') mode = setting;
      else {
        const host = root.getAttribute('data-theme');
        mode = host === 'dark' || host === 'light' ? host : media.matches ? 'dark' : 'light';
      }
      if (root.getAttribute('data-zao-mode') !== mode) root.setAttribute('data-zao-mode', mode);
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    media.addEventListener('change', apply);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', apply);
    };
  }, [setting]);
}

interface Settings {
  choices: Choices;
  speed: 'normal' | 'quarter';
  mode: ModeSetting;
  seal: 'ink' | 'azurite';
}

function App() {
  const [settings, setSettings] = useState<Settings>(() =>
    load<Settings>({ choices: PROPOSED, speed: 'normal', mode: 'system', seal: 'ink' }),
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useMode(settings.mode);

  useEffect(() => {
    save(settings);
    document.documentElement.setAttribute('data-zao-seal', settings.seal);
  }, [settings]);

  const choices = { ...TODAY, ...settings.choices };
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const setChoice = (key: string, value: string) =>
    setSettings((s) => ({ ...s, choices: { ...s.choices, [key]: value } }));

  const stageAttrs: Record<string, string> = Object.fromEntries(
    Object.entries(choices).map(([k, v]) => [`data-sk-${k}`, v]),
  );
  const proposedCount = PROPOSALS.filter((p) => choices[p.key] !== 'today').length;

  return (
    <div className="sk-page">
      <header className="sk-top">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="sk-eyebrow">ZAO · Su 素 · Sketch for review</p>
          <h1 className="type-title">Conversation and Composer</h1>
          <p className="sk-lede type-body text-muted">
            The two components the finish plan skipped, with each proposal layered on the real{' '}
            <code>@zao/react</code> components. Switch any row between Today and its options. The
            dot marks my lean; the decisions are yours.
          </p>
        </div>
        <div className="sk-globals">
          <div className="sk-global">
            <span className="sk-global-label">Show</span>
            <div className="flex gap-2">
              <Button
                size="small"
                variant={proposedCount === 0 ? 'primary' : 'secondary'}
                onClick={() => set({ choices: TODAY })}
              >
                Today
              </Button>
              <Button
                size="small"
                variant={
                  PROPOSALS.every((p) => choices[p.key] === p.lean) ? 'primary' : 'secondary'
                }
                onClick={() => set({ choices: PROPOSED })}
              >
                All leans
              </Button>
            </div>
          </div>
          <div className="sk-global">
            <span className="sk-global-label">Speed</span>
            <Segmented
              name={`${id}-speed`}
              label="Motion speed"
              value={settings.speed}
              options={[
                ['normal', '1×'],
                ['quarter', '¼×'],
              ]}
              onChange={(v) => set({ speed: v as Settings['speed'] })}
            />
          </div>
          <div className="sk-global">
            <span className="sk-global-label">Mode</span>
            <Segmented
              name={`${id}-mode`}
              label="Color mode"
              value={settings.mode}
              options={[
                ['system', 'System'],
                ['light', 'Light'],
                ['dark', 'Dark'],
              ]}
              onChange={(v) => set({ mode: v as ModeSetting })}
            />
          </div>
          <div className="sk-global">
            <span className="sk-global-label">Seal</span>
            <Segmented
              name={`${id}-seal`}
              label="Seal"
              value={settings.seal}
              options={[
                ['ink', '墨 Ink'],
                ['azurite', '青 Azurite'],
              ]}
              onChange={(v) => set({ seal: v as Settings['seal'] })}
            />
          </div>
        </div>
      </header>

      <section className="sk-compare" aria-labelledby="compare-title">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="sk-eyebrow">T1 · Transcript structure, at side-panel width</p>
          <h2 id="compare-title" className="type-heading">
            Keeping a request apart from an answer full of assets
          </h2>
          <p className="sk-prose type-body text-muted">
            The same three exchanges in each structure: a table and a card, two approval cards with
            a primary action, then a stopped answer. Scroll each one. The other rows on the right
            still apply here.
          </p>
        </div>
        <div className="sk-compare-grid">
          {['today', 'slip', 'ledger', 'tray', 'spine'].map((structure) => (
            <ComparePanel key={structure} structure={structure} attrs={stageAttrs} />
          ))}
        </div>
      </section>

      <div className="sk-main">
        <div ref={stageRef} className="sk sk-stage" data-sk-speed={settings.speed} {...stageAttrs}>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="sk-eyebrow">Working assistant</p>
            <h2 className="type-heading">Send, stream, stop and recover</h2>
          </div>
          <AssistantSpecimen choices={choices} stageRef={stageRef} />
          <section className="sk-states" aria-label="Composer states">
            <h3 className="sk-eyebrow">Composer states</h3>
            <div className="sk-states-grid">
              <div className="flex min-w-0 flex-col gap-2">
                <p className="type-caption text-muted">Empty draft</p>
                <StaticComposer label="New request" initial="" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <p className="type-caption text-muted">Send error</p>
                <StaticComposer
                  label="Request with send error"
                  initial="Review this request."
                  error="Could not send your request. Your draft is preserved. Try sending again."
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <p className="type-caption text-muted">Disabled</p>
                <StaticComposer
                  label="Unavailable request"
                  initial="This composer is unavailable."
                  disabled
                  withContext
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="sk-side" aria-label="Proposals">
          {(['Conversation', 'Composer'] as Group[]).map((group) => (
            <div key={group} className="flex min-w-0 flex-col">
              <h2 className="sk-eyebrow sk-side-group">{group}</h2>
              {PROPOSALS.filter((p) => p.group === group).map((p) => (
                <div
                  key={p.key}
                  className="sk-prop"
                  data-changed={choices[p.key] !== 'today' ? '' : undefined}
                >
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="sk-code">{p.code}</span>
                    <h3 className="type-label font-medium">{p.name}</h3>
                    {p.decided ? <span className="sk-decided">Decided</span> : null}
                  </div>
                  <p className="type-caption text-muted">{p.summary}</p>
                  <Segmented
                    name={`${id}-${p.key}`}
                    label={p.name}
                    value={choices[p.key]}
                    options={p.options}
                    lean={p.lean}
                    onChange={(v) => setChoice(p.key, v)}
                  />
                  <p className="sk-try type-caption">Try: {p.tryIt}</p>
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>

      <Notes />
    </div>
  );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
