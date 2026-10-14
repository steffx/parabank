import { test, expect } from '../../src/fixtures/test';
import { buildPayee } from '../../src/data/builders';
import { billPayFormFrom } from '../../src/pages/BillPayPage';

test.describe('Bill Pay', { tag: '@bill-pay' }, () => {
  test('pays a payee and debits the chosen account', { tag: '@smoke' }, async ({ loginAs, freshUser, bank }) => {
    const payee = buildPayee();
    const before = await bank.getAccount(freshUser.primaryAccountId);

    const app = await loginAs(freshUser);
    await app.billPay.goto();
    await app.billPay.pay({ ...billPayFormFrom(payee, 42.1), fromAccountId: freshUser.primaryAccountId });

    await app.billPay.expectHeading('Bill Payment Complete');
    await expect(app.billPay.result).toContainText(
      `Bill Payment to ${payee.name} in the amount of $42.10 from account ${freshUser.primaryAccountId} was successful.`,
    );

    const after = await bank.getAccount(freshUser.primaryAccountId);
    expect(after.balance).toBeCloseTo(before.balance - 42.1, 2);

    const debit = (await bank.getTransactions(freshUser.primaryAccountId)).find(
      (t) => t.description === `Bill Payment to ${payee.name}`,
    );
    expect(debit, 'bill payment transaction').toMatchObject({ type: 'Debit', amount: 42.1 });
  });

  test('empty form shows every validation message and sends nothing', async ({ userApp, page }) => {
    let billPayCalled = false;
    page.on('request', (r) => {
      if (r.url().includes('/bank/billpay')) billPayCalled = true;
    });

    await userApp.billPay.goto();
    await userApp.billPay.submit.click();

    for (const key of [
      'name',
      'address',
      'city',
      'state',
      'zipCode',
      'phoneNumber',
      'accountEmpty',
      'verifyAccountEmpty',
      'amountEmpty',
    ]) {
      await expect.soft(userApp.billPay.validation(key), key).toBeVisible();
    }
    await expect(userApp.billPay.validation('name')).toHaveText('Payee name is required.');
    await expect(userApp.billPay.validation('phoneNumber')).toHaveText('Phone number is required.');
    expect(billPayCalled).toBe(false);
  });

  test('account and verify-account must match', async ({ userApp }) => {
    await userApp.billPay.goto();
    await userApp.billPay.pay({ ...billPayFormFrom(buildPayee({ accountNumber: 11111 }), 5), verifyAccount: '22222' });

    await expect(userApp.billPay.validation('verifyAccountMismatch')).toHaveText('The account numbers do not match.');
    await expect(userApp.billPay.result).toBeHidden();
  });

  test('non-numeric amount and account are rejected', async ({ userApp }) => {
    await userApp.billPay.goto();
    await userApp.billPay.pay({
      ...billPayFormFrom(buildPayee(), 5),
      account: 'abc',
      verifyAccount: 'abc',
      amount: 'xyz',
    });

    await expect(userApp.billPay.validation('accountInvalid')).toBeVisible();
    await expect(userApp.billPay.validation('amountInvalid')).toBeVisible();
    await expect(userApp.billPay.result).toBeHidden();
  });

  test('phone field has an unstable id, so it is located by name', async ({ userApp, page }) => {
    await userApp.billPay.goto();
    const firstId = await userApp.billPay.input('payee.phoneNumber').getAttribute('id');
    await page.reload();
    const secondId = await userApp.billPay.input('payee.phoneNumber').getAttribute('id');

    expect(firstId).not.toBe(secondId);
  });
});
