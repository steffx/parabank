import { test, expect } from '../../src/fixtures/test';
import { parseMoney } from '../../src/utils/money';

test.describe('Open New Account', { tag: '@open-account' }, () => {
  for (const type of ['CHECKING', 'SAVINGS'] as const) {
    test(`opens a ${type} account funded from an existing account`, { tag: '@smoke' }, async ({ loginAs, freshUser, bank }) => {
      const app = await loginAs(freshUser);
      const before = await bank.getAccount(freshUser.primaryAccountId);

      await app.openAccount.goto();
      await app.openAccount.expectHeading('Open New Account');
      const minimumDeposit = parseMoney(
        (await app.openAccount.minimumDepositNote.innerText()).match(/\$[\d,.]+/)![0],
      );
      const newId = await app.openAccount.open(type, freshUser.primaryAccountId);

      await app.openAccount.expectHeading('Account Opened!');
      await expect(app.openAccount.result).toContainText('Congratulations, your account is now open.');

      const created = await bank.getAccount(newId);
      expect(created).toMatchObject({ id: newId, customerId: freshUser.id, type });
      expect(created.balance).toBeCloseTo(minimumDeposit, 2);

      const after = await bank.getAccount(freshUser.primaryAccountId);
      expect(after.balance).toBeCloseTo(before.balance - minimumDeposit, 2);
    });
  }

  test('new account appears in the overview and links to its activity', async ({ loginAs, freshUser }) => {
    const app = await loginAs(freshUser);
    await app.openAccount.goto();
    const newId = await app.openAccount.open('SAVINGS');

    await app.openAccount.newAccountId.click();
    await expect(app.activity.accountId).toHaveText(String(newId));
    await expect(app.activity.accountType).toHaveText('SAVINGS');

    await app.overview.goto();
    await expect(app.overview.accountLink(newId)).toBeVisible();
  });

  test('both account types are offered', async ({ userApp }) => {
    await userApp.openAccount.goto();
    await expect(userApp.openAccount.type.locator('option')).toHaveText(['CHECKING', 'SAVINGS']);
  });
});
