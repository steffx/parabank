import { Locator, Page, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class RequestLoanPage extends BasePage {
  protected readonly path = 'requestloan.htm';
  readonly amount: Locator;
  readonly downPayment: Locator;
  readonly fromAccount: Locator;
  readonly submit: Locator;
  readonly result: Locator;
  readonly providerName: Locator;
  readonly responseDate: Locator;
  readonly status: Locator;
  readonly approvedMessage: Locator;
  readonly deniedMessage: Locator;
  readonly newAccountId: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.amount = page.locator('#amount');
    this.downPayment = page.locator('#downPayment');
    this.fromAccount = page.locator('#fromAccountId');
    this.submit = page.locator('#requestLoanForm input[type="button"]');
    this.result = page.locator('#requestLoanResult');
    this.providerName = page.locator('#loanProviderName');
    this.responseDate = page.locator('#responseDate');
    this.status = page.locator('#loanStatus');
    this.approvedMessage = page.locator('#loanRequestApproved');
    this.deniedMessage = page.locator('#loanRequestDenied');
    this.newAccountId = page.locator('#newAccountId');
    this.error = page.locator('#requestLoanError');
  }

  async apply(amount: string | number, downPayment: string | number, fromAccountId?: number): Promise<void> {
    await test.step(`apply for loan ${amount} with down payment ${downPayment}`, async () => {
      await this.amount.fill(String(amount));
      await this.downPayment.fill(String(downPayment));
      await expect(this.fromAccount.locator('option').first()).toBeAttached();
      if (fromAccountId !== undefined) await this.fromAccount.selectOption(String(fromAccountId));
      await this.submit.click();
    });
  }
}
