'use client';

import { useEffect, useState } from 'react';

/** Match the lab island's browser parser so a snapshot includes the same extra CSS. */
export function CaptureExtraCss({ source }: { source: string }) {
  const [scoped, setScoped] = useState<string | null>(null);

  useEffect(() => {
    if (!source.trim()) {
      setScoped('');
      return;
    }
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(source);
      if (!sheet.cssRules.length) sheet.replaceSync(':scope { ' + source + ' }');
      const rules = [...sheet.cssRules]
        .filter(
          (rule) =>
            rule instanceof CSSStyleRule || /^@(media|supports|container)\b/i.test(rule.cssText),
        )
        .map((rule) => rule.cssText);
      setScoped(
        rules.length ? '@scope ([data-lab-island="capture"]) { ' + rules.join('\n') + ' }' : '',
      );
    } catch {
      setScoped('');
    }
  }, [source]);

  return <style data-capture-ready={scoped === null ? 'false' : 'true'}>{scoped ?? ''}</style>;
}
