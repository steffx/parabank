import { test, expect } from '../../src/fixtures/test';
import { buildPayee } from '../../src/data/builders';

/**
 * Exploratory security checks. They use harmless marker markup (no scripts) and only touch
 * the test's own fresh customer. A passing test here documents a weakness in ParaBank.
 */
test.describe('Security findings (HTML injection)', { tag: ['@hybrid', '@security'] }, () => {
  const probe = '<b id="pw-injection-probe">probe</b>';

  test('stored HTML injection: bill-pay payee name is rendered as markup in Account Activity', async ({
    bank,
    freshUser,
    loginAs,
  }) => {
    test.info().annotations.push({
      type: 'finding',
      description: 'activity.jsp builds rows with string concatenation of transaction.description (no escaping).',
    });
    await bank.billPay(freshUser.primaryAccountId, 1, buildPayee({ name: probe }));

    const app = await loginAs(freshUser);
    await app.activity.open(freshUser.primaryAccountId);

    // If the description were escaped we would see the literal text "<b id=...>" instead of an element.
    await expect(app.page.locator('#pw-injection-probe')).toHaveCount(1);
  });

  test('Find Transactions renders descriptions as markup too', async ({ bank, freshUser, loginAs }) => {
    await bank.billPay(freshUser.primaryAccountId, 2.22, buildPayee({ name: probe }));

    const app = await loginAs(freshUser);
    await app.findTransactions.goto();
    await app.findTransactions.byAmount(freshUser.primaryAccountId, 2.22);

    await expect(app.page.locator('#resultContainer #pw-injection-probe')).toHaveCount(1);
  });

  test('loan provider name is inserted with .html() (reflected from the API response)', async ({ userApp }) => {
    await userApp.page.route('**/services_proxy/bank/requestLoan*', (route) =>
      route.fulfill({ json: { responseDate: Date.now(), loanProviderName: probe, approved: true, accountId: 1 } }),
    );
    await userApp.requestLoan.goto();
    await userApp.requestLoan.apply(10, 1);

    await expect(userApp.requestLoan.providerName.locator('#pw-injection-probe')).toHaveCount(1);
  });

  test('session cookie is HttpOnly', async ({ userApp }) => {
    const cookies = await userApp.page.context().cookies();
    const session = cookies.find((c) => c.name === 'JSESSIONID');
    expect(session, 'JSESSIONID cookie').toBeDefined();
    expect.soft(session.httpOnly, 'JSESSIONID should be HttpOnly').toBe(true);
  });
});
