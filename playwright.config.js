import { defineConfig, devices } from '@playwright/test';
import * as os from 'node:os';
import { env } from './src/config/env';

/**
 * ParaBank Playwright configuration.
 *
 * Projects split the suite by test type so each layer can be run on its own:
 *   ui-*        browser tests for every ParaBank feature (Page Object Model)
 *   api         REST API tests (JSON + XML) with Playwright's request fixture
 *   soap        SOAP/WSDL tests against /services/ParaBank
 *   data-driven table-driven UI and API tests fed from src/data/*.json
 *   hybrid      API-arranged / UI-verified flows and network mocking
 *   a11y        axe-core accessibility scans
 *   visual      screenshot comparisons (baselines are created on first run)
 *   perf        page-load, interaction and API latency budgets (run with one worker: npm run test:perf)
 */
export default defineConfig({
  testDir: './tests',
  // The public demo is slow and shared, so allow generous timeouts.
  timeout: 90_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled', caret: 'hide' },
  },
  fullyParallel: true,
  forbidOnly: env.ci,
  retries: env.ci ? 2 : 1,
  workers: env.ci ? 2 : Math.max(1, Math.min(4, os.cpus().length - 1)),
  globalSetup: './src/setup/global-setup.js',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          application: 'ParaBank',
          base_url: env.baseUrl,
          node: process.version,
          os: `${os.platform()} ${os.release()}`,
        },
      },
    ],
  ],
  use: {
    baseURL: `${env.baseUrl}/`, // trailing slash: all paths in the suite are relative (no leading "/")
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    testIdAttribute: 'id',
  },
  projects: [
    { name: 'ui-chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'ui-firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
    { name: 'ui-webkit', testDir: './tests/ui', use: { ...devices['Desktop Safari'] } },
    { name: 'api', testDir: './tests/api' },
    { name: 'soap', testDir: './tests/soap' },
    { name: 'data-driven', testDir: './tests/data-driven', use: { ...devices['Desktop Chrome'] } },
    { name: 'hybrid', testDir: './tests/hybrid', use: { ...devices['Desktop Chrome'] } },
    { name: 'a11y', testDir: './tests/a11y', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'perf',
      testDir: './tests/perf',
      retries: 0, // a retry would hide a slow run
      use: { ...devices['Desktop Chrome'], trace: 'off', video: 'off' },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      retries: 0,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
});
