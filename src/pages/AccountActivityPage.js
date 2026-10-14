import { expect, test } from '@playwright/test';
import { parseMoney } from '../utils/money';
import { BasePage } from './BasePage';

export class AccountActivityPage extends BasePage {
  path = 'activity.htm';

  constructor(page) {
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

  async open(accountId) {
    await this.goto(`?id=${accountId}`);
    await expect(this.accountId).toHaveText(String(accountId));
  }

  async balanceValue() {
    await expect(this.balance).not.toHaveText('');
    return parseMoney(await this.balance.innerText());
  }

  async filter(month, type) {
    await test.step(`filter activity: ${month} / ${type}`, async () => {
      await this.month.selectOption(month);
      await this.transactionType.selectOption(type);
      await this.go.click();
    });
  }

  transactionLink(description) {
    return this.transactionTable.getByRole('link', { name: description });
  }
}
