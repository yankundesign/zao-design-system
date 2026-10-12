export type Point = readonly [number, number];

/** Round the geometry itself so the parts of a figure share a softly worked edge. */
export function roundedOutline(points: readonly Point[], radius = 0.6) {
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

export interface SolidGeometry {
  outline: string;
  crease?: string;
}
