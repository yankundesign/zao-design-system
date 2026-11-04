import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Plan' };

export default function PlanPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="plan" searchParams={searchParams} />;
}
