import { converter, formatHex, toGamut } from 'culori';
import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

const SAMPLE_SIDE = 256;
const MAX_SWATCHES_PER_GROUP = 6;
const NEUTRAL_CHROMA = 0.035;
const toOklab = converter('oklab');
const toOklch = converter('oklch');
const toSrgb = toGamut('rgb', 'oklch');

export type ImageMimeType = 'image/png' | 'image/jpeg';
export type SwatchKind = 'neutral' | 'color';

export interface ExtractedSwatch {
  id: string;
  kind: SwatchKind;
  hex: string;
  share: number;
  lightness: number;
  chroma: number;
  hue: number | null;
}

export interface NeutralSummary {
  share: number;
  averageHue: number | null;
  averageChroma: number;
  lightnessMin: number;
  lightnessMax: number;
}

export interface ImageAnalysis {
  width: number;
  height: number;
  swatches: ExtractedSwatch[];
  neutrals: NeutralSummary | null;
  neutralChromaThreshold: number;
}

interface Pixel {
  l: number;
  a: number;
  b: number;
  weight: number;
}

interface Center {
  l: number;
  a: number;
  b: number;
}

export class ImageAnalysisError extends Error {}

export interface SampledPixel {
  x: number;
  y: number;
  hex: string;
  alpha: number;
}

export function imageMimeType(buffer: Buffer): ImageMimeType {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg';
  throw new ImageAnalysisError('Upload a PNG or JPG image.');
}

function distance(left: Center, right: Center) {
  const dl = left.l - right.l;
  const da = left.a - right.a;
  const db = left.b - right.b;
  return dl * dl + da * da + db * db;
}

function weightedMean(pixels: Pixel[]): Center {
  let total = 0;
  let l = 0;
  let a = 0;
  let b = 0;
  for (const pixel of pixels) {
    total += pixel.weight;
    l += pixel.l * pixel.weight;
    a += pixel.a * pixel.weight;
    b += pixel.b * pixel.weight;
  }
  return { l: l / total, a: a / total, b: b / total };
}

function cluster(pixels: Pixel[], kind: SwatchKind, totalWeight: number): ExtractedSwatch[] {
  if (!pixels.length) return [];
  const count = Math.min(MAX_SWATCHES_PER_GROUP, pixels.length);
  const centers: Center[] = [weightedMean(pixels)];
  while (centers.length < count) {
    let farthest: Pixel | undefined;
    let farthestScore = 0;
    for (const pixel of pixels) {
      const nearest = Math.min(...centers.map((center) => distance(pixel, center)));
      const score = nearest * pixel.weight;
      if (score > farthestScore) {
        farthest = pixel;
        farthestScore = score;
      }
    }
    if (!farthest || farthestScore < 1e-9) break;
    centers.push({ l: farthest.l, a: farthest.a, b: farthest.b });
  }

  const assignments = new Uint8Array(pixels.length);
  for (let iteration = 0; iteration < 10; iteration++) {
    const sums = centers.map(() => ({ l: 0, a: 0, b: 0, weight: 0 }));
    pixels.forEach((pixel, index) => {
      let selected = 0;
      let best = distance(pixel, centers[0]!);
      for (let center = 1; center < centers.length; center++) {
        const candidate = distance(pixel, centers[center]!);
        if (candidate < best) {
          best = candidate;
          selected = center;
        }
      }
      assignments[index] = selected;
      const sum = sums[selected]!;
      sum.l += pixel.l * pixel.weight;
      sum.a += pixel.a * pixel.weight;
      sum.b += pixel.b * pixel.weight;
      sum.weight += pixel.weight;
    });
    for (let center = 0; center < centers.length; center++) {
      const sum = sums[center]!;
      if (sum.weight)
        centers[center] = {
          l: sum.l / sum.weight,
          a: sum.a / sum.weight,
          b: sum.b / sum.weight,
        };
    }
  }

  const weights = centers.map(() => 0);
  pixels.forEach((pixel, index) => {
    weights[assignments[index]!]! += pixel.weight;
  });
  return centers
    .map((center, index) => {
      const oklch = toOklch({ mode: 'oklab', ...center });
      return {
        id: `${kind}-${index + 1}`,
        kind,
        hex: formatHex(toSrgb(oklch))!,
        share: weights[index]! / totalWeight,
        lightness: oklch.l,
        chroma: oklch.c,
        hue: oklch.c < 0.002 ? null : (oklch.h ?? null),
      };
    })
    .filter((swatch) => swatch.share > 0)
    .sort((left, right) => right.share - left.share)
    .map((swatch, index) => ({ ...swatch, id: `${kind}-${index + 1}` }));
}

