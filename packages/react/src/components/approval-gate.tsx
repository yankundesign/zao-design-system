'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Button } from './button.js';
import { Card } from './card.js';

export interface ApprovalFact {
  label: string;
  value: ReactNode;
}

export interface ApprovalDecision {
  kind: 'approved' | 'declined';
  by: string;
  at: string;
}

export interface ApprovalGateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: string;
  reference?: string;
  facts?: ApprovalFact[];
  note?: ReactNode;
  approveLabel: string;
  approvedLabel: string;
  declineLabel: string;
  declinedLabel: string;
  /** One or two characters printed into the seal impression. */
  mark: string;
  decision: ApprovalDecision | null;
  pending?: boolean;
  disabled?: boolean;
  onApprove: () => void;
  onDecline: () => void;
}

/** A host-owned approval request that becomes an immutable decision record. */
export function ApprovalGate({
  title,
  reference,
  facts = [],
  note,
  approveLabel,
  approvedLabel,
  declineLabel,
  declinedLabel,
  mark,
  decision,
  pending = false,
  disabled = false,
  onApprove,
  onDecline,
  className,
  ...props
}: ApprovalGateProps) {
  const actions = useRef<HTMLDivElement>(null);
  const record = useRef<HTMLDivElement>(null);
  const actionsHadFocus = useRef(false);
  const previousDecision = useRef<ApprovalDecision | null>(decision);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (previousDecision.current === null && decision && actionsHadFocus.current) {
      record.current?.focus();
    }
    previousDecision.current = decision;
  }, [decision]);

  const decided = decision !== null;
  const newlyDecided = mounted && decided && previousDecision.current === null;

  return (
    <div {...props} data-zao-component="approval-gate" className={className}>
      <Card className="approval-gate-card">
        <header data-zao-slot="header" className="approval-gate-header">
          <span data-zao-slot="title" className="type-label font-medium">
            {title}
          </span>
          {reference ? (
            <span data-zao-slot="reference" className="type-caption figures-id text-muted">
              {reference}
            </span>
          ) : null}
        </header>
        {facts.length ? (
          <dl data-zao-slot="facts" className="approval-gate-facts">
            {facts.map((fact, index) => (
              <div className="approval-gate-fact" key={`${fact.label}-${index}`}>
                <dt className="type-caption text-muted">{fact.label}</dt>
                <dd className="type-caption text-default">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div
          ref={actions}
          data-zao-slot="actions"
          className="approval-gate-actions"
          onFocusCapture={() => {
            actionsHadFocus.current = true;
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              actionsHadFocus.current = false;
            }
          }}
        >
          {decided ? (
            <div
              ref={record}
              tabIndex={-1}
              role="status"
              data-zao-slot="record"
              data-zao-new={newlyDecided ? '' : undefined}
              className="approval-gate-record outline-focus"
            >
              <span data-zao-slot="record-text" className="approval-gate-record-text">
                <span className="type-label font-medium">
                  {decision.kind === 'approved' ? approvedLabel : declinedLabel}
                </span>
                <span className="type-caption figures-tabular text-muted">
                  {decision.by} · {decision.at}
                </span>
              </span>
              {decision.kind === 'approved' ? <SealImpression mark={mark} /> : null}
            </div>
          ) : (
            <>
              {note ? (
                <span data-zao-slot="note" className="type-caption text-muted">
                  {note}
                </span>
              ) : (
                <span data-zao-slot="note" />
              )}
              <span className="approval-gate-actions-buttons">
                <Button variant="secondary" disabled={disabled || pending} onClick={onDecline}>
                  {declineLabel}
                </Button>
                <Button
                  variant="primary"
                  disabled={disabled}
                  loading={pending}
                  loadingAnnouncement={approveLabel}
                  onClick={onApprove}
                >
                  {approveLabel}
                </Button>
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function SealImpression({ mark }: { mark: string }) {
  return (
    <span data-zao-slot="impression" aria-hidden="true" className="approval-gate-impression">
      <span>{mark}</span>
    </span>
  );
}
