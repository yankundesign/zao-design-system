import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'ApprovalGate' };

export default function ApprovalGatePage({
  searchParams,
}: {
  searchParams: ComponentSearchParams;
}) {
  return <ComponentDetail component="approval-gate" searchParams={searchParams} />;
}
