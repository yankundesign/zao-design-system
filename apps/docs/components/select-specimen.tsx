'use client';

import { Select } from '@zao/react';
import { workspaceDirectory } from './workspace-directory';

/** Single choices show default, invalid, and disabled states. */
export function SelectSpecimen() {
  return (
    <div data-zao-specimen="select" className="grid max-w-xl gap-5">
      <Select
        label="Region"
        options={[
          { value: 'west', label: 'West' },
          { value: 'central', label: 'Central' },
          { value: 'east', label: 'East' },
        ]}
        defaultValue="west"
        description="Choose the region for this workspace."
      />
      <Select
        label="Backup region"
        options={[
          { value: 'west', label: 'West' },
          { value: 'central', label: 'Central' },
        ]}
        error="Choose a backup region."
      />
      <Select
        label="Current plan"
        options={[{ value: 'standard', label: 'Standard' }]}
        defaultValue="standard"
        disabled
      />
      <Select
        label="Workspace location"
        options={workspaceDirectory}
        description="Open the list to browse complete names and scroll through locations."
      />
    </div>
  );
}
