import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  // Cloudflare Pages serves the exported docs without a Node.js server.
  output: process.env.ZAO_DOCS_STATIC_EXPORT === '1' ? 'export' : undefined,
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
