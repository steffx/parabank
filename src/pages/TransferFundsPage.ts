import { Locator, Page, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransferFundsPage extends BasePage {
  protected readonly path = 'transfer.htm';
  readonly amount: Locator;
  readonly fromAccount: Locator;
  readonly toAccount: Locator;
  readonly submit: Locator;
  readonly result: Locator;
  readonly amountResult: Locator;
  readonly fromAccountResult: Locator;
  readonly toAccountResult: Locator;
  readonly error: Locator;

  constructor(page: Page) {
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

  async waitForAccounts(): Promise<void> {
    await expect(this.fromAccount.locator('option').first()).toBeAttached();
    await expect(this.toAccount.locator('option').first()).toBeAttached();
  }

  async transfer(amount: string | number, fromAccountId?: number, toAccountId?: number): Promise<void> {
    await test.step(`transfer ${amount} from ${fromAccountId ?? 'default'} to ${toAccountId ?? 'default'}`, async () => {
      await this.waitForAccounts();
      await this.amount.fill(String(amount));
      if (fromAccountId !== undefined) await this.fromAccount.selectOption(String(fromAccountId));
      if (toAccountId !== undefined) await this.toAccount.selectOption(String(toAccountId));
      await this.submit.click();
    });
  }
}
