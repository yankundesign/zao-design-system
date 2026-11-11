import Link from 'next/link';
import type { ReactNode } from 'react';
import { ComponentPreview } from './component-preview';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { anatomyKinds, type AnatomyKind } from '@/lib/anatomy';
import { Anatomy } from './anatomy';
import { definitions, type ComponentId } from './component-definitions';
import './anatomy.css';

export type { ComponentId } from './component-definitions';
export type ComponentSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * A component's docs page. Each page passes its own specimens, so its bundle holds only the
 * components it shows rather than every page's.
 */
export async function ComponentDetail({
  component,
  searchParams,
  specimen,
  supplement,
  states,
}: {
  component: ComponentId;
  searchParams: ComponentSearchParams;
  /** The preview's specimen. */
  specimen: ReactNode;
  /** More specimens inside the preview frame: vertical Tabs, or a field's sizes and family. */
  supplement?: ReactNode;
  /** A section after the preview, such as Card's construction states. */
  states?: ReactNode;
}) {
  const definition = definitions[component];
  // Export one shared Su preview; URL normalization stays in the client.
  const query = process.env.ZAO_DOCS_STATIC_EXPORT === '1' ? {} : await searchParams;
  const quietStudy = await getQuietInstrumentStudy();
  const requestedStyle = first(query.style);
  const style =
    requestedStyle === 'quiet-instrument' && quietStudy ? 'quiet-instrument' : 'baseline';

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">{definition.title}</h1>
        <p className="type-body text-muted">{definition.description}</p>
      </header>

      {(anatomyKinds as readonly string[]).includes(component) && (
        <Anatomy
          kind={component as AnatomyKind}
          quietStudy={quietStudy ? { cssUrl: quietStudy.cssUrl } : null}
        />
      )}

      <ComponentPreview
        component={component}
        title={definition.title}
        selectedStyle={style}
        quietStudy={quietStudy ? { title: quietStudy.title, cssUrl: quietStudy.cssUrl } : null}
        specimen={specimen}
        supplement={supplement}
      />

      {states}

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Usage</h2>
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-4 type-body text-muted">
          {definition.usage.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {component === 'progress' && (
            <li>
              Follow the{' '}
              <Link className="text-default underline" href="/foundations/data-visualization">
                data visualization guideline
              </Link>{' '}
              when composing the reading.
            </li>
          )}
        </ul>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">API</h2>
        <div className="docs-scroll-region min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left type-body">
            <thead className="type-caption text-muted">
              <tr>
                <th className="border-b border-subtle pb-2 font-medium">Prop</th>
                <th className="border-b border-subtle pb-2 font-medium">Values</th>
                <th className="border-b border-subtle pb-2 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {definition.props.map((prop) => (
                <tr key={prop.name}>
                  <th className="border-b border-subtle py-2 pr-3 type-code">{prop.name}</th>
                  <td className="border-b border-subtle py-2 pr-3">{prop.values}</td>
                  <td className="border-b border-subtle py-2">{prop.defaultValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Example</h2>
        <pre className="docs-scroll-region min-w-0 overflow-x-auto rounded-surface border border-subtle bg-sunken p-4 type-code">
          <code>{definition.example}</code>
        </pre>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Accessibility</h2>
        <p className="max-w-2xl type-body text-muted">{definition.accessibility}</p>
      </section>
    </div>
  );
}
