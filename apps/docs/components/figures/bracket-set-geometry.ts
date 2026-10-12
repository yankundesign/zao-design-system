import { roundedOutline } from './outline';
import type { Point, SolidGeometry } from './outline';

/**
 * A column-head bracket set (柱头铺作), drawn with the nav figures' pen: front faces in one plane,
 * one receding direction up and to the right, softly worked corners and lighter creases.
 *
 * Every dimension is in fen (分), the module of Yingzao Fashi. An arm is one cai (材), 15 fen
 * high. The main bearing block is 32 wide and 20 high, split 8, 4 and 8 into ear, level and
 * tapered seat; small blocks are 14 wide and 10 high, split 4, 2 and 4. The first arm is 62 long,
 * the long arm 92, and both ends are cut in four straight segments (卷杀).
 */

/** The receding edge of every part: right and up, the same direction as the depth axis. */
const DEPTH: Point = [5, -3.4];
const RADIUS = 0.8;
/** Figure origin: the centre line, and the seat of the main bearing block. */
const ORIGIN: Point = [62, 92];

const [dx, dy] = DEPTH;
const round = (value: number) => Number(value.toFixed(2));
/** Convert fen from the origin (x right, y up) to figure units (y down). */
const pt = (x: number, y: number): Point => [round(ORIGIN[0] + x), round(ORIGIN[1] - y)];
const back = (point: Point): Point => [round(point[0] + dx), round(point[1] + dy)];

/** The front-top edge and most of the top-right edge, drawn lighter than the outline. */
function crease(left: Point, right: Point) {
  return `M${round(left[0] + 0.4 * dx)} ${round(left[1] - 0.15 * dy)}H${round(
    right[0] - 0.07 * dx,
  )}L${round(right[0] + 0.6 * dx)} ${round(right[1] + 0.5 * dy)}`;
}

/** A square-cut timber, centred on x, from bottom to top. */
function timber(x: number, width: number, bottom: number, top: number): SolidGeometry {
  const topLeft = pt(x - width / 2, top);
  const topRight = pt(x + width / 2, top);
  const bottomRight = pt(x + width / 2, bottom);
  return {
    outline: roundedOutline(
      [
        topLeft,
        back(topLeft),
        back(topRight),
        back(bottomRight),
        bottomRight,
        pt(x - width / 2, bottom),
      ],
      RADIUS,
    ),
    crease: crease(topLeft, topRight),
  };
}

/**
 * A bearing block (斗): ear and level above, then a seat (欹) that narrows with a slight hollow.
 * Ear, level and seat heights follow the manual's 4 : 2 : 4 split.
 */
function dou(x: number, width: number, bottom: number, height: number, inset: number) {
  const ear = bottom + height * 0.6;
  const level = bottom + height * 0.4;
  const half = width / 2;
  const top = bottom + height;
  const topLeft = pt(x - half, top);
  const topRight = pt(x + half, top);
  // The seat narrows with a shallow hollow, so its sides read as cut, not straight.
  const hollow = (side: 1 | -1) =>
    pt(x + side * (half - inset * 0.7), bottom + (level - bottom) * 0.45);
  const seat = (side: 1 | -1) => pt(x + side * (half - inset), bottom);
  const levelPoint = (side: 1 | -1) => pt(x + side * half, level);
  return {
    outline: roundedOutline(
      [
        topLeft,
        back(topLeft),
        back(topRight),
        back(levelPoint(1)),
        back(hollow(1)),
        back(seat(1)),
        seat(1),
        seat(-1),
        hollow(-1),
        levelPoint(-1),
      ],
      RADIUS,
    ),
    // The front top, then the ear line that marks the mouth of the block.
    crease: `${crease(topLeft, topRight)}M${round(topLeft[0] + 0.4 * dx)} ${pt(0, ear)[1]}H${round(
      topRight[0] - 0.07 * dx,
    )}`,
  };
}

/**
 * A bracket arm (栱), one cai high. Each end keeps 6 fen at its tip; the 9 fen below rise toward
 * the tip in four straight cuts of equal length.
 */
