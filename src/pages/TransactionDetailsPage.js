import { BasePage } from './BasePage';

export class TransactionDetailsPage extends BasePage {
  path = 'transaction.htm';

  constructor(page) {
    super(page);
    this.detailsTable = this.rightPanel.locator('table');
  }

  /** Value cell next to a label such as "Transaction ID:" / "Amount:". */
  value(label) {
    return this.detailsTable.locator('tr', { hasText: label }).locator('td').nth(1);
  }
}
