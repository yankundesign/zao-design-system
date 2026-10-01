export function scopedExtraCss(source: string, id: string) {
  if (!source.trim() || typeof CSSStyleSheet === 'undefined') return '';
  const sheet = new CSSStyleSheet();
  try {
    sheet.replaceSync(source);
    if (!sheet.cssRules.length) sheet.replaceSync(`:scope { ${source} }`);
  } catch {
    return '';
  }
  const rules = [...sheet.cssRules]
    .filter(
      (rule) =>
        rule instanceof CSSStyleRule || /^@(media|supports|container)\b/i.test(rule.cssText),
    )
    .map((rule) => rule.cssText);
  return rules.length ? `@scope ([data-lab-island="${id}"]) { ${rules.join('\n')} }` : '';
}
