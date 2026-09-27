import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/transfer-amounts.json';

test.describe('Data-driven: transfer amounts (API)', { tag: ['@data-driven', '@api'] }, () => {
  for (const c of data.cases) {
    test(`${c.id}: transfer $${c.amount}`, async ({ bank, freshUser }) => {
      const target = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
      const [from0, to0] = await Promise.all([bank.getAccount(freshUser.primaryAccountId), bank.getAccount(target.id)]);

      await bank.transfer(freshUser.primaryAccountId, target.id, c.amount);

      const [from1, to1] = await Promise.all([bank.getAccount(freshUser.primaryAccountId), bank.getAccount(target.id)]);
      expect(from1.balance).toBeCloseTo(from0.balance - c.amount, 2);
      expect(to1.balance).toBeCloseTo(to0.balance + c.amount, 2);
    });
  }
});
