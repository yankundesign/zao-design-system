'use client';

import { TextField } from '@zao/react';

/** Labels, guidance, errors, and disabled state share one stable field layout. */
export function TextFieldSpecimen() {
  return (
    <div data-zao-specimen="text-field" className="fields-layout grid gap-4">
      <div className="field min-w-0">
        <TextField
          label="Workspace name"
          defaultValue="North workspace"
          description={<span className="field-note">This name appears in invitations.</span>}
        />
      </div>
      <div className="field field-invalid min-w-0">
        <TextField
          label="Contact address"
          type="email"
          defaultValue="team@outside.example"
          error={<span className="field-error">Use a workspace email address.</span>}
        />
      </div>
      <div className="field min-w-0">
        <TextField label="Workspace ID" defaultValue="north-01" disabled />
      </div>
      <TextField label="Reference name" defaultValue="North workspace" readOnly />
    </div>
  );
}
