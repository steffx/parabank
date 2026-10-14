import { expect, test } from '@playwright/test';

/**
 * Shared layout of every ParaBank page:
 *   #topPanel (logo)  #headerPanel (home/about/contact)  #leftPanel (login or account services)  #rightPanel (content)
 */
export class BasePage {
  /**
   * Path relative to the application root, e.g. "overview.htm".
   * Abstract: every subclass sets it as a class field.
   * @type {string}
   */
  path;

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.leftPanel = page.locator('#leftPanel');
    this.rightPanel = page.locator('#rightPanel');
    this.welcomeText = page.locator('#leftPanel p.smallText');
  }

  async goto(query = '') {
    await test.step(`open ${this.path}${query}`, async () => {
      await this.page.goto(`${this.path}${query}`);
    });
  }

  /** Visible <h1 class="title"> in the content area (AJAX pages keep hidden ones for result/error states). */
  heading() {
    return this.rightPanel.locator('h1.title').filter({ visible: true }).first();
  }

  async expectHeading(text) {
    await expect(this.heading()).toHaveText(text);
  }

  /** "Account Services" menu shown in the left panel after login. */
  accountServicesLink(name) {
    return this.leftPanel.getByRole('link', { name, exact: true });
  }

  async navigateTo(name) {
    await test.step(`navigate via menu: ${name}`, async () => {
      await this.accountServicesLink(name).click();
    });
  }

  async logout() {
    await this.navigateTo('Log Out');
  }

  /** Top header links: home / about / contact (icons with text). */
  headerLink(name) {
    return this.page.locator('#headerPanel ul.button').getByRole('link', { name });
  }
}
