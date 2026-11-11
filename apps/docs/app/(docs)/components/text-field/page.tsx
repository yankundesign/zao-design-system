import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { TextFieldSpecimen } from '@/components/text-field-specimen';
import { FieldFamilySpecimen, FieldSizeSpecimen } from '@/components/field-family-specimen';

export const metadata: Metadata = { title: 'TextField' };

export default function TextFieldPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail
      component="text-field"
      searchParams={searchParams}
      specimen={<TextFieldSpecimen />}
      supplement={
        <>
          <FieldSizeSpecimen component="text-field" />
          <FieldFamilySpecimen />
        </>
      }
    />
  );
}
