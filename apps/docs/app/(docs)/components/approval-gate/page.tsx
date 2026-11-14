import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { ApprovalGateHoldSpecimen } from '@/components/approval-gate-hold-specimen';
import { ApprovalGateSpecimen } from '@/components/workflow-specimens';

export const metadata: Metadata = { title: 'ApprovalGate' };

export default function ApprovalGatePage({
  searchParams,
}: {
  searchParams: ComponentSearchParams;
}) {
  return (
    <ComponentDetail
      component="approval-gate"
      searchParams={searchParams}
      specimen={
        <>
          <ApprovalGateSpecimen />
          <div className="mt-6 border-t border-subtle pt-6">
            <ApprovalGateHoldSpecimen />
          </div>
        </>
      }
    />
  );
}
