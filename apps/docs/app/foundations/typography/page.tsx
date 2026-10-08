import type { Metadata } from 'next';
import { TypeRoles } from './type-roles';

export const metadata: Metadata = { title: 'Typography' };

export default function TypographyPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Typography</h1>
        <p className="type-body text-muted">
          Set type by role with <code className="type-code">type-*</code>, never by size or weight.
          Geist carries Su’s interface, display, and title roles. Geist Mono carries code and IDs.
          Type sizes and line heights stay consistent in light and dark.
        </p>
      </header>
      <TypeRoles />
    </div>
  );
}
