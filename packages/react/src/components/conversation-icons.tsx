import type { SVGProps } from 'react';

/** Iconoir ArrowDown geometry kept local so Conversation adds no icon dependency. */
export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 4v16m0 0 7-7m-7 7-7-7" />
    </svg>
  );
}
