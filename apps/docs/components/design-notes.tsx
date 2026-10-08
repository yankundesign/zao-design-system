import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  h1: ({ children }) => <h2 className="type-heading">{children}</h2>,
  h2: ({ children }) => <h2 className="type-heading pt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="type-body font-medium pt-2">{children}</h3>,
  p: ({ children }) => <p className="type-body text-muted">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-4 type-body text-muted">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-4 type-body text-muted">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-medium text-default">{children}</strong>,
  code: ({ children }) => <code className="type-code text-default">{children}</code>,
};

export function DesignNotes({
  markdown,
  sourceLabel = 'design.md',
}: {
  markdown: string;
  sourceLabel?: string;
}) {
  const body = markdown.replace(/^#\s+.+\r?\n/, '').trim();

  return (
    <article className="flex max-w-3xl min-w-0 flex-col gap-3 border-t border-subtle pt-4">
      <p className="type-caption text-muted">{sourceLabel}</p>
      <div className="flex flex-col gap-3">
        <Markdown components={markdownComponents}>{body}</Markdown>
      </div>
    </article>
  );
}
