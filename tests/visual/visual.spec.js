import { test, expect } from '../../src/fixtures/test';

/**
 * Visual regression. Baselines live in tests/visual/__screenshots__/.
 * Create/refresh them with:  npm run test:visual:update
 * Generate baselines on the same OS as CI (Linux) — fonts differ between platforms.
 * Dynamic content (news dates, account numbers, balances) is masked.
 */
test.describe('Visual regression', { tag: '@visual' }, () => {
  test('home page', async ({ app, page }) => {
    await app.home.goto();
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      mask: [app.home.latestNews],
    });
  });

  test('registration form', async ({ app, page }) => {
    await app.register.goto();
    await expect(page.locator('#rightPanel')).toHaveScreenshot('register-form.png');
  });

  test('registration form with every validation error', async ({ app, page }) => {
    await app.register.goto();
    await app.register.submit.click();
    await expect(page.locator('#rightPanel')).toHaveScreenshot('register-errors.png');
  });

  test('login error', async ({ app, page }) => {
    await app.home.goto();
    await app.home.login('nobody', 'nothing');
    await expect(page.locator('#rightPanel')).toHaveScreenshot('login-error.png');
  });

  test('about page', async ({ page }) => {
    await page.goto('about.htm');
    await expect(page.locator('#rightPanel')).toHaveScreenshot('about.png');
  });

  test('accounts overview layout', async ({ userApp }) => {
    await userApp.overview.goto();
    await userApp.overview.waitForAccounts();
    await expect(userApp.page).toHaveScreenshot('overview.png', {
      mask: [userApp.overview.table.locator('tbody'), userApp.overview.welcomeText],
    });
  });

  test('open account form', async ({ userApp }) => {
    await userApp.openAccount.goto();
    await userApp.openAccount.waitForFromAccounts();
    await expect(userApp.page.locator('#rightPanel')).toHaveScreenshot('open-account.png', {
      mask: [userApp.openAccount.fromAccount],
    });
  });

  test('bill pay form', async ({ userApp }) => {
    await userApp.billPay.goto();
    await expect(userApp.billPay.form).toHaveScreenshot('bill-pay-form.png', {
      mask: [userApp.billPay.fromAccount],
    });
  });
});
