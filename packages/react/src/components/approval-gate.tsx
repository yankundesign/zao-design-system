'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from 'react';
import { Button } from './button.js';
import { Card } from './card.js';
import { Dialog } from './dialog.js';

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
  /**
   * How the primary action is confirmed. Omit it for one press. With `hold`, the action must be
   * held for one Hold beat with the pointer, Space or Enter; releasing early cancels. With
   * `dialog`, a press opens a confirming Dialog. A hold also falls back to the Dialog with
   * reduced motion, and for an activation that cannot be held, such as one from a screen reader.
   */
  confirm?: 'hold' | 'dialog';
  /** The held action's visible label, such as "Hold to remove 14 seats". Defaults to `approveLabel`. */
  holdLabel?: string;
  /** The confirming Dialog's action that changes nothing. */
  cancelLabel?: string;
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
  confirm,
  holdLabel,
  cancelLabel = 'Cancel',
  onApprove,
  onDecline,
  className,
  ...props
}: ApprovalGateProps) {
  const hintId = useId();
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

  // Hold to approve (CR18). The hold is input, not state: the host still learns of one approval.
  const root = useRef<HTMLDivElement>(null);
  const [hold, setHold] = useState<'idle' | 'holding' | 'held'>('idle');
  const [confirming, setConfirming] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const holdStarted = useRef(false);
  const available = !disabled && !pending && !decided;

  useEffect(
    () => () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    },
    [],
  );

  // A decision unmounts the held action before its release arrives, so start each request clean.
  useEffect(() => {
    if (!decided) holdStarted.current = false;
  }, [decided]);

  // A completed hold keeps the seal full while the host works; if nothing comes of it, it clears.
  useEffect(() => {
    if (hold !== 'held' || pending || decided) return;
    const timer = window.setTimeout(() => setHold('idle'), 0);
    return () => window.clearTimeout(timer);
  }, [hold, pending, decided]);

  function startHold() {
    if (!available || holdTimer.current !== null) return;
    holdStarted.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setConfirming(true);
      return;
    }
    const value = getComputedStyle(root.current ?? document.body)
      .getPropertyValue('--zao-motion-duration-hold')
      .trim();
    const amount = Number.parseFloat(value);
    const beat = !Number.isFinite(amount) ? 0 : value.endsWith('ms') ? amount : amount * 1000;
    setHold('holding');
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setHold('held');
      onApprove();
    }, beat);
  }

  function releaseHold() {
    // The click that follows a release reads the flag before this clears it.
    window.setTimeout(() => {
      holdStarted.current = false;
    }, 0);
    if (holdTimer.current === null) return;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHold('idle');
  }

  const holdKey = (event: KeyboardEvent) => event.key === ' ' || event.key === 'Enter';
  const approve =
    confirm === 'hold' ? (
      <span
        className="approval-gate-hold"
        onPointerDown={(event) => {
          if (event.isPrimary && event.button === 0) startHold();
        }}
        onPointerUp={releaseHold}
        onPointerLeave={releaseHold}
        onPointerCancel={releaseHold}
        onKeyDown={(event) => {
          if (holdKey(event) && !event.repeat) startHold();
        }}
        onKeyUp={(event) => {
          if (holdKey(event)) releaseHold();
        }}
        onBlur={releaseHold}
        onContextMenu={(event) => event.preventDefault()}
      >
        <Button
          variant="primary"
          disabled={disabled}
          loading={pending}
          loadingAnnouncement={approveLabel}
          aria-describedby={`${hintId}`}
          onClick={() => {
            // An activation with no hold behind it (a screen reader's, say) is confirmed instead.
            if (!holdStarted.current && available) setConfirming(true);
          }}
        >
          {holdLabel ?? approveLabel}
        </Button>
      </span>
    ) : (
      <Button
        variant="primary"
        disabled={disabled}
        loading={pending}
        loadingAnnouncement={approveLabel}
        onClick={confirm === 'dialog' ? () => setConfirming(true) : onApprove}
      >
        {approveLabel}
      </Button>
    );

  return (
    <div {...props} ref={root} data-zao-component="approval-gate" className={className}>
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
          data-zao-holding={hold === 'holding' ? '' : undefined}
          data-zao-held={hold === 'held' ? '' : undefined}
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
                {approve}
                {confirm === 'hold' ? (
                  // The seal's place is drawn before the decision; holding fills it.
                  <span
                    data-zao-slot="seal-well"
                    aria-hidden="true"
                    className="approval-gate-seal-well"
                  >
                    {/* Not the record's impression: this one is only the drawing being filled. */}
                    <span className="approval-gate-impression approval-gate-seal-fill">
                      <span>{mark}</span>
                    </span>
                  </span>
                ) : null}
              </span>
            </>
          )}
        </div>
      </Card>
      {confirm === 'hold' ? (
        <p id={hintId} className="sr-only">
          Press and hold to approve. Release to cancel.
        </p>
      ) : null}
      {confirm ? (
        <Dialog.Root open={confirming} onOpenChange={setConfirming}>
          <Dialog.Portal container={root}>
            <Dialog.Backdrop />
            <Dialog.Viewport>
              <Dialog.Popup>
                <div className="flex flex-col gap-3">
                  <Dialog.Title>{approveLabel}?</Dialog.Title>
                  {note ? <Dialog.Description>{note}</Dialog.Description> : null}
                  <Dialog.Actions note={reference}>
                    <Dialog.Close>{cancelLabel}</Dialog.Close>
                    <Dialog.Close variant="primary" onClick={onApprove}>
                      {approveLabel}
                    </Dialog.Close>
                  </Dialog.Actions>
                </div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
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
