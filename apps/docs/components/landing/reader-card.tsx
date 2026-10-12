'use client';

import { useState } from 'react';
import { Button, Card } from '@zao/react';

/** The card a person sees: one main action, one supporting action, labels that name results. */
export function ReaderCard() {
  const [result, setResult] = useState('');

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="type-heading">Workspace settings</h4>
          <p className="type-body text-muted">Email updates are on for 12 members.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-subtle pt-3">
          <Button variant="secondary" onClick={() => setResult('Reset changes.')}>
            Reset changes
          </Button>
          <Button onClick={() => setResult('Saved changes.')}>Save changes</Button>
        </div>
      </Card>
      <p role="status" className="min-h-6 type-caption text-muted">
        {result}
      </p>
    </div>
  );
}
