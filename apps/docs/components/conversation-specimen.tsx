'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Copy, Database } from 'iconoir-react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import {
  Button,
  Card,
  Composer,
  ComposerContextChip,
  Conversation,
  IconButton,
  Message,
  Switch,
  Table,
} from '@zao/react';
import type { ComposerAttachment, ComposerDraft } from '@zao/react';

type TranscriptMessage = {
  id: string;
  kind: 'user' | 'assistant';
  text: string;
  metadata?: string;
  status?: 'complete' | 'streaming' | 'stopped' | 'error';
  error?: string;
  rich?: boolean;
  lateResults?: number;
};

const markdownComponents: Components = {
  h1: ({ children }) => <h4 className="type-heading">{children}</h4>,
  h2: ({ children }) => <h4 className="type-heading">{children}</h4>,
  h3: ({ children }) => <h5 className="type-label">{children}</h5>,
  p: ({ children }) => <p className="type-body">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-4 type-body">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-4 type-body">{children}</ol>,
  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="inline-flex min-h-6 items-center text-accent underline underline-offset-2 outline-focus"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre
      tabIndex={0}
      role="region"
      aria-label="Example code"
      className="max-w-full overflow-x-auto border border-subtle bg-sunken p-3 type-code outline-focus"
    >
      {children}
    </pre>
  ),
  code: ({ children }) => <code className="type-code">{children}</code>,
};

const initialMessages: TranscriptMessage[] = [
  {
    id: 'request-1',
    kind: 'user',
    text: 'Summarize storage usage for the North workspace.',
  },
  {
    id: 'response-1',
    kind: 'assistant',
    text: '## Storage summary\n\nThe North workspace uses **340 GB of 500 GB**. That is **68% used** and **32% available**. The largest category is photos.\n\nThe table records the same values as the summary; all readings come from the local example snapshot.',
    metadata: 'Storage snapshot',
    rich: true,
  },
  {
    id: 'request-2',
    kind: 'user',
    text: 'What should I check before deciding whether to add capacity?',
  },
  {
    id: 'response-2',
    kind: 'assistant',
    text: '## Before changing capacity\n\n1. Compare the current reading with recent growth.\n2. Check whether retention settings match your needs.\n3. Review the largest categories with their owners.\n\nThe snapshot describes current usage. It does not establish a growth rate or predict when capacity will run out.',
  },
  {
    id: 'request-3',
    kind: 'user',
    text: 'Keep the current capacity and give me a short record of the findings.',
  },
  {
    id: 'response-3',
    kind: 'assistant',
    text: '## Review record\n\n- **Capacity:** 500 GB.\n- **Used:** 340 GB, or 68%.\n- **Available:** 160 GB, or 32%.\n- **Next step:** review growth and retention before making a capacity decision.\n\nNo capacity change was made. This record is part of the local example conversation.\n\n```json\n{"workspace":"north","capacity_gb":500,"used_gb":340,"available_gb":160}\n```',
  },
];

const responseText =
  '## Follow-up summary\n\nThe North workspace has **160 GB available** in the example snapshot. Current usage alone does not show how quickly that space will be consumed.\n\nCompare a recent storage trend and check retention settings with the workspace owners. Keep the present capacity until that review gives you a reason to change it.\n\nThis response is generated locally from a fixed example; it does not read your selected files or change workspace settings.';

