import type { CSSProperties, ReactNode } from 'react';

export type NavSectionFigureKind = 'start' | 'foundations' | 'components' | 'charts';

type Point = readonly [number, number];

// Round the geometry itself so the small parts share a softly worked edge.
function roundedOutline(points: readonly Point[], radius = 0.6) {
  const number = (value: number) => Number(value.toFixed(2));
  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    const before = Math.hypot(previous[0] - point[0], previous[1] - point[1]);
    const after = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const inset = Math.min(radius, before / 2, after / 2);
    const toward = (other: Point, length: number) =>
      `${number(point[0] + ((other[0] - point[0]) * inset) / length)} ${number(
        point[1] + ((other[1] - point[1]) * inset) / length,
      )}`;
    return {
      before: toward(previous, before),
      point: `${point[0]} ${point[1]}`,
      after: toward(next, after),
    };
  });
  return (
    corners
      .map(
        (corner, index) =>
          `${index === 0 ? 'M' : 'L'}${corner.before}Q${corner.point} ${corner.after}`,
      )
      .join('') + 'Z'
  );
}

function Solid({ outline, crease }: { outline: string; crease?: string }) {
  return (
    <>
      <path d={outline} fill="var(--zao-color-bg-canvas)" vectorEffect="non-scaling-stroke" />
      {crease && (
        <path
          className="docs-nav-figure-detail"
          d={crease}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </>
  );
}

/** A rectangular solid: front face from x0 to x1, back edge at top, front edge at bottom. */
function block(x0: number, x1: number, top: number, bottom: number) {
  return {
    outline: roundedOutline([
      [x0, top + 2],
      [x0 + 3, top],
      [x1 + 3, top],
      [x1 + 3, bottom - 2],
      [x1, bottom],
      [x0, bottom],
    ]),
    crease: `M${x0 + 1.2} ${top + 2.3}H${x1 - 0.2}L${x1 + 1.8} ${top + 1}`,
  };
}

/** A layer of an exploded assembly rises a share of the part's lift, so its gaps open evenly. */
function Layer({ share, children }: { share: number; children: ReactNode }) {
  return (
    <g
      className="docs-nav-figure-layer"
      style={{ '--docs-nav-figure-share': share } as CSSProperties}
    >
      {children}
    </g>
  );
}

/** The pavilion with its parts set apart: base, posts, beam and roof. */
function StartFigure() {
  return (
    <>
      <Solid {...block(6, 38, 33, 37)} />
      <Layer share={1 / 3}>
        <Solid {...block(11, 15, 21, 31)} />
        <Solid {...block(31, 35, 21, 31)} />
      </Layer>
      <Layer share={2 / 3}>
        <Solid {...block(9, 36, 14.5, 19)} />
      </Layer>
      <g className="docs-nav-figure-part">
        <Solid
          outline="M13.5 6.11Q13.8 5.83 14.5 5.72L16 5.17Q16.4 5 17.1 5H31.5Q32.1 5 32.5 5.28L34 6.11C35.5 8.34 39 10.56 44.5 10.56Q45.3 10.56 44.9 10.95L43.2 12.28Q42.9 12.51 42.1 12.51H5.9Q5.1 12.51 4.8 12.28L3.1 10.95Q2.7 10.56 3.5 10.56C9 10.56 12.5 8.34 13.5 6.11Z"
          crease="M4.5 11.06Q9.5 11.78 15.5 11.51H32.5Q38.5 11.78 43.5 11.06"
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
function FoundationsFigure() {
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
      />
      <g className="docs-nav-figure-part">
        <Solid {...block(29, 41, 14, 21)} />
      </g>
    </>
  );
}

function ComponentsFigure() {
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
      />
      <Solid
        outline="M8.6 20H14.4Q15 20 15 20.6V22.4Q15 23 15.6 23H18.4Q19 23 19 23.6V24H29V23.6Q29 23 29.6 23H32.4Q33 23 33 22.4V20.6Q33 20 33.6 20H39.4Q40 20 40 20.6V22.4Q40 23 39.4 23H36.3Q35.8 23 35.4 23.5Q31.5 28 24 28Q16.5 28 12.6 23.5Q12.2 23 11.7 23H8.6Q8 23 8 22.4V20.6Q8 20 8.6 20Z"
        crease="M14 23.7Q18.5 26 24 26T34 23.7"
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
      />
      <g className="docs-nav-figure-part">
        <Solid
          outline="M4.7 11H10.3Q11 11 11 11.7V12.3Q11 13 11.7 13H16.3Q17 13 17 13.7V14.3Q17 15 17.7 15H30.3Q31 15 31 14.3V13.7Q31 13 31.7 13H36.3Q37 13 37 12.3V11.7Q37 11 37.7 11H43.3Q44 11 44 11.7V13.3Q44 14 43.3 14H40.3Q39.8 14 39.4 14.4Q33.5 20 24 20Q14.5 20 8.6 14.4Q8.2 14 7.7 14H4.7Q4 14 4 13.3V11.7Q4 11 4.7 11Z"
          crease="M10.5 15.2Q16.5 18 24 18T37.5 15.2"
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
        />
      </g>
    </>
  );
}

/** Posts of different heights on one plate: a bar chart built like timber. */
function ChartsFigure() {
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
      />
      <Solid {...first} />
      <g className="docs-nav-figure-part">
        <Solid {...second} />
      </g>
      <Solid {...third} />
    </>
  );
}

export function NavSectionFigure({ kind }: { kind: NavSectionFigureKind }) {
  return (
    <svg
      viewBox="0 0 48 40"
      className="docs-nav-figure h-10 w-12 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'start' ? (
        <StartFigure />
      ) : kind === 'foundations' ? (
        <FoundationsFigure />
      ) : kind === 'charts' ? (
        <ChartsFigure />
      ) : (
        <ComponentsFigure />
      )}
    </svg>
  );
}
