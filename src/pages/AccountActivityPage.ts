import { Locator, Page, expect, test } from '@playwright/test';
import { parseMoney } from '../utils/money';
import { BasePage } from './BasePage';

export class AccountActivityPage extends BasePage {
  protected readonly path = 'activity.htm';
  readonly accountId: Locator;
  readonly accountType: Locator;
  readonly balance: Locator;
  readonly availableBalance: Locator;
  readonly month: Locator;
  readonly transactionType: Locator;
  readonly go: Locator;
  readonly transactionTable: Locator;
  readonly transactionRows: Locator;
  readonly noTransactions: Locator;

  constructor(page: Page) {
    super(page);
    this.accountId = page.locator('#accountId');
    this.accountType = page.locator('#accountType');
    this.balance = page.locator('#balance');
    this.availableBalance = page.locator('#availableBalance');
    this.month = page.locator('#month');
    this.transactionType = page.locator('#transactionType');
    this.go = page.locator('#activityForm input[type="submit"]');
    this.transactionTable = page.locator('#transactionTable');
    this.transactionRows = this.transactionTable.locator('tbody tr');
    this.noTransactions = page.locator('#noTransactions');
  }

  async open(accountId: number): Promise<void> {
    await this.goto(`?id=${accountId}`);
    await expect(this.accountId).toHaveText(String(accountId));
  }

  async balanceValue(): Promise<number> {
    await expect(this.balance).not.toHaveText('');
    return parseMoney(await this.balance.innerText());
  }

  async filter(month: string, type: 'All' | 'Credit' | 'Debit'): Promise<void> {
    await test.step(`filter activity: ${month} / ${type}`, async () => {
      await this.month.selectOption(month);
      await this.transactionType.selectOption(type);
      await this.go.click();
    });
  }

  transactionLink(description: string | RegExp): Locator {
    return this.transactionTable.getByRole('link', { name: description });
  }
}
