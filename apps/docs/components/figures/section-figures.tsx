import type { SVGProps } from 'react';
import { Layer, Solid, block } from './figure-solid';
import { roundedOutline } from './outline';

export type SectionFigureKind = 'start' | 'foundations' | 'components' | 'charts';

/** When indexed, each part carries its assembly order so a larger drawing can seat it. */
interface FigureBodyProps {
  indexed?: boolean;
}

const at = (indexed: boolean | undefined, part: number) => (indexed ? part : undefined);

/** The pavilion with its parts set apart: base, posts, beam and roof. */
function StartFigure({ indexed }: FigureBodyProps) {
  return (
    <>
      <Solid {...block(6, 38, 33, 37)} part={at(indexed, 0)} />
      <Layer share={1 / 3}>
        <Solid {...block(11, 15, 21, 31)} part={at(indexed, 1)} />
        <Solid {...block(31, 35, 21, 31)} part={at(indexed, 1)} />
      </Layer>
      <Layer share={2 / 3}>
        <Solid {...block(9, 36, 14.5, 19)} part={at(indexed, 2)} />
      </Layer>
      <g className="docs-nav-figure-part">
        <Solid
          outline="M13.5 6.11Q13.8 5.83 14.5 5.72L16 5.17Q16.4 5 17.1 5H31.5Q32.1 5 32.5 5.28L34 6.11C35.5 8.34 39 10.56 44.5 10.56Q45.3 10.56 44.9 10.95L43.2 12.28Q42.9 12.51 42.1 12.51H5.9Q5.1 12.51 4.8 12.28L3.1 10.95Q2.7 10.56 3.5 10.56C9 10.56 12.5 8.34 13.5 6.11Z"
          crease="M4.5 11.06Q9.5 11.78 15.5 11.51H32.5Q38.5 11.78 43.5 11.06"
          part={at(indexed, 3)}
        />
      </g>
    </>
  );
}

// Bed joints run through every course; head joints shift half a brick from course to course.
const BOND_JOINTS = [
  'M5.6 21H29M5.6 26H40.4M5.6 31H40.4M41 26L44 24M41 31L44 29',
  'M17 16.4V20.6M17 16L20 14',
  'M11 21.4V25.6M23 21.4V25.6M35 21.4V25.6',
  'M17 26.4V30.6M29 26.4V30.6',
  'M11 31.4V35.6M23 31.4V35.6M35 31.4V35.6',
].join('');

/** Four courses of running bond; one brick lifts out of the top course. */
function FoundationsFigure({ indexed }: FigureBodyProps) {
  return (
    <>
      <Solid
        outline={roundedOutline([
          [5, 16],
          [8, 14],
          [32, 14],
          [32, 19],
          [44, 19],
          [44, 34],
          [41, 36],
          [5, 36],
        ])}
        crease={`M6.2 16.3H28.8L30.8 15M29.2 21.3H40.8L42.8 20${BOND_JOINTS}`}
        part={at(indexed, 0)}
      />
      <g className="docs-nav-figure-part">
        <Solid {...block(29, 41, 14, 21)} part={at(indexed, 1)} />
      </g>
    </>
  );
}

