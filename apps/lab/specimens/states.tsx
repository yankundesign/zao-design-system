export const meta = {
  id: 'states',
  title: 'Empty and error states',
  tags: ['states', 'empty', 'error'],
  description: 'Two moments where the display face carries the message.',
};

export default function StatesSpecimen() {
  return (
    <section className="grid min-w-0 gap-4 p-5 text-default md:grid-cols-2">
      <div className="flex flex-col justify-center rounded-surface border border-subtle bg-surface p-5">
        <span
          aria-hidden
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-surface border border-subtle bg-sunken type-heading text-muted"
        >
          +
        </span>
        <p className="type-caption text-muted">Empty state</p>
        <h2 className="type-title">Nothing to review yet</h2>
        <p className="mt-2 type-body text-muted">
          When a request needs your decision, it will appear here.
        </p>
        <button
          type="button"
          className="mt-4 h-8 self-start rounded-action bg-accent px-3 type-label trim-label text-on-accent"
        >
          Create a request
        </button>
      </div>
      <div className="flex flex-col justify-center rounded-surface border border-danger bg-danger-subtle p-5">
        <span
          aria-hidden
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-surface border border-danger type-heading text-danger"
        >
          !
        </span>
        <p className="type-caption text-danger">Connection error</p>
        <h2 className="type-title">Reports could not load</h2>
        <p className="mt-2 type-body text-muted">
          Check your connection, then try loading the reports again.
        </p>
        <button
          type="button"
          className="mt-4 h-8 self-start rounded-action border border-danger bg-surface px-3 type-label trim-label text-danger"
        >
          Load reports again
        </button>
      </div>
    </section>
  );
}
