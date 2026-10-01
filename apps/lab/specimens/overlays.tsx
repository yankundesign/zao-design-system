'use client';

import { useId, useState } from 'react';

export const meta = {
  id: 'overlays',
  title: 'Overlays',
  tags: ['overlay', 'material', 'dialog'],
  description: 'A menu and dialog over dense content to reveal material behavior.',
};

const activity = [
  ['09:42', 'Request assigned', 'Lin Chen'],
  ['09:35', 'Report generated', 'Mara Wu'],
  ['09:10', 'Policy reviewed', 'Noah Park'],
  ['08:57', 'Export prepared', 'Iris Hale'],
] as const;

export default function OverlaysSpecimen() {
  const dialogTitleId = useId();
  const [menuOpen, setMenuOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [status, setStatus] = useState('');

  return (
    <section className="flex min-w-0 flex-col gap-5 p-5 text-default">
      <div>
        <p className="type-caption text-muted">Floating layers</p>
        <h2 className="type-title">Activity workspace</h2>
        <p className="type-body text-muted">
          Move content behind the menu and dialog to inspect the material.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-surface border border-subtle bg-surface p-3">
          <div className="flex items-center justify-between gap-2 border-b border-subtle pb-3">
            <h3 className="type-heading">Recent activity</h3>
            <button
              type="button"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 rounded-action border border-default bg-surface px-3 type-label trim-label"
            >
              Actions
            </button>
          </div>
          <ul className="flex flex-col">
            {activity.map(([time, event, owner]) => (
              <li
                key={time}
                className="flex flex-wrap justify-between gap-2 border-b border-subtle py-3 type-caption"
              >
                <span className="figures-tabular text-muted">{time}</span>
                <span>{event}</span>
                <span className="text-muted">{owner}</span>
              </li>
            ))}
          </ul>
          {menuOpen && (
            <div
              role="group"
              aria-label="Activity actions"
              className="material-overlay absolute right-3 top-12 z-10 min-w-max p-1"
            >
              <button
                type="button"
                onClick={() => {
                  setStatus('Opened activity');
                  setMenuOpen(false);
                }}
                className="flex min-h-7 w-full items-center rounded-control px-2 text-left type-label hover:bg-hover"
              >
                Open activity
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('Copied activity link');
                  setMenuOpen(false);
                }}
                className="flex min-h-7 w-full items-center rounded-control px-2 text-left type-label hover:bg-hover"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('Archived activity');
                  setMenuOpen(false);
                }}
                className="flex min-h-7 w-full items-center rounded-control px-2 text-left type-label text-danger hover:bg-hover"
              >
                Archive activity
              </button>
            </div>
          )}
        </div>
        <div className="relative overflow-hidden rounded-surface border border-subtle bg-surface p-3 pb-20">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-surface bg-sunken p-3">
              <p className="type-caption text-muted">Reviewed</p>
              <p className="type-heading figures-tabular">1,284</p>
            </div>
            <div className="rounded-surface bg-accent-subtle p-3">
              <p className="type-caption text-accent">Pending</p>
              <p className="type-heading figures-tabular">36</p>
            </div>
          </div>
          <p className="mt-3 type-body text-muted">
            The dialog floats over active workspace content.
          </p>
          {!dialogOpen && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-3 h-8 rounded-action bg-accent px-3 type-label trim-label text-on-accent"
            >
              Open dialog
            </button>
          )}
          {dialogOpen && (
            <div
              role="dialog"
              aria-labelledby={dialogTitleId}
              className="material-overlay absolute inset-x-3 top-8 z-10 p-4"
            >
              <h3 id={dialogTitleId} className="type-heading">
                Export activity?
              </h3>
              <p className="mt-2 type-body text-muted">
                Create a file with the current activity and its owners.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('Exported activity');
                    setDialogOpen(false);
                  }}
                  className="h-8 rounded-action bg-accent px-3 type-label trim-label text-on-accent"
                >
                  Export activity
                </button>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-8 rounded-action border border-default bg-surface px-3 type-label trim-label"
                >
                  Cancel export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {status && (
        <p role="status" className="type-caption text-success">
          {status}
        </p>
      )}
    </section>
  );
}
