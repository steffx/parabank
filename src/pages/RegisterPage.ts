import { Locator, Page, test } from '@playwright/test';
import { NewCustomer } from '../api/types';
import { BasePage } from './BasePage';

/** Spring <form:input path="customer.firstName"> renders id="customer.firstName"; errors get id="<path>.errors". */
const byId = (page: Page, id: string): Locator => page.locator(`[id="${id}"]`);

export const registerFields = {
  firstName: 'customer.firstName',
  lastName: 'customer.lastName',
  street: 'customer.address.street',
  city: 'customer.address.city',
  state: 'customer.address.state',
  zipCode: 'customer.address.zipCode',
  phoneNumber: 'customer.phoneNumber',
  ssn: 'customer.ssn',
  username: 'customer.username',
  password: 'customer.password',
  repeatedPassword: 'repeatedPassword',
} as const;

export type RegisterField = keyof typeof registerFields;

export class RegisterPage extends BasePage {
  protected readonly path = 'register.htm';
  readonly submit: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.submit = page.locator('#customerForm input[type="submit"]');
    this.successMessage = this.rightPanel.locator('p', { hasText: 'Your account was created successfully' });
  }

  field(name: RegisterField): Locator {
    return byId(this.page, registerFields[name]);
  }

  error(name: RegisterField): Locator {
    return byId(this.page, `${registerFields[name]}.errors`);
  }

  async fill(customer: NewCustomer, repeatedPassword = customer.password): Promise<void> {
    await test.step(`fill registration form for ${customer.username}`, async () => {
      const values: Record<RegisterField, string> = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        zipCode: customer.address.zipCode,
        phoneNumber: customer.phoneNumber,
        ssn: customer.ssn,
        username: customer.username,
        password: customer.password,
        repeatedPassword,
      };
      for (const [field, value] of Object.entries(values) as [RegisterField, string][]) {
        await this.field(field).fill(value);
      }
    });
  }

  async register(customer: NewCustomer, repeatedPassword?: string): Promise<void> {
    await this.fill(customer, repeatedPassword);
    await this.submit.click();
  }
}
