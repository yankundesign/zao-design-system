import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';
import { SwitchSpecimen } from '@/components/switch-specimen';

export const metadata: Metadata = { title: 'Switch' };

export default function SwitchPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return (
    <ComponentDetail component="switch" searchParams={searchParams} specimen={<SwitchSpecimen />} />
  );
}
