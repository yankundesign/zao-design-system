import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZAO lab',
  description: 'A local workbench for exploring ZAO styles on realistic specimens.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-zao-theme="su" data-zao-mode="light">
      <body>{children}</body>
    </html>
  );
}
