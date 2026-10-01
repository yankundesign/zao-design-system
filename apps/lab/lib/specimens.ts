import type { ComponentType } from 'react';

export interface SpecimenMeta {
  id: string;
  title: string;
  tags: string[];
  description: string;
}

interface SpecimenModule {
  meta: SpecimenMeta;
  default: ComponentType;
}

interface WebpackContext {
  keys(): string[];
  (key: string): SpecimenModule;
}

declare const require: {
  context(directory: string, recursive: boolean, pattern: RegExp): WebpackContext;
};

// Webpack tracks the directory, so a new specimen needs only one .tsx file.
const modules = require.context('../specimens', true, /\.tsx$/);
const starterOrder = [
  'type',
  'color',
  'settings',
  'table',
  'agent-approval',
  'chat',
  'overlays',
  'states',
  'dashboard',
  'hero',
];

export const specimens = modules
  .keys()
  .map((key) => {
    const specimen = modules(key);
    if (!specimen.meta?.id || !specimen.default) {
      throw new Error(`${key} must export meta and a default specimen component.`);
    }
    return { ...specimen.meta, Component: specimen.default };
  })
  .sort((a, b) => {
    const left = starterOrder.indexOf(a.id);
    const right = starterOrder.indexOf(b.id);
    if (left >= 0 && right >= 0) return left - right;
    if (left >= 0) return -1;
    if (right >= 0) return 1;
    return a.title.localeCompare(b.title);
  });

if (new Set(specimens.map((specimen) => specimen.id)).size !== specimens.length) {
  throw new Error('Each specimen must have a unique meta.id.');
}
