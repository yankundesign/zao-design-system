'use client';

import { Tabs } from '@zao/react';
import { useFinish, type ModeSetting } from './use-finish';

export function FinishSwitcher() {
  const { setting, setMode } = useFinish();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs.Root
        className="shrink-0 [&>.tabs-viewport]:max-w-none"
        value={setting}
        onValueChange={(value) => {
          if (value === 'system' || value === 'light' || value === 'dark') {
            setMode(value satisfies ModeSetting);
          }
        }}
      >
        <Tabs.List variant="secondary" role="radiogroup" aria-label="Mode">
          <Tabs.Tab
            value="system"
            role="radio"
            aria-checked={setting === 'system'}
            aria-selected={undefined}
          >
            System
          </Tabs.Tab>
          <Tabs.Tab
            value="light"
            role="radio"
            aria-checked={setting === 'light'}
            aria-selected={undefined}
          >
            Light
          </Tabs.Tab>
          <Tabs.Tab
            value="dark"
            role="radio"
            aria-checked={setting === 'dark'}
            aria-selected={undefined}
          >
            Dark
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}
