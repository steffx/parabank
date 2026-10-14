import { test } from '@playwright/test';
import { BasePage } from './BasePage';

/** Spring <form:input path="customer.firstName"> renders id="customer.firstName"; errors get id="<path>.errors". */
const byId = (page, id) => page.locator(`[id="${id}"]`);

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
};

/** @typedef {keyof typeof registerFields} RegisterField */

export class RegisterPage extends BasePage {
  path = 'register.htm';

  constructor(page) {
    super(page);
    this.submit = page.locator('#customerForm input[type="submit"]');
    this.successMessage = this.rightPanel.locator('p', { hasText: 'Your account was created successfully' });
  }

  field(name) {
    return byId(this.page, registerFields[name]);
  }

  error(name) {
    return byId(this.page, `${registerFields[name]}.errors`);
  }

  async fill(customer, repeatedPassword = customer.password) {
    await test.step(`fill registration form for ${customer.username}`, async () => {
      const values = {
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
      for (const [field, value] of Object.entries(values)) {
        await this.field(field).fill(value);
      }
    });
  }

  async register(customer, repeatedPassword) {
    await this.fill(customer, repeatedPassword);
    await this.submit.click();
  }
}
