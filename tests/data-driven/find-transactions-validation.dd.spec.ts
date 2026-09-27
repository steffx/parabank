import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/find-transactions-validation.json';

test.describe('Data-driven: find transactions validation', { tag: '@data-driven' }, () => {
  for (const c of data.cases) {
    test(`${c.id}: ${c.search}(${c.input.map((i) => JSON.stringify(i)).join(', ')})`, async ({ userApp, workerUser, page }) => {
      const page$ = userApp.findTransactions;
      await page$.goto();
      const account = workerUser.primaryAccountId;
      switch (c.search) {
        case 'byId':
          await page$.byId(account, c.input[0]);
          break;
        case 'byDate':
          await page$.byDate(account, c.input[0]);
          break;
        case 'byDateRange':
          await page$.byDateRange(account, c.input[0], c.input[1]);
          break;
        case 'byAmount':
          await page$.byAmount(account, c.input[0]);
          break;
      }
      await expect(page.locator(`#${c.errorLocator}`)).toHaveText(c.message);
      await expect(page$.resultContainer).toBeHidden();
    });
  }
});
