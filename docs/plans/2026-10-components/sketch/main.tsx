/*
 * Reference only: the host for the Oct 13 Plan, Seal and Drawing sketch. It is not built,
 * typechecked or published with ZAO. The three components are sketched in this host on top of
 * the real @zao/react parts (Card, Table, Button, Message, Progress, Switch); see the plan's
 * README before porting anything.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, Clock, EditPencil, Play, Prohibition, WarningTriangle } from 'iconoir-react';
import { Button, Card, Message, Progress, Switch, Table } from '@zao/react';
import './sketch.css';

/* ------------------------------------------------------------------ proposals */

type Group = 'Plan' | 'Approval' | 'Loading';
interface Proposal {
  key: string;
  code: string;
  group: Group;
  name: string;
  summary: string;
  options: [string, string][];
  baseline: string;
  lean: string;
  /** Yankun's decision, Oct 13. */
  decided?: string;
  tryIt: string;
}

const PROPOSALS: Proposal[] = [
  {
    key: 'step',
    code: 'P1',
    group: 'Plan',
    name: 'Step construction',
    summary:
      'Decided: Rail. Steps stay flat on a ruler. Each step has a station on the rail; a finished step fills its station and draws its segment solid from the top. Built makes each step a drawing that becomes a small built part. List is the baseline: a glyph and a word.',
    options: [
      ['list', 'List'],
      ['rail', 'Rail'],
      ['built', 'Built'],
    ],
    baseline: 'list',
    lean: 'built',
    decided: 'rail',
    tryIt: 'Run the plan, at ¼ speed the first time.',
  },
  {
    key: 'arrival',
    code: 'P2',
    group: 'Plan',
    name: 'Arrival',
    summary:
      'When the assistant proposes a plan, a pen line draws each step from its leading edge, first to last, on the Reveal role. You see the whole shape of the work before any of it runs.',
    options: [
      ['instant', 'Instant'],
      ['drawn', 'Drawn in'],
    ],
    baseline: 'instant',
    lean: 'drawn',
    decided: 'drawn',
    tryIt: 'Press Propose again.',
  },
  {
    key: 'approve',
    code: 'A1',
    group: 'Approval',
    name: 'Approve action',
    summary:
      'Decided: Button + seal. Approve is the primary Button; the approved record that replaces the actions carries the seal’s impression, inked in three stepped bands. Stamp makes the action itself a seal. Hold fills the seal in four bands while held; its duration becomes its own motion role.',
    options: [
      ['button', 'Button'],
      ['sealed', 'Button + seal'],
      ['stamp', 'Stamp'],
      ['hold', 'Hold'],
    ],
    baseline: 'button',
    lean: 'stamp',
    decided: 'sealed',
    tryIt: 'Run the plan to step 4, or use the approval states below. Try Space on the keyboard.',
  },
  {
    key: 'impression',
    code: 'A2',
    group: 'Approval',
    name: 'Impression',
    summary:
      'Two classic seal cuts. Solid (白文): the mark is cut out of a filled square, so the paper shows through the character. Outline (朱文): the character and its frame carry the ink.',
    options: [
      ['solid', 'Solid 白文'],
      ['outline', 'Outline 朱文'],
    ],
    baseline: 'solid',
    lean: 'solid',
    tryIt: 'Compare the approved card in each seal.',
  },
  {
    key: 'loading',
    code: 'L1',
    group: 'Loading',
    name: 'Loading state',
    summary:
      'Drawing: while data loads, the part shows its own construction drawing. The frame is in ink and every line of text becomes its lettering guidelines, cut from the real layout, so the drawing can’t drift from what arrives. Nothing moves while it waits. When data lands, it’s built. Shimmer is the common skeleton, for contrast. Today, ZAO has no loading state for Card or Table.',
    options: [
      ['today', 'Today'],
      ['shimmer', 'Shimmer'],
      ['drawing', 'Drawing'],
    ],
    baseline: 'today',
    lean: 'drawing',
    decided: 'drawing',
    tryIt: 'Press Load below, or turn on Keep loading and compare.',
  },
  {
    key: 'dims',
    code: 'L2',
    group: 'Loading',
    name: 'Dimensions',
    summary:
      'The drawing carries its size in fen while it waits, as the Card page does. I’d keep this for the docs and the hero rather than product screens.',
    options: [
      ['off', 'Off'],
      ['on', 'On'],
    ],
    baseline: 'off',
    lean: 'off',
    decided: 'off',
    tryIt: 'Turn it on, then press Load.',
  },
];

type Choices = Record<string, string>;
const BASELINE: Choices = Object.fromEntries(PROPOSALS.map((p) => [p.key, p.baseline]));
const DECIDED: Choices = Object.fromEntries(PROPOSALS.map((p) => [p.key, p.decided ?? p.lean]));

