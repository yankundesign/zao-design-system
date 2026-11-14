import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { ButtonResultSpecimen } from '@/components/button-result-specimen';
import { ButtonSpecimen } from '@/components/button-specimen';

export const metadata: Metadata = { title: 'Button' };

export default function ButtonPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail
      component="button"
      searchParams={searchParams}
      specimen={
        <>
          <ButtonSpecimen />
          <div className="mt-6 border-t border-subtle pt-6">
            <ButtonResultSpecimen />
          </div>
        </>
      }
    />
  );
}
