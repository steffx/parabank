import { expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransferFundsPage extends BasePage {
  path = 'transfer.htm';

  constructor(page) {
    super(page);
    this.amount = page.locator('#amount');
    this.fromAccount = page.locator('#fromAccountId');
    this.toAccount = page.locator('#toAccountId');
    this.submit = page.locator('#transferForm input[type="submit"]');
    this.result = page.locator('#showResult');
    this.amountResult = page.locator('#amountResult');
    this.fromAccountResult = page.locator('#fromAccountIdResult');
    this.toAccountResult = page.locator('#toAccountIdResult');
    this.error = page.locator('#showError');
  }

  async waitForAccounts() {
    await expect(this.fromAccount.locator('option').first()).toBeAttached();
    await expect(this.toAccount.locator('option').first()).toBeAttached();
  }

  async transfer(amount, fromAccountId, toAccountId) {
    await test.step(`transfer ${amount} from ${fromAccountId ?? 'default'} to ${toAccountId ?? 'default'}`, async () => {
      await this.waitForAccounts();
      await this.amount.fill(String(amount));
      if (fromAccountId !== undefined) await this.fromAccount.selectOption(String(fromAccountId));
      if (toAccountId !== undefined) await this.toAccount.selectOption(String(toAccountId));
      await this.submit.click();
    });
  }
}
