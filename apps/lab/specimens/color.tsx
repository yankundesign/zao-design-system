export const meta = {
  id: 'color',
  title: 'Color',
  tags: ['foundation', 'color', 'semantic'],
  description: 'The five ramps shown through their semantic roles and use cases.',
};

const backgrounds = [
  { label: 'Canvas', className: 'bg-canvas' },
  { label: 'Surface', className: 'bg-surface' },
  { label: 'Sunken', className: 'bg-sunken' },
  { label: 'Overlay', className: 'bg-overlay' },
  { label: 'Hover', className: 'bg-hover' },
  { label: 'Active', className: 'bg-active' },
] as const;

const ramps = [
  {
    label: 'Accent',
    subtle: 'bg-accent-subtle',
    subtleHover: 'bg-accent-subtle-hover',
    solid: 'bg-accent',
    solidHover: 'bg-accent-hover',
    border: 'border-accent',
    text: 'text-accent',
  },
  {
    label: 'Success',
    subtle: 'bg-success-subtle',
    solid: 'bg-success',
    border: 'border-success',
    text: 'text-success',
  },
  {
    label: 'Warning',
    subtle: 'bg-warning-subtle',
    solid: 'bg-warning',
    border: 'border-warning',
    text: 'text-warning',
  },
  {
    label: 'Danger',
    subtle: 'bg-danger-subtle',
    solid: 'bg-danger',
    border: 'border-danger',
    text: 'text-danger',
  },
] as const;

export default function ColorSpecimen() {
  return (
    <section className="flex min-w-0 flex-col gap-8 p-5 text-default">
      <div className="flex flex-col gap-2">
        <p className="type-caption text-muted">Color roles</p>
        <h2 className="type-title">Color in context</h2>
        <p className="type-body text-muted">
          Neutral, accent and status ramps appear through the jobs they do in an interface.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="type-heading">Neutral surfaces</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {backgrounds.map((item) => (
            <div
              key={item.label}
              className={`${item.className} rounded-surface border border-subtle p-4`}
            >
              <span className="type-label">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-control border border-subtle px-2 py-1 type-caption">
            Subtle border
          </span>
          <span className="rounded-control border border-default px-2 py-1 type-caption">
            Default border
          </span>
          <span className="rounded-control border border-strong px-2 py-1 type-caption">
            Strong border
          </span>
          <span className="rounded-control outline outline-focus px-2 py-1 type-caption">
            Focus outline
          </span>
        </div>
        <p className="type-body">
          Default text <span className="text-muted">Muted text</span>{' '}
          <span className="text-disabled">Disabled text</span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ramps.map((ramp) => (
          <div key={ramp.label} className="rounded-surface border border-subtle bg-surface p-4">
            <h3 className="type-heading">{ramp.label}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`${ramp.subtle} rounded-control border ${ramp.border} px-2 py-1 type-label ${ramp.text}`}
              >
                Subtle fill and text
              </span>
              {'subtleHover' in ramp && (
                <span
                  className={`${ramp.subtleHover} rounded-control border ${ramp.border} px-2 py-1 type-label ${ramp.text}`}
                >
                  Subtle hover
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                aria-hidden
                className={`${ramp.solid} h-8 w-8 rounded-control border ${ramp.border}`}
              />
              <span className="type-caption text-muted">Solid fill</span>
              {'solidHover' in ramp && (
                <span aria-hidden className={`${ramp.solidHover} h-8 w-8 rounded-control`} />
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="h-8 self-start rounded-action bg-accent px-3 type-label trim-label text-on-accent"
      >
        On-accent text
      </button>
    </section>
  );
}
