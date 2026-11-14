'use client';

import { useEffect, useRef, useState } from 'react';
import { Table, Tabs } from '@zao/react';
import { requestsByDay } from './table-upgrades-data';

const formatItems = (value: number) => value.toLocaleString('en-US');
const requestCount = requestsByDay.reduce((total, group) => total + group.requests.length, 0);

/** The same requests with and without the held header, so the difference shows in place. */
function RequestsByDay({ stickyHeader }: { stickyHeader: boolean }) {
  const table = useRef<HTMLTableElement>(null);
  const [reading, setReading] = useState({ stuck: false, group: 0 });

  // Host logic: the readout names the header's state and the group at the top of the view.
  useEffect(() => {
    const node = table.current;
    const area = node?.parentElement;
    if (!stickyHeader || !node || !area) return;
    const update = () => {
      const header = node.tHead?.offsetHeight ?? 0;
      let group = 0;
      Array.from(node.tBodies).forEach((body, index) => {
        if (body.offsetTop <= area.scrollTop + header + 1) group = index;
      });
      const stuck = area.scrollTop > 0;
      setReading((current) =>
        current.stuck === stuck && current.group === group ? current : { stuck, group },
      );
    };
    area.addEventListener('scroll', update, { passive: true });
    update();
    return () => area.removeEventListener('scroll', update);
  }, [stickyHeader]);

  return (
    <div className="grid min-w-0 gap-3">
      <Table.Root
        ref={table}
        aria-label="Requests by day"
        stickyHeader={stickyHeader}
        className={stickyHeader ? 'max-h-96' : undefined}
      >
        <Table.Caption className="sr-only">
          {requestCount} sample requests from five days, grouped by day.
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-full">Request</Table.Head>
            <Table.Head className="whitespace-nowrap">ID</Table.Head>
            <Table.Head className="whitespace-nowrap">Owner</Table.Head>
            <Table.Head numeric className="whitespace-nowrap">
              Items
            </Table.Head>
          </Table.Row>
        </Table.Header>
        {requestsByDay.map((group) => (
          <Table.Body key={group.label}>
            <Table.Row>
              <Table.Head scope="rowgroup" colSpan={4}>
                <span className="flex flex-wrap items-baseline gap-2">
                  {group.label}
                  <span className="type-caption figures-tabular text-muted">
                    {group.requests.length} requests
                  </span>
                </span>
              </Table.Head>
            </Table.Row>
            {group.requests.map((request) => (
              <Table.Row key={request.id}>
                <Table.Head scope="row" className="whitespace-nowrap font-medium">
                  {request.name}
                </Table.Head>
                <Table.Cell className="whitespace-nowrap type-code figures-id text-muted">
                  {request.id}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-muted">{request.owner}</Table.Cell>
                <Table.Cell numeric className="whitespace-nowrap">
                  {formatItems(request.items)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        ))}
      </Table.Root>
      {stickyHeader && (
        <p
          data-zao-slot="readout"
          className="flex flex-wrap gap-x-4 gap-y-1 type-caption text-muted"
        >
          <span>
            Header{' '}
            <span className="font-medium text-default">{reading.stuck ? 'stuck' : 'resting'}</span>
          </span>
          <span>
            Group{' '}
            <span className="font-medium text-default">{requestsByDay[reading.group]!.label}</span>
          </span>
        </p>
      )}
    </div>
  );
}

/** Opt-in behaviors added to the basic Table, one block each. */
export function TableUpgrades() {
  return (
    <section
      className="docs-detail-section grid gap-5 border-t border-subtle pt-5"
      aria-labelledby="table-upgrades-heading"
    >
      <h2 id="table-upgrades-heading" className="type-heading">
        Upgrades
      </h2>
      <div className="grid min-w-0 gap-4">
        <article
          data-zao-specimen="table-sticky-header"
          className="grid min-w-0 gap-4"
          aria-labelledby="table-sticky-header-heading"
        >
          <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 id="table-sticky-header-heading" className="type-label font-medium">
              Stuck header
            </h3>
            <code className="type-code text-muted">stickyHeader</code>
            <span className="type-caption text-muted">Published</span>
          </header>
          <p className="max-w-2xl type-body text-muted">
            The column header stays in view while rows scroll beneath it. Once it sticks, its rule
            darkens and a plane appears under it; each day’s heading stacks below. Bound the frame’s
            height with className: without a bound, nothing sticks. Sample data.
          </p>
          <Tabs.Root defaultValue="upgraded">
            <Tabs.List variant="secondary" aria-label="Stuck header views">
              <Tabs.Tab value="basic">Basic</Tabs.Tab>
              <Tabs.Tab value="upgraded">Upgraded</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="basic" aria-label="Basic">
              <RequestsByDay stickyHeader={false} />
            </Tabs.Panel>
            <Tabs.Panel value="upgraded" aria-label="Upgraded">
              <RequestsByDay stickyHeader />
            </Tabs.Panel>
          </Tabs.Root>
          <p className="type-caption text-muted">Try: scroll the table.</p>
        </article>
      </div>
    </section>
  );
}
