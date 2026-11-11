'use client';

import type { ReactNode } from 'react';
import { Button, Card } from '@zao/react';
import { StorageRingStudy } from './storage-ring-study';

/** A grounded content card with one measurement and a joined bottom action row. */
export function CardSpecimen({
  actions,
  recordStatus = 'live',
}: {
  actions?: ReactNode;
  recordStatus?: string;
} = {}) {
  return (
    <div data-zao-specimen="card" className="@container">
      <Card className="system-card w-full">
        <div className="card-topline flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="type-heading">North workspace</h3>
            <span className="type-caption figures-id text-muted">Workspace / 001</span>
          </div>
          <span className="status inline-flex items-center gap-1 type-caption text-success">
            <i aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-pill bg-success" />
            Operational
          </span>
        </div>

        <div className="card-main grid gap-4 pb-4 @xl:grid-cols-2">
          <div className="card-copy flex min-w-0 flex-col gap-4">
            <p className="type-body text-muted">
              Review settings before they are shared with your team.
            </p>
            <dl className="flex flex-col gap-2 type-caption">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Active members</dt>
                <dd className="figures-tabular">12</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Last update</dt>
                <dd>Today</dd>
              </div>
            </dl>
          </div>

          <div
            data-zao-slot="card-data"
            className="min-w-0 border-t border-subtle pt-4 @xl:border-t-0 @xl:border-l @xl:pt-0 @xl:pl-4"
          >
            <StorageRingStudy />
          </div>
        </div>

        <div className="card-foot flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-4">
          <span className="type-caption text-muted">
            <span className="figures-id">Record 01</span> / {recordStatus}
          </span>
          <div className="card-actions ml-auto flex max-w-full flex-wrap justify-end gap-2">
            {actions ?? (
              <>
                <Button variant="secondary">Review settings</Button>
                <Button>Manage storage</Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
