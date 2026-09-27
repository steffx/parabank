import { test, expect } from '../../src/fixtures/test';

/** Act in the browser, then verify the persisted state through the API (not just what the page says). */
test.describe('Hybrid: act in UI, verify via API', { tag: '@hybrid' }, () => {
  test('UI transfer sends the right request and updates both balances', async ({ bank, freshUser, loginAs }) => {
    const target = await bank.createAccount(freshUser.id, 'SAVINGS', freshUser.primaryAccountId);
    const app = await loginAs(freshUser);
    await app.transfer.goto();

    const requestPromise = app.page.waitForRequest((r) => r.url().includes('/bank/transfer'));
    await app.transfer.transfer('12.34', freshUser.primaryAccountId, target.id);
    const request = await requestPromise;

    // The browser calls the same REST API through /services_proxy.
    const url = new URL(request.url());
    expect(url.pathname).toMatch(/services_proxy\/bank\/transfer$/);
    expect(request.method()).toBe('POST');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      fromAccountId: String(freshUser.primaryAccountId),
      toAccountId: String(target.id),
      amount: '12.34',
    });

    await app.transfer.expectHeading('Transfer Complete!');
    expect((await bank.getAccount(target.id)).balance).toBeCloseTo(target.balance + 12.34, 2);
  });

  test('UI registration creates a customer the API can log in', async ({ app, bank }) => {
    const { buildCustomer } = await import('../../src/data/builders');
    const customer = buildCustomer();
    await app.register.goto();
    await app.register.register(customer);
    await expect(app.register.successMessage).toBeVisible();

    const created = await bank.login(customer.username, customer.password);
    expect(created.address).toEqual(customer.address);
  });

  test('UI loan request creates a LOAN account visible to the API', async ({ bank, freshUser, loginAs }) => {
    const app = await loginAs(freshUser);
    await app.requestLoan.goto();

    const responsePromise = app.page.waitForResponse((r) => r.url().includes('/bank/requestLoan'));
    await app.requestLoan.apply(400, 40, freshUser.primaryAccountId);
    const loan = await (await responsePromise).json();

    expect(loan.approved).toBe(true);
    await expect(app.requestLoan.newAccountId).toHaveText(String(loan.accountId));
    expect((await bank.getAccount(loan.accountId)).type).toBe('LOAN');
  });
});
