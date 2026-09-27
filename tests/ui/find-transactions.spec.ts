import { test, expect } from '../../src/fixtures/test';
import { RegisteredUser } from '../../src/api/session';
import { ParaBankRestClient } from '../../src/api/ParaBankRestClient';
import { daysFromToday, toParaBankDate } from '../../src/utils/dates';

/** Arrange: deposit a unique amount via the API and return the resulting transaction. */
async function seedDeposit(bank: ParaBankRestClient, user: RegisteredUser) {
  const amount = Number((100 + Math.random() * 800).toFixed(2));
  await bank.deposit(user.primaryAccountId, amount);
  const tx = (await bank.findTransactionsByAmount(user.primaryAccountId, amount))[0];
  expect(tx, 'seeded deposit').toBeDefined();
  return tx;
}

test.describe('Find Transactions', { tag: '@find-transactions' }, () => {
  test('by amount', { tag: '@smoke' }, async ({ loginAs, freshUser, bank }) => {
    const tx = await seedDeposit(bank, freshUser);
    const app = await loginAs(freshUser);

    await app.findTransactions.goto();
    await app.findTransactions.byAmount(freshUser.primaryAccountId, tx.amount);

    await app.findTransactions.expectHeading('Transaction Results');
    await expect(app.findTransactions.resultRows).toHaveCount(1);
    await expect(app.findTransactions.resultRows.first()).toContainText('Deposit via Web Service');
    await expect(app.findTransactions.resultRows.first()).toContainText(`$${tx.amount.toFixed(2)}`);
  });

  test('by transaction id', async ({ loginAs, freshUser, bank }) => {
    const tx = await seedDeposit(bank, freshUser);
    const app = await loginAs(freshUser);

    await app.findTransactions.goto();
    await app.findTransactions.byId(freshUser.primaryAccountId, tx.id);

    await expect(app.findTransactions.resultRows).toHaveCount(1);
    await expect(app.findTransactions.resultRows.getByRole('link')).toHaveAttribute('href', new RegExp(`transaction\\.htm\\?id=${tx.id}$`));
  });

  test('by date and by date range', async ({ loginAs, freshUser, bank }) => {
    const tx = await seedDeposit(bank, freshUser);
    const app = await loginAs(freshUser);

    // Use the server-rendered date so the test is immune to client/server time zone differences.
    await app.transaction.goto(`?id=${tx.id}`);
    const serverDate = (await app.transaction.value('Date:').innerText()).trim();

    await app.findTransactions.goto();
    await app.findTransactions.byDate(freshUser.primaryAccountId, serverDate);
    await expect(app.findTransactions.resultRows.filter({ hasText: 'Deposit via Web Service' })).not.toHaveCount(0);

    await app.findTransactions.goto();
    await app.findTransactions.byDateRange(
      freshUser.primaryAccountId,
      toParaBankDate(daysFromToday(-2)),
      toParaBankDate(daysFromToday(2)),
    );
    await expect(app.findTransactions.resultRows.filter({ hasText: `$${tx.amount.toFixed(2)}` })).toHaveCount(1);
  });

  test('result links to the transaction details page', async ({ loginAs, freshUser, bank }) => {
    const tx = await seedDeposit(bank, freshUser);
    const app = await loginAs(freshUser);

    await app.findTransactions.goto();
    await app.findTransactions.byAmount(freshUser.primaryAccountId, tx.amount);
    await app.findTransactions.resultRows.getByRole('link').first().click();

    await app.transaction.expectHeading('Transaction Details');
    await expect(app.transaction.value('Transaction ID:')).toHaveText(String(tx.id));
    await expect(app.transaction.value('Description:')).toHaveText('Deposit via Web Service');
    await expect(app.transaction.value('Type:')).toHaveText('Credit');
    await expect(app.transaction.value('Amount:')).toHaveText(`$${tx.amount.toFixed(2)}`);
  });

  test('amount with no matches shows an empty result table', async ({ userApp, workerUser }) => {
    await userApp.findTransactions.goto();
    await userApp.findTransactions.byAmount(workerUser.primaryAccountId, '0.07');

    await expect(userApp.findTransactions.resultContainer).toBeVisible();
    await expect(userApp.findTransactions.resultRows).toHaveCount(0);
  });

  test.describe('client-side validation', () => {
    test('invalid transaction id', async ({ userApp, workerUser }) => {
      await userApp.findTransactions.goto();
      await userApp.findTransactions.byId(workerUser.primaryAccountId, 'abc');
      await expect(userApp.findTransactions.transactionIdError).toHaveText('Invalid transaction ID');
    });

    test('invalid date', async ({ userApp, workerUser }) => {
      await userApp.findTransactions.goto();
      await userApp.findTransactions.byDate(workerUser.primaryAccountId, '2024/13/45');
      await expect(userApp.findTransactions.transactionDateError).toHaveText('Invalid date format');
    });

    test('invalid date range', async ({ userApp, workerUser }) => {
      await userApp.findTransactions.goto();
      await userApp.findTransactions.byDateRange(workerUser.primaryAccountId, 'yesterday', 'today');
      await expect(userApp.findTransactions.dateRangeError).toHaveText('Invalid date format');
    });

    test('invalid amount', async ({ userApp, workerUser }) => {
      await userApp.findTransactions.goto();
      await userApp.findTransactions.byAmount(workerUser.primaryAccountId, 'lots');
      await expect(userApp.findTransactions.amountError).toHaveText('Invalid amount');
    });
  });
});
