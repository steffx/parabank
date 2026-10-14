import { test, expect } from '../../src/fixtures/test';
import { round2 } from '../../src/utils/money';

test.describe('Accounts Overview', { tag: '@overview' }, () => {
  test('lists exactly the accounts returned by the API', { tag: '@smoke' }, async ({ userApp, bank, workerUser }) => {
    const apiAccounts = await bank.getAccounts(workerUser.id);

    await userApp.overview.goto();
    const rows = await userApp.overview.rows();

    expect(rows.map((r) => r.accountId).sort()).toEqual(apiAccounts.map((a) => a.id).sort());
    for (const account of apiAccounts) {
      const row = rows.find((r) => r.accountId === account.id);
      expect(row.balance, `balance of ${account.id}`).toBeCloseTo(account.balance, 2);
    }
  });

  test('total equals the sum of all balances', async ({ userApp }) => {
    await userApp.overview.goto();
    const rows = await userApp.overview.rows();

    const sum = round2(rows.reduce((acc, r) => acc + r.balance, 0));
    expect(await userApp.overview.total()).toBeCloseTo(sum, 2);
  });

  test('available amount is the balance, floored at zero', async ({ userApp }) => {
    await userApp.overview.goto();
    for (const row of await userApp.overview.rows()) {
      expect(row.available).toBeCloseTo(Math.max(0, row.balance), 2);
    }
  });

  test('account number links to its activity page', async ({ userApp, workerUser }) => {
    await userApp.overview.goto();
    await userApp.overview.accountLink(workerUser.primaryAccountId).click();

    await expect(userApp.page).toHaveURL(new RegExp(`activity\\.htm\\?id=${workerUser.primaryAccountId}`));
    await expect(userApp.activity.accountId).toHaveText(String(workerUser.primaryAccountId));
  });
});
