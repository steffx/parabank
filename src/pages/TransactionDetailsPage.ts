import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransactionDetailsPage extends BasePage {
  protected readonly path = 'transaction.htm';
  readonly detailsTable: Locator;

  constructor(page: Page) {
    super(page);
    this.detailsTable = this.rightPanel.locator('table');
  }

  /** Value cell next to a label such as "Transaction ID:" / "Amount:". */
  value(label: string): Locator {
    return this.detailsTable.locator('tr', { hasText: label }).locator('td').nth(1);
  }
}