/** A bracket set: bearing block, arm, three blocks, a long arm and its top block. */
function ComponentsFigure({ indexed }: FigureBodyProps) {
  return (
    <>
      <Solid
        outline={roundedOutline([
          [21, 32],
          [24, 30],
          [30, 30],
          [30, 35],
          [27, 37],
          [21, 37],
        ])}
        crease="M22.2 32.3H26.8L28.8 31"
        part={at(indexed, 0)}
      />
      <Solid
        outline={roundedOutline([
          [16, 27],
          [19, 25],
          [35, 25],
          [33, 30],
          [30, 32],
          [18, 32],
        ])}
        crease="M17.2 27.3H31.8L33.8 26"
        part={at(indexed, 1)}
      />
      <Solid
        outline="M8.6 20H14.4Q15 20 15 20.6V22.4Q15 23 15.6 23H18.4Q19 23 19 23.6V24H29V23.6Q29 23 29.6 23H32.4Q33 23 33 22.4V20.6Q33 20 33.6 20H39.4Q40 20 40 20.6V22.4Q40 23 39.4 23H36.3Q35.8 23 35.4 23.5Q31.5 28 24 28Q16.5 28 12.6 23.5Q12.2 23 11.7 23H8.6Q8 23 8 22.4V20.6Q8 20 8.6 20Z"
        crease="M14 23.7Q18.5 26 24 26T34 23.7"
        part={at(indexed, 2)}
      />
      <Solid
        outline={roundedOutline([
          [7, 16],
          [10, 14],
          [20, 14],
          [20, 16],
          [18, 18],
          [15, 20],
          [9, 20],
          [7, 18],
        ])}
        crease="M8.2 16.3H16.8L18.8 15"
        part={at(indexed, 3)}
      />
      <Solid
        outline={roundedOutline([
          [31, 16],
          [34, 14],
          [44, 14],
          [44, 16],
          [42, 18],
          [39, 20],
          [33, 20],
          [31, 18],
        ])}
        crease="M32.2 16.3H40.8L42.8 15"
        part={at(indexed, 3)}
      />
      <Solid
        outline={roundedOutline([
          [19, 20],
          [22, 18],
          [32, 18],
          [32, 20],
          [30, 22],
          [27, 24],
          [21, 24],
          [19, 22],
        ])}
        crease="M20.2 20.3H28.8L30.8 19"
        part={at(indexed, 3)}
      />
      <g className="docs-nav-figure-part">
        <Solid
          outline="M4.7 11H10.3Q11 11 11 11.7V12.3Q11 13 11.7 13H16.3Q17 13 17 13.7V14.3Q17 15 17.7 15H30.3Q31 15 31 14.3V13.7Q31 13 31.7 13H36.3Q37 13 37 12.3V11.7Q37 11 37.7 11H43.3Q44 11 44 11.7V13.3Q44 14 43.3 14H40.3Q39.8 14 39.4 14.4Q33.5 20 24 20Q14.5 20 8.6 14.4Q8.2 14 7.7 14H4.7Q4 14 4 13.3V11.7Q4 11 4.7 11Z"
          crease="M10.5 15.2Q16.5 18 24 18T37.5 15.2"
          part={at(indexed, 4)}
        />
        <Solid
          outline={roundedOutline([
            [19, 8],
            [22, 6],
            [32, 6],
            [32, 8],
            [30, 13],
            [27, 15],
            [21, 15],
            [19, 10],
          ])}
          crease="M20.2 8.3H28.8L30.8 7"
          part={at(indexed, 5)}
        />
      </g>
    </>
  );
}

/** Posts of different heights on one plate: a bar chart built like timber. */
function ChartsFigure({ indexed }: FigureBodyProps) {
  const first = block(9, 15, 21, 31);
  const second = block(20, 26, 10, 31);
  const third = block(31, 37, 16, 31);
  return (
    <>
      <Solid
        outline={roundedOutline([
          [3, 31],
          [6, 29],
          [45, 29],
          [45, 34],
          [42, 36],
          [3, 36],
        ])}
        crease="M4.2 31.3H41.8L43.8 30"
        part={at(indexed, 0)}
      />
      <Solid {...first} part={at(indexed, 1)} />
      <g className="docs-nav-figure-part">
        <Solid {...second} part={at(indexed, 1)} />
      </g>
      <Solid {...third} part={at(indexed, 1)} />
    </>
  );
}

const bodies = {
  start: StartFigure,
  foundations: FoundationsFigure,
  components: ComponentsFigure,
  charts: ChartsFigure,
} as const;

/** Number of seating courses in each figure, for staggered assembly. */
export const sectionFigureCourses: Record<SectionFigureKind, number> = {
  start: 4,
  foundations: 2,
  components: 6,
  charts: 2,
};

/**
 * A section's construction figure, drawn in a 48 by 40 grid with a hairline that does not scale.
 * The nav draws it at 1:1; larger uses scale the grid and keep the same pen.
 */
export function SectionFigure({
  kind,
  indexed,
  className = 'docs-nav-figure h-10 w-12 shrink-0',
  ...props
}: { kind: SectionFigureKind; indexed?: boolean } & Omit<SVGProps<SVGSVGElement>, 'children'>) {
  const Body = bodies[kind];
  return (
    <svg
      viewBox="0 0 48 40"
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
      <Body indexed={indexed} />
    </svg>
  );
}