/* ------------------------------------------------------------------ storage */

const STORE_KEY = 'zao-components-sketch-v2';
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

/* ------------------------------------------------------------------ helpers */

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Resolve a duration token (including the slow-motion calc) through a probe's computed style. */
function readMs(el: Element | null, expression: string) {
  if (!el || reducedMotion()) return 0;
  const probe = document.createElement('span');
  probe.style.transitionDuration = expression.startsWith('--') ? `var(${expression})` : expression;
  el.appendChild(probe);
  const value = getComputedStyle(probe).transitionDuration;
  probe.remove();
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return value.endsWith('ms') ? n : n * 1000;
}

function stageOf(el: Element | null) {
  return el?.closest('.sk') ?? document.querySelector('.sk');
}

/** How long a drawn part takes to be built: lines withdraw, face fills, planes rise. */
function buildMs(el: Element | null) {
  const stage = stageOf(el);
  return (
    readMs(stage, '--zao-motion-duration-fast') +
    readMs(stage, '--zao-motion-duration-reveal') / 2 +
    readMs(stage, '--zao-motion-duration-lift')
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function now() {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(),
  );
}

/** Button's loading arc, drawn the same way: the system keeps one pending animation. */
function Arc() {
  return (
    <svg
      className="sk-arc button-loading-indicator"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
  );
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

/* ================================================================== Plan */

type StepStatus = 'planned' | 'running' | 'waiting' | 'done' | 'declined' | 'failed' | 'skipped';

const STATUS_TEXT: Record<StepStatus, string> = {
  planned: 'Planned',
  running: 'Running',
  waiting: 'Needs you',
  done: 'Done',
  declined: 'Declined',
  failed: 'Failed',
  skipped: 'Skipped',
};

const STATUS_GLYPH: Record<StepStatus, typeof Check> = {
  planned: Clock,
  running: Play,
  waiting: EditPencil,
  done: Check,
  declined: Prohibition,
  failed: WarningTriangle,
  skipped: Prohibition,
};

interface PlanStepData {
  id: string;
  title: string;
  detail: string;
  status: StepStatus;
  body?: ReactNode;
}

function Plan({
  label,
  steps,
  entering,
}: {
  label: string;
  steps: PlanStepData[];
  entering?: boolean;
}) {
  const titleId = useId();
  const done = steps.filter((s) => s.status === 'done' || s.status === 'declined').length;
  const finished = steps.every(
    (s) =>
      s.status !== 'planned' &&
      s.status !== 'running' &&
      s.status !== 'waiting' &&
      s.status !== 'failed',
  );
  return (
    <section
      className="sk-plan"
      aria-labelledby={titleId}
      data-entering={entering ? '' : undefined}
    >
      <header className="sk-plan-header">
        <h4 id={titleId} className="type-label font-medium">
          {label}
        </h4>
        <p className="type-caption figures-tabular text-muted">
          {finished ? 'Finished' : 'Plan'} · {done} of {steps.length} done
        </p>
      </header>
      <ol className="sk-steps">
        {steps.map((step, index) => {
          const Glyph = STATUS_GLYPH[step.status];
          return (
            <li
              key={step.id}
              className="sk-step"
              data-status={step.status}
              style={{ '--sk-i': index } as CSSProperties}
            >
              <div className="sk-step-part">
                <span className="sk-step-pen" aria-hidden="true" />
                <span className="sk-step-marker" aria-hidden="true">
                  <span className="sk-step-index type-caption figures-id">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="sk-step-glyph">
                    <Glyph focusable="false" />
                  </span>
                </span>
                <div className="sk-step-text">
                  <p className="sk-step-title type-label font-medium">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </p>
                  <p className="sk-step-detail type-caption">{step.detail}</p>
                </div>
                <span className="sk-step-status type-caption">
                  {step.status === 'running' ? <Arc /> : null}
                  {STATUS_TEXT[step.status]}
                </span>
              </div>
              {step.body ? <div className="sk-step-body">{step.body}</div> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ================================================================== Seal and ApprovalGate */

/** The seal's mark. 准 ("approved") is a placeholder; the host would pass its own. */
const SEAL_MARK = '准';

function SealMark({ cut, impressed }: { cut: string; impressed?: boolean }) {
  return (
    <span
      className="sk-mark"
      data-cut={cut}
      data-impressed={impressed ? '' : undefined}
      aria-hidden="true"
    >
      <span className="sk-mark-glyph">{SEAL_MARK}</span>
    </span>
  );
}

function SealButton({
  mode,
  cut,
  label,
  disabled,
  onApprove,
}: {
  mode: 'stamp' | 'hold';
  cut: string;
  label: string;
  disabled?: boolean;
  onApprove: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const hintId = useId();
  const [pressed, setPressed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function startHold() {
    if (disabled || timer.current !== null) return;
    setHolding(true);
    const ms = reducedMotion() ? 0 : readMs(ref.current, '--sk-hold');
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onApprove();
    }, ms || 1080);
  }

  function cancelHold() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }

  const isActivation = (event: KeyboardEvent) => event.key === ' ' || event.key === 'Enter';

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="sk-seal-button focus-brackets"
        data-mode={mode}
        data-cut={cut}
        data-zao-pressed={pressed || holding ? '' : undefined}
        data-holding={holding ? '' : undefined}
        disabled={disabled}
        aria-describedby={mode === 'hold' ? hintId : undefined}
        onClick={mode === 'stamp' ? onApprove : undefined}
        onKeyDown={(event) => {
          if (!isActivation(event) || event.repeat) return;
          if (mode === 'hold') {
            event.preventDefault();
            startHold();
          } else setPressed(true);
        }}
        onKeyUp={(event) => {
          if (!isActivation(event)) return;
          if (mode === 'hold') cancelHold();
          else setPressed(false);
        }}
        onBlur={() => {
          setPressed(false);
          cancelHold();
        }}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          if (mode !== 'hold' || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          startHold();
        }}
        onPointerUp={() => mode === 'hold' && cancelHold()}
        onPointerCancel={() => mode === 'hold' && cancelHold()}
        onContextMenu={(event) => mode === 'hold' && event.preventDefault()}
      >
        <span className="sk-seal-label type-button">{label}</span>
        <span className="sk-seal" aria-hidden="true">
          <span className="sk-seal-side construction-planes" />
          <span className="sk-seal-face">
            <span className="sk-mark-glyph">{SEAL_MARK}</span>
            <span className="sk-seal-ink">
              <span className="sk-mark-glyph">{SEAL_MARK}</span>
            </span>
          </span>
        </span>
      </button>
      {mode === 'hold' ? (
        <span id={hintId} className="sr-only">
          Press and hold until the seal fills.
        </span>
      ) : null}
    </>
  );
}

type Decision = { kind: 'approved' | 'declined'; at: string } | null;

function ApprovalGate({
  choice,
  cut,
  decision,
  onDecide,
  disabled,
}: {
  choice: string;
  cut: string;
  decision: Decision;
  onDecide: (kind: 'approved' | 'declined') => void;
  disabled?: boolean;
}) {
  const recordRef = useRef<HTMLDivElement>(null);
  const decidedHere = useRef(false);

  useEffect(() => {
    if (decision && decidedHere.current) {
      decidedHere.current = false;
      recordRef.current?.focus();
    }
  }, [decision]);

  const decide = (kind: 'approved' | 'declined') => {
    decidedHere.current = true;
    onDecide(kind);
  };

  const sealed = choice !== 'button';
  const buttonAction = choice === 'button' || choice === 'sealed';

  return (
    <Card className="sk-gate flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h5 className="type-label font-medium">Remove 38 seats</h5>
        <span className="type-caption figures-id text-muted">REQ-2291</span>
      </div>
      <dl className="sk-facts">
        <div>
          <dt>Seats</dt>
          <dd>38 with no sign-in since Jul 15</dd>
        </div>
        <div>
          <dt>Owners</dt>
          <dd>6 get an email</dd>
        </div>
        <div>
          <dt>Licenses</dt>
          <dd>Return to the pool</dd>
        </div>
      </dl>
      <div className="sk-gate-actions">
        {decision ? (
          <div
            ref={recordRef}
            tabIndex={-1}
            className="sk-record"
            data-kind={decision.kind}
            role="status"
          >
            <div className="sk-record-text">
              <p className="type-label font-medium">
                {decision.kind === 'approved' ? 'Approved removal' : 'Declined removal'}
              </p>
              <p className="type-caption figures-tabular text-muted">Yankun Wang · {decision.at}</p>
            </div>
            {decision.kind === 'approved' ? (
              sealed ? (
                <SealMark cut={cut} impressed />
              ) : (
                <span className="sk-record-glyph" aria-hidden="true">
                  <Check focusable="false" />
                </span>
              )
            ) : null}
          </div>
        ) : (
          <>
            <p className="sk-gate-note type-caption text-muted">
              Nothing changes until you approve.
            </p>
            <div className="sk-gate-buttons">
              <Button variant="secondary" disabled={disabled} onClick={() => decide('declined')}>
                Decline
              </Button>
              {buttonAction ? (
                <Button variant="primary" disabled={disabled} onClick={() => decide('approved')}>
                  Approve removal
                </Button>
              ) : (
                <SealButton
                  key={choice}
                  mode={choice === 'hold' ? 'hold' : 'stamp'}
                  cut={cut}
                  label={choice === 'hold' ? 'Hold to approve' : 'Approve removal'}
                  disabled={disabled}
                  onApprove={() => decide('approved')}
                />
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ================================================================== Drawing (loading) */

type LoadState = 'loading' | 'building' | 'built';

function Loadable({
  state,
  choices,
  label,
  today,
  children,
}: {
  state: LoadState;
  choices: Choices;
  label: string;
  today: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const dims = choices.loading === 'drawing' && choices.dims === 'on';

  useLayoutEffect(() => {
    const frame = ref.current?.querySelector('.sk-load-frame');
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const box = entry.borderBoxSize?.[0];
      setSize({
        width: box ? box.inlineSize : entry.contentRect.width,
        height: box ? box.blockSize : entry.contentRect.height,
      });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [dims]);

  const pending = state !== 'built';
  const showToday = choices.loading === 'today' && pending;
  const fen = (px: number) => Math.round(px / 4);

  return (
    <div
      ref={ref}
      className="sk-load"
      data-state={state}
      data-dims={dims ? '' : undefined}
      aria-busy={pending}
    >
      {pending && !showToday ? <span className="sr-only">{label}</span> : null}
      <div className="sk-load-frame" aria-hidden={pending && !showToday ? true : undefined}>
        {showToday ? today : children}
        {dims ? (
          <span className="sk-dims" aria-hidden="true">
            <span className="sk-dim-w type-caption figures-tabular">
              <span>{fen(size.width)} fen</span>
            </span>
            <span className="sk-dim-h type-caption figures-tabular">
              <span>{fen(size.height)} fen</span>
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Loading → (data arrives) → building for one build duration → built. */
function useLoad(initial: LoadState = 'built') {
  const [state, setState] = useState<LoadState>(initial);
  const token = useRef(0);
  const hold = useRef(false);

  async function run(el: Element | null, waitMs: number) {
    const mine = ++token.current;
    setState('loading');
    await sleep(waitMs);
    while (hold.current && mine === token.current) await sleep(120);
    if (mine !== token.current) return;
    setState('building');
    await sleep(buildMs(el) + 40);
    if (mine !== token.current) return;
    setState('built');
  }

  function reset(next: LoadState) {
    token.current++;
    setState(next);
  }

  return { state, run, reset, hold };
}

/* ------------------------------------------------------------------ assets */

const REMOVALS = [
  ['Ada Okafor', 'Jun 28', 'Full'],
  ['Bram de Vries', 'Jul 2', 'Full'],
  ['Chen Liu', 'Jul 9', 'Viewer'],
  ['Dara Moss', 'Jul 11', 'Full'],
  ['Eli Navarro', 'Jul 14', 'Viewer'],
];

function RemovalTable({ label = 'Removal list' }: { label?: string }) {
  return (
    <Table.Root aria-label={label}>
      <Table.Header>
        <Table.Row>
          <Table.Head className="w-full">Member</Table.Head>
          <Table.Head className="whitespace-nowrap">Last sign-in</Table.Head>
          <Table.Head className="whitespace-nowrap">Seat</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {REMOVALS.map(([name, last, seat]) => (
          <Table.Row key={name}>
            <Table.Cell>{name}</Table.Cell>
            <Table.Cell className="whitespace-nowrap figures-tabular">{last}</Table.Cell>
            <Table.Cell className="whitespace-nowrap">{seat}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell className="text-muted">33 more</Table.Cell>
          <Table.Cell />
          <Table.Cell numeric className="figures-tabular">
            38
          </Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  );
}

function RemovalTableToday() {
  return (
    <Table.Root aria-label="Removal list, loading">
      <Table.Header>
        <Table.Row>
          <Table.Head className="w-full">Member</Table.Head>
          <Table.Head className="whitespace-nowrap">Last sign-in</Table.Head>
          <Table.Head className="whitespace-nowrap">Seat</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell className="text-muted" colSpan={3}>
            Loading removal list…
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  );
}

function SeatsCard({ after = false }: { after?: boolean }) {
  const used = after ? 374 : 412;
  const pct = Math.round((used / 450) * 100);
  return (
    <Card className="sk-seats flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h5 className="type-label font-medium">Seats</h5>
        <span className="type-caption figures-tabular text-muted">North workspace</span>
      </div>
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="type-title figures-tabular">{used}</span>
        <span className="type-caption text-muted">of 450 assigned</span>
      </p>
      <div className="sk-meter" aria-hidden="true">
        <span style={{ inlineSize: `${pct}%` }} />
      </div>
      <div className="flex min-w-0 flex-wrap justify-between gap-x-3 type-caption">
        <span className="text-muted">{after ? 'Removed today' : 'Inactive 90 days'}</span>
        <span className="figures-tabular">38</span>
      </div>
    </Card>
  );
}

function SeatsCardToday() {
  return (
    <Card className="sk-seats flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <h5 className="type-label font-medium">Seats</h5>
        <span className="type-caption text-muted">North workspace</span>
      </div>
      <Progress label="Loading seats" value={null} />
    </Card>
  );
}

/* ================================================================== the working assistant */

const STEP_DEFS = [
  {
    id: 'read',
    title: 'Read seat assignments',
    detail: 'North workspace · 412 assigned seats',
    ms: 900,
  },
  {
    id: 'find',
    title: 'Find seats with no sign-in for 90 days',
    detail: 'Sign-in log since Jul 15',
    ms: 1100,
  },
  { id: 'list', title: 'Prepare the removal list', detail: '38 seats · 6 owners', ms: 500 },
  { id: 'approve', title: 'Approve the removal', detail: 'Waits for your approval', ms: 0 },
  {
    id: 'remove',
    title: 'Remove 38 seats and email owners',
    detail: 'Licenses return to the pool',
    ms: 1100,
  },
] as const;
type StepId = (typeof STEP_DEFS)[number]['id'];

const INITIAL_STATUS: Record<StepId, StepStatus> = {
  read: 'planned',
  find: 'planned',
  list: 'planned',
  approve: 'planned',
  remove: 'planned',
};

function WorkingAssistant({ choices, quarter }: { choices: Choices; quarter: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [proposal, setProposal] = useState(0);
  const [decision, setDecision] = useState<Decision>(null);
  const [failNext, setFailNext] = useState(false);
  const [slow, setSlow] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [shown, setShown] = useState<Partial<Record<StepId, boolean>>>({});
  const table = useLoad('built');
  const summary = useLoad('built');
  const token = useRef(0);
  const failRef = useRef(failNext);
  failRef.current = failNext;
  table.hold.current = slow;
  summary.hold.current = slow;
  const pace = quarter ? 2 : 1;

  const running = Object.values(status).some((s) => s === 'running');
  const started = Object.values(status).some((s) => s !== 'planned');
  const finished = status.remove === 'done' || status.remove === 'skipped';

  const set = (id: StepId, s: StepStatus) => setStatus((current) => ({ ...current, [id]: s }));

  async function runFrom(index: number) {
    const mine = ++token.current;
    const alive = () => mine === token.current;
    for (let i = index; i < STEP_DEFS.length; i++) {
      const step = STEP_DEFS[i];
      if (step.id === 'approve') {
        set('approve', 'waiting');
        setAnnouncement('Step 4 needs your approval.');
        return;
      }
      set(step.id, 'running');
      setAnnouncement(`Step ${i + 1} running.`);
      await sleep(step.ms * pace);
      if (!alive()) return;
      if (step.id === 'find' && failRef.current) {
        setFailNext(false);
        set('find', 'failed');
        setAnnouncement('Step 2 failed. Retry the step.');
        return;
      }
      if (step.id === 'list') {
        setShown((current) => ({ ...current, list: true }));
        await table.run(stageRef.current, 1500 * pace);
        if (!alive()) return;
      }
      if (step.id === 'remove') {
        setShown((current) => ({ ...current, remove: true }));
        await summary.run(stageRef.current, 1100 * pace);
        if (!alive()) return;
      }
      const build = buildMs(stageRef.current);
      set(step.id, 'done');
      setAnnouncement(`Step ${i + 1} done.`);
      await sleep(build + 180 * pace);
      if (!alive()) return;
    }
    setAnnouncement('Plan finished. Removed 38 seats.');
  }

  function propose() {
    token.current++;
    setStatus(INITIAL_STATUS);
    setDecision(null);
    setShown({});
    table.reset('built');
    summary.reset('built');
    setProposal((n) => n + 1);
    setAnnouncement('Proposed a new plan.');
  }

  function decide(kind: 'approved' | 'declined') {
    setDecision({ kind, at: now() });
    if (kind === 'approved') {
      set('approve', 'done');
      setAnnouncement('Approved removal. Step 5 running.');
      const build = buildMs(stageRef.current);
      const mine = ++token.current;
      void sleep(build + 260 * pace).then(() => {
        if (mine === token.current) void runFrom(4);
      });
    } else {
      setStatus((current) => ({ ...current, approve: 'declined', remove: 'skipped' }));
      setAnnouncement('Declined removal. Nothing changed.');
    }
  }

  const steps: PlanStepData[] = STEP_DEFS.map((def) => {
    let body: ReactNode = null;
    if (def.id === 'find' && status.find === 'failed') {
      body = (
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="type-caption text-danger">The sign-in log timed out. Nothing changed.</p>
          <Button variant="secondary" size="small" onClick={() => void runFrom(1)}>
            Retry step
          </Button>
        </div>
      );
    }
    if (def.id === 'list' && shown.list) {
      body = (
        <Loadable
          state={table.state}
          choices={choices}
          label="Loading the removal list"
          today={<RemovalTableToday />}
        >
          <RemovalTable />
        </Loadable>
      );
    }
    if (def.id === 'approve' && (status.approve !== 'planned' || decision)) {
      body = (
        <ApprovalGate
          choice={choices.approve}
          cut={choices.impression}
          decision={decision}
          onDecide={decide}
        />
      );
    }
    if (def.id === 'remove' && shown.remove) {
      body = (
        <Loadable
          state={summary.state}
          choices={choices}
          label="Loading seats"
          today={<SeatsCardToday />}
        >
          <SeatsCard after />
        </Loadable>
      );
    }
    const detail =
      def.id === 'approve' && decision
        ? `${decision.kind === 'approved' ? 'Approved' : 'Declined'} by Yankun Wang · ${decision.at}`
        : def.id === 'remove' && status.remove === 'skipped'
          ? 'Not run after the decline'
          : def.detail;
    return { ...def, detail, status: status[def.id], body };
  });

  return (
    <div ref={stageRef} className="flex min-w-0 flex-col gap-4">
      <div className="sk-panel card-construction border border-subtle bg-canvas">
        <header className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 border-b border-subtle px-3 py-2">
          <h3 className="type-label font-medium">ZAO assistant</h3>
          <p className="type-caption text-muted">North workspace</p>
        </header>
        <div className="sk-transcript">
          <Message.Root author="You" kind="user">
            <Message.Content>
              <p className="type-body">Remove seats that haven’t signed in for 90 days.</p>
            </Message.Content>
          </Message.Root>
          <Message.Root author="ZAO assistant" kind="assistant" metadata="Local simulation">
            <Message.Content>
              <div className="flex min-w-0 flex-col gap-3">
                <p>
                  Here’s the plan. Steps 1 to 3 only read. Nothing is removed until you approve step
                  4.
                </p>
                <Plan
                  key={proposal}
                  label="Remove inactive seats"
                  steps={steps}
                  entering={proposal > 0}
                />
              </div>
            </Message.Content>
            <Message.Actions>
              <Button
                variant="primary"
                size="small"
                disabled={started}
                onClick={() => void runFrom(0)}
              >
                {finished ? 'Plan finished' : started ? 'Running plan' : 'Run plan'}
              </Button>
            </Message.Actions>
          </Message.Root>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="sk-sim flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 type-caption text-muted">
          <Switch checked={failNext} onCheckedChange={setFailNext} disabled={running} />
          Fail step 2
        </label>
        <label className="flex items-center gap-2 type-caption text-muted">
          <Switch checked={slow} onCheckedChange={setSlow} />
          Keep loading
        </label>
        <Button variant="quiet" size="small" onClick={propose}>
          Propose again
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== benches */

const STATE_STEPS: PlanStepData[] = [
  {
    id: 'a',
    title: 'Read seat assignments',
    detail: 'North workspace · 412 assigned seats',
    status: 'done',
  },
  {
    id: 'b',
    title: 'Find seats with no sign-in for 90 days',
    detail: 'Sign-in log since Jul 15',
    status: 'running',
  },
  { id: 'c', title: 'Approve the removal', detail: 'Waits for your approval', status: 'waiting' },
  {
    id: 'd',
    title: 'Remove 38 seats and email owners',
    detail: 'Licenses return to the pool',
    status: 'planned',
  },
  {
    id: 'e',
    title: 'Export the sign-in report',
    detail: 'The report service is unavailable',
    status: 'failed',
  },
  {
    id: 'f',
    title: 'Archive removed members',
    detail: 'Not needed after a decline',
    status: 'skipped',
  },
];

function PlanStates() {
  return (
    <section className="sk-bench" aria-labelledby="plan-states">
      <div className="sk-bench-head">
        <h3 id="plan-states" className="sk-eyebrow">
          P1 · Plan, every step state
        </h3>
        <p className="type-caption text-muted">
          Done, running, needs you, planned, failed and skipped, in the chosen construction.
        </p>
      </div>
      <Plan label="Every step state" steps={STATE_STEPS} />
    </section>
  );
}

function ApprovalStates({ choices }: { choices: Choices }) {
  const [live, setLive] = useState<Decision>(null);
  const [round, setRound] = useState(0);
  return (
    <section className="sk-bench" aria-labelledby="approval-states">
      <div className="sk-bench-head">
        <h3 id="approval-states" className="sk-eyebrow">
          A1 · Approval states
        </h3>
        <p className="type-caption text-muted">
          The first card works. The other two show the records it leaves.
        </p>
      </div>
      <div className="sk-gate-grid">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="type-caption text-muted">Waiting for you</p>
            <Button
              variant="quiet"
              size="small"
              disabled={!live}
              onClick={() => {
                setLive(null);
                setRound((n) => n + 1);
              }}
            >
              Reset
            </Button>
          </div>
          <ApprovalGate
            key={round}
            choice={choices.approve}
            cut={choices.impression}
            decision={live}
            onDecide={(kind) => setLive({ kind, at: now() })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="sk-gate-label type-caption text-muted">Approved</p>
          <ApprovalGate
            choice={choices.approve}
            cut={choices.impression}
            decision={{ kind: 'approved', at: '10:42 AM' }}
            onDecide={() => {}}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="sk-gate-label type-caption text-muted">Declined</p>
          <ApprovalGate
            choice={choices.approve}
            cut={choices.impression}
            decision={{ kind: 'declined', at: '10:42 AM' }}
            onDecide={() => {}}
          />
        </div>
      </div>
    </section>
  );
}

function LoadingBench({ choices, quarter }: { choices: Choices; quarter: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const card = useLoad('loading');
  const table = useLoad('loading');
  const [keep, setKeep] = useState(true);
  card.hold.current = keep;
  table.hold.current = keep;
  const pace = quarter ? 2 : 1;

  // The bench opens mid-load and stays there, so the resting page shows the drawing.
  useEffect(() => {
    if (!keep && card.state === 'loading') {
      void card.run(ref.current, 0);
      void table.run(ref.current, 260 * pace);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keep]);

  function reload() {
    void card.run(ref.current, 1300 * pace);
    void table.run(ref.current, 1700 * pace);
  }

  return (
    <section ref={ref} className="sk-bench" aria-labelledby="loading-bench">
      <div className="sk-bench-head">
        <h3 id="loading-bench" className="sk-eyebrow">
          L1 · Loading, then built
        </h3>
        <p className="type-caption text-muted">
          The same Card and Table from the plan, held mid-load until you let them arrive.
        </p>
      </div>
      <div className="sk-sim flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
        <Button variant="secondary" size="small" onClick={reload}>
          Load
        </Button>
        <label className="flex items-center gap-2 type-caption text-muted">
          <Switch checked={keep} onCheckedChange={setKeep} />
          Keep loading
        </label>
      </div>
      <div className="sk-load-grid">
        <Loadable
          state={card.state}
          choices={choices}
          label="Loading seats"
          today={<SeatsCardToday />}
        >
          <SeatsCard />
        </Loadable>
        <Loadable
          state={table.state}
          choices={choices}
          label="Loading the removal list"
          today={<RemovalTableToday />}
        >
          <RemovalTable label="Removal list, bench" />
        </Loadable>
      </div>
    </section>
  );
}

/* ================================================================== notes */

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
        <p className="sk-eyebrow">Notes · Oct 13, on commit 28a85b8 with the Conversation plan</p>
        <h2 id="notes-title" className="type-heading">
          Why these three, and what’s still open
        </h2>
        <p className="sk-prose type-body text-muted">
          Each one has a process for its job: a plan gets done, an approval gets given, data
          arrives. That’s where drawn → built means something instead of decorating, and where
          motion can answer an action instead of playing on load. All three use only existing
          tokens, roles and utilities. No new color.
        </p>
      </div>

      <div className="sk-notes-grid">
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="sk-eyebrow">What each one would become</h3>
          <ol className="sk-findings">
            <Finding code="P" title="Plan, a new component">
              <code>Plan.Root</code> with a label and <code>Plan.Step</code> children, each with a
              title, detail, <code>status</code> (planned, running, waiting, done, failed, skipped)
              and an optional body for what the step produced. The host owns the run; Plan only
              draws it, as Message does for responses. A finished step uses the slip’s depth (
              <code>depth.rest.small</code>), so a long plan stays light.
            </Finding>
            <Finding code="A" title="ApprovalGate, a new component">
              A Card with the consequence spelled out, Decline, and an approve action with{' '}
              <code>confirm=&quot;stamp&quot; | &quot;hold&quot;</code>. The decision renders as a
              record that uses the same verb, so the action becomes its own receipt. It reuses
              Card’s load-path dip, Button’s seat and the focus brackets. The seal face and the
              impression read the seal tokens, so azurite works without changes.
            </Finding>
            <Finding code="L" title="Drawing, a state on existing parts">
              Not a new component: a <code>drawing</code> state for Card and Table, later for
              Progress and charts. The host renders placeholder rows, as it would for a skeleton,
              and ZAO draws them: ink frame, no face, no planes, and text replaced by its lettering
              guidelines, an overline and an underline cut from the real line boxes. One CSS recipe,
              no second layout to maintain. The docs’ Card states become the published behavior.
            </Finding>
          </ol>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="sk-eyebrow">Decided Oct 13, and what’s still open</h3>
          <ol className="sk-findings">
            <Finding code="A1" title="Hold duration: decided">
              Its own motion role, <code>motion.duration.hold</code>: four grade-1 beats, one per
              ink band, about 1.1s.
            </Finding>
            <Finding code="A2" title="What the seal says">
              准 (“approved”) is a placeholder. The mark could be the approver’s initials, a product
              mark, or a short host-provided word. It’s decorative either way: the accessible name
              stays “Approve removal” and the record states the result in words.
            </Finding>
            <Finding code="A1" title="Hold can’t be the only way">
              Some people can’t press and hold. If Hold ships for irreversible actions, it needs
              another path, such as a setting that turns it back into a press, or a Dialog
              confirmation. Still open.
            </Finding>
            <Finding code="P2" title="Stagger: decided with Drawn in">
              The pen starts each step one <code>motion.duration.fast</code> after the last. That
              stagger is new to the system: Menu rows keep none. Here the order is the point,
              because the plan is drawn in the order it will run.
            </Finding>
            <Finding code="—" title="What the sketch fakes">
              The plan runner, the timings between steps and the network are simulated. The drawing
              state is applied by the host through a wrapper; in the system it would be a prop. The
              pen sweeps left to right; RTL would mirror it. Reduced motion shows every end state
              without travel.
            </Finding>
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== app */

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
    load<Settings>({ choices: DECIDED, speed: 'normal', mode: 'system', seal: 'ink' }),
  );
  const id = useId();
  useMode(settings.mode);

  useEffect(() => {
    save(settings);
    document.documentElement.setAttribute('data-zao-seal', settings.seal);
  }, [settings]);

  const choices = { ...DECIDED, ...settings.choices };
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const setChoice = (key: string, value: string) =>
    setSettings((s) => ({ ...s, choices: { ...s.choices, [key]: value } }));
  const stageAttrs: Record<string, string> = Object.fromEntries(
    Object.entries(choices).map(([k, v]) => [`data-sk-${k}`, v]),
  );
  const quarter = settings.speed === 'quarter';
  const isBaseline = PROPOSALS.every((p) => choices[p.key] === p.baseline);
  const isDecided = PROPOSALS.every((p) => choices[p.key] === p.lean);

  return (
    <div className="sk sk-page" data-sk-speed={settings.speed} {...stageAttrs}>
      <header className="sk-top">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="sk-eyebrow">ZAO · Su 素 · Sketch for review</p>
          <h1 className="type-title">Plan, seal and drawing</h1>
          <p className="sk-lede type-body text-muted">
            Three proposals whose job is a process: an agent’s plan that gets built step by step, an
            approval you stamp, and loading that shows a part’s drawing until its data arrives.
            They’re sketched on the real <code>@zao/react</code> parts. Switch any row between its
            options. The dot marks my lean; rows marked Decided record your Oct 13 choices.
          </p>
        </div>
        <div className="sk-globals">
          <div className="sk-global">
            <span className="sk-global-label">Show</span>
            <div className="flex gap-2">
              <Button
                size="small"
                variant={isBaseline ? 'primary' : 'secondary'}
                onClick={() => set({ choices: BASELINE })}
              >
                Baseline
              </Button>
              <Button
                size="small"
                variant={isDecided ? 'primary' : 'secondary'}
                onClick={() => set({ choices: DECIDED })}
              >
                Decided
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

      <div className="sk-main">
        <div className="sk-stage">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="sk-eyebrow">Working assistant</p>
            <h2 className="type-heading">Propose, build, approve</h2>
            <p className="sk-prose type-body text-muted">
              One request runs through all three. The plan arrives as a drawing, its steps are built
              as they finish, step 3’s list loads as a drawing, and step 4 waits for your seal.
            </p>
          </div>
          <WorkingAssistant choices={choices} quarter={quarter} />
          <PlanStates />
          <ApprovalStates choices={choices} />
          <LoadingBench choices={choices} quarter={quarter} />
        </div>

        <aside className="sk-side" aria-label="Proposals">
          {(['Plan', 'Approval', 'Loading'] as Group[]).map((group) => (
            <div key={group} className="flex min-w-0 flex-col">
              <h2 className="sk-eyebrow sk-side-group">{group}</h2>
              {PROPOSALS.filter((p) => p.group === group).map((p) => (
                <div
                  key={p.key}
                  className="sk-prop"
                  data-changed={choices[p.key] !== p.baseline ? '' : undefined}
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

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
