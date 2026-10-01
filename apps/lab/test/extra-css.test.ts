import { describe, expect, it } from 'vitest';
import type { StyleFile } from '@zao/engine';
import { resolveExtraCss } from '../lib/extra-css';

const style = (id: string, extendsId: string, extraCss?: string): StyleFile => ({
  id,
  name: id,
  extends: extendsId,
  author: 'yankun',
  modes: ['light'],
  params: {},
  ...(extraCss === undefined ? {} : { extraCss }),
});

describe('extra CSS inheritance', () => {
  const parent = style('parent', 'su', ':scope { background: linear-gradient(white, black) }');
  const library = { parent, su: style('su', 'su') };

  it('inherits from the nearest ancestor when the child field is empty or absent', () => {
    expect(resolveExtraCss(style('child', 'parent', ''), library)).toEqual({
      css: parent.extraCss,
      inheritedFrom: 'parent',
    });
    expect(resolveExtraCss(style('child', 'parent'), library)).toEqual({
      css: parent.extraCss,
      inheritedFrom: 'parent',
    });
  });

  it('uses an explicit child value instead of inherited CSS', () => {
    expect(resolveExtraCss(style('child', 'parent', ':scope { color: red }'), library)).toEqual({
      css: ':scope { color: red }',
      inheritedFrom: null,
    });
  });

  it('walks multiple ancestors and safely stops at a cycle', () => {
    expect(
      resolveExtraCss(style('child', 'middle'), {
        ...library,
        middle: style('middle', 'parent', ''),
      }),
    ).toEqual({ css: parent.extraCss, inheritedFrom: 'parent' });
    expect(
      resolveExtraCss(style('child', 'middle'), {
        middle: style('middle', 'child'),
      }),
    ).toEqual({ css: '', inheritedFrom: null });
  });
});
