export type Mode = 'light' | 'dark';

export interface RampInput {
  hue: number;
  chroma: number;
  solid?: Partial<Record<Mode, number>>;
  lightness?: Record<Mode, number[]>;
  chromaCurve?: number[];
  hueDrift?: number;
  pins?: Partial<Record<Mode, Record<number, string>>>;
  anchor?: string;
}

export interface FinishInput {
  neutral: RampInput;
  accent: RampInput;
  success: RampInput;
  warning: RampInput;
  danger: RampInput;
  contrast: number;
  extraRamps?: Record<string, RampInput>;
}

export type ParameterKind =
  | 'number'
  | 'hue'
  | 'chroma'
  | 'lightness'
  | 'color'
  | 'curve'
  | 'step'
  | 'font'
  | 'easing'
  | 'duration'
  | 'enum';
export type Layer = 'finish' | 'mode' | 'structure';

export interface Parameter {
  id: string;
  group: string;
  label: string;
  kind: ParameterKind;
  range?: [number, number];
  unit: string;
  layer: Layer;
  perMode: boolean;
  cssVariables: string[];
  tokenPath: string;
  options?: string[];
}

export interface StyleFile {
  $schema?: string;
  id: string;
  name: string;
  extends: string;
  author: string;
  modes: Mode[];
  tags?: string[];
  references?: string[];
  notes?: string;
  params: Record<string, unknown>;
  extraCss?: string;
  sources?: Record<string, string>;
  generated?: boolean;
  provenance?: StyleProvenance;
}

export type StyleProvenance =
  | { operation: 'mix'; base: string; groups: Record<string, string> }
  | { operation: 'interpolate'; from: string; to: string; t: number }
  | {
      operation: 'sweep';
      source: string;
      parameter: string;
      values: unknown[];
      index: number;
    }
  | {
      operation: 'vary';
      source: string;
      params: string[];
      spread: number;
      count: number;
      seed: number;
      index: number;
    };

export interface CssContext {
  theme: 'su' | 'yu';
  mode: Mode;
  baseVariables: Record<string, string>;
  baselines?: Record<string, StyleFile>;
  paletteInput?: FinishInput;
  paletteAliases?: Record<string, { ramp: string; mode: Mode; step: number | 'contrast' }>;
}
