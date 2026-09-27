import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { arrayOf, expectSchema, transactionSchema } from '../../src/api/schemas';
import { Transaction } from '../../src/api/types';
import { daysFromToday, toParaBankDate } from '../../src/utils/dates';

test.describe('REST: transactions', { tag: '@api' }, () => {
  let deposit: Transaction;
  const amount = Number((200 + Math.random() * 500).toFixed(2));

  test.beforeEach(async ({ bank, freshUser }) => {
    await bank.deposit(freshUser.primaryAccountId, amount);
    await bank.withdraw(freshUser.primaryAccountId, 1.23);
    deposit = (await bank.findTransactionsByAmount(freshUser.primaryAccountId, amount))[0];
  });

  test('GET /accounts/{id}/transactions lists credits and debits', async ({ bank, freshUser }) => {
    const all = await bank.getTransactions(freshUser.primaryAccountId);

    expectSchema(all, arrayOf(transactionSchema), 'transactions');
    expect(all.every((t) => t.accountId === freshUser.primaryAccountId)).toBe(true);
    expect(all).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'Credit', amount, description: 'Deposit via Web Service' }),
        expect.objectContaining({ type: 'Debit', amount: 1.23, description: 'Withdraw via Web Service' }),
      ]),
    );
  });

  test('GET /transactions/{id} returns one transaction', async ({ bank }) => {
    const tx = await bank.getTransaction(deposit.id);
    expect(tx).toEqual(deposit);
  });

  test('find by amount returns only matching transactions', async ({ bank, freshUser }) => {
    const found = await bank.findTransactionsByAmount(freshUser.primaryAccountId, amount);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((t) => t.amount === amount)).toBe(true);
  });

  test('find by date range includes today', async ({ bank, freshUser }) => {
    const found = await bank.findTransactionsByDateRange(
      freshUser.primaryAccountId,
      toParaBankDate(daysFromToday(-2)),
      toParaBankDate(daysFromToday(2)),
    );
    expect(found.map((t) => t.id)).toContain(deposit.id);
  });

  test('find by date range in the far past is empty', async ({ bank, freshUser }) => {
    const found = await bank.findTransactionsByDateRange(freshUser.primaryAccountId, '01-01-2000', '12-31-2000');
    expect(found).toEqual([]);
  });

  test('find on a date', async ({ bank, freshUser }) => {
    // The deposit's own date, formatted the way ParaBank expects (server-side date).
    const candidates = [daysFromToday(-1), daysFromToday(0), daysFromToday(1)].map((d) => toParaBankDate(d));
    const hits = await Promise.all(candidates.map((d) => bank.findTransactionsOnDate(freshUser.primaryAccountId, d)));
    expect(hits.flat().map((t) => t.id)).toContain(deposit.id);
  });

  test('find by month and type filters credits/debits', async ({ bank, freshUser }) => {
    const credits = await bank.findTransactionsByMonthAndType(freshUser.primaryAccountId, 'All', 'Credit');
    const debits = await bank.findTransactionsByMonthAndType(freshUser.primaryAccountId, 'All', 'Debit');

    expect(credits.length).toBeGreaterThan(0);
    expect(debits.length).toBeGreaterThan(0);
    expect(credits.every((t) => t.type === 'Credit')).toBe(true);
    expect(debits.every((t) => t.type === 'Debit')).toBe(true);
  });

  test('KNOWN BEHAVIOUR: wrong date format is silently accepted and returns nothing', async ({ bank, freshUser }) => {
    test.info().annotations.push({
      type: 'finding',
      description: 'SimpleDateFormat("MM-dd-yyyy") is lenient: "2024-01-01" parses to a nonsense date instead of HTTP 400.',
    });
    const res = await bank.send('GET', endpoints.transactionsOnDate(freshUser.primaryAccountId, '2024-01-01'));
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('unparseable date is rejected with a helpful message', async ({ bank, freshUser }) => {
    const res = await bank.send('GET', endpoints.transactionsOnDate(freshUser.primaryAccountId, 'yesterday'));
    expect(res.ok()).toBe(false);
    expect(await res.text()).toContain('Unable to parse date yesterday');
  });

  test('unknown transaction id returns an error', async ({ bank }) => {
    const res = await bank.send('GET', endpoints.transaction(1));
    expect(res.ok()).toBe(false);
    expect(await res.text()).toContain('Could not find transaction #1');
  });
});
