'use client';

import { useState } from 'react';

export const meta = {
  id: 'agent-approval',
  title: 'Agent approval',
  tags: ['agent', 'approval', 'status'],
  description: 'Three proposed changes with details, tool status and a decision.',
};

const changes = [
  {
    id: 'schedule',
    title: 'Move the weekly summary',
    detail: 'Send the summary on Monday at 09:00 instead of Friday at 17:00.',
  },
  {
    id: 'members',
    title: 'Add two reviewers',
    detail: 'Give Lin Chen and Mara Wu review access to the workspace.',
  },
  {
    id: 'archive',
    title: 'Archive old reports',
    detail: 'Archive reports created before January, leaving current reports in place.',
  },
] as const;

export default function AgentApprovalSpecimen() {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <section className="flex min-w-0 flex-col gap-5 p-5 text-default">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-caption text-muted">Assistant / Proposed changes</p>
          <h2 className="type-title">Review 3 changes</h2>
        </div>
        <span className="rounded-pill border border-accent bg-accent-subtle px-2 py-1 type-caption text-accent">
          {decision === 'pending'
            ? 'Awaiting your decision'
            : decision === 'approved'
              ? 'Approved'
              : 'Rejected'}
        </span>
      </div>
      <p className="type-body text-muted">
        The assistant prepared these changes after your request. Review each detail before applying
        them.
      </p>
      <ol className="flex flex-col gap-2">
        {changes.map((change, index) => (
          <li key={change.id} className="rounded-surface border border-subtle bg-surface p-3">
            <div className="flex gap-3">
              <span className="type-code figures-tabular text-muted">{index + 1}.</span>
              <div className="min-w-0 flex-1">
                <p className="type-body font-medium">{change.title}</p>
                <details className="mt-1">
                  <summary className="min-h-7 cursor-pointer type-caption text-accent">
                    Show change details
                  </summary>
                  <p className="type-body text-muted">{change.detail}</p>
                </details>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="rounded-surface border border-subtle bg-sunken p-3">
        <p className="type-caption text-muted">Tool calls</p>
        <p className="type-body">
          <span className="text-success" aria-hidden>
            ✓
          </span>{' '}
          Read workspace settings <span className="text-muted">· complete</span>
        </p>
        <p className="type-body">
          <span className="text-warning" aria-hidden>
            ○
          </span>{' '}
          Apply changes{' '}
          <span className="text-muted">
            ·{' '}
            {decision === 'approved'
              ? 'complete'
              : decision === 'rejected'
                ? 'canceled'
                : 'waiting for approval'}
          </span>
        </p>
      </div>
      {decision === 'pending' ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDecision('approved')}
            className="h-8 rounded-action bg-accent px-3 type-label trim-label text-on-accent transition-colors duration-fast hover:bg-accent-hover"
          >
            Approve 3 changes
          </button>
          <button
            type="button"
            onClick={() => setDecision('rejected')}
            className="h-8 rounded-action border border-default bg-surface px-3 type-label trim-label transition-colors duration-base ease-standard hover:bg-hover"
          >
            Reject 3 changes
          </button>
        </div>
      ) : (
        <div
          role="status"
          className={`rounded-surface border p-3 type-body ${decision === 'approved' ? 'border-success bg-success-subtle text-success' : 'border-danger bg-danger-subtle text-danger'}`}
        >
          {decision === 'approved' ? 'Approved 3 changes' : 'Rejected 3 changes'}
          <button
            type="button"
            onClick={() => setDecision('pending')}
            className="ml-3 min-h-7 underline underline-offset-2"
          >
            Review again
          </button>
        </div>
      )}
    </section>
  );
}
