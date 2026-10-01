import type { StyleFile } from '@zao/engine';

/** An empty child field inherits the nearest ancestor's island CSS. */
export function resolveExtraCss(style: StyleFile, library: Record<string, StyleFile>) {
  if (style.extraCss?.trim()) return { css: style.extraCss, inheritedFrom: null };

  const visited = new Set([style.id]);
  let parentId = style.extends;
  while (!visited.has(parentId)) {
    visited.add(parentId);
    const parent = library[parentId];
    if (!parent) break;
    if (parent.extraCss?.trim()) return { css: parent.extraCss, inheritedFrom: parent.name };
    parentId = parent.extends;
  }
  return { css: '', inheritedFrom: null };
}
