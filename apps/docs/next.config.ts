import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  // Optional isolation for concurrent local builds and browser checks.
  distDir: process.env.ZAO_DOCS_DIST_DIR ?? '.next',
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    optimizePackageImports: ['iconoir-react'],
  },
  // The repo root, so Next finds the pnpm workspace.
  turbopack: {
    root: fileURLToPath(new URL('../../', import.meta.url)),
  },
};

export default nextConfig;