function neutralSummary(pixels: Pixel[], totalWeight: number): NeutralSummary | null {
  if (!pixels.length) return null;
  const average = weightedMean(pixels);
  const averageLch = toOklch({ mode: 'oklab', ...average });
  const averageChroma =
    pixels.reduce((sum, pixel) => sum + Math.hypot(pixel.a, pixel.b) * pixel.weight, 0) /
    pixels.reduce((sum, pixel) => sum + pixel.weight, 0);
  return {
    share: pixels.reduce((sum, pixel) => sum + pixel.weight, 0) / totalWeight,
    averageHue: averageLch.c < 0.002 ? null : (averageLch.h ?? null),
    averageChroma,
    lightnessMin: Math.min(...pixels.map((pixel) => pixel.l)),
    lightnessMax: Math.max(...pixels.map((pixel) => pixel.l)),
  };
}

/** Reads only PNG/JPG bytes. Transparency contributes in proportion to pixel alpha. */
export async function analyzeImage(buffer: Buffer): Promise<ImageAnalysis> {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES)
    throw new ImageAnalysisError('Choose an image under 16 MB.');
  const mimeType = imageMimeType(buffer);
  const source = sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' });
  let metadata;
  try {
    metadata = await source.metadata();
  } catch {
    throw new ImageAnalysisError('This image could not be decoded. Choose a PNG or JPG.');
  }
  if (
    (mimeType === 'image/png' && metadata.format !== 'png') ||
    (mimeType === 'image/jpeg' && metadata.format !== 'jpeg') ||
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS
  )
    throw new ImageAnalysisError('This image is too large or is not a PNG or JPG.');

  let decoded;
  try {
    decoded = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' })
      .rotate()
      .resize(SAMPLE_SIDE, SAMPLE_SIDE, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ImageAnalysisError('This image could not be decoded. Choose a PNG or JPG.');
  }

  const neutralPixels: Pixel[] = [];
  const colorPixels: Pixel[] = [];
  let totalWeight = 0;
  for (let offset = 0; offset < decoded.data.length; offset += decoded.info.channels) {
    const alpha = decoded.data[offset + 3]! / 255;
    if (alpha === 0) continue;
    const oklab = toOklab({
      mode: 'rgb',
      r: decoded.data[offset]! / 255,
      g: decoded.data[offset + 1]! / 255,
      b: decoded.data[offset + 2]! / 255,
    });
    const pixel: Pixel = { l: oklab.l, a: oklab.a, b: oklab.b, weight: alpha };
    totalWeight += alpha;
    (Math.hypot(pixel.a, pixel.b) <= NEUTRAL_CHROMA ? neutralPixels : colorPixels).push(pixel);
  }
  if (totalWeight === 0)
    throw new ImageAnalysisError('This image has no visible pixels to extract.');
  return {
    width: metadata.width,
    height: metadata.height,
    swatches: [
      ...cluster(neutralPixels, 'neutral', totalWeight),
      ...cluster(colorPixels, 'color', totalWeight),
    ],
    neutrals: neutralSummary(neutralPixels, totalWeight),
    neutralChromaThreshold: NEUTRAL_CHROMA,
  };
}

/** Samples a displayed pixel from the original image, after EXIF orientation. */
export async function sampleImagePixel(
  buffer: Buffer,
  x: number,
  y: number,
): Promise<SampledPixel> {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES)
    throw new ImageAnalysisError('Choose an image under 16 MB.');
  imageMimeType(buffer);
  if (!Number.isInteger(x) || !Number.isInteger(y))
    throw new ImageAnalysisError('Pixel coordinates must be whole numbers.');
  let decoded;
  try {
    decoded = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' })
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ImageAnalysisError('This image could not be decoded. Choose a PNG or JPG.');
  }
  if (x < 0 || y < 0 || x >= decoded.info.width || y >= decoded.info.height)
    throw new ImageAnalysisError(
      `Pixel coordinates must fit within ${decoded.info.width} × ${decoded.info.height}.`,
    );
  const offset = (y * decoded.info.width + x) * decoded.info.channels;
  const channels = [decoded.data[offset]!, decoded.data[offset + 1]!, decoded.data[offset + 2]!];
  return {
    x,
    y,
    hex: `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`,
    alpha: decoded.data[offset + 3]! / 255,
  };
}
