import { test, expect } from '../../src/fixtures/test';

/**
 * The ParaBank UI renders most pages from AJAX calls to services_proxy/bank/*.
 * Intercepting them lets us test UI states that are hard to reach with real data.
 */
test.describe('Hybrid: network mocking with page.route', { tag: '@hybrid' }, () => {
  test('overview renders whatever accounts the API returns (mocked)', async ({ userApp, workerUser }) => {
    await userApp.page.route('**/services_proxy/bank/customers/*/accounts', (route) =>
      route.fulfill({
        json: [
          { id: 11111, customerId: workerUser.id, type: 'CHECKING', balance: 1000.5 },
          { id: 22222, customerId: workerUser.id, type: 'SAVINGS', balance: -250 },
          { id: 33333, customerId: workerUser.id, type: 'LOAN', balance: 0 },
        ],
      }),
    );

    await userApp.overview.goto();
    const rows = await userApp.overview.rows();

    expect(rows).toEqual([
      { accountId: 11111, balance: 1000.5, available: 1000.5 },
      { accountId: 22222, balance: -250, available: 0 },
      { accountId: 33333, balance: 0, available: 0 },
    ]);
    expect(await userApp.overview.total()).toBeCloseTo(750.5, 2);
  });

  test('overview shows the error panel when the API fails', async ({ userApp }) => {
    await userApp.page.route('**/services_proxy/bank/customers/*/accounts', (route) =>
      route.fulfill({ status: 500, json: { message: 'boom' } }),
    );

    await userApp.overview.goto();

    await expect(userApp.overview.error).toBeVisible();
    await expect(userApp.overview.error).toContainText('An internal error has occurred and has been logged.');
    await expect(userApp.overview.table).toBeHidden();
  });

  test('transfer shows the error panel when the network drops', async ({ userApp }) => {
    await userApp.page.route('**/services_proxy/bank/transfer*', (route) => route.abort('connectionreset'));

    await userApp.transfer.goto();
    await userApp.transfer.transfer('1');

    await expect(userApp.transfer.error).toBeVisible();
    await expect(userApp.transfer.result).toBeHidden();
  });

  test('loan UI renders an approval without touching the back end', async ({ userApp }) => {
    await userApp.page.route('**/services_proxy/bank/requestLoan*', (route) =>
      route.fulfill({
        json: {
          responseDate: Date.now(),
          loanProviderName: 'Mocked Lender',
          approved: true,
          message: null,
          accountId: 98765,
        },
      }),
    );

    await userApp.requestLoan.goto();
    await userApp.requestLoan.apply(1_000_000, 1);

    await expect(userApp.requestLoan.status).toHaveText('Approved');
    await expect(userApp.requestLoan.providerName).toHaveText('Mocked Lender');
    await expect(userApp.requestLoan.newAccountId).toHaveText('98765');
  });

  test('loan UI maps every denial reason to its message', async ({ userApp }) => {
    const reasons = {
      'error.insufficient.funds': 'We cannot grant a loan in that amount with your available funds.',
      'error.insufficient.down.payment': 'We cannot grant a loan in that amount with the given down payment.',
      'error.insufficient.funds.for.down.payment': 'You do not have sufficient funds for the given down payment.',
      'error.insufficient.funds.and.down.payment':
        'We cannot grant a loan in that amount with your available funds and down payment.',
    };
    for (const [code, text] of Object.entries(reasons)) {
      await userApp.page.unroute('**/services_proxy/bank/requestLoan*');
      await userApp.page.route('**/services_proxy/bank/requestLoan*', (route) =>
        route.fulfill({ json: { responseDate: Date.now(), loanProviderName: 'Mock', approved: false, message: code } }),
      );
      await userApp.requestLoan.goto();
      await userApp.requestLoan.apply(100, 10);

      await expect(userApp.requestLoan.status, code).toHaveText('Denied');
      await expect(userApp.requestLoan.deniedMessage, code).toContainText(text);
    }
  });

  test('slow API: overview still renders once the response arrives', async ({ userApp }) => {
    await userApp.page.route('**/services_proxy/bank/customers/*/accounts', async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    await userApp.overview.goto();
    await expect(userApp.overview.accountRows.first()).toBeVisible({ timeout: 20_000 });
  });
});
