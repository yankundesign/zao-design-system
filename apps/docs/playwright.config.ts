import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const port = process.env.ZAO_DOCS_TEST_PORT ?? '3102';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: process.env.ZAO_DOCS_DIST_DIR
    ? `${process.env.ZAO_DOCS_DIST_DIR}/test-results`
    : './test-results',
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
  },
  webServer: {
    command: `pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/`,
    env: {
      ZAO_STYLE_STUDIES_DIR: fileURLToPath(new URL('./e2e/fixtures/studies/', import.meta.url)),
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
