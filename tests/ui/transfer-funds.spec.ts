import { test, expect } from '../../src/fixtures/test';

test.describe('Transfer Funds', { tag: '@transfer' }, () => {
  test('moves money between two of the customer\'s accounts', { tag: '@smoke' }, async ({ loginAs, freshUser, bank }) => {
    const second = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    const [fromBefore, toBefore] = await Promise.all([
      bank.getAccount(freshUser.primaryAccountId),
      bank.getAccount(second.id),
    ]);

    const app = await loginAs(freshUser);
    await app.transfer.goto();
    await app.transfer.transfer('25.50', freshUser.primaryAccountId, second.id);

    await app.transfer.expectHeading('Transfer Complete!');
    await expect(app.transfer.amountResult).toHaveText('$25.50');
    await expect(app.transfer.fromAccountResult).toHaveText(String(freshUser.primaryAccountId));
    await expect(app.transfer.toAccountResult).toHaveText(String(second.id));
    await expect(app.transfer.result).toContainText(
      `$25.50 has been transferred from account #${freshUser.primaryAccountId} to account #${second.id}.`,
    );

    const [fromAfter, toAfter] = await Promise.all([bank.getAccount(freshUser.primaryAccountId), bank.getAccount(second.id)]);
    expect(fromAfter.balance).toBeCloseTo(fromBefore.balance - 25.5, 2);
    expect(toAfter.balance).toBeCloseTo(toBefore.balance + 25.5, 2);
  });

  test('both dropdowns list every account of the customer', async ({ userApp, bank, workerUser }) => {
    const ids = (await bank.getAccounts(workerUser.id)).map((a) => String(a.id));
    await userApp.transfer.goto();
    await userApp.transfer.waitForAccounts();

    await expect(userApp.transfer.fromAccount.locator('option')).toHaveText(ids);
    await expect(userApp.transfer.toAccount.locator('option')).toHaveText(ids);
  });

  test('empty amount is not transferred', async ({ userApp }) => {
    await userApp.transfer.goto();
    await userApp.transfer.transfer('');

    await expect(userApp.transfer.result).toBeHidden();
    await expect(userApp.transfer.error).toBeVisible();
    await expect(userApp.transfer.error).toContainText('An internal error has occurred and has been logged.');
  });

  test('non-numeric amount is not transferred', async ({ userApp }) => {
    await userApp.transfer.goto();
    await userApp.transfer.transfer('ten dollars');

    await expect(userApp.transfer.result).toBeHidden();
    await expect(userApp.transfer.error).toBeVisible();
  });

  test('KNOWN BEHAVIOUR: transfers larger than the balance are accepted (overdraft)', async ({ loginAs, freshUser, bank }) => {
    test.info().annotations.push({
      type: 'finding',
      description: 'ParaBank does not check available funds on transfer; the source account goes negative.',
    });
    const second = await bank.createAccount(freshUser.id, 'CHECKING', freshUser.primaryAccountId);
    const before = await bank.getAccount(freshUser.primaryAccountId);
    const tooMuch = Math.ceil(before.balance) + 1000;

    const app = await loginAs(freshUser);
    await app.transfer.goto();
    await app.transfer.transfer(tooMuch, freshUser.primaryAccountId, second.id);

    await app.transfer.expectHeading('Transfer Complete!');
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeLessThan(0);
  });
});
