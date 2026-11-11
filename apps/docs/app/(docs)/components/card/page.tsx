import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { CardLayoutPreview } from '@/components/card-layout-preview';
import { ConstructionStates } from '@/components/construction-states';

export const metadata: Metadata = { title: 'Card' };

export default function CardPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail
      component="card"
      searchParams={searchParams}
      specimen={<CardLayoutPreview />}
      states={<ConstructionStates />}
    />
  );
}
