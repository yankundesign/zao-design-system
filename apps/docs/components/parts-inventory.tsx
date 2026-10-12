import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { inventoryBlocks } from './motion-inventory';

const components: Components = {
  h2: ({ children }) => <h2 className="type-heading">{children}</h2>,
  p: ({ children }) => <p className="type-body text-muted">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-4 type-body text-muted">{children}</ul>
  ),
  strong: ({ children }) => <strong className="font-medium text-default">{children}</strong>,
  code: ({ children }) => <code className="type-code text-default">{children}</code>,
};
const inline: Components = { ...components, p: ({ children }) => <span>{children}</span> };

/** Render the maintained source catalog without a second list of names in page code. */
export function PartsInventory({ markdown }: { markdown: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-4" data-parts-inventory>
      <p className="type-caption text-muted">Source: docs/parts.md</p>
      {inventoryBlocks(markdown).map((block, index) =>
        'prose' in block ? (
          <div key={index} className="flex min-w-0 flex-col gap-3">
            <Markdown components={components}>{block.prose}</Markdown>
          </div>
        ) : (
          <div
            key={index}
            role="region"
            aria-label={'Parts reference table ' + (index + 1)}
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
    </div>
  );
}
