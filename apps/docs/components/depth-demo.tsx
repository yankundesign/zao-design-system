'use client';

import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Card, Composer, Menu, Progress, Select, Switch, Tabs, finish } from '@zao/react';
import { useFinish } from './use-finish';

const regions = [
  { value: 'west', label: 'West' },
  { value: 'central', label: 'Central' },
  { value: 'east', label: 'East' },
  { value: 'archive', label: 'Archived region', disabled: true },
];

interface DepthDemoProps {
  /** Published pixel distances supplied by the server page's token JSON. */
  contact: number;
  lift: number;
  studyCssUrl?: string;
}

/** A docs-only island that scales the shared painted distances without changing layout. */
export function DepthDemo({ contact, lift, studyCssUrl }: DepthDemoProps) {
  const scaleId = useId();
  const descriptionId = useId();
  const { theme, resolved } = useFinish();
  const [scale, setScale] = useState(1);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [region, setRegion] = useState<string | null>('west');
  const [draft, setDraft] = useState('Review storage use.');
  const [result, setResult] = useState('This preview keeps every action local.');
  const readout = `${scale.toFixed(2)}×`;
  const depth = {
    '--zao-depth-contact': `${contact * scale}px`,
    '--zao-depth-lift': `${lift * scale}px`,
  } as CSSProperties;

  return (
    <section aria-labelledby="depth-demo-heading" className="flex flex-col gap-4">
      {studyCssUrl && <link rel="stylesheet" href={studyCssUrl} />}
      <div className="flex max-w-2xl flex-col gap-2">
        <h2 id="depth-demo-heading" className="type-heading">
          Try the construction
        </h2>
        <p id={descriptionId} className="type-body text-muted">
          Scale the depth, then use the controls. The painted edges change while their targets,
          content spacing, and neighboring layout stay fixed. The default 1× uses the published
          distances; zero removes depth.
        </p>
      </div>

      <div className="flex max-w-2xl flex-col gap-3" data-depth-controls="">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={scaleId} className="type-label font-medium">
            Depth scale
          </label>
          <output htmlFor={scaleId} className="type-label figures-tabular" aria-live="off">
            {readout}
          </output>
        </div>
        <input
          id={scaleId}
          type="range"
          min={0}
          max={4}
          step={0.01}
          value={scale}
          onChange={(event) => setScale(Number(event.currentTarget.value))}
          aria-describedby={descriptionId}
          aria-valuetext={`${scale.toFixed(2)} times the published depth`}
          className="min-h-6 w-full outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ accentColor: 'var(--zao-color-accent-solid)' }}
        />
        <Button variant="secondary" className="self-start" onClick={() => setScale(1)}>
          Reset depth
        </Button>
      </div>

      <div
        {...finish(theme, resolved)}
        data-study="quiet-instrument"
        data-depth-island=""
        data-depth-scale={scale}
        className="study grid min-w-0 gap-6 border border-subtle bg-canvas p-5 text-default lg:grid-cols-2"
        style={depth}
      >
        <section className="flex min-w-0 flex-col items-start gap-3" data-depth-part="button">
          <h3 className="type-label text-muted">Button</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setResult('Approved the local preview.')}>
              Approve preview
            </Button>
            <Button variant="secondary" disabled>
              Unavailable
            </Button>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3" data-depth-part="card">
          <h3 className="type-label text-muted">Card</h3>
          <Card className="flex flex-col gap-3">
            <h4 className="type-heading">Workspace storage</h4>
            <dl className="flex items-baseline justify-between gap-3 type-body">
              <dt className="text-muted">Storage used</dt>
              <dd className="figures-tabular">68%</dd>
            </dl>
            <div className="flex justify-end border-t border-subtle pt-3">
              <Button
                variant="secondary"
                onClick={() => setResult('Reviewed the storage preview.')}
              >
                Review storage
              </Button>
            </div>
          </Card>
        </section>

        <section className="flex min-w-0 flex-col items-start gap-3" data-depth-part="menu">
          <h3 className="type-label text-muted">Menu</h3>
          <Menu
            trigger="Preview workspace actions"
            items={[
              {
                label: 'Rename workspace',
                onSelect: () => setResult('Selected Rename workspace.'),
              },
              {
                label: 'Copy workspace ID',
                onSelect: () => setResult('Selected Copy workspace ID.'),
              },
              { separator: true },
              { label: 'Archive workspace', disabled: true },
            ]}
          />
        </section>

        <section className="flex min-w-0 flex-col gap-3" data-depth-part="switch">
          <h3 className="type-label text-muted">Switch</h3>
          <label className="flex min-h-6 cursor-pointer items-center justify-between gap-4">
            <span className="type-body">Preview email updates</span>
            <Switch
              aria-label="Preview email updates"
              checked={emailUpdates}
              onCheckedChange={setEmailUpdates}
            />
          </label>
        </section>

        <section className="flex min-w-0 flex-col gap-3" data-depth-part="tabs">
          <h3 className="type-label text-muted">Secondary tabs</h3>
          <Tabs.Root defaultValue="overview">
            <Tabs.List variant="secondary" aria-label="Preview workspace views">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
              <Tabs.Tab value="archive" disabled>
                Archive
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview">
              <p className="type-body text-muted">12 members can access this workspace.</p>
            </Tabs.Panel>
            <Tabs.Panel value="activity">
              <p className="type-body text-muted">Three settings were updated today.</p>
            </Tabs.Panel>
          </Tabs.Root>
        </section>

        <section className="flex min-w-0 flex-col gap-3" data-depth-part="progress">
          <h3 className="type-label text-muted">Progress</h3>
          <Progress label="Preview file upload" value={68} />
        </section>

        <section className="flex min-w-0 flex-col gap-3" data-depth-part="composer">
          <h3 className="type-label text-muted">Composer</h3>
          <Composer
            label="Preview request"
            value={draft}
            onValueChange={setDraft}
            onSend={() => setResult('Accepted the local preview request.')}
          />
        </section>

        <section className="flex min-w-0 flex-col gap-3" data-depth-part="field">
          <h3 className="type-label text-muted">Select field</h3>
          <Select
            label="Preview region"
            options={regions}
            value={region}
            onValueChange={setRegion}
          />
        </section>
      </div>

      <p role="status" className="type-caption text-muted" data-depth-result="">
        {result}
      </p>
    </section>
  );
}
