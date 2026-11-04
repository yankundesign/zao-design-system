'use client';

import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Folder } from 'iconoir-react';
import {
  ApprovalGate,
  Button,
  Card,
  Composer,
  ComposerContextChip,
  Menu,
  Plan,
  Switch,
  Tabs,
} from '@zao/react';
import type {
  ApprovalDecision,
  ComposerAttachment,
  ComposerDraft,
  PlanStepStatus,
} from '@zao/react';
import { StorageRingStudy } from '../storage-ring-study';

export interface PlateDefinition {
  id: string;
  name: string;
  /** The one input the plate is about, as bencho.dev files its blocks. */
  verb: string;
  note: string;
  Demo: ComponentType;
  /** Plates whose motion is an arrival play it again the first time they scroll into view. */
  replayOnView?: boolean;
  /** Plates with a popup below them sit high on the stage so the popup stays inside. */
  align?: 'center' | 'start';
}

/** Runs a fixed host timeline once per mount; every simulated reply is local to the plate. */
function useTimeline(steps: readonly (readonly [number, () => void])[]) {
  const timeline = useRef(steps);
  useEffect(() => {
    const timers = timeline.current.map(([at, run]) => window.setTimeout(run, at));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
}

/** Host replies wait on timers the plate clears when it remounts or unmounts. */
function useHostDelay() {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);
  return (ms: number) =>
    new Promise<void>((resolve) => {
      timers.current.push(window.setTimeout(resolve, ms));
    });
}

function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="secondary" size="large">
        Save draft
      </Button>
      <Button size="large">Approve 3 changes</Button>
    </div>
  );
}

function SwitchDemo() {
  return (
    <Card className="gallery-demo">
      <form aria-labelledby="gallery-switch-heading" className="flex flex-col">
        <div className="flex items-baseline justify-between gap-3 pb-4">
          <h3 id="gallery-switch-heading" className="type-label font-medium">
            Notifications
          </h3>
          <span className="type-caption text-muted">North workspace</span>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 border-y border-subtle py-3">
          <span className="type-body">Email updates</span>
          <Switch aria-label="Email updates" defaultChecked />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-subtle py-3">
          <span className="type-body">Activity alerts</span>
          <Switch aria-label="Activity alerts" />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4 pt-3">
          <span className="type-body">Weekly digest</span>
          <Switch aria-label="Weekly digest" defaultChecked />
        </label>
      </form>
    </Card>
  );
}

const views = [
  { value: 'overview', label: 'Overview', text: '12 members are active this week.' },
  { value: 'activity', label: 'Activity', text: 'Three settings changed today.' },
  { value: 'members', label: 'Members', text: '2 invitations are waiting.' },
] as const;

const ranges = [
  { value: 'day', label: 'Day', reading: '1,084 requests' },
  { value: 'week', label: 'Week', reading: '6,912 requests' },
  { value: 'month', label: 'Month', reading: '28,406 requests' },
] as const;

