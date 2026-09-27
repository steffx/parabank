import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/bill-pay-validation.json';
import { buildPayee } from '../../src/data/builders';
import { BillPayErrorKey, BillPayForm, billPayErrors, billPayFormFrom } from '../../src/pages/BillPayPage';

type Case = { id: string; override: Partial<BillPayForm>; visible: BillPayErrorKey[] };

test.describe('Data-driven: bill pay validation', { tag: '@data-driven' }, () => {
  for (const c of data.cases as Case[]) {
    test(`${c.id}: ${JSON.stringify(c.override)} -> ${c.visible.join(', ')}`, async ({ userApp }) => {
      await userApp.billPay.goto();
      await userApp.billPay.pay({ ...billPayFormFrom(buildPayee(), 10), ...c.override });

      for (const key of c.visible) {
        await expect(userApp.billPay.validation(key), key).toBeVisible();
      }
      const others = (Object.keys(billPayErrors) as BillPayErrorKey[]).filter((k) => !c.visible.includes(k));
      for (const key of others) {
        await expect.soft(userApp.billPay.validation(key), `${key} should stay hidden`).toBeHidden();
      }
      await expect(userApp.billPay.result).toBeHidden();
    });
  }
});
