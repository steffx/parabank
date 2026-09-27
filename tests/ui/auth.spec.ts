import { test, expect } from '../../src/fixtures/test';

test.describe('Authentication', { tag: '@auth' }, () => {
  test('customer can log in and sees the accounts overview', { tag: '@smoke' }, async ({ app, workerUser }) => {
    await app.home.goto();
    await app.home.login(workerUser.username, workerUser.password);

    await app.overview.expectHeading('Accounts Overview');
    await expect(app.overview.welcomeText).toHaveText(`Welcome ${workerUser.firstName} ${workerUser.lastName}`);
    await expect(app.overview.accountServicesLink('Log Out')).toBeVisible();
    await expect(app.home.username).toBeHidden();
  });

  test('wrong password is rejected with a clear message', async ({ app, workerUser }) => {
    await app.home.goto();
    await app.home.login(workerUser.username, `${workerUser.password}-wrong`);

    await app.home.expectHeading('Error!');
    await expect(app.home.error).toHaveText('The username and password could not be verified.');
  });

  test('empty username and password are rejected', async ({ app }) => {
    await app.home.goto();
    await app.home.login('', '');

    await expect(app.home.error).toHaveText('Please enter a username and password.');
  });

  test('log out ends the session', async ({ loginAs, freshUser }) => {
    const app = await loginAs(freshUser);
    await app.overview.goto();
    await app.overview.waitForAccounts();

    await app.overview.logout();

    await expect(app.home.username).toBeVisible();
    await app.overview.goto();
    await expect(app.overview.table).toBeHidden();
    await expect(app.home.loginButton).toBeVisible();
  });

  const protectedPages = [
    'overview.htm',
    'openaccount.htm',
    'transfer.htm',
    'billpay.htm',
    'findtrans.htm',
    'updateprofile.htm',
    'requestloan.htm',
  ];

  for (const path of protectedPages) {
    test(`anonymous visitor cannot use ${path}`, async ({ page, app }) => {
      await page.goto(path);
      await expect(app.home.loginButton).toBeVisible();
      await expect(app.home.accountServicesLink('Log Out')).toHaveCount(0);
    });
  }
});
