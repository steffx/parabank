import { test, expect } from '../../src/fixtures/test';

/**
 * Expectations assume ParaBank's default admin settings
 * (loan processor = "Available Funds", threshold = 20%, initial balance = $515.50).
 * On the shared public demo those settings can be changed by anyone.
 */
test.describe('Request Loan', { tag: '@loan' }, () => {
  test('small loan is approved and a loan account is created', { tag: '@smoke' }, async ({ loginAs, freshUser, bank }) => {
    const app = await loginAs(freshUser);
    const before = await bank.getAccount(freshUser.primaryAccountId);

    await app.requestLoan.goto();
    await app.requestLoan.expectHeading('Apply for a Loan');
    await app.requestLoan.apply(500, 50, freshUser.primaryAccountId);

    await app.requestLoan.expectHeading('Loan Request Processed');
    await expect(app.requestLoan.status).toHaveText('Approved');
    await expect(app.requestLoan.approvedMessage).toContainText('Congratulations, your loan has been approved.');
    await expect(app.requestLoan.providerName).not.toBeEmpty();
    await expect(app.requestLoan.responseDate).not.toBeEmpty();

    const loanAccountId = Number(await app.requestLoan.newAccountId.innerText());
    const loan = await bank.getAccount(loanAccountId);
    expect(loan).toMatchObject({ type: 'LOAN', customerId: freshUser.id, balance: 500 });
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(before.balance - 50, 2);
  });

  test('loan far above available funds is denied', async ({ loginAs, freshUser }) => {
    const app = await loginAs(freshUser);
    await app.requestLoan.goto();
    await app.requestLoan.apply(1_000_000, 10);

    await expect(app.requestLoan.status).toHaveText('Denied');
    await expect(app.requestLoan.deniedMessage).toContainText('We cannot grant a loan in that amount with your available funds.');
    await expect(app.requestLoan.newAccountId).toBeHidden();
  });

  test('down payment larger than available funds is denied', async ({ loginAs, freshUser }) => {
    const app = await loginAs(freshUser);
    await app.requestLoan.goto();
    await app.requestLoan.apply(1000, 100_000);

    await expect(app.requestLoan.status).toHaveText('Denied');
    await expect(app.requestLoan.deniedMessage).toContainText('You do not have sufficient funds for the given down payment.');
  });

  test('empty amounts produce an error instead of a decision', async ({ userApp }) => {
    await userApp.requestLoan.goto();
    await userApp.requestLoan.apply('', '');

    await expect(userApp.requestLoan.result).toBeHidden();
    await expect(userApp.requestLoan.error).toBeVisible();
  });
});
