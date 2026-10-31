'use client';

import { Button, Table } from '@zao/react';
import { useId, useState } from 'react';

export interface ChartTable {
  columns: readonly { label: string; numeric?: boolean }[];
  /** One row per datum, built from the chart's own data; the first cell names the row. */
  rows: readonly (readonly string[])[];
}

/**
 * Every chart's numbers in Table, opened inline below the frame and closed by default (C2).
 * The table adds height below the readout; the plot never moves.
 */
export function ChartDataView({
  title,
  table,
  disabled = false,
}: {
  title: string;
  table: ChartTable;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const regionId = useId();

  return (
    <div data-zao-slot="chart-data" className="flex min-w-0 flex-col items-start gap-3">
      <Button
        variant="quiet"
        size="small"
        aria-expanded={open}
        aria-controls={regionId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Hide data' : 'Show data'}
      </Button>
      <div id={regionId} hidden={!open} className="w-full min-w-0">
        {open && (
          <Table.Root aria-label={`${title} data`}>
            <Table.Header>
              <Table.Row>
                {table.columns.map((column) => (
                  <Table.Head key={column.label} numeric={column.numeric}>
                    {column.label}
                  </Table.Head>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {table.rows.map((row, index) => (
                <Table.Row key={index}>
                  {row.map((cell, column) =>
                    column === 0 ? (
                      <Table.Head key={column} scope="row">
                        {cell}
                      </Table.Head>
                    ) : (
                      <Table.Cell key={column} numeric={table.columns[column]?.numeric}>
                        {cell}
                      </Table.Cell>
                    ),
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </div>
    </div>
  );
}
