import { test, expect } from '../../src/fixtures/test';
import { buildCustomer, buildPayee } from '../../src/data/builders';

/** Arrange through the API (fast, precise), assert through the browser (what the customer sees). */
test.describe('Hybrid: arrange via API, verify in UI', { tag: '@hybrid' }, () => {
  test('accounts opened via API appear in the Accounts Overview', async ({ bank, freshUser, loginAs }) => {
    const checking = await bank.createAccount(freshUser.id, 'CHECKING', freshUser.primaryAccountId);
    const savings = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);

    const app = await loginAs(freshUser);
    await app.overview.goto();
    const rows = await app.overview.rows();

    expect(rows.map((r) => r.accountId)).toEqual(
      expect.arrayContaining([freshUser.primaryAccountId, checking.id, savings.id]),
    );
    expect(rows.find((r) => r.accountId === savings.id).balance).toBeCloseTo(savings.balance, 2);
  });

  test('API deposit shows up in Account Activity with the new balance', async ({ bank, freshUser, loginAs }) => {
    await bank.deposit(freshUser.primaryAccountId, 321.09);
    const account = await bank.getAccount(freshUser.primaryAccountId);

    const app = await loginAs(freshUser);
    await app.activity.open(freshUser.primaryAccountId);

    expect(await app.activity.balanceValue()).toBeCloseTo(account.balance, 2);
    await expect(app.activity.transactionRows.filter({ hasText: '$321.09' })).toHaveCount(1);
  });

  test('API bill payment is visible in Find Transactions', async ({ bank, freshUser, loginAs }) => {
    const payee = buildPayee();
    await bank.billPay(freshUser.primaryAccountId, 19.87, payee);

    const app = await loginAs(freshUser);
    await app.findTransactions.goto();
    await app.findTransactions.byAmount(freshUser.primaryAccountId, 19.87);

    await expect(app.findTransactions.resultRows).toContainText([`Bill Payment to ${payee.name}`]);
  });

  test('API profile change is shown in the Update Profile form and welcome text', async ({
    bank,
    freshUser,
    loginAs,
  }) => {
    const next = buildCustomer({ username: freshUser.username, password: freshUser.password });
    await bank.updateCustomer(freshUser.id, next);

    const app = await loginAs(freshUser);
    await app.updateProfile.goto();
    await app.updateProfile.waitForPrefill();

    await expect(app.updateProfile.field('firstName')).toHaveValue(next.firstName);
    await expect(app.updateProfile.field('city')).toHaveValue(next.address.city);
    await expect(app.updateProfile.welcomeText).toHaveText(`Welcome ${next.firstName} ${next.lastName}`);
  });
});
