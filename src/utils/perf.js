import { expect, test } from '@playwright/test';

/**
 * Lightweight client-side performance helpers (test plan section 4.4).
 *
 * Playwright is a functional tool, so these checks measure what one user experiences:
 * navigation timing, Largest Contentful Paint, page weight and API latency.
 * Load, stress and soak testing belong in k6 against a private ParaBank instance.
 */

const num = (value, fallback) => (value === undefined || value === '' ? fallback : Number(value));

/** How many times each measurement is repeated. Median and p90 are reported. */
export const PERF_RUNS = num(process.env.PERF_RUNS, 5);

/**
 * Multiplies every time budget. Use e.g. PERF_BUDGET_FACTOR=2 against the slow shared public demo,
 * keep 1 against your own Docker instance. Size and request-count budgets are not scaled.
 */
const factor = num(process.env.PERF_BUDGET_FACTOR, 1);

/** Budgets are p90 values. Starting points from the test plan; re-baseline after 5 nightly runs. */
export const budgets = {
  page: {
    ttfbMs: 800 * factor,
    loadMs: 3000 * factor,
    lcpMs: 2500 * factor,
    bytes: 1.5 * 1024 * 1024,
    requests: 40,
  },
  apiMs: 1000 * factor,
  parallelP90Ms: 2000 * factor,
  submitMs: 2000 * factor,
  loginToOverviewMs: 3000 * factor,
  searchMs: 2000 * factor,
  imageBytes: 200 * 1024,
};

/**
 * @param {number[]} samples
 * @returns {{runs: number, min: number, median: number, p90: number, max: number}}
 */
export function stats(samples) {
  const s = [...samples].sort((a, b) => a - b);
  const at = (q) => s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)];
  const round = (v) => Math.round(v * 10) / 10;
  return { runs: s.length, min: round(s[0]), median: round(at(0.5)), p90: round(at(0.9)), max: round(s.at(-1)) };
}

/**
 * Times an async function in milliseconds.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<{ms: number, value: T}>}
 */
export async function timeIt(fn) {
  const start = performance.now();
  const value = await fn();
  return { ms: performance.now() - start, value };
}

/** Records LCP candidates on window.__lcp from the very start of the page. */
const LCP_OBSERVER = () => {
  window.__lcp = 0;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__lcp = Math.max(window.__lcp, entry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Browser without LCP support (Firefox/WebKit): __lcp stays 0 and the LCP check is skipped.
  }
};

/**
 * Loads `path` in a brand-new browser context (cold cache) and reads the browser's own timing data.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {string} path path relative to baseURL, e.g. "index.htm"
 * @param {{storageState?: any, baseURL?: string}} [options]
 */
export async function measurePageLoad(browser, path, options = {}) {
  const context = await browser.newContext({ storageState: options.storageState, baseURL: options.baseURL });
  try {
    const page = await context.newPage();
    await page.addInitScript(LCP_OBSERVER);
    await page.goto(path, { waitUntil: 'load' });
    // LCP is finalised on the first input or when the page is hidden; a short settle is enough for these pages.
    await page.waitForTimeout(500);
    return await page.evaluate(() => {
      const nav = /** @type {PerformanceNavigationTiming} */ (performance.getEntriesByType('navigation')[0]);
      const resources = /** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType('resource'));
      const size = (e) => e.transferSize || e.encodedBodySize || 0;
      return {
        ttfbMs: nav.responseStart - nav.startTime,
        domContentLoadedMs: nav.domContentLoadedEventEnd - nav.startTime,
        loadMs: nav.loadEventEnd - nav.startTime,
        lcpMs: window.__lcp || 0,
        requests: resources.length + 1,
        bytes: size(nav) + resources.reduce((sum, e) => sum + size(e), 0),
        largeImages: resources
          .filter((e) => e.initiatorType === 'img' && e.encodedBodySize > 200 * 1024)
          .map((e) => ({ url: e.name, bytes: e.encodedBodySize })),
      };
    });
  } finally {
    await context.close();
  }
}

/**
 * Repeats `measurePageLoad` PERF_RUNS times and summarises every metric.
 * @param {import('@playwright/test').Browser} browser
 * @param {string} path
 * @param {{storageState?: any}} [options]
 */
export async function profilePage(browser, path, options = {}) {
  const runs = [];
  for (let i = 0; i < PERF_RUNS; i++) {
    runs.push(await test.step(`load ${path} (run ${i + 1}/${PERF_RUNS})`, () => measurePageLoad(browser, path, options)));
  }
  const pick = (key) => stats(runs.map((r) => r[key]));
  return {
    path,
    ttfbMs: pick('ttfbMs'),
    domContentLoadedMs: pick('domContentLoadedMs'),
    loadMs: pick('loadMs'),
    lcpMs: pick('lcpMs'),
    requests: pick('requests'),
    bytes: pick('bytes'),
    largeImages: runs[0].largeImages,
  };
}

/**
 * Soft-asserts a page profile against the page budget, so every breached metric is reported at once.
 * @param {Awaited<ReturnType<typeof profilePage>>} profile
 */
export function expectPageWithinBudget(profile) {
  const b = budgets.page;
  const where = profile.path;
  expect.soft(profile.ttfbMs.p90, `${where} TTFB p90 (ms)`).toBeLessThan(b.ttfbMs);
  expect.soft(profile.loadMs.p90, `${where} load event p90 (ms)`).toBeLessThan(b.loadMs);
  if (profile.lcpMs.max > 0) expect.soft(profile.lcpMs.p90, `${where} LCP p90 (ms)`).toBeLessThan(b.lcpMs);
  expect.soft(profile.bytes.max, `${where} page weight (bytes)`).toBeLessThan(b.bytes);
  expect.soft(profile.requests.max, `${where} request count`).toBeLessThan(b.requests);
}

/**
 * Attaches measurements to the HTML/Allure report and records the headline number as an annotation.
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} name
 * @param {unknown} data
 */
export async function attachPerf(testInfo, name, data) {
  await testInfo.attach(`perf-${name}.json`, { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
}
