import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/loan-scenarios.json';
import { isPublicDemo } from '../../src/config/env';

test.describe('Data-driven: loan decisions (API)', { tag: ['@data-driven', '@api'] }, () => {
  test.beforeEach(async ({ bank, freshUser }) => {
    const [account] = await bank.getAccounts(freshUser.id);
    // Boundary cases only make sense with the default opening balance.
    test.skip(Math.abs(account.balance - 515.5) > 0.001, `initial balance is ${account.balance}, expected 515.50`);
    if (isPublicDemo) {
      test.info().annotations.push({ type: 'note', description: 'Public demo admin settings may differ from defaults.' });
    }
  });

  for (const c of data.cases) {
    test(`${c.id}: amount ${c.amount}, down payment ${c.downPayment} -> ${c.approved ? 'approved' : c.message}`, async ({ bank, freshUser }) => {
      const loan = await bank.requestLoan(freshUser.id, c.amount, c.downPayment, freshUser.primaryAccountId);

      expect(loan.approved).toBe(c.approved);
      if (c.approved) {
        expect(loan.accountId).toBeGreaterThan(0);
      } else {
        expect(loan.message).toBe(c.message);
      }
    });
  }
});
