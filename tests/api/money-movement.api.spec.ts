import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';

test.describe('REST: deposit, withdraw, transfer', { tag: '@api' }, () => {
  test('POST /deposit credits the account', { tag: '@smoke' }, async ({ bank, freshUser }) => {
    const before = await bank.getAccount(freshUser.primaryAccountId);

    const message = await bank.deposit(freshUser.primaryAccountId, 100.25);

    expect(message).toBe(`Successfully deposited $100.25 to account #${freshUser.primaryAccountId}`);
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(before.balance + 100.25, 2);
  });

  test('POST /withdraw debits the account', async ({ bank, freshUser }) => {
    const before = await bank.getAccount(freshUser.primaryAccountId);

    const message = await bank.withdraw(freshUser.primaryAccountId, 40);

    expect(message).toBe(`Successfully withdrew $40 from account #${freshUser.primaryAccountId}`);
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(before.balance - 40, 2);
  });

  test('POST /transfer moves money and records a debit and a credit', async ({ bank, freshUser }) => {
    const target = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    const [from0, to0] = await Promise.all([bank.getAccount(freshUser.primaryAccountId), bank.getAccount(target.id)]);

    const message = await bank.transfer(freshUser.primaryAccountId, target.id, 33.33);

    expect(message).toBe(
      `Successfully transferred $33.33 from account #${freshUser.primaryAccountId} to account #${target.id}`,
    );
    const [from1, to1] = await Promise.all([bank.getAccount(freshUser.primaryAccountId), bank.getAccount(target.id)]);
    expect(from1.balance).toBeCloseTo(from0.balance - 33.33, 2);
    expect(to1.balance).toBeCloseTo(to0.balance + 33.33, 2);

    const sent = (await bank.getTransactions(freshUser.primaryAccountId)).filter((t) => t.description === 'Funds Transfer Sent');
    const received = (await bank.getTransactions(target.id)).filter((t) => t.description === 'Funds Transfer Received');
    expect(sent.some((t) => t.type === 'Debit' && t.amount === 33.33)).toBe(true);
    expect(received.some((t) => t.type === 'Credit' && t.amount === 33.33)).toBe(true);
  });

  test('money is conserved across many transfers', async ({ bank, freshUser }) => {
    const b = await bank.createAccount(freshUser.id, 'CHECKING', freshUser.primaryAccountId);
    const c = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    const total = async () =>
      (await bank.getAccounts(freshUser.id)).reduce((sum, a) => sum + a.balance, 0);
    const start = await total();

    await bank.transfer(freshUser.primaryAccountId, b.id, 10);
    await bank.transfer(b.id, c.id, 5.55);
    await bank.transfer(c.id, freshUser.primaryAccountId, 1.11);

    expect(await total()).toBeCloseTo(start, 2);
  });

  test.describe('negative', () => {
    test('deposit into a missing account fails', async ({ bank }) => {
      const res = await bank.send('POST', endpoints.deposit, { params: { accountId: 1, amount: 10 } });
      expect(res.ok()).toBe(false);
      expect(await res.text()).toContain('Could not find account number 1');
    });

    test('withdraw from a missing account fails', async ({ bank }) => {
      const res = await bank.send('POST', endpoints.withdraw, { params: { accountId: 1, amount: 10 } });
      expect(res.ok()).toBe(false);
    });

    test('transfer without an amount is rejected', async ({ bank, workerUser }) => {
      const res = await bank.send('POST', endpoints.transfer, {
        params: { fromAccountId: workerUser.primaryAccountId, toAccountId: workerUser.primaryAccountId },
      });
      expect(res.ok()).toBe(false);
    });

    test('non-numeric amount is rejected', async ({ bank, workerUser }) => {
      const res = await bank.send('POST', endpoints.deposit, {
        params: { accountId: workerUser.primaryAccountId, amount: 'ten' },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test('GET is not allowed on POST-only resources', async ({ bank, workerUser }) => {
      const res = await bank.send('GET', endpoints.deposit, {
        params: { accountId: workerUser.primaryAccountId, amount: 1 },
      });
      expect(res.status()).toBe(405);
    });
  });

  test.describe('known behaviour (findings)', () => {
    test('withdraw is allowed beyond the balance', async ({ bank, freshUser }) => {
      test.info().annotations.push({ type: 'finding', description: 'No insufficient-funds check on withdraw.' });
      const before = await bank.getAccount(freshUser.primaryAccountId);
      await bank.withdraw(freshUser.primaryAccountId, before.balance + 500);
      expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeLessThan(0);
    });

    test('negative deposit amount is accepted and reduces the balance', async ({ bank, freshUser }) => {
      test.info().annotations.push({ type: 'finding', description: 'Negative amounts are not validated.' });
      const before = await bank.getAccount(freshUser.primaryAccountId);
      const res = await bank.send('POST', endpoints.deposit, { params: { accountId: freshUser.primaryAccountId, amount: -10 } });
      if (res.ok()) {
        expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(before.balance - 10, 2);
      } else {
        test.info().annotations.push({ type: 'note', description: `Server rejected negative deposit: HTTP ${res.status()}` });
      }
    });

    test('transfer between accounts of different customers is allowed', async ({ bank, freshUser, registerUser }) => {
      test.info().annotations.push({ type: 'finding', description: 'Transfer does not check account ownership (IDOR).' });
      const other = await registerUser();
      const before = await bank.getAccount(other.primaryAccountId);
      await bank.transfer(freshUser.primaryAccountId, other.primaryAccountId, 1);
      expect((await bank.getAccount(other.primaryAccountId)).balance).toBeCloseTo(before.balance + 1, 2);
    });
  });
});
