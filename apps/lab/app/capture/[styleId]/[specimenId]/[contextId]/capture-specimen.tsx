'use client';

import { useEffect, useState } from 'react';
import { specimens } from '@/lib/specimens';

export function CaptureSpecimen({ id }: { id: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const specimen = specimens.find((entry) => entry.id === id);
  if (!specimen) throw new Error('Specimen "' + id + '" was not found.');
  const Component = specimen.Component;
  return (
    <div data-capture-specimen-ready={ready ? 'true' : 'false'} style={{ display: 'contents' }}>
      <Component />
    </div>
  );
}
