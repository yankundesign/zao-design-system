export type NavSectionFigureKind = 'start' | 'foundations' | 'components';

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

function StartFigure() {
  return (
    <>
      <Solid
        outline={roundedOutline([
          [6, 34],
          [9, 32],
          [41, 32],
          [41, 35],
          [38, 37],
          [6, 37],
        ])}
        crease="M7.2 34.3H37.8L39.8 33"
      />
      <Solid
        outline={roundedOutline([
          [11, 23],
          [14, 21],
          [18, 21],
          [18, 32],
          [15, 34],
          [11, 34],
        ])}
        crease="M12.2 23.3H14.8L16.8 22"
      />
      <Solid
        outline={roundedOutline([
          [31, 23],
          [34, 21],
          [38, 21],
          [38, 32],
          [35, 34],
          [31, 34],
        ])}
        crease="M32.2 23.3H34.8L36.8 22"
      />
      <Solid
        outline={roundedOutline([
          [9, 21],
          [12, 19],
          [39, 19],
          [39, 22],
          [36, 24],
          [9, 24],
        ])}
        crease="M10.2 21.3H35.8L37.8 20"
      />
      <g className="docs-nav-figure-part">
        <Solid
          outline="M13.5 9.5Q13.8 9 14.5 8.8L16 7.8Q16.4 7.5 17.1 7.5H31.5Q32.1 7.5 32.5 8L34 9.5C35.5 13.5 39 17.5 44.5 17.5Q45.3 17.5 44.9 18.2L43.2 20.6Q42.9 21 42.1 21H5.9Q5.1 21 4.8 20.6L3.1 18.2Q2.7 17.5 3.5 17.5C9 17.5 12.5 13.5 13.5 9.5Z"
          crease="M4.5 18.4Q9.5 19.7 15.5 19.2H32.5Q38.5 19.7 43.5 18.4"
        />
      </g>
    </>
  );
}

function FoundationsFigure() {
  return (
    <>
      <Solid
        outline={roundedOutline([
          [3, 28],
          [6, 26],
          [45, 26],
          [45, 33],
          [42, 35],
          [3, 35],
        ])}
        crease="M4.2 28.3H41.8L43.8 27"
      />
      <Solid
        outline={roundedOutline([
          [6, 21],
          [9, 19],
          [42, 19],
          [42, 27],
          [39, 29],
          [6, 29],
        ])}
        crease="M7.2 21.3H38.8L40.8 20"
      />
      <g className="docs-nav-figure-part">
        <Solid
          outline={roundedOutline([
            [4, 16],
            [7, 14],
            [44, 14],
            [44, 19],
            [41, 21],
            [4, 21],
          ])}
          crease="M5.2 16.3H40.8L42.8 15"
        />
      </g>
      <Solid
        outline={roundedOutline([
          [21, 18],
          [24, 16],
          [36, 16],
          [36, 21],
          [33, 23],
          [21, 23],
        ])}
        crease="M22.2 18.3H32.8L34.8 17"
      />
      <Solid
        outline={roundedOutline([
          [18, 25],
          [21, 23],
          [33, 23],
          [33, 28],
          [30, 30],
          [18, 30],
        ])}
        crease="M19.2 25.3H29.8L31.8 24"
      />
      <Solid
        outline={roundedOutline([
          [15, 32],
          [18, 30],
          [32, 30],
          [32, 35],
          [29, 37],
          [15, 37],
        ])}
        crease="M16.2 32.3H28.8L30.8 31"
      />
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
      ) : (
        <ComponentsFigure />
      )}
    </svg>
  );
}
