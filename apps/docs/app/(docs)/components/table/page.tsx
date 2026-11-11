import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { TableSpecimen } from '@/components/table-specimen';
import { TableDrawingStates } from '@/components/drawing-state-demo';

export const metadata: Metadata = { title: 'Table' };

export default function TablePage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail
      component="table"
      searchParams={searchParams}
      specimen={<TableSpecimen />}
      states={<TableDrawingStates />}
    />
  );
}
