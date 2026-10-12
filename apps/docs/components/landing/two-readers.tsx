import { componentUsage } from '../component-detail';
import { ReaderCard } from './reader-card';

/** Section 4: the same Button for a person, and the rules an agent reads for it. */
export function TwoReaders() {
  // The first two rules describe what the card shows: emphasis and a label that names the result.
  const rules = componentUsage('button').slice(0, 2);

  return (
    <section
      aria-labelledby="landing-readers-heading"
      data-landing-section="readers"
      className="landing-section flex flex-col gap-6"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 id="landing-readers-heading" className="type-title">
          Written for two readers.
        </h2>
        <p className="type-body text-muted text-pretty">
          People see the result. Agents read the rule behind it, with its reason.
        </p>
      </div>

      <div className="landing-readers grid min-w-0 gap-8">
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="type-label text-muted">For people</h3>
          <ReaderCard />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="type-label text-muted">For agents</h3>
          <div className="flex min-w-0 flex-col gap-3 border-t border-subtle pt-3">
            <p className="type-code text-default">Button · usage</p>
            <ol className="flex flex-col gap-3">
              {rules.map((rule, index) => (
                <li key={rule} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                  <span className="type-code figures-tabular text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="type-code text-muted">{rule}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="type-caption text-muted">
            Component manifests and a validator are planned for v0.1.
          </p>
        </div>
      </div>
    </section>
  );
}
