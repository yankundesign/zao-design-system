'use client';

import { useEffect, useState } from 'react';
import { ApprovalGate, Button, Conversation, Message, Plan, Switch, finish } from '@zao/react';
import type { PlanStepStatus } from '@zao/react';
import { useFinish } from './use-finish';

const initialStatuses: PlanStepStatus[] = [
  'done',
  'running',
  'waiting',
  'planned',
  'declined',
  'failed',
  'skipped',
];

export function PlanSpecimen() {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [runKey, setRunKey] = useState(0);
  const [simulation, setSimulation] = useState(false);

  useEffect(() => {
    if (!simulation) return;
    let index = 0;
    const timer = window.setInterval(() => {
      setStatuses((current) =>
        current.map((status, position) => (position === index ? 'done' : status)),
      );
      index = (index + 1) % initialStatuses.length;
    }, 700);
    return () => window.clearInterval(timer);
  }, [simulation]);

  return (
    <div className="grid min-w-0 gap-8">
      <Plan.Root label="Remove inactive seats">
        <Plan.Step
          title="Read seat assignments"
          detail="North workspace · 412 assigned seats"
          status={statuses[0]!}
        />
        <Plan.Step
          title="Prepare the removal list"
          detail="38 seats · 6 owners"
          status={statuses[1]!}
        >
          <p className="type-caption text-muted">38 seats have no sign-in since Jul 15.</p>
        </Plan.Step>
        <Plan.Step
          title="Review the decision"
          detail="Return unused licenses to the pool"
          status={statuses[2]!}
        />
        <Plan.Step
          title="Notify workspace owners"
          detail="6 owners receive an email"
          status={statuses[3]!}
        />
        <Plan.Step title="Record the declined request" status={statuses[4]!} />
        <Plan.Step title="Check the export" status={statuses[5]!} />
        <Plan.Step title="Close the run" status={statuses[6]!} />
      </Plan.Root>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setSimulation((value) => !value)}>
          {simulation ? 'Stop local simulation' : 'Local simulation'}
        </Button>
        <Button variant="secondary" onClick={() => setRunKey((value) => value + 1)}>
          Propose again
        </Button>
        <label className="flex items-center gap-2 type-caption">
          Fail step 2{' '}
          <Switch
            checked={statuses[1] === 'failed'}
            onCheckedChange={(failed) =>
              setStatuses((current) =>
                current.map((status, index) =>
                  index === 1 ? (failed ? 'failed' : 'running') : status,
                ),
              )
            }
          />
        </label>
      </div>
      <section
        className="grid gap-3 border-t border-subtle pt-4"
        aria-label="Plan inside a Conversation"
      >
        <h3 className="type-label font-medium">Inside a Conversation</h3>
        <Conversation.Root aria-label="Seat cleanup conversation" className="grid gap-3">
          <Conversation.Viewport className="max-h-96">
            <Conversation.List>
              <Conversation.Item>
                <Message.Root author="Assistant" kind="assistant">
                  <Message.Content>
                    <Plan.Root key={runKey} label="Remove inactive seats">
                      <Plan.Step
                        title="Read seat assignments"
                        detail="North workspace · 412 assigned seats"
                        status="done"
                      />
                      <Plan.Step
                        title="Prepare the removal list"
                        detail="38 seats · 6 owners"
                        status={statuses[1]!}
                      />
                      <Plan.Step
                        title="Wait for approval"
                        detail="No changes until approved"
                        status="waiting"
                      />
                    </Plan.Root>
                  </Message.Content>
                </Message.Root>
              </Conversation.Item>
            </Conversation.List>
          </Conversation.Viewport>
        </Conversation.Root>
      </section>
    </div>
  );
}

export function ApprovalGateSpecimen() {
  const [decision, setDecision] = useState<null | {
    kind: 'approved' | 'declined';
    by: string;
    at: string;
  }>(null);
  const [pending, setPending] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  function decide(kind: 'approved' | 'declined') {
    if (pending) return;
    setPending(true);
    window.setTimeout(() => {
      setDecision({ kind, by: 'YK', at: 'Oct 13 · 10:42' });
      setPending(false);
    }, 900);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          disabled={!decision && !pending}
          onClick={() => {
            setDecision(null);
            setPending(false);
            setResetKey((value) => value + 1);
          }}
        >
          Reset
        </Button>
      </div>
      <ApprovalGate
        key={resetKey}
        title="Remove 38 seats"
        reference="REQ-2291"
        facts={[
          { label: 'Seats', value: '38 with no sign-in since Jul 15' },
          { label: 'Owners', value: '6 get an email' },
          { label: 'Licenses', value: 'Return to the pool' },
        ]}
        note="Nothing changes until you approve."
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
      <div className="grid gap-4 sm:grid-cols-2">
        <ApprovalRecordSample
          seal="ink"
          decision={{ kind: 'approved', by: 'YK', at: 'Oct 13 · 10:42' }}
        />
        <ApprovalRecordSample
          seal="azurite"
          decision={{ kind: 'approved', by: 'YK', at: 'Oct 13 · 10:42' }}
        />
        <ApprovalRecordSample
          seal="ink"
          decision={{ kind: 'declined', by: 'YK', at: 'Oct 13 · 10:44' }}
        />
        <ApprovalRecordSample
          seal="azurite"
          decision={{ kind: 'declined', by: 'YK', at: 'Oct 13 · 10:44' }}
        />
      </div>
    </div>
  );
}

function ApprovalRecordSample({
  seal,
  decision,
}: {
  seal: 'ink' | 'azurite';
  decision: { kind: 'approved' | 'declined'; by: string; at: string };
}) {
  const { theme, resolved } = useFinish();
  return (
    <div {...finish(theme, resolved)} data-zao-seal={seal === 'azurite' ? 'azurite' : undefined}>
      <ApprovalGate
        title={`${seal === 'ink' ? 'Ink' : 'Azurite'} seal record`}
        approveLabel="Approve"
        approvedLabel="Approved"
        declineLabel="Decline"
        declinedLabel="Declined"
        mark="准"
        decision={decision}
        onApprove={() => {}}
        onDecline={() => {}}
      />
    </div>
  );
}
