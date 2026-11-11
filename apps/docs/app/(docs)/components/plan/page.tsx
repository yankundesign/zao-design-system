import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { PlanSpecimen } from '@/components/workflow-specimens';

export const metadata: Metadata = { title: 'Plan' };

export default function PlanPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail component="plan" searchParams={searchParams} specimen={<PlanSpecimen />} />
  );
}
