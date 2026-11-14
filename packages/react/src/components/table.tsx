'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { useDrawingState } from './drawing.js';

export interface TableRootProps extends ComponentPropsWithRef<'table'> {
  /** A name for the native table and its keyboard-accessible scroll area. */
  'aria-label': string;
  /** Layout classes for the stationary outer frame. */
  className?: string;
  /** Classes for the native table, such as column sizing or a minimum width. */
  tableClassName?: string;
  'data-zao-theme'?: 'su' | 'yu';
  'data-zao-mode'?: 'light' | 'dark';
  /** Show placeholder rows as a still construction drawing while the host loads data. */
  drawing?: boolean;
  /** Polite loading status announced while drawing. */
  drawingLabel?: string;
  /**
   * Keep the column header in view while rows scroll beneath it. Bound the frame's height with
   * `className`; without a bound nothing sticks.
   */
  stickyHeader?: boolean;
}

export type TableCaptionProps = ComponentPropsWithRef<'caption'>;
export type TableHeaderProps = ComponentPropsWithRef<'thead'>;
export type TableBodyProps = ComponentPropsWithRef<'tbody'>;
export type TableFooterProps = ComponentPropsWithRef<'tfoot'>;

export interface TableRowProps extends ComponentPropsWithRef<'tr'> {
  /** Visual selection; expose the actual state with a labeled checkbox in the row. */
  selected?: boolean;
}

export interface TableHeadProps extends ComponentPropsWithRef<'th'> {
  /** Right-align comparable numbers and use tabular figures. */
  numeric?: boolean;
}

export interface TableCellProps extends ComponentPropsWithRef<'td'> {
  /** Right-align comparable numbers and use tabular figures. */
  numeric?: boolean;
}

/** Whether the nearest Root holds its header: a rowgroup heading then sticks under it. */
const StickyHeaderContext = createContext(false);

/** Publishes the header's and the group heads' measured sizes to the scroll area. */
function useStickyHeaderSizes(enabled: boolean) {
  const scrollArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = scrollArea.current;
    const table = area?.querySelector<HTMLTableElement>(':scope > table');
    if (!enabled || !area || !table) return;
    const measure = () => {
      const header = table.tHead?.getBoundingClientRect().height ?? 0;
      let group = 0;
      for (const head of table.querySelectorAll<HTMLElement>(
        ':scope > tbody > tr > [data-zao-group-head]',
      ))
        group = Math.max(group, head.getBoundingClientRect().height);
      area.style.setProperty('--zao-table-header-size', `${header}px`);
      area.style.setProperty('--zao-table-group-size', `${group}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(table);
    if (table.tHead) observer.observe(table.tHead);
    measure();
    return () => {
      observer.disconnect();
      area.style.removeProperty('--zao-table-header-size');
      area.style.removeProperty('--zao-table-group-size');
    };
  }, [enabled]);
  return scrollArea;
}

/** A stationary frame around a single reading plane, with native table semantics. */
function TableRoot({
  className,
  tableClassName,
  'aria-label': label,
  'data-zao-theme': theme,
  'data-zao-mode': mode,
  drawing = false,
  drawingLabel = 'Loading',
  stickyHeader = false,
  ...props
}: TableRootProps) {
  const root = useRef<HTMLDivElement>(null);
  const building = useDrawingState(drawing, root);
  const scrollArea = useStickyHeaderSizes(stickyHeader);
  return (
    <StickyHeaderContext value={stickyHeader}>
      <div
        ref={root}
        data-zao-component="table"
        data-zao-theme={theme}
        data-zao-mode={mode}
        data-zao-drawing={drawing ? '' : undefined}
        data-zao-building={building ? '' : undefined}
        data-zao-sticky-header={stickyHeader ? '' : undefined}
        aria-hidden={drawing || undefined}
        aria-busy={drawing || undefined}
        inert={drawing || undefined}
        className={`card-construction construction-shading construction-planes min-w-0 rounded-none border border-subtle bg-canvas text-default${stickyHeader ? ' flex flex-col' : ''}${drawing ? ' construction-drawing' : ''}${className ? ` ${className}` : ''}`}
      >
        <div
          ref={scrollArea}
          data-zao-slot="scroll-area"
          role="region"
          aria-label={`${label} scroll area`}
          tabIndex={0}
          className={`overflow-x-auto outline-focus${stickyHeader ? ' table-sticky-scroll min-h-0 flex-1 overflow-y-auto' : ''}`}
        >
          <table
            {...props}
            aria-label={label}
            data-zao-slot="table"
            className={`table-plane w-full ${stickyHeader ? 'table-sticky-header' : 'border-collapse'} text-left${tableClassName ? ` ${tableClassName}` : ''}`}
          />
        </div>
      </div>
      {drawing ? (
        <span className="button-loading-announcement" role="status">
          {drawingLabel}
        </span>
      ) : null}
    </StickyHeaderContext>
  );
}

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      {...props}
      data-zao-slot="caption"
      className={`px-4 py-3 text-left type-caption text-muted${className ? ` ${className}` : ''}`}
    />
  );
}

function TableHeader(props: TableHeaderProps) {
  return <thead {...props} data-zao-slot="header" />;
}

function TableBody(props: TableBodyProps) {
  return <tbody {...props} data-zao-slot="body" />;
}

function TableFooter(props: TableFooterProps) {
  return <tfoot {...props} data-zao-slot="footer" />;
}

function TableRow({ selected = false, ...props }: TableRowProps) {
  return <tr {...props} data-zao-slot="row" data-selected={selected ? '' : undefined} />;
}

function TableHead({ numeric = false, className, scope = 'col', ...props }: TableHeadProps) {
  // Under a held header, a rowgroup heading that spans columns is a group head.
  const groupHead =
    useContext(StickyHeaderContext) && scope === 'rowgroup' && Number(props.colSpan) > 1;
  return (
    <th
      {...props}
      scope={scope}
      data-zao-slot="head"
      data-zao-group-head={groupHead ? '' : undefined}
      className={[
        'px-3 py-2 align-middle',
        groupHead
          ? 'type-label font-medium text-default'
          : scope === 'row' || scope === 'rowgroup'
            ? 'type-body text-default'
            : 'type-label text-muted',
        numeric ? 'text-right figures-tabular' : 'text-left',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

function TableCell({ numeric = false, className, ...props }: TableCellProps) {
  return (
    <td
      {...props}
      data-zao-slot="cell"
      className={[
        'px-3 py-2 align-middle type-body text-default',
        numeric ? 'text-right figures-tabular' : 'text-left',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

export const Table = {
  Root: TableRoot,
  Caption: TableCaption,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
};
