'use client';

import { useState } from 'react';
import { ApprovalGate, Button } from '@zao/react';
import type { ApprovalDecision } from '@zao/react';

/**
 * Hold to approve (component review, CR18): a destructive approval is held for one Hold beat,
 * or confirmed in a Dialog. The host still hears of one approval.
 */
export function ApprovalGateHoldSpecimen() {
  const [held, setHeld] = useState<ApprovalDecision | null>(null);
  const [confirmed, setConfirmed] = useState<ApprovalDecision | null>(null);
  const decide = (kind: ApprovalDecision['kind']): ApprovalDecision => ({
    kind,
    by: 'YK',
    at: 'Nov 14 · 09:12',
  });
  const request = {
    title: 'Delete North workspace',
    reference: 'REQ-2304',
    facts: [
      { label: 'Members', value: '14 lose access' },
      { label: 'Files', value: '2,310 are deleted' },
    ],
    note: 'This cannot be undone.',
    approveLabel: 'Delete workspace',
    approvedLabel: 'Deleted workspace',
    declineLabel: 'Keep workspace',
    declinedLabel: 'Kept workspace',
    mark: '准',
  };

  return (
    <div data-zao-specimen="approval-gate-hold" className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-label font-medium">Confirming a destructive approval</p>
        <Button
          variant="quiet"
          size="small"
          disabled={!held && !confirmed}
          onClick={() => {
            setHeld(null);
            setConfirmed(null);
          }}
        >
          Reset both
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="type-caption text-muted">
            Hold. Press and hold the action with the pointer, Space or Enter.
          </p>
          <ApprovalGate
            {...request}
            confirm="hold"
            holdLabel="Hold to delete workspace"
            decision={held}
            onApprove={() => setHeld(decide('approved'))}
            onDecline={() => setHeld(decide('declined'))}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="type-caption text-muted">
            Dialog. A press asks once more. A hold falls back to this with reduced motion.
          </p>
          <ApprovalGate
            {...request}
            confirm="dialog"
            decision={confirmed}
            onApprove={() => setConfirmed(decide('approved'))}
            onDecline={() => setConfirmed(decide('declined'))}
          />
        </div>
      </div>
    </div>
  );
}
