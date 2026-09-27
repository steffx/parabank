import { Locator, Page, expect } from '@playwright/test';
import { parseMoney } from '../utils/money';
import { BasePage } from './BasePage';

export interface OverviewRow {
  accountId: number;
  balance: number;
  available: number;
}

export class AccountsOverviewPage extends BasePage {
  protected readonly path = 'overview.htm';
  readonly table: Locator;
  readonly accountRows: Locator;
  readonly totalRow: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.table = page.locator('#accountTable');
    // account rows contain a link to activity.htm; the "Total" row does not
    this.accountRows = this.table.locator('tbody tr').filter({ has: page.locator('a') });
    this.totalRow = this.table.locator('tbody tr').filter({ hasText: 'Total' });
    this.error = page.locator('#showError');
  }

  /** Waits for the AJAX table to render at least one account. */
  async waitForAccounts(): Promise<void> {
    await expect(this.accountRows.first()).toBeVisible();
  }

  async rows(): Promise<OverviewRow[]> {
    await this.waitForAccounts();
    const rows: OverviewRow[] = [];
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

  async total(): Promise<number> {
    return parseMoney(await this.totalRow.locator('td').nth(1).innerText());
  }

  accountLink(accountId: number): Locator {
    return this.table.getByRole('link', { name: String(accountId), exact: true });
  }
}
