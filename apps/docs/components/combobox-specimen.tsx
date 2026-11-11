'use client';

import { Combobox } from '@zao/react';
import { workspaceDirectory } from './workspace-directory';

const workspaces = [
  { value: 'north', label: 'North workspace' },
  { value: 'east', label: 'East workspace' },
  { value: 'west', label: 'West workspace' },
  { value: 'archive', label: 'Archive workspace', disabled: true },
];

/** Search, empty results, and disabled choices use the same options. */
export function ComboboxSpecimen() {
  return (
    <div data-zao-specimen="combobox" className="grid max-w-xl gap-5">
      <Combobox
        label="Workspace"
        options={workspaces}
        defaultValue="north"
        description="Search by workspace name."
      />
      <Combobox label="Destination workspace" options={workspaces} placeholder="Find a workspace" />
      <Combobox label="Locked workspace" options={workspaces} defaultValue="east" disabled />
      <Combobox label="Backup workspace" options={workspaces} error="Choose a backup workspace." />
      <Combobox
        label="Workspace directory"
        options={workspaceDirectory}
        placeholder="Find a workspace"
        description="Type a name to filter the list. Unmatched names show no matches."
      />
    </div>
  );
}
