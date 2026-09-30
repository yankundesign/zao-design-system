import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  // The repo root, so Next finds the pnpm workspace.
  turbopack: {
    root: fileURLToPath(new URL('../../', import.meta.url)),
  },
};

export default nextConfig;
