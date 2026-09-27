import { test, expect } from '../../src/fixtures/test';

test.describe('Account Activity', { tag: '@activity' }, () => {
  test('shows account details that match the API', { tag: '@smoke' }, async ({ userApp, bank, workerUser }) => {
    const account = await bank.getAccount(workerUser.primaryAccountId);

    await userApp.activity.open(account.id);

    await userApp.activity.expectHeading('Account Details');
    await expect(userApp.activity.accountType).toHaveText(account.type);
    expect(await userApp.activity.balanceValue()).toBeCloseTo(account.balance, 2);
  });

  test('lists every transaction of the account', async ({ loginAs, freshUser, bank }) => {
    await bank.deposit(freshUser.primaryAccountId, 12.34);
    await bank.withdraw(freshUser.primaryAccountId, 5.67);
    const apiTx = await bank.getTransactions(freshUser.primaryAccountId);

    const app = await loginAs(freshUser);
    await app.activity.open(freshUser.primaryAccountId);

    await expect(app.activity.transactionRows).toHaveCount(apiTx.length);
    await expect(app.activity.transactionLink('Deposit via Web Service')).toBeVisible();
    await expect(app.activity.transactionLink('Withdraw via Web Service')).toBeVisible();
  });

  test('filter by type shows only matching transactions', async ({ loginAs, freshUser, bank }) => {
    await bank.deposit(freshUser.primaryAccountId, 20);
    await bank.withdraw(freshUser.primaryAccountId, 3);
    const app = await loginAs(freshUser);
    await app.activity.open(freshUser.primaryAccountId);

    await app.activity.filter('All', 'Debit');
    await expect(app.activity.transactionLink('Withdraw via Web Service')).toBeVisible();
    await expect(app.activity.transactionLink('Deposit via Web Service')).toBeHidden();

    await app.activity.filter('All', 'Credit');
    await expect(app.activity.transactionLink('Deposit via Web Service')).toBeVisible();
    await expect(app.activity.transactionLink('Withdraw via Web Service')).toBeHidden();
  });

  test('empty filter result shows "No transactions found."', async ({ loginAs, freshUser }) => {
    const app = await loginAs(freshUser);
    await app.activity.open(freshUser.primaryAccountId);

    await app.activity.filter('All', 'Debit');
    await expect(app.activity.noTransactions).toHaveText('No transactions found.');
  });

  test('transaction link opens transaction details', async ({ loginAs, freshUser, bank }) => {
    await bank.deposit(freshUser.primaryAccountId, 7.5);
    const app = await loginAs(freshUser);
    await app.activity.open(freshUser.primaryAccountId);

    await app.activity.transactionLink('Deposit via Web Service').click();

    await app.transaction.expectHeading('Transaction Details');
    await expect(app.transaction.value('Amount:')).toHaveText('$7.50');
    await expect(app.transaction.value('Type:')).toHaveText('Credit');
  });

  test('activity period offers "All" plus twelve months', async ({ userApp, workerUser }) => {
    await userApp.activity.open(workerUser.primaryAccountId);
    await expect(userApp.activity.month.locator('option')).toHaveCount(13);
    await expect(userApp.activity.transactionType.locator('option')).toHaveText(['All', 'Credit', 'Debit']);
  });
});
