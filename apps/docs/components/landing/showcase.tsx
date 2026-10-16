'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Settings } from 'iconoir-react';
import {
  Button,
  Card,
  Composer,
  Conversation,
  IconButton,
  Menu,
  Message,
  Progress,
  Switch,
  Table,
  Tabs,
} from '@zao/react';
import type { ComposerDraft } from '@zao/react';
import { StorageRingStudy } from '../storage-ring-study';
import { RequestStatus, requests } from '../table-specimen';
import type { RequestRecord } from '../table-specimen';

/** The published components this window is built from. "Show parts" names each one. */
export const showcaseParts = [
  'Tabs',
  'Menu',
  'IconButton',
  'Card',
  'Progress',
  'Switch',
  'Table',
  'Button',
  'Conversation',
  'Message',
  'Composer',
] as const;
type PartName = (typeof showcaseParts)[number];

type View = 'overview' | 'requests' | 'members' | 'settings';
type Status = RequestRecord['status'];
type Line = { id: string; kind: 'user' | 'assistant'; text: string };

const SEATS = { used: 48, total: 60 };
const members = [
  { name: 'Lin Chen', role: 'Owner', requests: 2 },
  { name: 'Mara Wu', role: 'Admin', requests: 2 },
  { name: 'Noah Park', role: 'Member', requests: 1 },
  { name: 'Iris Hale', role: 'Member', requests: 1 },
] as const;

const initialStatuses = (): Record<string, Status> =>
  Object.fromEntries(requests.map((request) => [request.id, request.status]));

const opening: Line[] = [
  { id: 'storage', kind: 'user', text: 'How much storage is North using?' },
  {
    id: 'storage-answer',
    kind: 'assistant',
    text: '340 of 500 GB, or 68%. Photos are the largest category.',
  },
  { id: 'question', kind: 'user', text: 'What needs my attention today?' },
  {
    id: 'summary',
    kind: 'assistant',
    text: 'Two requests need review: Policy update (8 items) and Storage audit (52 items). Archive export is still blocked.',
  },
];

/** One component in the window. With "Show parts" on, it is outlined and named. */
function Part({
  name,
  className = '',
  children,
}: {
  name: PartName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-showcase-part={name} className={`landing-part min-w-0 ${className}`}>
      {children}
      <span className="landing-part-label font-mono type-caption" aria-hidden="true">
        {name}
      </span>
    </div>
  );
}

/** North's mark: a north arrow, half filled as on a survey drawing, in a hairline frame. */
function NorthMark() {
  return (
    <svg
      className="landing-window-mark h-8 w-8 shrink-0"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="landing-window-mark-frame" x="0.5" y="0.5" width="31" height="31" />
      <path className="landing-window-mark-fill" d="M16 6 L11 20 L16 17.5 Z" />
      <path className="landing-window-mark-line" d="M16 6 L21 20 L16 17.5 M16 17.5 V26" />
    </svg>
  );
}

