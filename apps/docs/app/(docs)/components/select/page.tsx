import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { SelectSpecimen } from '@/components/select-specimen';
import { FieldFamilySpecimen, FieldSizeSpecimen } from '@/components/field-family-specimen';

export const metadata: Metadata = { title: 'Select' };

export default function SelectPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail
      component="select"
      searchParams={searchParams}
      specimen={<SelectSpecimen />}
      supplement={
        <>
          <FieldSizeSpecimen component="select" />
          <FieldFamilySpecimen />
        </>
      }
    />
  );
}
