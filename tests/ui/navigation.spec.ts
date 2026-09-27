import { test, expect } from '../../src/fixtures/test';

const menu = [
  { link: 'Open New Account', heading: 'Open New Account', url: /openaccount\.htm/ },
  { link: 'Accounts Overview', heading: 'Accounts Overview', url: /overview\.htm/ },
  { link: 'Transfer Funds', heading: 'Transfer Funds', url: /transfer\.htm/ },
  { link: 'Bill Pay', heading: 'Bill Payment Service', url: /billpay\.htm/ },
  { link: 'Find Transactions', heading: 'Find Transactions', url: /findtrans\.htm/ },
  { link: 'Update Contact Info', heading: 'Update Profile', url: /updateprofile\.htm/ },
  { link: 'Request Loan', heading: 'Apply for a Loan', url: /requestloan\.htm/ },
];

test.describe('Account Services menu', { tag: '@navigation' }, () => {
  for (const item of menu) {
    test(`"${item.link}" opens the right page`, async ({ userApp }) => {
      await userApp.overview.goto();
      await userApp.overview.navigateTo(item.link);

      await expect(userApp.page).toHaveURL(item.url);
      await userApp.overview.expectHeading(item.heading);
    });
  }

  test('footer links work for anonymous visitors', async ({ app, page }) => {
    await app.home.goto();
    for (const [name, url] of [
      ['About Us', /about\.htm/],
      ['Services', /services\.htm/],
      ['Site Map', /sitemap\.htm/],
      ['Contact Us', /contact\.htm/],
      ['Home', /index\.htm/],
    ] as const) {
      await page.locator('#footerPanel').getByRole('link', { name, exact: true }).click();
      await expect(page, `footer link ${name}`).toHaveURL(url);
    }
  });
});
