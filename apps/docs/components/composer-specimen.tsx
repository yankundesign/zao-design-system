'use client';

import { useEffect, useRef, useState } from 'react';
import { Database, Folder } from 'iconoir-react';
import { Composer, ComposerContextChip } from '@zao/react';
import type { ComposerAttachment, ComposerDraft } from '@zao/react';

type RequestState = 'ready' | 'accepting' | 'responding' | 'complete' | 'stopped';
const requestDelay = 750;
const sendErrorGuidance =
  'Could not send your request. Your draft is preserved. Try sending again.';

/** Controlled examples keep their request and file handling local. */
function InteractiveComposer({ sendError = false }: { sendError?: boolean }) {
  const [value, setValue] = useState(
    sendError ? 'Review this request.' : 'Summarize the attached files.',
  );
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [contextItems, setContextItems] = useState([
    { id: 'project-files', label: 'Project files', icon: Folder },
    { id: 'reference-data', label: 'Reference data', icon: Database },
  ]);
  const failNext = useRef(sendError);
  const [initialError, setInitialError] = useState(sendError);
  const [requestState, setRequestState] = useState<RequestState>('ready');
  const [stopping, setStopping] = useState(false);
  const nextAttachmentId = useRef(0);
  const acceptanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptanceResolve = useRef<(() => void) | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolve = useRef<(() => void) | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (acceptanceTimer.current !== null) clearTimeout(acceptanceTimer.current);
      acceptanceResolve.current?.();
      acceptanceResolve.current = null;
      if (stopTimer.current !== null) clearTimeout(stopTimer.current);
      stopResolve.current?.();
      stopResolve.current = null;
    };
  }, []);

  useEffect(() => {
    if (requestState !== 'responding' || stopping) return;
    const timer = setTimeout(() => {
      if (mounted.current) setRequestState('complete');
    }, 2400);
    return () => clearTimeout(timer);
  }, [requestState, stopping]);

  async function send(draft: ComposerDraft) {
    const shouldFail = failNext.current;
    setInitialError(false);
    setRequestState('accepting');
    await new Promise<void>((resolve) => {
      acceptanceResolve.current = resolve;
      acceptanceTimer.current = setTimeout(() => {
        acceptanceTimer.current = null;
        acceptanceResolve.current = null;
        resolve();
      }, requestDelay);
    });
    if (!mounted.current) return;
    if (shouldFail) {
      failNext.current = false;
      setRequestState('ready');
      throw new Error('The example request was rejected.');
    }
    // The host clears a draft only after it accepts the request.
    setValue((current) => (current === draft.text ? '' : current));
    const acceptedIds = new Set(draft.attachments.map((attachment) => attachment.id));
    setAttachments((current) => current.filter((attachment) => !acceptedIds.has(attachment.id)));
    setRequestState('responding');
  }

  async function stop() {
    setStopping(true);
    await new Promise<void>((resolve) => {
      stopResolve.current = resolve;
      stopTimer.current = setTimeout(() => {
        stopTimer.current = null;
        stopResolve.current = null;
        resolve();
      }, requestDelay);
    });
    if (!mounted.current) return;
    setRequestState('stopped');
    setStopping(false);
  }

  return (
    <Composer
      label={sendError ? 'Request with send error' : 'Request'}
      value={value}
      onValueChange={setValue}
      onSend={send}
      placeholder="Write a request…"
      error={initialError ? sendErrorGuidance : undefined}
      attachments={attachments}
      onFilesSelect={(files) => {
        setAttachments((current) => [
          ...current,
          ...files.map((file) => ({ id: `composer-file-${nextAttachmentId.current++}`, file })),
        ]);
      }}
      onRemoveAttachment={(id) => {
        setAttachments((current) => current.filter((attachment) => attachment.id !== id));
      }}
      responding={requestState === 'responding'}
      onStop={stop}
      context={
        !sendError && contextItems.length > 0 ? (
          <ul
            aria-label="Included context"
            className="flex min-w-0 flex-wrap gap-1.5 type-caption text-muted"
          >
            {contextItems.map((item) => (
              <li key={item.id} className="min-w-0">
                <ComposerContextChip
                  label={item.label}
                  icon={item.icon}
                  onRemove={() => {
                    setContextItems((current) =>
                      current.filter((contextItem) => contextItem.id !== item.id),
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        ) : undefined
      }
    />
  );
}

export function ComposerSpecimen() {
  const [emptyValue, setEmptyValue] = useState('');

  return (
    <div data-zao-specimen="composer" className="flex min-w-0 flex-col gap-4">
      <section className="flex min-w-0 flex-col gap-2" aria-label="Composer with context">
        <h3 className="type-caption text-muted">With context</h3>
        <InteractiveComposer />
      </section>

      <div className="grid min-w-0 gap-4 border-t border-subtle pt-4 lg:grid-cols-2">
        <section
          className="flex min-w-0 flex-col gap-2"
          aria-label="Empty Composer example"
          data-zao-specimen="composer-empty"
          data-zao-example="empty-composer"
        >
          <h3 className="type-caption text-muted">Empty draft</h3>
          <Composer
            label="New request"
            value={emptyValue}
            onValueChange={setEmptyValue}
            placeholder="Write a request…"
            onSend={() => setEmptyValue('')}
          />
        </section>

        <section
          className="flex min-w-0 flex-col gap-2"
          aria-label="Disabled Composer example"
          data-zao-specimen="composer-disabled"
          data-zao-example="disabled-composer"
        >
          <h3 className="type-caption text-muted">Disabled</h3>
          <Composer
            label="Unavailable request"
            value="This composer is unavailable."
            onValueChange={() => {}}
            onSend={() => {}}
            onFilesSelect={() => {}}
            disabled
          />
        </section>
        <section className="flex min-w-0 flex-col gap-2" aria-label="Composer send error example">
          <h3 className="type-caption text-muted">Send error</h3>
          <InteractiveComposer sendError />
        </section>
      </div>
    </div>
  );
}
