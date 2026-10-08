'use client';

import { forwardRef, useEffect, useId, useRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useConversationAnnouncement } from './conversation.js';

export type MessageKind = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'stopped' | 'error';

export interface MessageRootProps extends ComponentPropsWithoutRef<'article'> {
  /** Visible authorship, also used as the message's accessible name. */
  author: string;
  /** User requests use a restrained surface; assistant responses stay on the open canvas. */
  kind: MessageKind;
  /** Supporting information, such as a time or source count. */
  metadata?: ReactNode;
  /** The host owns response progress and retains partial content when stopped or failed. */
  status?: MessageStatus;
  /** Visible recovery guidance for a failed message. */
  error?: ReactNode;
}

export type MessageContentProps = ComponentPropsWithoutRef<'div'>;
export type MessageActionsProps = ComponentPropsWithoutRef<'div'>;

function classes(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

const statusLabels: Record<MessageStatus, string | null> = {
  complete: null,
  streaming: 'Responding',
  stopped: 'Stopped',
  error: 'Response failed',
};

const Root = forwardRef<HTMLElement, MessageRootProps>(function MessageRoot(
  {
    author,
    kind,
    metadata,
    status = 'complete',
    error,
    className,
    children,
    'aria-labelledby': labelledBy,
    ...props
  },
  ref,
) {
  const authorId = useId();
  const announce = useConversationAnnouncement();
  const previousStatus = useRef(status);
  const mounted = useRef(false);

  useEffect(() => {
    const changed = previousStatus.current !== status;
    const initialStreaming = !mounted.current && status === 'streaming';
    previousStatus.current = status;
    mounted.current = true;
    if (!announce || (!changed && !initialStreaming)) return;

    const feedback: Record<MessageStatus, string> = {
      streaming: `${author} is responding.`,
      complete: `${author} response ready.`,
      stopped: `${author} response stopped.`,
      error: `${author} response failed. Review the message for recovery options.`,
    };
    announce(feedback[status]);
  }, [announce, author, status]);

  return (
    <article
      {...props}
      ref={ref}
      aria-labelledby={labelledBy ?? authorId}
      data-zao-component="message"
      data-zao-slot="root"
      data-zao-kind={kind}
      data-zao-status={status}
      className={classes('zao-message', className)}
    >
      <header data-zao-slot="header" className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span id={authorId} data-zao-slot="author" className="type-label font-medium text-default">
          {author}
        </span>
        {metadata ? (
          <span data-zao-slot="metadata" className="type-caption text-muted">
            {metadata}
          </span>
        ) : null}
        {statusLabels[status] ? (
          <span
            data-zao-slot="status"
            className={`type-caption ${status === 'error' ? 'text-danger' : 'text-muted'}`}
          >
            {statusLabels[status]}
          </span>
        ) : null}
      </header>
      {children}
      {error ? (
        <div data-zao-slot="error" className="type-caption text-danger">
          {error}
        </div>
      ) : null}
    </article>
  );
});

const Content = forwardRef<HTMLDivElement, MessageContentProps>(function MessageContent(
  { className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-zao-slot="content"
      className={classes('zao-message-content type-body text-default', className)}
    />
  );
});

const Actions = forwardRef<HTMLDivElement, MessageActionsProps>(function MessageActions(
  { className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-zao-slot="actions"
      className={classes('flex min-w-0 flex-wrap items-center gap-2', className)}
    />
  );
});

/** Explicit authorship and lifecycle feedback around ordinary React content and native actions. */
export const Message = { Root, Content, Actions };
