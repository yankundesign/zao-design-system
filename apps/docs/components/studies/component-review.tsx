'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  ApprovalGate,
  Button,
  Card,
  Dialog,
  IconButton,
  Plan,
  Progress,
  Switch,
  Tabs,
  finish,
} from '@zao/react';
import type { ApprovalDecision } from '@zao/react';
import { Check, Copy } from 'iconoir-react';
import { islandModeScript } from '../landing/landing-root';
import { useFinish } from '../use-finish';
import './component-review.css';

/*
 * Private comparisons for the component review's "study first" gates (wave 2, Nov 13). Each
 * section shows today's part beside the proposal. Everything here is docs-local: the published
 * components are used as they are and restyled or wrapped only inside this page. Nothing here is
 * approved; Yankun chooses, and only then is a row published.
 */

const noop = () => () => {};

function milliseconds(element: Element | null, token: string) {
  const value = getComputedStyle(element ?? document.body)
    .getPropertyValue(token)
    .trim();
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  return value.endsWith('ms') ? amount : amount * 1000;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Study({
  gate,
  title,
  look,
  children,
}: {
  gate: string;
  title: string;
  look: ReactNode;
  children: ReactNode;
}) {
  return (
    <section data-cr-study={gate} className="flex flex-col gap-4 border-t border-subtle pt-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono type-caption text-muted">{gate}</p>
        <h2 className="type-heading">{title}</h2>
        <p className="max-w-2xl type-body text-muted">{look}</p>
      </header>
      <div className="cr-options">{children}</div>
    </section>
  );
}

function Option({ name, note, children }: { name: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div data-cr-option={name} className="flex min-w-0 flex-col gap-2">
      <h3 className="type-label font-medium">{name}</h3>
      <div className="cr-stage">{children}</div>
      {note ? <p className="type-caption text-muted">{note}</p> : null}
    </div>
  );
}

/* S1 — the loading mark. The published arc, restyled per option in component-review.css. */
function LoadingMarks() {
  const marks = [
    { id: 'arc', name: 'Today · Arc', note: 'One arc, turning once per loading duration.' },
    {
      id: 'ticks',
      name: 'A · Grade ticks',
      note: 'Eight ticks, one per motion grade. They fill in eight steps per loading duration.',
    },
    {
      id: 'brackets',
      name: 'B · Bracket corners',
      note: 'The four focus-bracket corners, lit in turn: four steps per loading duration.',
    },
  ];
  return (
    <Study
      gate="S1"
      title="What is the loading mark?"
      look="Every pending state shares one mark. Compare the three in a primary and a secondary action, at the small size, and in a running Plan step. With reduced motion each shows a still mark."
    >
      {marks.map((mark) => (
        <Option key={mark.id} name={mark.name} note={mark.note}>
          <div data-cr-loading={mark.id} className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" loading loadingAnnouncement="">
                Save changes
              </Button>
              <Button variant="secondary" loading loadingAnnouncement="">
                Export report
              </Button>
              <Button variant="secondary" size="small" loading loadingAnnouncement="">
                Retry
              </Button>
            </div>
            <Plan.Root label="Remove inactive seats" entering={false} announce={false}>
              <Plan.Step title="Check seat activity" status="done" />
              <Plan.Step title="Remove 14 seats" status="running" />
            </Plan.Root>
          </div>
        </Option>
      ))}
    </Study>
  );
}

/* CR1 — Button shows its result. `hold` keeps the face seated for the Hold beat. */
function ResultAction({
  hold,
  kind,
  pendingFor = 0,
}: {
  hold: boolean;
  kind: 'copy' | 'save' | 'icon';
  /** Simulated host work before the result, in milliseconds. */
  pendingFor?: number;
}) {
  const [phase, setPhase] = useState<'idle' | 'pending' | 'result'>('idle');
  const host = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  function run() {
    if (timer.current !== null) clearTimeout(timer.current);
    const show = () => {
      setPhase('result');
      timer.current = setTimeout(
        () => setPhase('idle'),
        milliseconds(host.current, '--zao-motion-duration-hold'),
      );
    };
    if (pendingFor > 0) {
      setPhase('pending');
      timer.current = setTimeout(show, pendingFor);
    } else show();
  }

  const result = phase === 'result';
  const labels = kind === 'save' ? ['Save changes', 'Saved'] : ['Copy response', 'Copied'];
  return (
    <span
      ref={host}
      data-cr-result={result && hold ? '' : undefined}
      className="cr-result inline-flex"
    >
      {kind === 'icon' ? (
        <IconButton
          icon={result ? Check : Copy}
          aria-label="Copy response"
          variant="quiet"
          onClick={run}
        />
      ) : (
        <Button
          variant={kind === 'save' ? 'primary' : 'secondary'}
          loading={kind === 'save' ? phase === 'pending' : undefined}
          loadingAnnouncement="Saving changes"
          onClick={run}
        >
          {/* Both labels share one cell, so the result never resizes the action. */}
          <span className="cr-label-stack">
            <span data-current={result ? undefined : ''}>{labels[0]}</span>
            <span data-current={result ? '' : undefined}>{labels[1]}</span>
          </span>
        </Button>
      )}
      <span className="sr-only" role="status">
        {result ? (kind === 'save' ? 'Saved changes.' : 'Copied response.') : ''}
      </span>
    </span>
  );
}

function ButtonResult() {
  return (
    <Study
      gate="CR1"
      title="Does Button show its result?"
      look={
        'Press each action. Today the host swaps the label and the face returns at once. In the proposal the face stays seated for the Hold beat while the label reads the result, then lifts. "Save changes" waits on simulated work first.'
      }
    >
      <Option name="Today · Label only" note="The label changes; the face is free.">
        <ResultAction kind="copy" hold={false} />
        <ResultAction kind="icon" hold={false} />
        <ResultAction kind="save" hold={false} pendingFor={900} />
      </Option>
      <Option
        name="Proposal · Result on the face"
        note="Seated for motion.duration.hold, then it lifts on its own role."
      >
        <ResultAction kind="copy" hold />
        <ResultAction kind="icon" hold />
        <ResultAction kind="save" hold pendingFor={900} />
      </Option>
    </Study>
  );
}

/* CR18 — hold to approve. A docs-local gate row with a drawn seal well that fills as held. */
const approval: ApprovalDecision = { kind: 'approved', by: 'YK', at: 'Nov 13 · 10:42' };
const gateFacts = [
  { label: 'Seats', value: '14 inactive for 90 days' },
  { label: 'Saves', value: '$168 a month' },
];

function HoldGate() {
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [holding, setHolding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const record = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portal = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  function approve() {
    timer.current = null;
    flushSync(() => {
      setHolding(false);
      setDecision(approval);
    });
    record.current?.focus();
  }

  function start() {
    if (decision || timer.current !== null) return;
    // Reduced motion takes the confirm path instead of a timed hold.
    if (prefersReducedMotion()) {
      setConfirming(true);
      return;
    }
    setHolding(true);
    timer.current = setTimeout(approve, milliseconds(row.current, '--zao-motion-duration-hold'));
  }

  function release() {
    if (timer.current === null) return;
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  const holdKey = (event: KeyboardEvent) => event.key === ' ' || event.key === 'Enter';

  return (
    <div ref={portal} className="flex w-full min-w-0 flex-col gap-3">
      <Card className="cr-gate">
        <header className="approval-gate-header">
          <span className="type-label font-medium">Remove inactive seats</span>
          <span className="type-caption figures-id text-muted">REQ-2291</span>
        </header>
        <dl className="approval-gate-facts">
          {gateFacts.map((fact) => (
            <div className="approval-gate-fact" key={fact.label}>
              <dt className="type-caption text-muted">{fact.label}</dt>
              <dd className="type-caption text-default">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div ref={row} data-cr-holding={holding ? '' : undefined} className="cr-gate-row">
          {decision ? (
            <div ref={record} tabIndex={-1} role="status" className="cr-gate-record outline-focus">
              <span className="type-label font-medium">
                {decision.kind === 'approved' ? 'Removed 14 seats' : 'Kept 14 seats'}
              </span>
              <span className="type-caption figures-tabular text-muted">
                {decision.by} · {decision.at}
              </span>
            </div>
          ) : (
            <>
              {/* The note takes the free room, so the actions never move under a held pointer. */}
              <span className="min-w-0 flex-1 type-caption text-muted">
                {holding ? 'Keep holding…' : 'This cannot be undone.'}
              </span>
              <span className="approval-gate-actions-buttons">
                <Button
                  variant="secondary"
                  onClick={() => setDecision({ ...approval, kind: 'declined' })}
                >
                  Keep seats
                </Button>
                <span
                  className="cr-hold-action"
                  onPointerDown={(event: PointerEvent) => {
                    if (event.button === 0) start();
                  }}
                  onPointerUp={release}
                  onPointerLeave={release}
                  onPointerCancel={release}
                  onKeyDown={(event) => {
                    if (holdKey(event) && !event.repeat) start();
                  }}
                  onKeyUp={(event) => {
                    if (holdKey(event)) release();
                  }}
                  onBlur={release}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <Button variant="primary" aria-describedby="cr-hold-hint">
                    Hold to remove 14 seats
                  </Button>
                </span>
              </span>
            </>
          )}
          {/* The seal's place is drawn before the decision and printed by it. */}
          <span
            aria-hidden="true"
            className="cr-seal"
            data-cr-printed={decision?.kind === 'approved' ? '' : undefined}
          >
            <span className="approval-gate-impression cr-seal-fill">
              <span>准</span>
            </span>
          </span>
        </div>
        <p id="cr-hold-hint" className="sr-only">
          Press and hold for about a second to approve. Release to cancel.
        </p>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="quiet" size="small" disabled={!decision} onClick={() => setDecision(null)}>
          Reset
        </Button>
      </div>
      <Dialog.Root open={confirming} onOpenChange={setConfirming}>
        <Dialog.Portal container={portal}>
          <Dialog.Backdrop />
          <Dialog.Viewport>
            <Dialog.Popup>
              <div className="flex flex-col gap-3">
                <Dialog.Title>Remove 14 inactive seats?</Dialog.Title>
                <Dialog.Description>
                  The seats have been inactive for 90 days. This cannot be undone.
                </Dialog.Description>
                <Dialog.Actions note="REQ-2291">
                  <Dialog.Close>Keep seats</Dialog.Close>
                  <Dialog.Close variant="primary" onClick={() => setDecision(approval)}>
                    Remove 14 seats
                  </Dialog.Close>
                </Dialog.Actions>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function PressGate() {
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <ApprovalGate
        title="Remove inactive seats"
        reference="REQ-2291"
        facts={gateFacts}
        note="This cannot be undone."
        approveLabel="Remove 14 seats"
        approvedLabel="Removed 14 seats"
        declineLabel="Keep seats"
        declinedLabel="Kept 14 seats"
        mark="准"
        decision={decision}
        onApprove={() => setDecision(approval)}
        onDecline={() => setDecision({ ...approval, kind: 'declined' })}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="quiet" size="small" disabled={!decision} onClick={() => setDecision(null)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function HoldToApprove() {
  return (
    <Study
      gate="CR18 · G1"
      title="Does hold-to-approve ship?"
      look="Today a destructive approval takes one press. In the proposal, hold the primary action with the pointer, Space or Enter: its face seats in the Hold role's four steps while the seal fills its drawn place, and the decision is recorded when it is full. Release early and both return. With reduced motion a press opens a confirming Dialog."
    >
      <Option name="Today · One press" note="The published ApprovalGate.">
        <PressGate />
      </Option>
      <Option
        name="Proposal · Hold"
        note="motion.duration.hold on motion.easing.hold; the early return leaves on the fold."
      >
        <HoldGate />
      </Option>
    </Study>
  );
}

/* CR9 — the Switch face can be dragged. The published Switch, wrapped. */
function DragSwitch({ drag }: { drag: boolean }) {
  const [checked, setChecked] = useState(false);
  const host = useRef<HTMLLabelElement>(null);
  const suppress = useRef(false);
  const gesture = useRef<{
    control: HTMLElement;
    pointer: number;
    startX: number;
    origin: number;
    travel: number;
    sign: number;
    position: number;
    moved: boolean;
  } | null>(null);

  function begin(event: PointerEvent<HTMLLabelElement>) {
    if (!drag || event.button !== 0) return;
    const control = host.current?.querySelector<HTMLElement>('.switch-construction');
    const thumb = control?.querySelector<HTMLElement>('[data-zao-slot="thumb"]');
    if (!control || !thumb || !control.contains(event.target as Node)) return;
    const travel =
      control.getBoundingClientRect().width -
      thumb.getBoundingClientRect().width -
      2 * Number.parseFloat(getComputedStyle(thumb).top);
    const origin = checked ? travel : 0;
    gesture.current = {
      control,
      pointer: event.pointerId,
      startX: event.clientX,
      origin,
      travel,
      sign: getComputedStyle(control).direction === 'rtl' ? -1 : 1,
      position: origin,
      moved: false,
    };
  }

  function move(event: PointerEvent<HTMLLabelElement>) {
    const state = gesture.current;
    if (!state || state.pointer !== event.pointerId) return;
    const delta = (event.clientX - state.startX) * state.sign;
    // A press without travel stays a press and toggles as it does today.
    if (!state.moved && Math.abs(delta) < 3) return;
    if (!state.moved) {
      state.moved = true;
      state.control.setPointerCapture(event.pointerId);
      state.control.dataset.crDragging = '';
    }
    state.position = Math.min(state.travel, Math.max(0, state.origin + delta));
    state.control.style.setProperty('--switch-position', `${state.sign * state.position}px`);
  }

  function end(event: PointerEvent<HTMLLabelElement>) {
    const state = gesture.current;
    if (!state || state.pointer !== event.pointerId) return;
    gesture.current = null;
    if (!state.moved) return;
    // The face settles on the nearer end; the click that follows a drag must not toggle again.
    suppress.current = true;
    flushSync(() => setChecked(state.position > state.travel / 2));
    delete state.control.dataset.crDragging;
    state.control.style.removeProperty('--switch-position');
    setTimeout(() => {
      suppress.current = false;
    }, 0);
  }

  return (
    <label
      ref={host}
      className="cr-switch inline-flex items-center gap-3"
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <Switch
        checked={checked}
        onCheckedChange={(next) => {
          if (!suppress.current) setChecked(next);
        }}
      />
      <span className="type-label">Share usage data</span>
    </label>
  );
}

function SwitchDrag() {
  return (
    <Study
      gate="CR9"
      title="Can the Switch face be dragged?"
      look="Today a drag does nothing until release. In the proposal, press the face and move: it follows the pointer between its ends and settles on the nearer one on the Slide role. A press without travel, the label and the keyboard toggle as they do today."
    >
      <Option name="Today · Press only" note="The published Switch.">
        <DragSwitch drag={false} />
      </Option>
      <Option name="Proposal · Dragged face" note="Try a short drag that stops before the middle.">
        <DragSwitch drag />
      </Option>
    </Study>
  );
}

/* CR8 — the selection line leads. Direction is known when the value changes. */
const views = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'members', label: 'Members' },
  { value: 'billing', label: 'Billing' },
  { value: 'settings', label: 'Settings' },
];

function LeadTabs({ lead }: { lead: boolean }) {
  const [value, setValue] = useState('overview');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const index = (name: string) => views.findIndex((view) => view.value === name);
  return (
    <div data-cr-lead={lead ? direction : undefined} className="min-w-0">
      <Tabs.Root
        value={value}
        onValueChange={(next: string) => {
          setDirection(index(next) > index(value) ? 'forward' : 'backward');
          setValue(next);
        }}
      >
        <Tabs.List aria-label={lead ? 'Workspace views, proposal' : 'Workspace views, today'}>
          {views.map((view) => (
            <Tabs.Tab key={view.value} value={view.value}>
              {view.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {views.map((view) => (
          <Tabs.Panel key={view.value} value={view.value}>
            <p className="type-caption text-muted">{view.label} view.</p>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}

function TabsLead() {
  return (
    <Study
      gate="CR8"
      title="How does the selection line travel?"
      look="Go from Overview to Settings and back. Today the line slides as one block. In the proposal its leading end moves on the Slide role and its trailing end on Reveal, so it stretches toward the new tab and closes behind. Nothing overshoots, and reduced motion stays instant."
    >
      <Option name="Today · Block slide" note="Both ends on Slide.">
        <LeadTabs lead={false} />
      </Option>
      <Option
        name="Proposal · Leading line"
        note="Slide leads because it is the shorter role; the plan named them the other way. Left to right only here."
      >
        <LeadTabs lead />
      </Option>
    </Study>
  );
}

/* CR10 — a finished Progress seats into its well. */
function SeatProgress({ seat }: { seat?: 'seat' | 'flush' }) {
  const [value, setValue] = useState(68);
  const done = value === 100;
  return (
    <div data-cr-seat={seat} className="flex w-full min-w-0 flex-col gap-3">
      <Progress label="Upload files" value={value} />
      <div>
        <Button variant="quiet" size="small" onClick={() => setValue(done ? 68 : 100)}>
          {done ? 'Back to 68%' : 'Finish upload'}
        </Button>
      </div>
    </div>
  );
}

function ProgressSeat() {
  return (
    <Study
      gate="CR10"
      title="What marks a finished Progress?"
      look="Finish each upload. Today 100% looks like 99% with a longer face. In A the face seats one contact step into its well once the reading arrives, on the Seat role. That step is one pixel and is hard to see, so B is added for comparison: at full the well’s walls and frame take the face’s ink, and the face fills its frame."
    >
      <Option name="Today · A longer face">
        <SeatProgress />
      </Option>
      <Option
        name="A · Seated at full"
        note="The plan’s lean: depth.contact, once, after the Slide."
      >
        <SeatProgress seat="seat" />
      </Option>
      <Option name="B · Flush with its frame" note="Not in the plan. Added because A barely reads.">
        <SeatProgress seat="flush" />
      </Option>
    </Study>
  );
}

/** One Quiet instrument island, like the gallery, holding the six comparisons. */
export function ComponentReviewStudies() {
  const { theme, resolved } = useFinish();
  const serverRender = useSyncExternalStore(
    noop,
    () => false,
    () => true,
  );
  return (
    <div
      {...finish(theme, resolved)}
      data-study="quiet-instrument"
      suppressHydrationWarning
      className="study cr-studies flex min-w-0 flex-col gap-10 text-default"
    >
      {serverRender ? <script dangerouslySetInnerHTML={{ __html: islandModeScript }} /> : null}
      <header className="flex max-w-2xl flex-col gap-2">
        <p className="font-mono type-caption text-muted">Component review · wave 2 · private</p>
        <h1 className="type-title">Studies to choose from</h1>
        <p className="type-body text-muted">
          Six comparisons for the gates marked “study first”. Each shows today’s part beside the
          proposal, built only on this page. Nothing here is published or approved.
        </p>
      </header>
      <LoadingMarks />
      <ButtonResult />
      <HoldToApprove />
      <SwitchDrag />
      <TabsLead />
      <ProgressSeat />
    </div>
  );
}
