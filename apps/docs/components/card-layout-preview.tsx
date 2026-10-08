'use client';

import { Tabs } from '@zao/react';
import Link from 'next/link';
import { CardSpecimen } from './component-specimens';
import {
  CompactCardSpecimen,
  MediaCardSpecimen,
  StackedCardSpecimen,
} from './card-layout-specimens';

const layouts = [
  {
    value: 'split',
    label: 'Split',
    description: 'Related content and an open instrument readout, separated by a fine rule.',
    Specimen: CardSpecimen,
  },
  {
    value: 'stacked',
    label: 'Stacked',
    description: 'A single column for content, details, and bottom actions.',
    Specimen: StackedCardSpecimen,
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'A short summary with one supporting action.',
    Specimen: CompactCardSpecimen,
  },
  {
    value: 'media',
    label: 'Media',
    description: 'A visual above the title, supporting text, and actions.',
    Specimen: MediaCardSpecimen,
  },
] as const;

// Docs comparison dimensions requested for every composition, independent of finish.
const previewWidths = [640, 480] as const;

/** Layout belongs to the content composition; every option shares the same Card. */
export function CardLayoutPreview() {
  return (
    <Tabs.Root defaultValue="split">
      <p className="pb-4 type-caption text-muted">
        The storage ring is the first chart study.{' '}
        <Link
          href="/foundations/data-visualization"
          className="text-accent underline outline-focus"
        >
          Read the data visualization guideline
        </Link>
        .
      </p>
      <div className="flex flex-col gap-2">
        <p className="type-caption font-medium text-muted">Layout</p>
        <Tabs.List
          variant="secondary"
          aria-label="Card layout"
          className="grid w-full grid-cols-2 sm:grid-cols-4"
        >
          {layouts.map(({ value, label }) => (
            <Tabs.Tab key={value} value={value} className="w-full">
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </div>
      {layouts.map(({ value, label, description, Specimen }) => (
        <Tabs.Panel key={value} value={value} aria-label={label} data-zao-card-layout={value}>
          <div className="flex min-w-0 flex-col gap-4">
            <p className="type-caption text-muted">{description}</p>
            {previewWidths.map((width) => (
              <div key={width} className="flex min-w-0 flex-col gap-2">
                <p className="pl-1 type-caption figures-tabular text-muted">{width}px</p>
                <section
                  data-zao-card-width={width}
                  aria-label={`${label} card at ${width} pixels`}
                  tabIndex={0}
                  className="min-w-0 overflow-x-auto p-1 outline-focus"
                >
                  <div style={{ width }}>
                    <Specimen />
                  </div>
                </section>
              </div>
            ))}
          </div>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
