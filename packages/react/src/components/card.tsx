import type { ComponentPropsWithRef } from 'react';

export type CardProps = ComponentPropsWithRef<'div'>;

/** A grounded content surface; native actions belong inside its stationary frame. */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`card-construction rounded-surface border border-subtle bg-surface p-4 text-default${className ? ` ${className}` : ''}`}
      {...props}
      data-zao-component="card"
    />
  );
}
