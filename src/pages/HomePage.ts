import { Locator, Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  protected readonly path = 'index.htm';

  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotLoginLink: Locator;
  readonly error: Locator;
  readonly atmServices: Locator;
  readonly onlineServices: Locator;
  readonly latestNews: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator('#loginPanel input[name="username"]');
    this.password = page.locator('#loginPanel input[name="password"]');
    this.loginButton = page.locator('#loginPanel input[type="submit"]');
    this.registerLink = page.locator('#loginPanel').getByRole('link', { name: 'Register' });
    this.forgotLoginLink = page.locator('#loginPanel').getByRole('link', { name: 'Forgot login info?' });
    this.error = page.locator('#rightPanel p.error');
    this.atmServices = page.locator('ul.services');
    this.onlineServices = page.locator('ul.servicestwo');
    this.latestNews = page.locator('ul.events');
  }

  async login(username: string, password: string): Promise<void> {
    await test.step(`log in as "${username}"`, async () => {
      await this.username.fill(username);
      await this.password.fill(password);
      await this.loginButton.click();
    });
  }
}
