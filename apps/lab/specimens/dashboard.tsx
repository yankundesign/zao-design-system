export const meta = {
  id: 'dashboard',
  title: 'Dashboard',
  tags: ['data', 'chart', 'metrics'],
  description: 'Metric cards and a compact chart using neutral, accent and status roles.',
};

const metrics = [
  { label: 'Requests reviewed', value: '1,284', change: '+8.2%', color: 'text-success' },
  { label: 'Pending decisions', value: '36', change: '−4.1%', color: 'text-accent' },
  { label: 'Needs attention', value: '7', change: '+2', color: 'text-warning' },
] as const;

const bars = [
  { day: 'Mon', reviewed: 55, pending: 25 },
  { day: 'Tue', reviewed: 70, pending: 20 },
  { day: 'Wed', reviewed: 62, pending: 35 },
  { day: 'Thu', reviewed: 82, pending: 18 },
  { day: 'Fri', reviewed: 74, pending: 28 },
] as const;

export default function DashboardSpecimen() {
  return (
    <section className="flex min-w-0 flex-col gap-5 p-5 text-default">
      <div>
        <p className="type-caption text-muted">Workspace / Overview</p>
        <h2 className="type-title">This week</h2>
        <p className="type-body text-muted">A view of review activity across the workspace.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-surface border border-subtle bg-surface p-4">
            <p className="type-caption text-muted">{metric.label}</p>
            <p className="mt-2 type-title figures-tabular">{metric.value}</p>
            <p className={`type-caption figures-tabular ${metric.color}`}>
              {metric.change} from last week
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-surface border border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="type-heading">Activity by day</h3>
            <p className="type-caption text-muted">Reviewed and pending requests</p>
          </div>
          <div className="flex flex-wrap gap-3 type-caption">
            <span>
              <span aria-hidden className="mr-1 inline-block h-2 w-2 rounded-pill bg-accent" />
              Reviewed
            </span>
            <span>
              <span aria-hidden className="mr-1 inline-block h-2 w-2 rounded-pill bg-warning" />
              Pending
            </span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2 border-b border-subtle pb-2">
          {bars.map((bar) => (
            <div key={bar.day} className="flex flex-col items-center gap-1">
              <div className="flex h-20 w-full items-end justify-center gap-1 bg-sunken p-1">
                <span
                  role="img"
                  aria-label={`${bar.day}: ${bar.reviewed} reviewed`}
                  style={{ height: `${bar.reviewed}%` }}
                  className="w-3 rounded-control bg-accent"
                />
                <span
                  role="img"
                  aria-label={`${bar.day}: ${bar.pending} pending`}
                  style={{ height: `${bar.pending}%` }}
                  className="w-3 rounded-control bg-warning"
                />
              </div>
              <span className="type-caption text-muted">{bar.day}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 type-caption text-muted">Bars show daily counts on a shared scale.</p>
      </div>
    </section>
  );
}
