import { expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class FindTransactionsPage extends BasePage {
  path = 'findtrans.htm';

  constructor(page) {
    super(page);
    this.account = page.locator('#accountId');
    this.transactionId = page.locator('#transactionId');
    this.findById = page.locator('#findById');
    this.transactionDate = page.locator('#transactionDate');
    this.findByDate = page.locator('#findByDate');
    this.fromDate = page.locator('#fromDate');
    this.toDate = page.locator('#toDate');
    this.findByDateRange = page.locator('#findByDateRange');
    this.amount = page.locator('#amount');
    this.findByAmount = page.locator('#findByAmount');
    this.resultContainer = page.locator('#resultContainer');
    this.resultRows = page.locator('#transactionBody tr');
    this.errorContainer = page.locator('#errorContainer');
    this.transactionIdError = page.locator('#transactionIdError');
    this.transactionDateError = page.locator('#transactionDateError');
    this.dateRangeError = page.locator('#dateRangeError');
    this.amountError = page.locator('#amountError');
  }

  async selectAccount(accountId) {
    await expect(this.account.locator(`option[value="${accountId}"]`)).toBeAttached();
    await this.account.selectOption(String(accountId));
  }

  async byId(accountId, id) {
    await test.step(`find transaction by id ${id}`, async () => {
      await this.selectAccount(accountId);
      await this.transactionId.fill(String(id));
      await this.findById.click();
    });
  }

  async byDate(accountId, date) {
    await test.step(`find transactions on ${date}`, async () => {
      await this.selectAccount(accountId);
      await this.transactionDate.fill(date);
      await this.findByDate.click();
    });
  }

  async byDateRange(accountId, from, to) {
    await test.step(`find transactions between ${from} and ${to}`, async () => {
      await this.selectAccount(accountId);
      await this.fromDate.fill(from);
      await this.toDate.fill(to);
      await this.findByDateRange.click();
    });
  }

  async byAmount(accountId, amount) {
    await test.step(`find transactions of amount ${amount}`, async () => {
      await this.selectAccount(accountId);
      await this.amount.fill(String(amount));
      await this.findByAmount.click();
    });
  }
}