function TabsDemo() {
  return (
    <div className="gallery-demo flex flex-col gap-8">
      <Tabs.Root defaultValue="overview">
        <Tabs.List aria-label="Workspace views">
          {views.map((view) => (
            <Tabs.Tab key={view.value} value={view.value}>
              {view.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {views.map((view) => (
          <Tabs.Panel key={view.value} value={view.value} aria-label={view.label}>
            <p className="pt-3 type-body text-muted">{view.text}</p>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
      <Tabs.Root defaultValue="day">
        <Tabs.List variant="secondary" aria-label="Range">
          {ranges.map((range) => (
            <Tabs.Tab key={range.value} value={range.value}>
              {range.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {ranges.map((range) => (
          <Tabs.Panel key={range.value} value={range.value} aria-label={range.label}>
            <p className="pt-3 type-caption figures-tabular text-muted">{range.reading}</p>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}

function MenuDemo() {
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <Menu
        trigger="Workspace actions"
        items={[
          { label: 'Rename workspace', onSelect: () => setResult('Renamed workspace.') },
          { label: 'Copy workspace ID', onSelect: () => setResult('Copied workspace ID.') },
          { separator: true },
          { label: 'Archive workspace', disabled: true },
        ]}
      />
      <p className="type-caption text-muted" aria-live="polite">
        {result ?? 'Choose an action.'}
      </p>
    </div>
  );
}

function ComposerDemo() {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [responding, setResponding] = useState(false);
  const [context, setContext] = useState(true);
  const nextId = useRef(0);
  const delay = useHostDelay();

  async function send(draft: ComposerDraft) {
    await delay(700);
    // The host clears the draft only once it accepts the request.
    setValue((current) => (current === draft.text ? '' : current));
    const accepted = new Set(draft.attachments.map((attachment) => attachment.id));
    setAttachments((current) => current.filter((attachment) => !accepted.has(attachment.id)));
    setResponding(true);
    await delay(2000);
    setResponding(false);
  }

  return (
    <Composer
      className="gallery-demo"
      label="Request"
      value={value}
      onValueChange={setValue}
      onSend={send}
      placeholder="Write a request…"
      attachments={attachments}
      onFilesSelect={(files) =>
        setAttachments((current) => [
          ...current,
          ...files.map((file) => ({ id: `gallery-file-${nextId.current++}`, file })),
        ])
      }
      onRemoveAttachment={(id) =>
        setAttachments((current) => current.filter((attachment) => attachment.id !== id))
      }
      responding={responding}
      onStop={async () => {
        await delay(500);
        setResponding(false);
      }}
      context={
        context ? (
          <ul aria-label="Included context" className="flex min-w-0 flex-wrap gap-1.5">
            <li className="min-w-0">
              <ComposerContextChip
                label="North workspace"
                icon={Folder}
                onRemove={() => setContext(false)}
              />
            </li>
          </ul>
        ) : undefined
      }
    />
  );
}

const planSteps = [
  { title: 'Read seat assignments', detail: 'North workspace · 412 seats' },
  { title: 'Prepare the removal list', detail: '38 seats · 6 owners' },
  { title: 'Review the decision', detail: 'Return unused licenses' },
  { title: 'Notify workspace owners', detail: '6 owners get an email' },
] as const;

const planRun: readonly (readonly [number, readonly PlanStepStatus[]])[] = [
  [900, ['running', 'planned', 'planned', 'planned']],
  [1900, ['done', 'running', 'planned', 'planned']],
  [2900, ['done', 'done', 'waiting', 'planned']],
  [4200, ['done', 'done', 'done', 'running']],
  [5200, ['done', 'done', 'done', 'done']],
];

function PlanDemo() {
  const [statuses, setStatuses] = useState<readonly PlanStepStatus[]>(
    planSteps.map(() => 'planned'),
  );
  useTimeline(planRun.map(([at, next]) => [at, () => setStatuses(next)] as const));
  return (
    <Plan.Root className="gallery-demo" label="Remove inactive seats" entering announce={false}>
      {planSteps.map((step, index) => (
        <Plan.Step
          key={step.title}
          title={step.title}
          detail={step.detail}
          status={statuses[index]!}
        />
      ))}
    </Plan.Root>
  );
}

function ApprovalDemo() {
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [pending, setPending] = useState(false);
  const delay = useHostDelay();

  async function decide(kind: ApprovalDecision['kind']) {
    if (pending) return;
    setPending(true);
    await delay(900);
    setDecision({ kind, by: 'YK', at: 'Oct 31 · 10:42' });
    setPending(false);
  }

  return (
    <ApprovalGate
      className="gallery-demo"
      title="Remove 38 seats"
      reference="REQ-2291"
      facts={[
        { label: 'Seats', value: '38 inactive since Jul 15' },
        { label: 'Owners', value: '6 get an email' },
      ]}
      approveLabel="Approve removal"
      approvedLabel="Approved removal"
      declineLabel="Decline"
      declinedLabel="Declined removal"
      mark="准"
      decision={decision}
      pending={pending}
      onApprove={() => decide('approved')}
      onDecline={() => decide('declined')}
    />
  );
}

function RingDemo() {
  const [drawing, setDrawing] = useState(true);
  useTimeline([[1400, () => setDrawing(false)]]);
  return (
    <Card className="gallery-demo" drawing={drawing} drawingLabel="Loading storage use">
      <StorageRingStudy drawing={drawing} />
    </Card>
  );
}

export const plates: readonly PlateDefinition[] = [
  {
    id: 'button',
    name: 'Button',
    verb: 'Press',
    note: 'The face lifts off its base on hover and seats on press. Tab brings the focus brackets in.',
    Demo: ButtonDemo,
  },
  {
    id: 'switch',
    name: 'Switch',
    verb: 'Toggle',
    note: 'One face slides in a recessed channel. A quick second press reverses it from where it is.',
    Demo: SwitchDemo,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    verb: 'Select',
    note: 'A ruled rail with seal fishtails, and a recessed track with one sliding face.',
    Demo: TabsDemo,
  },
  {
    id: 'menu',
    name: 'Menu',
    verb: 'Reveal',
    note: 'The pocket opens from the trigger’s joint; its front lip travels with the reveal.',
    Demo: MenuDemo,
    align: 'start',
  },
  {
    id: 'composer',
    name: 'Composer',
    verb: 'Type',
    note: 'Send rises when there is a draft, seats when pressed, then the same control rises as Stop.',
    Demo: ComposerDemo,
  },
  {
    id: 'plan',
    name: 'Plan',
    verb: 'Watch',
    note: 'Steps arrive drawn by a pen, one at a time; the rail fills as each one finishes.',
    Demo: PlanDemo,
    replayOnView: true,
  },
  {
    id: 'approval-gate',
    name: 'ApprovalGate',
    verb: 'Approve',
    note: 'An approval becomes a record, sealed with an impression inked in three strikes.',
    Demo: ApprovalDemo,
  },
  {
    id: 'ring',
    name: 'Storage ring',
    verb: 'Load',
    note: 'The card arrives as its drawing, then builds. Point at the ring to measure a region.',
    Demo: RingDemo,
    replayOnView: true,
  },
];
