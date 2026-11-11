/** Workspace locations for the Combobox and Select previews: one long name, one disabled. */
export const workspaceDirectory = Array.from({ length: 18 }, (_, index) => ({
  value: `location-${index + 1}`,
  label:
    index === 0
      ? 'North workspace — customer operations and international service coordination'
      : `Workspace location ${String(index + 1).padStart(2, '0')}`,
  disabled: index === 8,
}));
