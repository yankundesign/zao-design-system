'use client';

import { useState } from 'react';

export const meta = {
  id: 'table',
  title: 'Data table',
  tags: ['data', 'table', 'density'],
  description: 'Dense rows with IDs, numbers, statuses, hover and selection.',
};

const rows = [
  {
    id: 'REQ-01Il10',
    name: 'Access review',
    owner: 'Lin Chen',
    count: 24,
    status: 'Ready',
    statusClass: 'bg-success-subtle text-success border-success',
  },
  {
    id: 'REQ-2048',
    name: 'Usage summary',
    owner: 'Mara Wu',
    count: 1084,
    status: 'Running',
    statusClass: 'bg-accent-subtle text-accent border-accent',
  },
  {
    id: 'REQ-0137',
    name: 'Policy update',
    owner: 'Noah Park',
    count: 8,
    status: 'Needs review',
    statusClass: 'bg-warning-subtle text-warning border-warning',
  },
  {
    id: 'REQ-0962',
    name: 'Archive export',
    owner: 'Iris Hale',
    count: 306,
    status: 'Blocked',
    statusClass: 'bg-danger-subtle text-danger border-danger',
  },
] as const;

export default function TableSpecimen() {
  const [selected, setSelected] = useState<string[]>(['REQ-2048']);

  return (
    <section className="flex min-w-0 flex-col gap-5 p-5 text-default">
      <div>
        <p className="type-caption text-muted">Operations / Requests</p>
        <h2 className="type-title">Recent requests</h2>
        <p className="type-body text-muted">Select rows to compare their details.</p>
      </div>
      <div className="overflow-x-auto rounded-surface border border-subtle bg-surface">
        <table className="w-full min-w-max border-collapse text-left">
          <thead className="bg-sunken type-label text-muted">
            <tr>
              <th scope="col" className="p-2">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="p-2 font-medium">
                Request
              </th>
              <th scope="col" className="p-2 font-medium">
                ID
              </th>
              <th scope="col" className="p-2 font-medium">
                Owner
              </th>
              <th scope="col" className="p-2 text-right font-medium">
                Items
              </th>
              <th scope="col" className="p-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="type-body">
            {rows.map((row) => {
              const isSelected = selected.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`${isSelected ? 'bg-active' : 'hover:bg-hover'} border-t border-subtle transition-colors duration-fast`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={isSelected}
                      onChange={() =>
                        setSelected(
                          isSelected
                            ? selected.filter((id) => id !== row.id)
                            : [...selected, row.id],
                        )
                      }
                      style={{ accentColor: 'var(--zao-color-accent-solid)' }}
                    />
                  </td>
                  <td className="p-2 font-medium">{row.name}</td>
                  <td className="p-2 type-code figures-id">{row.id}</td>
                  <td className="p-2">{row.owner}</td>
                  <td className="p-2 text-right figures-tabular">{row.count.toLocaleString()}</td>
                  <td className="p-2">
                    <span
                      className={`${row.statusClass} rounded-pill border px-2 py-0.5 type-caption`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="type-caption text-muted figures-tabular" role="status">
        {selected.length} of {rows.length} requests selected
      </p>
    </section>
  );
}