function StorageResult({ sourceId }: { sourceId: string }) {
  const [reviewed, setReviewed] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-3" data-zao-example="storage-result">
      <Table.Root aria-label="North workspace storage snapshot" id={sourceId}>
        <Table.Caption>Local example snapshot · 500 GB total capacity</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-full">Category</Table.Head>
            <Table.Head className="whitespace-nowrap">ID</Table.Head>
            <Table.Head numeric className="whitespace-nowrap">
              Used
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {[
            ['Photos', 'ST-001', '180 GB'],
            ['Documents', 'ST-002', '96 GB'],
            ['Recordings', 'ST-003', '64 GB'],
          ].map(([category, id, used]) => (
            <Table.Row key={id}>
              <Table.Cell>{category}</Table.Cell>
              <Table.Cell className="figures-id whitespace-nowrap">{id}</Table.Cell>
              <Table.Cell numeric className="whitespace-nowrap">
                {used}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Head scope="row" colSpan={2}>
              Total used
            </Table.Head>
            <Table.Cell numeric className="whitespace-nowrap">
              340 GB
            </Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>

      <p className="type-caption text-muted">
        Source:{' '}
        <a
          href={`#${sourceId}`}
          className="inline-flex min-h-6 items-center text-accent underline underline-offset-2 outline-focus"
        >
          Storage snapshot
        </a>{' '}
        · local example data
      </p>

      <Card className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="type-heading">Capacity review</h4>
          <p className="type-caption text-muted">North workspace · example record</p>
        </div>
        <p className="type-body">Keep the current capacity while reviewing growth and retention.</p>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-subtle pt-3">
          <p role="status" className="type-caption text-muted">
            {reviewed ? 'Marked the example record as reviewed.' : 'Ready for review.'}
          </p>
          <Button
            variant="secondary"
            size="small"
            disabled={reviewed}
            onClick={() => setReviewed(true)}
          >
            {reviewed ? 'Reviewed' : 'Mark reviewed'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** A host-owned transcript with local streaming, interruption, and recovery. */
export function ConversationSpecimen() {
  const [messages, setMessages] = useState<TranscriptMessage[]>(initialMessages);
  const [value, setValue] = useState('What should we review next?');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [contextItems, setContextItems] = useState([
    { id: 'storage-snapshot', label: 'Storage snapshot', icon: Database },
  ]);
  const [failNext, setFailNext] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [run, setRun] = useState<{ id: string; fail: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; text: string } | null>(null);
  const nextId = useRef(4);
  const acceptanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptanceResolve = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const sourceId = useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (acceptanceTimer.current !== null) clearTimeout(acceptanceTimer.current);
      acceptanceResolve.current?.();
      acceptanceResolve.current = null;
    };
  }, []);

  useEffect(() => {
    if (!run) return;
    let length = 0;
    const timer = setInterval(() => {
      length = Math.min(length + 16, responseText.length);
      const failed = run.fail && length >= responseText.length / 2;
      const complete = length === responseText.length;
      setMessages((current) =>
        current.map((message) =>
          message.id === run.id
            ? {
                ...message,
                text: responseText.slice(0, length),
                status: failed ? 'error' : complete ? 'complete' : 'streaming',
                error: failed
                  ? 'The local example response stopped unexpectedly. Retry the response.'
                  : undefined,
              }
            : message,
        ),
      );
      if (failed || complete) {
        clearInterval(timer);
        setRun(null);
        setAnnouncement(
          failed
            ? 'The example response failed. The partial response is available; retry to continue.'
            : 'Completed the example response.',
        );
      }
    }, 80);
    return () => clearInterval(timer);
  }, [run]);

  async function send(draft: ComposerDraft) {
    const id = nextId.current++;
    const shouldFail = failNext;
    setAccepting(true);
    await new Promise<void>((resolve) => {
      acceptanceResolve.current = resolve;
      acceptanceTimer.current = setTimeout(() => {
        acceptanceTimer.current = null;
        acceptanceResolve.current = null;
        resolve();
      }, 400);
    });
    if (!mounted.current) return;
    setMessages((current) => [
      ...current,
      {
        id: `request-${id}`,
        kind: 'user',
        text: draft.text || 'Review the attached files.',
        metadata:
          draft.attachments.length > 0
            ? `Selected files: ${draft.attachments.map((attachment) => attachment.file.name).join(', ')} (local preview only)`
            : 'Example request',
      },
      {
        id: `response-${id}`,
        kind: 'assistant',
        text: '',
        metadata: 'Local simulation',
        status: 'streaming',
      },
    ]);
    setValue((current) => (current === draft.text ? '' : current));
    const acceptedIds = new Set(draft.attachments.map((attachment) => attachment.id));
    setAttachments((current) => current.filter((attachment) => !acceptedIds.has(attachment.id)));
    setFailNext(false);
    setAccepting(false);
    setAnnouncement('ZAO assistant is responding in the local example.');
    setRun({ id: `response-${id}`, fail: shouldFail });
  }

  function stop() {
    if (!run) return;
    const id = run.id;
    setRun(null);
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, status: 'stopped' } : message)),
    );
    setAnnouncement('Stopped the example response. The partial response is available.');
  }

  function retry(id: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, text: '', status: 'streaming', error: undefined }
          : message,
      ),
    );
    setAnnouncement('Retrying the example response.');
    setRun({ id, fail: false });
  }

  function addLateResult() {
    setMessages((current) => {
      const target = current.findLast((message) => message.kind === 'assistant');
      return current.map((message) =>
        message.id === target?.id
          ? { ...message, lateResults: (message.lateResults ?? 0) + 1 }
          : message,
      );
    });
  }

  async function copyResponse(message: TranscriptMessage) {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopyFeedback({ id: message.id, text: 'Copied response.' });
    } catch {
      setCopyFeedback({ id: message.id, text: 'Select the response text and copy it.' });
    }
  }

  return (
    <div data-zao-specimen="conversation" className="flex min-w-0 flex-col gap-4">
      <div
        className="card-construction min-w-0 border border-subtle bg-canvas"
        data-zao-example="assistant-panel"
      >
        <header className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 border-b border-subtle px-3 py-2">
          <h4 className="type-label font-medium">ZAO assistant</h4>
          <p className="type-caption text-muted">North workspace</p>
        </header>
        <Conversation.Root aria-label="North workspace conversation" announcement={announcement}>
          <Conversation.Viewport
            style={{ height: 'calc(var(--zao-space-20) * 5)', maxHeight: '65dvh' }}
            className="py-2"
          >
            <Conversation.List>
              {messages.map((message) => (
                <Conversation.Item key={message.id} data-message-id={message.id}>
                  <Message.Root
                    author={message.kind === 'user' ? 'You' : 'ZAO assistant'}
                    kind={message.kind}
                    metadata={message.metadata}
                    status={message.status}
                    error={message.error}
                  >
                    <Message.Content>
                      <div className="flex min-w-0 flex-col gap-3 break-words">
                        {message.kind === 'user' ? (
                          <p className="whitespace-pre-wrap type-body">{message.text}</p>
                        ) : (
                          <Markdown components={markdownComponents}>{message.text}</Markdown>
                        )}
                        {message.rich && <StorageResult sourceId={`${sourceId}-${message.id}`} />}
                        {Array.from({ length: message.lateResults ?? 0 }, (_, index) => (
                          <div
                            key={index}
                            data-zao-example="late-result"
                            className="flex min-w-0 flex-col gap-2"
                          >
                            <p className="type-caption text-muted">Added a local example result.</p>
                            <StorageResult sourceId={`${sourceId}-${message.id}-late-${index}`} />
                          </div>
                        ))}
                      </div>
                    </Message.Content>
                    {message.kind === 'assistant' && message.text && (
                      <Message.Actions>
                        <IconButton
                          icon={Copy}
                          aria-label="Copy response"
                          variant="quiet"
                          size="small"
                          disabled={message.status === 'streaming'}
                          onClick={() => void copyResponse(message)}
                        />
                        {copyFeedback?.id === message.id && (
                          <span role="status" className="type-caption text-muted">
                            {copyFeedback.text}
                          </span>
                        )}
                        {message.status === 'error' && (
                          <Button
                            variant="secondary"
                            size="small"
                            disabled={accepting || run !== null}
                            onClick={() => retry(message.id)}
                          >
                            Retry response
                          </Button>
                        )}
                      </Message.Actions>
                    )}
                  </Message.Root>
                </Conversation.Item>
              ))}
            </Conversation.List>
          </Conversation.Viewport>
          <Conversation.Latest className="ml-3" />
        </Conversation.Root>

        <div className="p-3">
          <Composer
            label="Follow-up request"
            value={value}
            onValueChange={setValue}
            onSend={send}
            attachments={attachments}
            onFilesSelect={(files) => {
              setAttachments((current) => [
                ...current,
                ...files.map((file) => ({ id: `conversation-file-${nextId.current++}`, file })),
              ]);
            }}
            onRemoveAttachment={(id) => {
              setAttachments((current) => current.filter((attachment) => attachment.id !== id));
            }}
            responding={run !== null}
            onStop={stop}
            placeholder="Ask a follow-up…"
            context={
              contextItems.length > 0 ? (
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
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p className="type-caption text-muted">Local simulation · files stay in this browser</p>
          <Button variant="quiet" size="small" onClick={addLateResult}>
            Add late result
          </Button>
        </div>
        <label className="flex min-w-0 flex-wrap items-center gap-2 type-caption text-muted">
          <Switch
            checked={failNext}
            onCheckedChange={setFailNext}
            disabled={accepting || run !== null}
          />
          Fail next response
        </label>
      </div>
    </div>
  );
}
