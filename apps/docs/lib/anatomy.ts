/** Docs-only drawing parameters approved as D13 A. */
export const anatomyDefaults = {
  explodeContactMultiplier: 18,
  projectionAngleDegrees: 0,
  strokeHairlineMultiplier: 1,
} as const;

export const anatomyKinds = [
  'button',
  'card',
  'menu',
  'switch',
  'tabs',
  'text-field',
  'progress',
] as const;
export type AnatomyKind = (typeof anatomyKinds)[number];
export interface AnatomyParameters {
  explodeContactMultiplier: number;
  projectionAngleDegrees: number;
  strokeHairlineMultiplier: number;
}
export interface AnatomyPoint {
  x: number;
  y: number;
}
export interface AnatomyRect extends AnatomyPoint {
  width: number;
  height: number;
}
interface ShapePaint {
  id: string;
  part: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
}
export type AnatomyShape =
  | (ShapePaint & AnatomyRect & { type: 'rect'; radius?: number; facet?: number })
  | (ShapePaint & { type: 'polygon'; points: AnatomyPoint[] })
  | (ShapePaint & { type: 'path'; d: string; transform: string; bounds: AnatomyRect })
  | (ShapePaint & { type: 'line'; from: AnatomyPoint; to: AnatomyPoint });
export interface AnatomyReading extends AnatomyPoint {
  id: string;
  part: string;
  text: string;
  width: number;
  height: number;
  fill: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  direction: string;
}
export interface AnatomyPart {
  id: string;
  name: string;
  description: string;
  anchor: AnatomyPoint;
}
export interface AnatomyScene {
  kind: AnatomyKind;
  title: string;
  description: string;
  native: AnatomyRect;
  tokens: {
    contact: number;
    lift: number;
    hairline: number;
    fen: number;
    annotationLineHeight: number;
    axis: AnatomyPoint;
  };
  shapes: AnatomyShape[];
  readings: AnatomyReading[];
  parts: AnatomyPart[];
  /** Raw geometry/paint remains available for the source-vs-drawing contract. */
  source: Record<string, unknown>;
}
export interface AnatomyConfiguration {
  kind: AnatomyKind;
  mode: 'light' | 'dark';
  direction: 'ltr' | 'rtl';
  parameters: AnatomyParameters;
  /** Effective inherited custom properties, copied into the isolated source document. */
  variables: Record<string, string>;
}

export const anatomyChannel = 'zao-docs-anatomy-v1';
