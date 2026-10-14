import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/bill-pay-validation.json';
import { buildPayee } from '../../src/data/builders';
import { billPayErrors, billPayFormFrom } from '../../src/pages/BillPayPage';

test.describe('Data-driven: bill pay validation', { tag: '@data-driven' }, () => {
  for (const c of data.cases) {
    test(`${c.id}: ${JSON.stringify(c.override)} -> ${c.visible.join(', ')}`, async ({ userApp }) => {
      await userApp.billPay.goto();
      await userApp.billPay.pay({ ...billPayFormFrom(buildPayee(), 10), ...c.override });

      for (const key of c.visible) {
        await expect(userApp.billPay.validation(key), key).toBeVisible();
      }
      const others = Object.keys(billPayErrors).filter((k) => !c.visible.includes(k));
      for (const key of others) {
        await expect.soft(userApp.billPay.validation(key), `${key} should stay hidden`).toBeHidden();
      }
      await expect(userApp.billPay.result).toBeHidden();
    });
  }
});
