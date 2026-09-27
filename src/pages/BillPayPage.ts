import { Locator, Page, expect, test } from '@playwright/test';
import { Payee } from '../api/types';
import { BasePage } from './BasePage';

/** ids of the client-side validation messages rendered by billpay.jsp */
export const billPayErrors = {
  name: 'validationModel-name',
  address: 'validationModel-address',
  city: 'validationModel-city',
  state: 'validationModel-state',
  zipCode: 'validationModel-zipCode',
  phoneNumber: 'validationModel-phoneNumber',
  accountEmpty: 'validationModel-account-empty',
  accountInvalid: 'validationModel-account-invalid',
  verifyAccountEmpty: 'validationModel-verifyAccount-empty',
  verifyAccountInvalid: 'validationModel-verifyAccount-invalid',
  verifyAccountMismatch: 'validationModel-verifyAccount-mismatch',
  amountEmpty: 'validationModel-amount-empty',
  amountInvalid: 'validationModel-amount-invalid',
} as const;

export type BillPayErrorKey = keyof typeof billPayErrors;

export interface BillPayForm {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  account: string;
  verifyAccount: string;
  amount: string;
  fromAccountId?: number;
}

export const billPayFormFrom = (payee: Payee, amount: number): BillPayForm => ({
  name: payee.name,
  street: payee.address.street,
  city: payee.address.city,
  state: payee.address.state,
  zipCode: payee.address.zipCode,
  phoneNumber: payee.phoneNumber,
  account: String(payee.accountNumber),
  verifyAccount: String(payee.accountNumber),
  amount: String(amount),
});

export class BillPayPage extends BasePage {
  protected readonly path = 'billpay.htm';
  readonly form: Locator;
  readonly fromAccount: Locator;
  readonly submit: Locator;
  readonly result: Locator;
  readonly payeeNameResult: Locator;
  readonly amountResult: Locator;
  readonly fromAccountResult: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator('#billpayForm');
    this.fromAccount = this.form.locator('select[name="fromAccountId"]');
    this.submit = this.form.locator('input[type="button"]');
    this.result = page.locator('#billpayResult');
    this.payeeNameResult = page.locator('#payeeName');
    this.amountResult = this.result.locator('#amount');
    this.fromAccountResult = this.result.locator('#fromAccountId');
    this.error = page.locator('#billpayError');
  }

  /**
   * NOTE: the phone input gets a random UUID id and class on every render,
   * so it can only be located reliably by its name attribute.
   */
  input(name: string): Locator {
    return this.form.locator(`input[name="${name}"]`);
  }

  validation(key: BillPayErrorKey): Locator {
    return this.page.locator(`#${billPayErrors[key]}`);
  }

  async fill(f: BillPayForm): Promise<void> {
    await test.step(`fill bill pay form for payee "${f.name}"`, async () => {
      await this.input('payee.name').fill(f.name);
      await this.input('payee.address.street').fill(f.street);
      await this.input('payee.address.city').fill(f.city);
      await this.input('payee.address.state').fill(f.state);
      await this.input('payee.address.zipCode').fill(f.zipCode);
      await this.input('payee.phoneNumber').fill(f.phoneNumber);
      await this.input('payee.accountNumber').fill(f.account);
      await this.input('verifyAccount').fill(f.verifyAccount);
      await this.input('amount').fill(f.amount);
      await expect(this.fromAccount.locator('option').first()).toBeAttached();
      if (f.fromAccountId !== undefined) await this.fromAccount.selectOption(String(f.fromAccountId));
    });
  }

  async pay(f: BillPayForm): Promise<void> {
    await this.fill(f);
    await this.submit.click();
  }
}
