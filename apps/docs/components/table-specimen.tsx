'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'iconoir-react';
import { Button, Menu, Table } from '@zao/react';

const requests = [
  {
    id: 'REQ-01Il10',
    name: 'Access review',
    owner: 'Lin Chen',
    items: 24,
    status: 'Ready',
  },
  {
    id: 'REQ-2048',
    name: 'Usage summary',
    owner: 'Mara Wu',
    items: 1084,
    status: 'Running',
  },
  {
    id: 'REQ-0137',
    name: 'Policy update',
    owner: 'Noah Park',
    items: 8,
    status: 'Needs review',
  },
  {
    id: 'REQ-0962',
    name: 'Archive export',
    owner: 'Iris Hale',
    items: 306,
    status: 'Blocked',
  },
  {
    id: 'REQ-1032',
    name: 'Membership sync',
    owner: 'Lin Chen',
    items: 24,
    status: 'Ready',
  },
  {
    id: 'REQ-1186',
    name: 'Storage audit',
    owner: 'Mara Wu',
    items: 52,
    status: 'Needs review',
  },
] as const;

type RequestRecord = (typeof requests)[number];
type SortColumn = 'request' | 'items';
type SortDirection = 'ascending' | 'descending';
type Sort = { column: SortColumn; direction: SortDirection };

const formatItems = (value: number) => value.toLocaleString('en-US');

/** Read, sort, and select records on one steady content plane. */
export function TableSpecimen() {
  const [sort, setSort] = useState<Sort | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<RequestRecord[] | null>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const comparisonId = useId();
  const allSelected = selected.length === requests.length;
  const partlySelected = selected.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = partlySelected;
  }, [partlySelected]);

  const rows = requests
    .map((request, index) => ({ request, index }))
    .sort((a, b) => {
      if (!sort) return a.index - b.index;
      const value =
        sort.column === 'request'
          ? a.request.name.localeCompare(b.request.name, 'en')
          : a.request.items - b.request.items;
      return value * (sort.direction === 'ascending' ? 1 : -1) || a.index - b.index;
    })
    .map(({ request }) => request);

  function nextDirection(column: SortColumn): SortDirection {
    return sort?.column === column && sort.direction === 'ascending' ? 'descending' : 'ascending';
  }

  function toggleSort(column: SortColumn) {
    setSort({ column, direction: nextDirection(column) });
  }

  function toggleSelection(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
    setComparison(null);
  }

  function clearSelection() {
    setSelected([]);
    setComparison(null);
  }

  function sortIndicator(column: SortColumn) {
    const active = sort?.column === column;
    const Icon = active && sort.direction === 'descending' ? ArrowDown : ArrowUp;
    return <Icon className={`size-4 shrink-0${active ? '' : ' invisible'}`} aria-hidden="true" />;
  }

  return (
    <div data-zao-specimen="table" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <h3 className="type-heading">Recent requests</h3>
          <span className="type-caption figures-tabular text-muted">6 requests</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            disabled={selected.length < 2}
            aria-controls={comparisonId}
            onClick={() => setComparison(rows.filter((request) => selected.includes(request.id)))}
          >
            Compare selected
          </Button>
          <Menu
            trigger="Table actions"
            size="small"
            items={[
              { label: 'Reset sorting', disabled: sort === null, onSelect: () => setSort(null) },
              {
                label: 'Clear selection',
                disabled: selected.length === 0,
                onSelect: clearSelection,
              },
            ]}
          />
        </div>
      </div>

      <Table.Root aria-label="Recent requests">
        <Table.Caption className="sr-only">
          Six operations requests. Sort by Request or Items, then select requests to compare.
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-12">
              <label className="flex size-6 cursor-pointer items-center justify-center">
                <input
                  ref={selectAll}
                  type="checkbox"
                  aria-label="Select all requests"
                  checked={allSelected}
                  onChange={() => {
                    setSelected(allSelected ? [] : requests.map((request) => request.id));
                    setComparison(null);
                  }}
                  className="table-checkbox size-4 cursor-pointer outline-focus"
                />
              </label>
            </Table.Head>
            <Table.Head
              className="w-full"
              aria-sort={sort?.column === 'request' ? sort.direction : undefined}
            >
              <Button
                variant="quiet"
                size="small"
                className="-ml-2"
                aria-label={`Sort by request, ${nextDirection('request')}`}
                onClick={() => toggleSort('request')}
              >
                <span
                  className={`inline-flex items-center gap-2 type-label ${sort?.column === 'request' ? 'text-default' : 'text-muted'}`}
                >
                  Request
                  {sortIndicator('request')}
                </span>
              </Button>
            </Table.Head>
            <Table.Head className="whitespace-nowrap">ID</Table.Head>
            <Table.Head className="whitespace-nowrap">Owner</Table.Head>
            <Table.Head
              numeric
              className="whitespace-nowrap"
              aria-sort={sort?.column === 'items' ? sort.direction : undefined}
            >
              <Button
                variant="quiet"
                size="small"
                className="-mr-2 ml-auto"
                aria-label={`Sort by items, ${nextDirection('items')}`}
                onClick={() => toggleSort('items')}
              >
                <span
                  className={`inline-flex items-center gap-2 type-label ${sort?.column === 'items' ? 'text-default' : 'text-muted'}`}
                >
                  {sortIndicator('items')}
                  Items
                </span>
              </Button>
            </Table.Head>
            <Table.Head className="whitespace-nowrap">Status</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((request) => {
            const isSelected = selected.includes(request.id);
            return (
              <Table.Row key={request.id} selected={isSelected} className="group">
                <Table.Cell>
                  <label className="flex size-6 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${request.name}`}
                      checked={isSelected}
                      onChange={() => toggleSelection(request.id)}
                      className="table-checkbox size-4 cursor-pointer outline-focus"
                    />
                  </label>
                </Table.Cell>
                <Table.Head scope="row" className="whitespace-nowrap font-medium">
                  {request.name}
                </Table.Head>
                <Table.Cell
                  className={`whitespace-nowrap type-code figures-id ${isSelected ? 'text-default' : 'text-muted'} group-hover:text-default group-focus-within:text-default`}
                >
                  {request.id}
                </Table.Cell>
                <Table.Cell
                  className={`whitespace-nowrap ${isSelected ? 'text-default' : 'text-muted'} group-hover:text-default group-focus-within:text-default`}
                >
                  {request.owner}
                </Table.Cell>
                <Table.Cell numeric className="whitespace-nowrap">
                  {formatItems(request.items)}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <span className="type-caption">{request.status}</span>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>

      <p className="type-caption figures-tabular text-muted" aria-hidden="true">
        {selected.length === 0 ? 'No selection' : `${selected.length} selected`}
      </p>
      <p className="sr-only" role="status">
        {selected.length} of {requests.length} requests selected
        {sort
          ? ` · Sorted by ${sort.column === 'request' ? 'Request' : 'Items'}, ${sort.direction}`
          : ''}
      </p>
      <div id={comparisonId} aria-live="polite" aria-atomic="true" className="-mt-4">
        {comparison && (
          <section
            aria-label="Selected requests comparison"
            className="mt-4 flex flex-col gap-3 border-t border-subtle pt-4"
          >
            <h4 className="type-label font-medium">Selected requests</h4>
            <ul className="flex flex-col gap-2">
              {comparison.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 type-body"
                >
                  <span className="font-medium">{request.name}</span>
                  <span className="type-caption figures-tabular text-muted">
                    {formatItems(request.items)} items · {request.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="type-caption figures-tabular text-muted">
              Total items:{' '}
              {formatItems(comparison.reduce((total, request) => total + request.items, 0))}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
