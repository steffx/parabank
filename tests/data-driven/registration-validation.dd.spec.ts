import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/registration-validation.json';
import { buildCustomer } from '../../src/data/builders';
import { RegisterField } from '../../src/pages/RegisterPage';

type Case = { id: string; field: RegisterField; value: string; errorField: RegisterField; message: string };

test.describe('Data-driven: registration validation', { tag: '@data-driven' }, () => {
  for (const c of data.cases as Case[]) {
    test(`${c.id}: ${c.field}="${c.value}" -> "${c.message}"`, async ({ app }) => {
      const customer = buildCustomer();
      await app.register.goto();
      await app.register.fill(customer);
      await app.register.field(c.field).fill(c.value);
      await app.register.submit.click();

      await expect(app.register.error(c.errorField)).toHaveText(c.message);
      // Only the targeted field fails.
      await expect(app.register.rightPanel.locator('span.error')).toHaveCount(1);
    });
  }
});