function gong(length: number, bottom: number, cutLength: number) {
  const height = 15;
  const top = bottom + height;
  const tip = top - 6;
  const half = length / 2;
  const cut = (side: 1 | -1) =>
    [0, 1, 2, 3, 4].map((step) => {
      const share = step / 4;
      // Shallow first, steeper toward the tip, as when the drop and the length are each divided
      // into four and joined.
      return pt(
        side * (half - cutLength + cutLength * share),
        bottom + (tip - bottom) * share * share,
      );
    });
  const topLeft = pt(-half, top);
  const topRight = pt(half, top);
  const right = cut(1);
  const left = cut(-1);
  return {
    outline: roundedOutline(
      [
        topLeft,
        back(topLeft),
        back(topRight),
        back(right[4]!),
        ...right.slice().reverse(),
        ...left,
      ],
      RADIUS,
    ),
    crease: crease(topLeft, topRight),
  };
}

export interface BracketPart extends SolidGeometry {
  /** Assembly course, bottom to top. Parts on one course seat together. */
  course: number;
  name: string;
}

const SMALL = { width: 14, height: 10, inset: 2 };
const CENTRE_BLOCK = { width: 16, height: 10, inset: 2 };

function blockCourse(course: number, bottom: number, offset: number, label: string): BracketPart[] {
  return [
    {
      course,
      name: `${label}, left`,
      ...dou(-offset, SMALL.width, bottom, SMALL.height, SMALL.inset),
    },
    {
      course,
      name: `${label}, centre`,
      ...dou(0, CENTRE_BLOCK.width, bottom, CENTRE_BLOCK.height, CENTRE_BLOCK.inset),
    },
    {
      course,
      name: `${label}, right`,
      ...dou(offset, SMALL.width, bottom, SMALL.height, SMALL.inset),
    },
  ];
}

/** Bottom to top: main bearing block, first arm, blocks, long arm, blocks, beam. */
export const bracketSetParts: BracketPart[] = [
  { course: 0, name: 'Main bearing block (栌斗)', ...dou(0, 32, 0, 20, 4) },
  { course: 1, name: 'First arm (泥道栱)', ...gong(62, 20, 14) },
  ...blockCourse(2, 35, 24, 'Small block (散斗)'),
  { course: 3, name: 'Long arm (慢栱)', ...gong(92, 45, 12) },
  ...blockCourse(4, 60, 39, 'Small block (散斗)'),
  { course: 5, name: 'Beam (柱头方)', ...timber(0, 116, 70, 85) },
];

export const bracketSetCourses = 6;

/** Figure bounds with room for the receding edges and the stroke. */
export const bracketSetViewBox = '2 1.5 126 92';
export const bracketSetBounds = { x: 2, y: 1.5, width: 126, height: 92 } as const;

export interface BracketCourse {
  course: number;
  /** The part's name in the manual and in English, and its drawn size in fen. */
  name: string;
  term: string;
  size: string;
  /** Front-face extent in figure units: one span per part on the course, left to right. */
  spans: readonly (readonly [number, number])[];
  /** Vertical centre of the course's front faces at rest, in figure units. */
  centre: number;
}

const span = (x: number, width: number) =>
  [pt(x - width / 2, 0)[0], pt(x + width / 2, 0)[0]] as const;
const centre = (bottom: number, top: number) => round(ORIGIN[1] - (bottom + top) / 2);

/** What the ruler measures and the caption names when a course is picked, bottom to top. */
export const bracketCourses: readonly BracketCourse[] = [
  {
    course: 0,
    term: '栌斗',
    name: 'Main bearing block',
    size: '32 × 20 fen',
    spans: [span(0, 32)],
    centre: centre(0, 20),
  },
  {
    course: 1,
    term: '泥道栱',
    name: 'First arm',
    size: '62 × 15 fen',
    spans: [span(0, 62)],
    centre: centre(20, 35),
  },
  {
    course: 2,
    term: '散斗',
    name: 'Small blocks',
    size: '14 × 10 fen, centre 16',
    spans: [span(-24, SMALL.width), span(0, CENTRE_BLOCK.width), span(24, SMALL.width)],
    centre: centre(35, 45),
  },
  {
    course: 3,
    term: '慢栱',
    name: 'Long arm',
    size: '92 × 15 fen',
    spans: [span(0, 92)],
    centre: centre(45, 60),
  },
  {
    course: 4,
    term: '散斗',
    name: 'Small blocks',
    size: '14 × 10 fen, centre 16',
    spans: [span(-39, SMALL.width), span(0, CENTRE_BLOCK.width), span(39, SMALL.width)],
    centre: centre(60, 70),
  },
  {
    course: 5,
    term: '柱头方',
    name: 'Beam',
    size: '15 fen high, one cai',
    spans: [span(0, 116)],
    centre: centre(70, 85),
  },
];
