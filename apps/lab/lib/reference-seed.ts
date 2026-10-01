import type { StyleFile } from '@zao/engine';

export interface ReferenceSeedChoice {
  referenceId: string;
  referenceTitle: string;
  name: string;
  currentStyle: StyleFile;
  savedStyles: StyleFile[];
  reservedStyleIds?: string[];
  mode: 'light' | 'dark';
  neutralStep: number;
  accentStep: number;
  neutralHex: string;
  accentHex: string;
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'reference-study'
  );
}

export function makeReferenceSeedDraft(choice: ReferenceSeedChoice): StyleFile {
  if (!choice.name.trim()) throw new Error('Name the draft style.');
  if (!choice.currentStyle.modes.includes(choice.mode))
    throw new Error('Choose a mode supported by the current style.');
  for (const [label, step] of [
    ['neutral', choice.neutralStep],
    ['accent', choice.accentStep],
  ] as const) {
    if (!Number.isInteger(step) || step < 1 || step > 12)
      throw new Error(`Choose a palette step from 1 to 12 for ${label}.`);
  }
  for (const color of [choice.neutralHex, choice.accentHex]) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Choose a source swatch or exact pixel.');
  }
  const base = slug(choice.name);
  const used = new Set([
    ...choice.savedStyles.map((style) => style.id),
    ...(choice.reservedStyleIds ?? []),
    choice.currentStyle.id,
    'su',
    'yu',
  ]);
  let id = base;
  let number = 2;
  while (used.has(id)) id = `${base}-${number++}`;
  const savedParent = choice.savedStyles.find((style) => style.id === choice.currentStyle.id);
  const parentIsSaved =
    choice.currentStyle.id === 'su' || choice.currentStyle.id === 'yu' || Boolean(savedParent);
  const hasUnsavedVisualChanges =
    savedParent !== undefined &&
    (JSON.stringify(choice.currentStyle.params) !== JSON.stringify(savedParent.params) ||
      (choice.currentStyle.extraCss ?? '') !== (savedParent.extraCss ?? ''));
  const inheritCurrentStyle = parentIsSaved && !hasUnsavedVisualChanges;
  return {
    id,
    name: choice.name.trim(),
    extends: inheritCurrentStyle ? choice.currentStyle.id : choice.currentStyle.extends,
    author: 'yankun',
    modes: [...choice.currentStyle.modes],
    references: [...new Set([...(choice.currentStyle.references ?? []), choice.referenceId])],
    notes: `Seeded from ${choice.referenceTitle}. Neutral ${choice.neutralHex} at ${choice.mode} step ${choice.neutralStep}; accent ${choice.accentHex} at ${choice.mode} step ${choice.accentStep}.`,
    params: {
      ...(inheritCurrentStyle ? {} : choice.currentStyle.params),
      'color.neutral.anchor': choice.neutralHex,
      [`color.neutral.pin.${choice.mode}.${choice.neutralStep}`]: choice.neutralHex,
      'color.accent.anchor': choice.accentHex,
      [`color.accent.pin.${choice.mode}.${choice.accentStep}`]: choice.accentHex,
    },
    ...(inheritCurrentStyle || !choice.currentStyle.extraCss
      ? {}
      : { extraCss: choice.currentStyle.extraCss }),
  };
}
