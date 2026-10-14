import { test, expect } from '../../src/fixtures/test';
import { loginStorageState } from '../../src/api/session';
import { buildPayee } from '../../src/data/builders';
import { billPayFormFrom } from '../../src/pages/BillPayPage';
import { ParaBankApp } from '../../src/pages/ParaBankApp';
import { daysFromToday, toParaBankDate } from '../../src/utils/dates';
import {
  PERF_RUNS,
  attachPerf,
  budgets,
  expectPageWithinBudget,
  profilePage,
  stats,
  timeIt,
} from '../../src/utils/perf';

/** New logged-in (or anonymous) page in its own context, so every run starts with a cold cache. */
async function freshApp(browser, storageState) {
  const context = await browser.newContext({ storageState });
  const app = new ParaBankApp(await context.newPage());
  return { app, close: () => context.close() };
}

/**
 * Page-load and user-interaction timing (TC-PERF-*), test plan section 4.4.
 * Each measurement runs PERF_RUNS times in a fresh browser context (cold cache); budgets apply to the p90.
 * Run with: npm run test:perf   (one worker, so tests do not compete for CPU or network)
 */
test.describe('Performance: page load and interactions', { tag: '@perf' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-PERF-M01-01 home / login page load', async ({ browser }, testInfo) => {
    const profile = await profilePage(browser, 'index.htm');
    await attachPerf(testInfo, 'home', profile);
    expectPageWithinBudget(profile);
  });

  test('TC-PERF-M04-01 accounts overview after login', async ({ browser, workerUser }, testInfo) => {
    const samples = [];
    for (let i = 0; i < PERF_RUNS; i++) {
      const { app, close } = await freshApp(browser);
      await app.home.goto();
      await app.home.username.fill(workerUser.username);
      await app.home.password.fill(workerUser.password);
      const { ms } = await timeIt(async () => {
        await app.home.loginButton.click();
        await expect(app.overview.accountRows.first()).toBeVisible();
      });
      samples.push(ms);
      await close();
    }
    const loginToOverview = stats(samples);

    const storageState = await loginStorageState(workerUser.username, workerUser.password);
    const profile = await profilePage(browser, 'overview.htm', { storageState });
    await attachPerf(testInfo, 'overview', { loginToOverviewMs: loginToOverview, page: profile });

    expect.soft(loginToOverview.p90, 'Log In click to accounts table p90 (ms)').toBeLessThan(budgets.loginToOverviewMs);
    expectPageWithinBudget(profile);
  });

  test('TC-PERF-M07-01 transfer page load and submit', async ({ browser, freshUser, bank }, testInfo) => {
    const savings = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    const storageState = await loginStorageState(freshUser.username, freshUser.password);
    const profile = await profilePage(browser, 'transfer.htm', { storageState });

    const samples = [];
    for (let i = 0; i < PERF_RUNS; i++) {
      const { app, close } = await freshApp(browser, storageState);
      await app.transfer.goto();
      await expect(app.transfer.toAccount.locator(`option[value="${savings.id}"]`)).toBeAttached();
      await app.transfer.amount.fill('1');
      await app.transfer.fromAccount.selectOption(String(freshUser.primaryAccountId));
      await app.transfer.toAccount.selectOption(String(savings.id));
      const { ms } = await timeIt(async () => {
        await app.transfer.submit.click();
        await expect(app.transfer.result).toBeVisible();
      });
      samples.push(ms);
      await close();
    }
    const submit = stats(samples);
    await attachPerf(testInfo, 'transfer', { submitToConfirmationMs: submit, page: profile });

    expectPageWithinBudget(profile);
    expect.soft(submit.p90, 'Transfer click to "Transfer Complete!" p90 (ms)').toBeLessThan(budgets.submitMs);
  });

  test('TC-PERF-M08-01 bill pay page load and submit', async ({ browser, freshUser }, testInfo) => {
    const storageState = await loginStorageState(freshUser.username, freshUser.password);
    const profile = await profilePage(browser, 'billpay.htm', { storageState });

    const samples = [];
    for (let i = 0; i < PERF_RUNS; i++) {
      const { app, close } = await freshApp(browser, storageState);
      await app.billPay.goto();
      await app.billPay.fill({ ...billPayFormFrom(buildPayee(), 1), fromAccountId: freshUser.primaryAccountId });
      const { ms } = await timeIt(async () => {
        await app.billPay.submit.click();
        await expect(app.billPay.result).toBeVisible();
      });
      samples.push(ms);
      await close();
    }
    const submit = stats(samples);
    await attachPerf(testInfo, 'billpay', { submitToConfirmationMs: submit, page: profile });

    expectPageWithinBudget(profile);
    expect.soft(submit.p90, 'Send Payment click to "Bill Payment Complete" p90 (ms)').toBeLessThan(budgets.submitMs);
  });

  test('TC-PERF-M09-01 find transactions by date range', async ({ browser, freshUser, bank }, testInfo) => {
    const savings = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    await bank.transfer(freshUser.primaryAccountId, savings.id, 10);
    const storageState = await loginStorageState(freshUser.username, freshUser.password);
    const from = toParaBankDate(daysFromToday(-7));
    const to = toParaBankDate(daysFromToday(1));

    const samples = [];
    for (let i = 0; i < PERF_RUNS; i++) {
      const { app, close } = await freshApp(browser, storageState);
      const find = app.findTransactions;
      await find.goto();
      await find.selectAccount(freshUser.primaryAccountId);
      await find.fromDate.fill(from);
      await find.toDate.fill(to);
      const { ms } = await timeIt(async () => {
        await find.findByDateRange.click();
        await expect(find.resultRows.first()).toBeVisible();
      });
      samples.push(ms);
      await close();
    }
    const search = stats(samples);
    await attachPerf(testInfo, 'find-transactions', { searchMs: search });

    expect.soft(search.p90, 'Find Transactions click to results p90 (ms)').toBeLessThan(budgets.searchMs);
  });

  test('TC-PERF-M13-01 static pages load', async ({ browser }, testInfo) => {
    const profiles = [];
    for (const path of ['about.htm', 'services.htm', 'contact.htm']) {
      profiles.push(await profilePage(browser, path));
    }
    await attachPerf(testInfo, 'static-pages', profiles);

    for (const profile of profiles) {
      expectPageWithinBudget(profile);
      for (const img of profile.largeImages) {
        testInfo.annotations.push({
          type: 'perf-warning',
          description: `${profile.path}: image over ${budgets.imageBytes / 1024} KB: ${img.url} (${img.bytes} bytes)`,
        });
      }
    }
  });
});
