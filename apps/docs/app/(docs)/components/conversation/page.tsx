import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Conversation' };

export default function ConversationPage({
  searchParams,
}: {
  searchParams: ComponentSearchParams;
}) {
  return <ComponentDetail component="conversation" searchParams={searchParams} />;
}
