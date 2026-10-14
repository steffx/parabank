import { expect } from '@playwright/test';
import { parseMoney } from '../utils/money';
import { BasePage } from './BasePage';

/**
 * @typedef {object} OverviewRow
 * @property {number} accountId
 * @property {number} balance
 * @property {number} available
 */

export class AccountsOverviewPage extends BasePage {
  path = 'overview.htm';

  constructor(page) {
    super(page);
    this.table = page.locator('#accountTable');
    // account rows contain a link to activity.htm; the "Total" row does not
    this.accountRows = this.table.locator('tbody tr').filter({ has: page.locator('a') });
    this.totalRow = this.table.locator('tbody tr').filter({ hasText: 'Total' });
    this.error = page.locator('#showError');
  }

  /** Waits for the AJAX table to render at least one account. */
  async waitForAccounts() {
    await expect(this.accountRows.first()).toBeVisible();
  }

  async rows() {
    await this.waitForAccounts();
    const rows = [];
    for (const row of await this.accountRows.all()) {
      const cells = row.locator('td');
      rows.push({
        accountId: Number(await cells.nth(0).innerText()),
        balance: parseMoney(await cells.nth(1).innerText()),
        available: parseMoney(await cells.nth(2).innerText()),
      });
    }
    return rows;
  }

  async total() {
    return parseMoney(await this.totalRow.locator('td').nth(1).innerText());
  }

  accountLink(accountId) {
    return this.table.getByRole('link', { name: String(accountId), exact: true });
  }
}
