import type { CSSProperties, SVGProps } from 'react';
import { Solid } from './figure-solid';
import { bracketSetParts, bracketSetViewBox } from './bracket-set-geometry';

/**
 * The column-head bracket set at hero scale, measured in fen. Each part carries its course, so a
 * course can be picked, and the courses can open apart; the drawing is complete without motion.
 */
export function BracketSetFigure({
  picked = null,
  className,
  ...props
}: Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'> & { picked?: number | null }) {
  return (
    <svg
      viewBox={bracketSetViewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {bracketSetParts.map((part) => (
        <g
          key={part.name}
          className="landing-bracket-part"
          data-course={part.course}
          data-picked={picked === part.course ? '' : undefined}
          data-raised={picked !== null && part.course >= picked ? '' : undefined}
          style={{ '--course': part.course } as CSSProperties}
        >
          <Solid outline={part.outline} crease={part.crease} />
        </g>
      ))}
    </svg>
  );
}
