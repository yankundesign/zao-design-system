'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Switch, Table } from '@zao/react';

export function TableDrawingStates() {
  const [drawing, setDrawing] = useState(false);
  const [keepLoading, setKeepLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function load() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setDrawing(true);
    if (!keepLoading)
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setDrawing(false);
      }, 1800);
  }

  return (
    <section
      className="docs-detail-section grid gap-5 border-t border-subtle pt-5"
      aria-labelledby="table-drawing-heading"
    >
      <h2 id="table-drawing-heading" className="type-heading">
        Loading
      </h2>
      <div className="grid min-w-0 gap-4">
        <p className="max-w-2xl type-body text-muted">
          Local simulation. Keep the last-known rows while data arrives; pass placeholder rows with
          the expected shape when there is no prior content.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={load} disabled={drawing}>
            Load
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (timer.current !== null) window.clearTimeout(timer.current);
              timer.current = null;
              setDrawing(false);
            }}
            disabled={!drawing}
          >
            Build
          </Button>
          <label className="flex items-center gap-2 type-caption">
            Keep loading <Switch checked={keepLoading} onCheckedChange={setKeepLoading} />
          </label>
        </div>
        <Table.Root
          aria-label="Storage records"
          drawing={drawing}
          drawingLabel="Loading storage records"
        >
          <Table.Header>
            <Table.Row>
              <Table.Head>Record</Table.Head>
              <Table.Head>Owner</Table.Head>
              <Table.Head numeric>Items</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Head scope="row">Photo library</Table.Head>
              <Table.Cell>Lin Chen</Table.Cell>
              <Table.Cell numeric>182</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Head scope="row">Archive export</Table.Head>
              <Table.Cell>Mara Wu</Table.Cell>
              <Table.Cell numeric>96</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Head scope="row">Workspace files</Table.Head>
              <Table.Cell>Noah Park</Table.Cell>
              <Table.Cell numeric>62</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
