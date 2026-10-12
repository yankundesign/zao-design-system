import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';

/** Parse only the pipe tables in the maintained inventory; no runtime markdown extension. */
export function inventoryBlocks(markdown: string) {
  const lines = markdown
    .replace(/^#\s+.+\r?\n/, '')
    .trim()
    .split(/\r?\n/);
  const blocks: Array<{ prose: string } | { headers: string[]; rows: string[][] }> = [];
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map((cell) => cell.trim().replace(/\\\|/g, '|'));
  let prose: string[] = [];
  const flush = () => {
    if (prose.length) blocks.push({ prose: prose.join('\n') });
    prose = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim().startsWith('|') && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1] ?? '')) {
      flush();
      const headers = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index]!.trim().startsWith('|')) {
        rows.push(cells(lines[index]!));
        index += 1;
      }
      index -= 1;
      blocks.push({ headers, rows });
    } else {
      prose.push(line);
    }
  }
  flush();
  return blocks;
}

const components: Components = {
  h2: ({ children }) => <h3 className="type-body font-medium">{children}</h3>,
  h3: ({ children }) => <h4 className="type-label font-medium">{children}</h4>,
  p: ({ children }) => <p className="type-body text-muted">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-4 type-body text-muted">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-4 type-body text-muted">{children}</ol>
  ),
  strong: ({ children }) => <strong className="font-medium text-default">{children}</strong>,
  code: ({ children }) => <code className="type-code text-default">{children}</code>,
  // Source-relative paths name repo files; they are not docs routes.
  a: ({ children, href }) => (
    <span title={href} className="text-default">
      {children}
    </span>
  ),
};
const inline: Components = { ...components, p: ({ children }) => <span>{children}</span> };

/** The page renders its current inventory directly from docs/motion.md. */
export function MotionInventory({ markdown }: { markdown: string }) {
  return (
    <section aria-labelledby="motion-inventory-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="motion-inventory-title" className="type-heading">
        Motion inventory
      </h2>
      <p className="type-caption text-muted">Source: docs/motion.md</p>
      {inventoryBlocks(markdown).map((block, index) =>
        'prose' in block ? (
          <div key={index} className="flex min-w-0 flex-col gap-3">
            <Markdown components={components}>{block.prose}</Markdown>
          </div>
        ) : (
          <div
            key={index}
            role="region"
            aria-label={'Motion inventory table ' + (index + 1)}
            tabIndex={0}
            className="min-w-0 overflow-x-auto border border-subtle outline-focus"
          >
            <table className="w-full border-collapse text-left type-caption">
              <thead>
                <tr className="border-b border-subtle">
                  {block.headers.map((header, column) => (
                    <th key={column} scope="col" className="px-3 py-2 type-label font-medium">
                      <Markdown components={inline}>{header}</Markdown>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-subtle last:border-b-0">
                    {row.map((cell, column) => (
                      <td key={column} className="px-3 py-2 align-top">
                        <Markdown components={inline}>{cell}</Markdown>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </section>
  );
}
