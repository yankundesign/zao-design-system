export const meta = {
  id: 'hero',
  title: 'Hero',
  tags: ['display', 'marketing', 'type'],
  description: 'Large display type, supporting copy and a clear action.',
};

export default function HeroSpecimen() {
  return (
    <section className="flex min-w-0 flex-col justify-center gap-6 px-5 py-20 text-default sm:px-10">
      <p className="type-caption text-muted">A calmer way to work · 从容协作</p>
      <div className="flex max-w-3xl flex-col gap-4">
        <h2 className="type-display text-balance">Make room for the work that matters.</h2>
        <p className="type-title text-balance">让每一步都清晰可见。</p>
        <p className="max-w-xl type-body text-muted">
          Bring requests, decisions and progress into one shared view. See what needs you, then move
          forward with confidence.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="h-10 rounded-action bg-accent px-4 type-label trim-label text-on-accent transition-colors duration-fast hover:bg-accent-hover"
        >
          Explore the workspace
        </button>
        <button
          type="button"
          className="h-10 rounded-action border border-default bg-surface px-4 type-label trim-label transition-colors duration-base ease-standard hover:bg-hover"
        >
          See how it works
        </button>
      </div>
    </section>
  );
}
