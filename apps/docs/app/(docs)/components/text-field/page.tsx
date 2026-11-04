import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'TextField' };

export default function TextFieldPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="text-field" searchParams={searchParams} />;
}
