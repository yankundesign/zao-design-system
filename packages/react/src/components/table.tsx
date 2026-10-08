import type { ComponentPropsWithRef } from 'react';

export interface TableRootProps extends ComponentPropsWithRef<'table'> {
  /** A name for the native table and its keyboard-accessible scroll area. */
  'aria-label': string;
  /** Layout classes for the stationary outer frame. */
  className?: string;
  /** Classes for the native table, such as column sizing or a minimum width. */
  tableClassName?: string;
  'data-zao-theme'?: 'su' | 'yu';
  'data-zao-mode'?: 'light' | 'dark';
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

/** A stationary frame around a single reading plane, with native table semantics. */
function TableRoot({
  className,
  tableClassName,
  'aria-label': label,
  'data-zao-theme': theme,
  'data-zao-mode': mode,
  ...props
}: TableRootProps) {
  return (
    <div
      data-zao-component="table"
      data-zao-theme={theme}
      data-zao-mode={mode}
      className={`card-construction min-w-0 rounded-none border border-subtle bg-canvas text-default${className ? ` ${className}` : ''}`}
    >
      <div
        data-zao-slot="scroll-area"
        role="region"
        aria-label={`${label} scroll area`}
        tabIndex={0}
        className="overflow-x-auto outline-focus"
      >
        <table
          {...props}
          aria-label={label}
          data-zao-slot="table"
          className={`table-plane w-full border-collapse text-left${tableClassName ? ` ${tableClassName}` : ''}`}
        />
      </div>
    </div>
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
  return (
    <th
      {...props}
      scope={scope}
      data-zao-slot="head"
      className={[
        'px-3 py-2 align-middle',
        scope === 'row' || scope === 'rowgroup'
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
