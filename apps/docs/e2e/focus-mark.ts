import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * The visible keyboard focus mark. Button, IconButton and Switch draw four ink brackets on
 * their own ::after, outside the part and independent of the face (finish plan V12, Oct 11);
 * forced colors swap them for a solid system outline. Every other control keeps the outside
 * outline.
 */
export interface FocusMark {
  kind: 'brackets' | 'outline' | 'none';
  /** Gap between the native box and the mark, in px. */
  offset: number;
  /** Stroke width, in px. */
  width: number;
}

export function readFocusMark(target: Locator): Promise<FocusMark> {
  return target.evaluate((node) => {
    const css = getComputedStyle(node);
    const focused = node.matches(':focus-visible') || node.hasAttribute('data-zao-focus-visible');
    if (node.classList.contains('focus-brackets') && css.outlineStyle === 'none') {
      // The brackets are the corners of the ::after outline, cut out by an even-odd polygon.
      const after = getComputedStyle(node, '::after');
      const shown =
        focused &&
        after.content !== 'none' &&
        Number.parseFloat(after.opacity) > 0.99 &&
        after.outlineStyle === 'solid' &&
        after.clipPath.startsWith('polygon(evenodd');
      return {
        kind: shown ? 'brackets' : 'none',
        offset: Number.parseFloat(after.outlineOffset),
        width: Number.parseFloat(after.outlineWidth),
      };
    }
    const outline = css.outlineStyle !== 'none' && Number.parseFloat(css.outlineWidth) > 0;
    return {
      kind: focused && outline ? 'outline' : 'none',
      offset: Number.parseFloat(css.outlineOffset),
      width: Number.parseFloat(css.outlineWidth),
    };
  });
}

/**
 * Waits for the brackets to close in, then checks they hold outside the part. Under forced
 * colors the brackets give way to a solid system outline, so that is what is expected there.
 */
export async function expectFocusBrackets(target: Locator) {
  await expect(target).toBeFocused();
  const forced = await target.evaluate(() => matchMedia('(forced-colors: active)').matches);
  await expect
    .poll(async () => (await readFocusMark(target)).kind)
    .toBe(forced ? 'outline' : 'brackets');
  const mark = await readFocusMark(target);
  expect(mark.offset).toBeGreaterThan(0);
  expect(mark.width).toBeGreaterThan(0);
  return mark;
}
