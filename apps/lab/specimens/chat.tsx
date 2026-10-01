'use client';

import { useEffect, useState } from 'react';

export const meta = {
  id: 'chat',
  title: 'Chat and generated card',
  tags: ['agent', 'chat', 'generated'],
  description: 'Messages, generated content, code and a streaming response.',
};

const response =
  'I found three open requests and grouped them by owner. The review card is ready below.';

export default function ChatSpecimen() {
  const [visible, setVisible] = useState(response.length);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!streaming) return;
    if (visible >= response.length) {
      const done = window.setTimeout(() => setStreaming(false), 0);
      return () => window.clearTimeout(done);
    }
    const tick = window.setTimeout(() => setVisible(Math.min(visible + 3, response.length)), 35);
    return () => window.clearTimeout(tick);
  }, [streaming, visible]);

  return (
    <section className="flex min-w-0 flex-col gap-4 p-5 text-default">
      <div className="border-b border-subtle pb-3">
        <p className="type-caption text-muted">Assistant</p>
        <h2 className="type-heading">Request review</h2>
      </div>
      <div className="flex justify-end">
        <div className="max-w-xl rounded-surface bg-accent-subtle p-3 type-body text-default">
          Show me the requests that still need review.
        </div>
      </div>
      <div className="flex max-w-xl flex-col gap-3">
        <p className="type-caption text-muted">Assistant · just now</p>
        <p className="type-body" aria-live="polite">
          {response.slice(0, visible)}
          {streaming && (
            <span aria-hidden className="text-accent">
              ▍
            </span>
          )}
        </p>
        <div className="rounded-surface border border-default bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="type-heading">Open requests</h3>
            <span className="rounded-pill border border-warning bg-warning-subtle px-2 py-0.5 type-caption text-warning">
              3 to review
            </span>
          </div>
          <p className="mt-2 type-body text-muted">Two access updates and one report schedule.</p>
          <ul className="mt-3 flex flex-col gap-2 border-t border-subtle pt-3 type-body">
            <li className="flex justify-between gap-3">
              <span>Access update</span>
              <span className="text-muted">Lin Chen</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Access update</span>
              <span className="text-muted">Mara Wu</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Report schedule</span>
              <span className="text-muted">Noah Park</span>
            </li>
          </ul>
          <button
            type="button"
            className="mt-4 h-8 rounded-action bg-accent px-3 type-label trim-label text-on-accent"
          >
            Review 3 requests
          </button>
        </div>
        <div className="rounded-surface border border-subtle bg-sunken p-3">
          <p className="type-caption text-muted">Query used</p>
          <pre className="mt-2 overflow-x-auto type-code figures-id">
            <code>{'SELECT id, owner FROM requests\nWHERE status = "pending";'}</code>
          </pre>
        </div>
        <button
          type="button"
          disabled={streaming}
          onClick={() => {
            setVisible(0);
            setStreaming(true);
          }}
          className="h-8 self-start rounded-action border border-default bg-surface px-3 type-label trim-label disabled:text-disabled"
        >
          Generate response again
        </button>
      </div>
    </section>
  );
}
