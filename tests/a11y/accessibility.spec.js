import { test, expect } from '../../src/fixtures/test';
import { checkA11y } from '../../src/utils/a11y';

const publicPages = [
  { label: 'home', path: 'index.htm' },
  { label: 'register', path: 'register.htm' },
  { label: 'lookup', path: 'lookup.htm' },
  { label: 'about', path: 'about.htm' },
  { label: 'contact', path: 'contact.htm' },
  { label: 'admin', path: 'admin.htm' },
];

const customerPages = [
  { label: 'overview', path: 'overview.htm', ready: '#accountTable tbody tr' },
  { label: 'open-account', path: 'openaccount.htm', ready: '#fromAccountId option' },
  { label: 'transfer', path: 'transfer.htm', ready: '#fromAccountId option' },
  { label: 'bill-pay', path: 'billpay.htm', ready: 'select[name="fromAccountId"] option' },
  { label: 'find-transactions', path: 'findtrans.htm', ready: '#accountId option' },
  { label: 'update-profile', path: 'updateprofile.htm', ready: '#updateProfileForm' },
  { label: 'request-loan', path: 'requestloan.htm', ready: '#fromAccountId option' },
];

test.describe('Accessibility (axe-core, WCAG 2.1 AA)', { tag: '@a11y' }, () => {
  for (const p of publicPages) {
    test(`public page: ${p.label}`, async ({ page }, testInfo) => {
      await page.goto(p.path);
      await checkA11y(page, testInfo, p.label);
    });
  }

  for (const p of customerPages) {
    test(`customer page: ${p.label}`, async ({ userApp }, testInfo) => {
      await userApp.page.goto(p.path);
      await expect(userApp.page.locator(p.ready).first()).toBeAttached();
      await checkA11y(userApp.page, testInfo, p.label);
    });
  }

  test('account activity page', async ({ userApp, workerUser }, testInfo) => {
    await userApp.activity.open(workerUser.primaryAccountId);
    await checkA11y(userApp.page, testInfo, 'activity');
  });

  test('login error state', async ({ app, page }, testInfo) => {
    await app.home.goto();
    await app.home.login('nobody', 'nothing');
    await expect(app.home.error).toBeVisible();
    await checkA11y(page, testInfo, 'login-error');
  });

  test('keyboard only: a customer can log in with Tab and Enter', async ({ app, page, workerUser }) => {
    await app.home.goto();
    await app.home.username.focus();
    await page.keyboard.type(workerUser.username);
    await page.keyboard.press('Tab');
    await expect(app.home.password).toBeFocused();
    await page.keyboard.type(workerUser.password);
    await page.keyboard.press('Enter');

    await app.overview.expectHeading('Accounts Overview');
  });
});
