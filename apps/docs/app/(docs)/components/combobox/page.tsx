import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { ComboboxSpecimen } from '@/components/combobox-specimen';
import { FieldFamilySpecimen, FieldSizeSpecimen } from '@/components/field-family-specimen';

export const metadata: Metadata = { title: 'Combobox' };

export default function ComboboxPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail
      component="combobox"
      searchParams={searchParams}
      specimen={<ComboboxSpecimen />}
      supplement={
        <>
          <FieldSizeSpecimen component="combobox" />
          <FieldFamilySpecimen />
        </>
      }
    />
  );
}