function RequestsTable({
  statuses,
  owners = false,
}: {
  statuses: Record<string, Status>;
  owners?: boolean;
}) {
  return (
    <Table.Root aria-label="North requests">
      <Table.Header>
        <Table.Row>
          <Table.Head className="w-full">Request</Table.Head>
          <Table.Head className="whitespace-nowrap">ID</Table.Head>
          {owners ? <Table.Head className="whitespace-nowrap">Owner</Table.Head> : null}
          <Table.Head numeric className="whitespace-nowrap">
            Items
          </Table.Head>
          <Table.Head className="whitespace-nowrap">Status</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {requests.map((request) => (
          <Table.Row key={request.id}>
            <Table.Head scope="row" className="whitespace-nowrap font-medium">
              {request.name}
            </Table.Head>
            <Table.Cell className="whitespace-nowrap type-code figures-id text-muted">
              {request.id}
            </Table.Cell>
            {owners ? (
              <Table.Cell className="whitespace-nowrap text-muted">{request.owner}</Table.Cell>
            ) : null}
            <Table.Cell numeric className="whitespace-nowrap">
              {request.items.toLocaleString('en-US')}
            </Table.Cell>
            <Table.Cell className="whitespace-nowrap" data-request-status={request.id}>
              <RequestStatus status={statuses[request.id]!} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

/**
 * The hero's working window, in the page's own mode (L9): a North workspace built only from ZAO
 * parts, with an assistant that can approve the requests waiting for review. Sample data, local
 * only. The hero shows it whole (Built) or taken apart into its layers (Parts).
 */
export function ShowcaseWindow({
  style,
  scale,
  resetRef,
}: {
  style: CSSProperties;
  scale: number;
  /** Lets the hero offer "Reset example" outside the window. */
  resetRef?: { current: (() => void) | null };
}) {
  const [view, setView] = useState<View>('overview');
  const [statuses, setStatuses] = useState(initialStatuses);
  const [lines, setLines] = useState<Line[]>(opening);
  const [draft, setDraft] = useState('');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const nextId = useRef(0);
  const panels = useRef<HTMLDivElement>(null);
  const overview = useRef<HTMLDivElement>(null);

  // Other views take the overview's height, so switching tabs never resizes the window. A hidden
  // overview measures zero; the last height it had is kept.
  useLayoutEffect(() => {
    const node = overview.current;
    if (!node) return;
    const setOverviewHeight = (height: number) => {
      if (height > 0) panels.current?.style.setProperty('--overview-height', `${height}px`);
    };
    setOverviewHeight(node.getBoundingClientRect().height);
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize[0]?.blockSize ?? 0;
      setOverviewHeight(height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const waiting = requests.filter((request) => statuses[request.id] === 'Needs review');
  const open = requests.filter((request) => statuses[request.id] !== 'Ready').length;
  const approved = requests.filter(
    (request) => request.status === 'Needs review' && statuses[request.id] === 'Ready',
  );

  function reply(text: string, user?: string) {
    const id = nextId.current++;
    setLines((current) => [
      ...current,
      ...(user ? [{ id: `user-${id}`, kind: 'user' as const, text: user }] : []),
      { id: `assistant-${id}`, kind: 'assistant', text },
    ]);
    setAnnouncement(text);
  }

  function approve(user?: string) {
    const names = waiting.map((request) => request.name).join(' and ');
    setStatuses((current) => {
      const next = { ...current };
      for (const request of waiting) next[request.id] = 'Ready';
      return next;
    });
    reply(`Approved ${waiting.length} requests. ${names} are now Ready.`, user);
  }

  function reopen() {
    setStatuses((current) => {
      const next = { ...current };
      for (const request of approved) next[request.id] = 'Needs review';
      return next;
    });
    reply(`Reopened ${approved.length} requests. They need review again.`);
  }

  function send({ text }: ComposerDraft) {
    const request = text.trim() || 'Review the workspace.';
    setDraft('');
    if (waiting.length > 0 && /approve/i.test(request)) {
      approve(request);
      return;
    }
    reply(
      waiting.length > 0
        ? `This preview answers from local sample data. Ask me to approve the ${waiting.length} requests that need review.`
        : 'This preview answers from local sample data. Every request is Ready or running, except Archive export, which is blocked.',
      request,
    );
  }

  function reset() {
    setStatuses(initialStatuses());
    setLines(opening);
    setDraft('');
    setView('overview');
    setAnnouncement('Reset the example workspace.');
  }
  if (resetRef) resetRef.current = reset;

  return (
    <div
      role="group"
      aria-label="North workspace example"
      data-landing-window=""
      data-depth-scale={scale}
      className="landing-window card-shaded-construction card-material border bg-surface"
      style={style}
    >
      <Tabs.Root
        value={view}
        onValueChange={(value) => setView(value as View)}
        className="flex min-w-0 flex-1 flex-col"
      >
        {/* Oct 15, header A: who this is (kind over name, a mark) and how it stands. */}
        <div className="landing-window-bar">
          <div className="landing-window-identity flex min-w-0 items-center gap-3">
            <NorthMark />
            <div className="flex min-w-0 flex-col">
              <span className="font-mono type-caption figures-id text-muted whitespace-nowrap">
                Workspace · 001
              </span>
              <span className="type-label font-medium whitespace-nowrap">North</span>
            </div>
          </div>
          <dl
            className="landing-window-readings font-mono type-caption"
            aria-label="North readings"
          >
            <div>
              <dt>Members</dt>
              <dd className="figures-tabular">{SEATS.used}</dd>
            </div>
            <div>
              <dt>Open</dt>
              <dd className="figures-tabular">{open}</dd>
            </div>
            <div>
              <dt>Synced</dt>
              <dd className="figures-tabular">09:41</dd>
            </div>
          </dl>
          <div className="landing-window-actions flex items-center gap-2">
            <Part name="Menu" className="inline-flex">
              <Menu
                trigger="View"
                size="small"
                items={[
                  { label: 'All requests', onSelect: () => setView('requests') },
                  { label: 'Members', onSelect: () => setView('members') },
                  { separator: true },
                  { label: 'Reset example', onSelect: reset },
                ]}
              />
            </Part>
            <Part name="IconButton" className="inline-flex">
              <IconButton
                icon={Settings}
                aria-label="Workspace settings"
                variant="quiet"
                size="small"
                onClick={() => setView('settings')}
              />
            </Part>
          </div>
        </div>

        <div className="landing-window-body">
          {/* Oct 15, top nav A: the rail runs the width of the main column and meets the
              assistant's heading rule on one line. */}
          <Part name="Tabs" className="landing-window-tabs">
            <Tabs.List aria-label="Workspace views">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="requests">
                Requests
                <span className="border-l border-subtle pl-2 type-caption figures-tabular">
                  {waiting.length}
                </span>
              </Tabs.Tab>
              <Tabs.Tab value="members">Members</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
          </Part>
          <div ref={panels} className="landing-window-panels">
            <Tabs.Panel ref={overview} value="overview" aria-label="Overview" keepMounted>
              <div className="flex min-w-0 flex-col gap-4">
                <div className="landing-window-cards grid min-w-0 gap-4">
                  <Part name="Card" className="flex">
                    <Card className="flex w-full min-w-0 flex-col gap-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="type-heading">Storage</h3>
                        <span className="type-caption figures-tabular text-muted">
                          340 of 500 GB
                        </span>
                      </div>
                      <StorageRingStudy />
                    </Card>
                  </Part>
                  <Card className="flex min-w-0 flex-col gap-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="type-heading">Seats</h3>
                      <span className="type-caption figures-tabular text-muted">
                        {SEATS.total - SEATS.used} open
                      </span>
                    </div>
                    <Part name="Progress">
                      <Progress label="Seats in use" value={SEATS.used} max={SEATS.total} />
                    </Part>
                    {/* Oct 15, cards A: dotted leaders join each reading to its value. */}
                    <dl className="docs-leaders flex flex-col gap-2 type-caption">
                      {[
                        ['Seats used', `${SEATS.used} of ${SEATS.total}`],
                        ['Active today', '12 members'],
                        ['Invitations pending', '3'],
                      ].map(([term, value]) => (
                        <div key={term} className="flex items-baseline justify-between">
                          <dt className="text-muted">{term}</dt>
                          <dd className="figures-tabular">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="docs-rule-capped mt-auto flex flex-col gap-3 pt-3">
                      <Part name="Switch">
                        <label className="flex min-h-6 cursor-pointer items-center justify-between gap-4">
                          <span className="type-body">Email updates</span>
                          <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
                        </label>
                      </Part>
                      <p className="type-caption text-muted">
                        {emailUpdates
                          ? 'Members get a summary when a request changes.'
                          : 'Members check requests here.'}
                      </p>
                    </div>
                  </Card>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <h3 className="type-heading">Requests</h3>
                  <Part name="Table">
                    <RequestsTable statuses={statuses} />
                  </Part>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="requests" aria-label="Requests" keepMounted>
              <div className="flex min-w-0 flex-col gap-3">
                <h3 className="type-heading">All requests</h3>
                <RequestsTable statuses={statuses} owners />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="members" aria-label="Members" keepMounted>
              <div className="flex min-w-0 flex-col gap-3">
                <h3 className="type-heading">Members</h3>
                <Table.Root aria-label="North members">
                  <Table.Header>
                    <Table.Row>
                      <Table.Head className="w-full">Name</Table.Head>
                      <Table.Head className="whitespace-nowrap">Role</Table.Head>
                      <Table.Head numeric className="whitespace-nowrap">
                        Requests
                      </Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {members.map((member) => (
                      <Table.Row key={member.name}>
                        <Table.Head scope="row" className="whitespace-nowrap font-medium">
                          {member.name}
                        </Table.Head>
                        <Table.Cell className="whitespace-nowrap text-muted">
                          {member.role}
                        </Table.Cell>
                        <Table.Cell numeric className="whitespace-nowrap">
                          {member.requests}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="settings" aria-label="Settings" keepMounted>
              <div className="flex max-w-xl min-w-0 flex-col gap-4">
                <h3 className="type-heading">Settings</h3>
                {[
                  {
                    label: 'Email updates',
                    detail: 'A summary when a request changes.',
                    checked: emailUpdates,
                    set: setEmailUpdates,
                  },
                  {
                    label: 'Weekly summary',
                    detail: 'Storage, seats and requests every Monday.',
                    checked: weeklySummary,
                    set: setWeeklySummary,
                  },
                ].map((setting) => (
                  <label
                    key={setting.label}
                    className="flex cursor-pointer items-center justify-between gap-4 border-t border-subtle pt-3"
                  >
                    <span className="flex flex-col gap-1">
                      <span className="type-body">{setting.label}</span>
                      <span className="type-caption text-muted">{setting.detail}</span>
                    </span>
                    <Switch checked={setting.checked} onCheckedChange={setting.set} />
                  </label>
                ))}
              </div>
            </Tabs.Panel>
          </div>

          <aside className="landing-window-assistant" aria-label="Assistant">
            <div className="landing-window-assistant-head flex items-center justify-between gap-2 px-3">
              <h3 className="type-label font-medium">Assistant</h3>
              <span className="type-caption text-muted">Sample data</span>
            </div>
            {/* Oct 15, side panel C: a faint fen field as the ground, and the Composer seated
                in a well. */}
            <div className="landing-window-assistant-body">
              <Part name="Conversation" className="landing-window-conversation">
                <Conversation.Root aria-label="Assistant conversation" announcement={announcement}>
                  <Conversation.Viewport className="landing-window-viewport">
                    <Conversation.List>
                      {lines.map((line) => (
                        <Conversation.Item key={line.id}>
                          {line.id === 'summary' ? (
                            <Part name="Message">
                              <Message.Root author="Assistant" kind="assistant">
                                <Message.Content>
                                  <p className="type-body">{line.text}</p>
                                </Message.Content>
                                {waiting.length > 0 || approved.length > 0 ? (
                                  <Message.Actions>
                                    {/* One Button that changes its action, so focus stays on it. */}
                                    <Part name="Button" className="inline-flex">
                                      <Button
                                        size="small"
                                        variant={waiting.length > 0 ? 'primary' : 'secondary'}
                                        onClick={() => (waiting.length > 0 ? approve() : reopen())}
                                      >
                                        {waiting.length > 0
                                          ? `Approve ${waiting.length} requests`
                                          : `Reopen ${approved.length} requests`}
                                      </Button>
                                    </Part>
                                  </Message.Actions>
                                ) : null}
                              </Message.Root>
                            </Part>
                          ) : (
                            <Message.Root
                              author={line.kind === 'user' ? 'You' : 'Assistant'}
                              kind={line.kind}
                            >
                              <Message.Content>
                                <p className="type-body">{line.text}</p>
                              </Message.Content>
                            </Message.Root>
                          )}
                        </Conversation.Item>
                      ))}
                    </Conversation.List>
                  </Conversation.Viewport>
                  <Conversation.Latest />
                </Conversation.Root>
              </Part>
              <div className="landing-window-dock construction-well p-3">
                <Part name="Composer">
                  <Composer
                    label="Message the assistant"
                    value={draft}
                    onValueChange={setDraft}
                    onSend={send}
                    placeholder={
                      waiting.length > 0 ? 'Approve the waiting requests…' : 'Ask about North…'
                    }
                  />
                </Part>
              </div>
            </div>
          </aside>
        </div>
      </Tabs.Root>
    </div>
  );
}
