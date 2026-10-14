import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { accountSchema, arrayOf, expectSchema } from '../../src/api/schemas';

test.describe('REST: accounts', { tag: '@api' }, () => {
  test('GET /customers/{id}/accounts lists the customer accounts', { tag: '@smoke' }, async ({ bank, freshUser }) => {
    const accounts = await bank.getAccounts(freshUser.id);

    expectSchema(accounts, arrayOf(accountSchema), 'accounts');
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ customerId: freshUser.id, type: 'CHECKING' });
    expect(accounts[0].balance).toBeGreaterThan(0);
  });

  test('GET /accounts/{id} returns one account', async ({ bank, workerUser }) => {
    const account = await bank.getAccount(workerUser.primaryAccountId);

    expectSchema(account, accountSchema, 'account');
    expect(account.id).toBe(workerUser.primaryAccountId);
  });

  for (const type of ['CHECKING', 'SAVINGS']) {
    test(`POST /createAccount opens a ${type} account and funds it from the source`, async ({ bank, freshUser }) => {
      const before = await bank.getAccount(freshUser.primaryAccountId);

      const created = await bank.createAccount(freshUser.id, type, freshUser.primaryAccountId);

      expectSchema(created, accountSchema, 'created account');
      expect(created).toMatchObject({ customerId: freshUser.id, type });
      const after = await bank.getAccount(freshUser.primaryAccountId);
      // money is conserved: what left the source is the opening balance of the new account
      expect(before.balance - after.balance).toBeCloseTo(created.balance, 2);
      expect((await bank.getAccounts(freshUser.id)).map((a) => a.id)).toContain(created.id);
    });
  }

  test('unknown account id returns an error', async ({ bank }) => {
    const res = await bank.send('GET', endpoints.account(1));

    expect(res.ok()).toBe(false);
    expect(await res.text()).toContain('Could not find account #1');
  });

  test('createAccount from a non-existing account fails', async ({ bank, freshUser }) => {
    const res = await bank.send('POST', endpoints.createAccount, {
      params: { customerId: freshUser.id, newAccountType: 0, fromAccountId: 1 },
    });
    expect(res.ok()).toBe(false);
  });
});
