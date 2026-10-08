import { Button, Card } from '@zao/react';

function WorkspaceStatus() {
  return (
    <span className="status inline-flex items-center gap-1 type-caption text-success">
      <i aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-pill bg-success" />
      Operational
    </span>
  );
}

/** A single reading column with details grouped before the bottom actions. */
export function StackedCardSpecimen() {
  return (
    <div data-zao-specimen="card-stacked" className="@container">
      <Card className="system-card w-full">
        <div className="card-topline flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="type-heading">North workspace</h3>
            <span className="type-caption figures-id text-muted">Workspace / 001</span>
          </div>
          <WorkspaceStatus />
        </div>

        <div className="card-copy flex min-w-0 flex-col gap-4 pb-4">
          <p className="type-body text-muted">
            Review settings before they are shared with your team.
          </p>
          <dl
            data-zao-slot="card-data"
            className="grid gap-3 border-t border-subtle pt-3 type-caption @sm:grid-cols-2"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-muted">Active members</dt>
              <dd className="type-label figures-tabular">12</dd>
            </div>
            <div className="flex min-w-0 flex-col gap-1 border-t border-subtle pt-3 @sm:border-t-0 @sm:border-l @sm:pl-4 @sm:pt-0">
              <dt className="text-muted">Last update</dt>
              <dd className="type-label">Today</dd>
            </div>
          </dl>
        </div>

        <div className="card-foot flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-4">
          <span className="type-caption text-muted">
            <span className="figures-id">Record 01</span> / live
          </span>
          <div className="card-actions ml-auto flex max-w-full flex-wrap justify-end gap-2">
            <Button variant="secondary" className="study-button is-secondary">
              Review settings
            </Button>
            <Button className="study-button is-primary">Manage storage</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** A short summary keeps one secondary action close to its supporting metadata. */
export function CompactCardSpecimen() {
  return (
    <div data-zao-specimen="card-compact">
      <Card className="system-card w-full">
        <div className="card-topline flex flex-wrap items-start justify-between gap-3 pb-3">
          <h3 className="type-heading">North workspace</h3>
          <WorkspaceStatus />
        </div>
        <p className="card-copy pb-3 type-body text-muted">Review settings for your team.</p>
        <div className="card-foot flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-3">
          <span className="type-caption figures-id text-muted">Workspace / 001</span>
          <Button variant="secondary" size="small" className="study-button is-secondary ml-auto">
            Review workspace
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** An original construction drawing gives a media card a legible subject. */
export function MediaCardSpecimen() {
  return (
    <div data-zao-specimen="card-media">
      <Card className="system-card w-full">
        <figure className="flex min-w-0 flex-col gap-4 pb-4">
          <div className="system-figure min-w-0 rounded-surface border border-subtle bg-sunken p-4">
            <svg
              data-zao-slot="card-media"
              className="block h-auto w-full"
              viewBox="0 0 360 176"
              role="img"
              aria-label="Joinery construction"
              focusable="false"
            >
              <g stroke="var(--zao-color-border-default)" strokeWidth="1" strokeLinejoin="round">
                <path d="M252 52 204 76 204 92 252 68Z" fill="var(--zao-color-bg-hover)" />
                <path d="M272 110 248 122 248 138 272 126Z" fill="var(--zao-color-bg-hover)" />
                <path d="M248 122 180 88 180 104 248 138Z" fill="var(--zao-color-bg-active)" />
                <path d="M180 88 132 112 132 128 180 104Z" fill="var(--zao-color-bg-hover)" />
                <path d="M132 112 108 100 108 116 132 128Z" fill="var(--zao-color-bg-active)" />
                <path d="M156 76 88 42 88 58 156 92Z" fill="var(--zao-color-bg-active)" />
                <path
                  d="M112 30 180 64 228 40 252 52 204 76 272 110 248 122 180 88 132 112 108 100 156 76 88 42Z"
                  fill="var(--zao-color-bg-surface)"
                />
                <path d="M180 64 204 76 180 88 156 76Z" fill="var(--zao-color-accent-subtle)" />
              </g>
            </svg>
          </div>
          <figcaption className="card-copy flex min-w-0 flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="type-heading">Joinery study</h3>
              <span className="type-caption figures-id text-muted">Assembly / 01</span>
            </div>
            <p className="type-body text-muted">
              Two beams meet on a shared plane. The same parts can take different finishes.
            </p>
          </figcaption>
        </figure>

        <div className="card-foot flex flex-wrap items-center justify-end gap-2 border-t border-subtle pt-4">
          <Button variant="secondary" className="study-button is-secondary">
            View study
          </Button>
          <Button className="study-button is-primary">Open drawing</Button>
        </div>
      </Card>
    </div>
  );
}
