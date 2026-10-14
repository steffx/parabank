import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { PERF_RUNS, attachPerf, budgets, stats, timeIt } from '../../src/utils/perf';

/**
 * REST API latency budgets and a light concurrency smoke run (TC-PERF-M07-02), test plan section 4.4.
 * 20 parallel requests is a smoke check, not a load test: never point load at the shared public demo.
 */
test.describe('Performance: REST API latency', { tag: ['@perf', '@api'] }, () => {
  test('TC-PERF-M07-02 API latency and concurrency smoke', async ({ bank, freshUser }, testInfo) => {
    const savings = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    await bank.transfer(freshUser.primaryAccountId, savings.id, 5);

    /** @type {Record<string, () => Promise<unknown>>} */
    const calls = {
      login: () => bank.login(freshUser.username, freshUser.password),
      accounts: () => bank.getAccounts(freshUser.id),
      transactions: () => bank.getTransactions(freshUser.primaryAccountId),
      transfer: () => bank.transfer(freshUser.primaryAccountId, savings.id, 1),
    };

    /** @type {Record<string, ReturnType<typeof stats>>} */
    const latency = {};
    for (const [name, call] of Object.entries(calls)) {
      const samples = [];
      for (let i = 0; i < PERF_RUNS; i++) samples.push((await timeIt(call)).ms);
      latency[name] = stats(samples);
    }

    const PARALLEL = 20;
    const batch = await test.step(`${PARALLEL} parallel GET /accounts/{id}`, () =>
      Promise.all(
        Array.from({ length: PARALLEL }, () =>
          timeIt(() => bank.send('GET', endpoints.account(freshUser.primaryAccountId))),
        ),
      ),
    );
    const failed = batch.filter(({ value }) => !value.ok()).map(({ value }) => value.status());
    const parallel = stats(batch.map(({ ms }) => ms));

    await attachPerf(testInfo, 'api-latency', { latency, parallel: { requests: PARALLEL, failed, ...parallel } });

    for (const [name, s] of Object.entries(latency)) {
      expect.soft(s.p90, `${name} p90 (ms)`).toBeLessThan(budgets.apiMs);
    }
    expect.soft(failed, 'failed parallel requests (status codes)').toEqual([]);
    expect.soft(parallel.p90, `${PARALLEL} parallel requests p90 (ms)`).toBeLessThan(budgets.parallelP90Ms);
  });
});
