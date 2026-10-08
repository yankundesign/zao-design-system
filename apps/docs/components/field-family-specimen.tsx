'use client';

import { useRef, useState } from 'react';
import { Button, Combobox, Select, TextField } from '@zao/react';

const workspaces = [
  { value: 'north', label: 'North workspace' },
  { value: 'east', label: 'East workspace' },
  { value: 'west', label: 'West workspace' },
  { value: 'archive', label: 'Archive workspace', disabled: true },
];
const regions = [
  { value: 'west', label: 'West' },
  { value: 'central', label: 'Central' },
  { value: 'east', label: 'East' },
];
const sizes = ['small', 'default', 'large'] as const;

/** The same real components form one mixed row on every field's docs page. */
export function FieldFamilySpecimen() {
  const nameRef = useRef<HTMLInputElement>(null);
  const [workspace, setWorkspace] = useState<string | null>('north');
  const [region, setRegion] = useState<string | null>('west');
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <form
      data-zao-specimen="field-family"
      aria-label="Workspace settings"
      className="@container flex min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(`Saved changes for ${nameRef.current?.value ?? 'this workspace'}.`);
      }}
    >
      <h4 className="type-label font-medium">Fields together</h4>
      <div data-zao-slot="form-row" className="grid min-w-0 gap-3 @3xl:grid-cols-4">
        <TextField
          ref={nameRef}
          label="Workspace name"
          name="workspaceName"
          defaultValue="North workspace"
        />
        <Combobox
          label="Workspace"
          name="workspace"
          options={workspaces}
          value={workspace}
          onValueChange={setWorkspace}
        />
        <Select
          label="Region"
          name="region"
          options={regions}
          value={region}
          onValueChange={setRegion}
        />
        <Button type="submit" variant="secondary" className="self-end">
          Save changes
        </Button>
      </div>
      <p role="status" className="type-caption text-muted">
        {saved ?? 'Edit the fields, then save changes.'}
      </p>
    </form>
  );
}

export function FieldSizeSpecimen({
  component,
}: {
  component: 'text-field' | 'combobox' | 'select';
}) {
  return (
    <div data-zao-specimen="field-sizes" className="@container flex min-w-0 flex-col gap-3">
      <h4 className="type-label font-medium">Sizes</h4>
      <div className="grid min-w-0 items-start gap-4 @xl:grid-cols-3">
        {sizes.map((size) => {
          const label = size === 'small' ? 'Small' : size === 'large' ? 'Large' : 'Default';
          return component === 'text-field' ? (
            <TextField key={size} label={label} size={size} defaultValue="North workspace" />
          ) : component === 'combobox' ? (
            <Combobox
              key={size}
              label={label}
              size={size}
              options={workspaces}
              defaultValue="north"
            />
          ) : (
            <Select key={size} label={label} size={size} options={regions} defaultValue="west" />
          );
        })}
      </div>
    </div>
  );
}
