export const meta = {
  id: 'type',
  title: 'Type',
  tags: ['foundation', 'type', 'chinese'],
  description: 'Every type role with Latin, Chinese, numbers and identifiers.',
};

const roles = [
  { name: 'Display', className: 'type-display', sample: 'Build with clarity · 营造有度' },
  { name: 'Title', className: 'type-title', sample: 'A considered workspace · 有序的工作台' },
  { name: 'Heading', className: 'type-heading', sample: 'Review the details · 查看详情' },
  {
    name: 'Body',
    className: 'type-body',
    sample: 'Three changes are ready for review. 三项更改等待审核。',
  },
  { name: 'Label', className: 'type-label', sample: 'Workspace name · 工作区名称' },
  { name: 'Caption', className: 'type-caption', sample: 'Updated 24 minutes ago · 24 分钟前更新' },
  { name: 'Code', className: 'type-code', sample: 'const workspaceId = "WK-01Il10";' },
] as const;

export default function TypeSpecimen() {
  return (
    <section className="flex min-w-0 flex-col gap-8 p-5 text-default">
      <div className="flex flex-col gap-2">
        <p className="type-caption text-muted">Type roles</p>
        <h2 className="type-title">Words that work in every finish</h2>
        <p className="type-body text-muted">
          The same roles carry interface copy, Chinese text, changing numbers and IDs.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {roles.map((role) => (
          <div key={role.name} className="grid gap-2 border-t border-subtle pt-3 sm:grid-cols-4">
            <p className="type-caption text-muted">{role.name}</p>
            <p className={`${role.className} min-w-0 break-words sm:col-span-3`}>{role.sample}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-surface border border-subtle bg-surface p-4">
          <p className="type-caption text-muted">Changing numbers</p>
          <p className="type-heading figures-tabular">1,084.20 → 1,105.76</p>
        </div>
        <div className="rounded-surface border border-subtle bg-surface p-4">
          <p className="type-caption text-muted">Copyable ID</p>
          <p className="type-code figures-id break-all">REQ-01Il10-2048</p>
        </div>
      </div>
    </section>
  );
}
