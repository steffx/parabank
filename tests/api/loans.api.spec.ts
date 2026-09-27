import { test, expect } from '../../src/fixtures/test';
import { expectSchema, loanResponseSchema } from '../../src/api/schemas';

test.describe('REST: loans', { tag: '@api' }, () => {
  test('approved loan creates a LOAN account and takes the down payment', { tag: '@smoke' }, async ({ bank, freshUser }) => {
    const before = await bank.getAccount(freshUser.primaryAccountId);

    const loan = await bank.requestLoan(freshUser.id, 1000, 100, freshUser.primaryAccountId);

    expectSchema(loan, loanResponseSchema, 'loan response');
    expect(loan.approved).toBe(true);
    expect(loan.accountId).toBeDefined();
    const loanAccount = await bank.getAccount(loan.accountId!);
    expect(loanAccount).toMatchObject({ type: 'LOAN', balance: 1000, customerId: freshUser.id });
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(before.balance - 100, 2);

    const downPayment = (await bank.getTransactions(freshUser.primaryAccountId)).find(
      (t) => t.description === `Down Payment for Loan # ${loan.accountId}`,
    );
    expect(downPayment).toMatchObject({ type: 'Debit', amount: 100 });
  });

  test('denied loan creates no account and moves no money', async ({ bank, freshUser }) => {
    const before = await bank.getAccounts(freshUser.id);

    const loan = await bank.requestLoan(freshUser.id, 5_000_000, 10, freshUser.primaryAccountId);

    expect(loan.approved).toBe(false);
    expect(loan.message).toBe('error.insufficient.funds');
    expect(await bank.getAccounts(freshUser.id)).toEqual(before);
  });

  test('down payment above available funds is denied', async ({ bank, freshUser }) => {
    const loan = await bank.requestLoan(freshUser.id, 100, 999_999, freshUser.primaryAccountId);

    expect(loan.approved).toBe(false);
    expect(loan.message).toBe('error.insufficient.funds.for.down.payment');
  });

  test('response reports the loan provider and a response date', async ({ bank, freshUser }) => {
    const loan = await bank.requestLoan(freshUser.id, 200, 20, freshUser.primaryAccountId);

    expect(loan.loanProviderName.length).toBeGreaterThan(0);
    const date = new Date(loan.responseDate);
    expect(Math.abs(Date.now() - date.getTime())).toBeLessThan(2 * 24 * 3600 * 1000);
  });
});
