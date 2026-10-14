'use client';

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from 'react';
import { LoadingIndicator } from './button.js';
import { useConversationAnnouncement, useConversationDidCommit } from './conversation.js';

export type PlanStepStatus =
  'planned' | 'running' | 'waiting' | 'done' | 'declined' | 'failed' | 'skipped';

export interface PlanRootProps extends ComponentPropsWithoutRef<'section'> {
  /** Visible name for the plan. */
  label: string;
  /** Override the initial arrival state, for example when restoring host history. */
  entering?: boolean;
  /** Announce changed step statuses inside a Conversation. Defaults to true. */
  announce?: boolean;
}

export interface PlanStepProps extends ComponentPropsWithoutRef<'li'> {
  title: string;
  detail?: ReactNode;
  status: PlanStepStatus;
}

interface StepInternalProps extends PlanStepProps {
  __planIndex?: number;
  __planTotal?: number;
  __planInitial?: boolean;
  __planDraw?: boolean;
}

const statusText: Record<PlanStepStatus, string> = {
  planned: 'Planned',
  running: 'Running',
  waiting: 'Needs you',
  done: 'Done',
  declined: 'Declined',
  failed: 'Failed',
  skipped: 'Skipped',
};
const PlanAnnounceContext = createContext(true);

function classes(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

const Root = forwardRef<HTMLElement, PlanRootProps>(function PlanRoot(
  { label, entering, announce = true, className, children, ...props },
  ref,
) {
  const didCommit = useConversationDidCommit();
  const [mountedAfterCommit] = useState(didCommit);
  const shouldEnter = entering ?? mountedAfterCommit;
  const id = useId();
  const steps = Children.toArray(children).filter(isValidElement);
  const [initialKeys] = useState(() => new Set(steps.map((step) => step.key)));
  const finished = steps.filter((step) => {
    const status = (step.props as PlanStepProps).status;
    return status === 'done' || status === 'declined';
  }).length;
  const pending = steps.some((step) => {
    const status = (step.props as PlanStepProps).status;
    return (
      status === 'planned' || status === 'running' || status === 'waiting' || status === 'failed'
    );
  });

  return (
    <section
      {...props}
      ref={ref}
      aria-labelledby={`${id}-label`}
      data-zao-component="plan"
      data-zao-slot="root"
      data-zao-entering={shouldEnter ? '' : undefined}
      className={classes('zao-plan min-w-0', className)}
    >
      <header data-zao-slot="header" className="zao-plan-header">
        <span id={`${id}-label`} data-zao-slot="label" className="type-label font-medium">
          {label}
        </span>
        <span data-zao-slot="summary" className="type-caption figures-tabular text-muted">
          {pending ? '' : 'Finished · '}
          {finished} of {steps.length} done
        </span>
      </header>
      <PlanAnnounceContext.Provider value={announce}>
        <ol data-zao-slot="steps" className="zao-plan-steps">
          {steps.map((child, index) => {
            const initial = initialKeys.has(child.key);
            return cloneElement(child as ReactElement<StepInternalProps>, {
              __planIndex: index,
              __planTotal: steps.length,
              __planInitial: shouldEnter && initial,
              __planDraw: !initial || shouldEnter,
            });
          })}
        </ol>
      </PlanAnnounceContext.Provider>
    </section>
  );
});

const Step = forwardRef<HTMLLIElement, StepInternalProps>(function PlanStep(
  {
    title,
    detail,
    status,
    className,
    children,
    __planIndex = 0,
    __planTotal = 1,
    __planInitial = false,
    __planDraw = false,
    ...props
  },
  ref,
) {
  const announce = useConversationAnnouncement();
  const shouldAnnounce = useContext(PlanAnnounceContext);
  const previous = useRef(status);
  const mounted = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const changed = previous.current !== status;
    previous.current = status;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (changed && shouldAnnounce && announce)
      announce(`Step ${__planIndex + 1} ${statusText[status]}.`);
  }, [announce, shouldAnnounce, __planIndex, status]);

  const drawn = __planDraw;
  return (
    <li
      {...props}
      ref={ref}
      aria-current={status === 'running' || status === 'waiting' ? 'step' : undefined}
      aria-labelledby={titleId}
      data-zao-slot="step"
      data-zao-status={status}
      data-zao-last={__planIndex === __planTotal - 1 ? '' : undefined}
      data-zao-draw={drawn ? '' : undefined}
      data-zao-plan-initial={__planInitial ? '' : undefined}
      style={
        {
          '--zao-plan-index': __planIndex,
          '--zao-plan-delay': __planInitial
            ? `calc(${__planIndex} * var(--zao-motion-duration-fast))`
            : '0ms',
          '--zao-plan-fill': status === 'done' || status === 'declined' ? '100%' : '0%',
          ...props.style,
        } as CSSProperties
      }
      className={classes('zao-plan-step', className)}
    >
      <span data-zao-slot="pen" aria-hidden="true" className="zao-plan-pen" />
      <div className="zao-plan-row">
        <span
          data-zao-slot="index"
          aria-hidden="true"
          className="zao-plan-index type-caption figures-id text-muted"
        >
          {String(__planIndex + 1).padStart(2, '0')}
        </span>
        <div className="zao-plan-copy">
          <span
            id={titleId}
            data-zao-slot="title"
            className="zao-plan-title type-label font-medium"
          >
            {title}
          </span>
          {detail ? (
            <div data-zao-slot="detail" className="zao-plan-detail type-caption text-muted">
              {detail}
            </div>
          ) : null}
        </div>
        <span data-zao-slot="status" className="zao-plan-status type-caption">
          {status === 'running' ? <LoadingIndicator /> : null}
          {statusText[status]}
        </span>
      </div>
      {children ? (
        <div data-zao-slot="body" className="zao-plan-body">
          {children}
        </div>
      ) : null}
    </li>
  );
});

export const Plan = { Root, Step };
