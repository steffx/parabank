import { test, expect } from '../../src/fixtures/test';
import { infoPages } from '../../src/pages/InfoPages';

test.describe('Public pages', { tag: '@public' }, () => {
  test('home page shows the login panel and service lists', { tag: '@smoke' }, async ({ app, page }) => {
    await app.home.goto();

    await expect(page).toHaveTitle(/ParaBank/);
    await expect(app.home.username).toBeVisible();
    await expect(app.home.password).toBeVisible();
    await expect(app.home.atmServices.locator('li')).not.toHaveCount(0);
    await expect(app.home.onlineServices.locator('li')).not.toHaveCount(0);
    await expect(app.home.latestNews.locator('li')).not.toHaveCount(0);
  });

  for (const info of infoPages) {
    test(`${info.name} page renders`, async ({ page }) => {
      const response = await page.goto(info.path);
      expect(response?.status()).toBe(200);
      await expect(page.getByText(info.marker).first()).toBeVisible();
    });
  }

  test('services page links to every published WSDL and the REST docs', async ({ page }) => {
    await page.goto('services.htm');
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
    for (const pattern of [/services\/ParaBank\?wsdl/, /services\/LoanProcessor\?wsdl/, /services\/bank\?_wadl/, /api-docs\/index\.html/]) {
      expect(hrefs.some((h) => pattern.test(h)), `link matching ${pattern}`).toBe(true);
    }
  });

  test('unknown page is reported as not found', async ({ page }) => {
    const response = await page.goto('this-page-does-not-exist.htm');
    const notFound = response?.status() === 404 || (await page.getByText(/was not found/).count()) > 0;
    expect(notFound, `status ${response?.status()}`).toBe(true);
  });
});
