import { expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export const profileFields = {
  firstName: 'customer.firstName',
  lastName: 'customer.lastName',
  street: 'customer.address.street',
  city: 'customer.address.city',
  state: 'customer.address.state',
  zipCode: 'customer.address.zipCode',
  phoneNumber: 'customer.phoneNumber',
};

/** @typedef {keyof typeof profileFields} ProfileField */

/**
 * Client-side error spans rendered by updateprofile.jsp.
 * @type {Partial<Record<ProfileField, string>>}
 */
export const profileErrors = {
  firstName: 'firstName-error',
  lastName: 'lastName-error',
  street: 'street-error',
  city: 'city-error',
  state: 'state-error',
  zipCode: 'zipCode-error',
};

export class UpdateProfilePage extends BasePage {
  path = 'updateprofile.htm';

  constructor(page) {
    super(page);
    this.submit = page.locator('#updateProfileForm input[type="button"]');
    this.result = page.locator('#updateProfileResult');
    this.error = page.locator('#updateProfileError');
  }

  field(name) {
    return this.page.locator(`[id="${profileFields[name]}"]`);
  }

  validation(name) {
    return this.page.locator(`#${profileErrors[name]}`);
  }

  /** Fields are pre-filled from GET /customers/{id} via AJAX. */
  async waitForPrefill() {
    await expect(this.field('firstName')).not.toHaveValue('');
  }

  async update(values) {
    await test.step('update profile', async () => {
      await this.waitForPrefill();
      for (const [k, v] of Object.entries(values)) {
        await this.field(k).fill(v);
      }
      await this.submit.click();
    });
  }
}
