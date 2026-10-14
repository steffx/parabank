import { expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class OpenAccountPage extends BasePage {
  path = 'openaccount.htm';

  constructor(page) {
    super(page);
    this.type = page.locator('#type');
    this.fromAccount = page.locator('#fromAccountId');
    this.submit = page.locator('#openAccountForm input[type="button"]');
    this.minimumDepositNote = page.locator('#openAccountForm p', { hasText: 'A minimum of' });
    this.result = page.locator('#openAccountResult');
    this.newAccountId = page.locator('#newAccountId');
    this.error = page.locator('#openAccountError');
  }

  /** The "from account" dropdown is filled by AJAX after page load. */
  async waitForFromAccounts() {
    await expect(this.fromAccount.locator('option').first()).toBeAttached();
  }

  async open(type, fromAccountId) {
    return test.step(`open ${type} account`, async () => {
      await this.waitForFromAccounts();
      await this.type.selectOption({ label: type });
      if (fromAccountId !== undefined) await this.fromAccount.selectOption(String(fromAccountId));
      await this.submit.click();
      await expect(this.result).toBeVisible();
      await expect(this.newAccountId).not.toHaveText('');
      return Number(await this.newAccountId.innerText());
    });
  }
}
