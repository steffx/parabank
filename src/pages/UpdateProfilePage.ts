import { Locator, Page, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export const profileFields = {
  firstName: 'customer.firstName',
  lastName: 'customer.lastName',
  street: 'customer.address.street',
  city: 'customer.address.city',
  state: 'customer.address.state',
  zipCode: 'customer.address.zipCode',
  phoneNumber: 'customer.phoneNumber',
} as const;
export type ProfileField = keyof typeof profileFields;

/** Client-side error spans rendered by updateprofile.jsp. */
export const profileErrors: Partial<Record<ProfileField, string>> = {
  firstName: 'firstName-error',
  lastName: 'lastName-error',
  street: 'street-error',
  city: 'city-error',
  state: 'state-error',
  zipCode: 'zipCode-error',
};

export class UpdateProfilePage extends BasePage {
  protected readonly path = 'updateprofile.htm';
  readonly submit: Locator;
  readonly result: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.submit = page.locator('#updateProfileForm input[type="button"]');
    this.result = page.locator('#updateProfileResult');
    this.error = page.locator('#updateProfileError');
  }

  field(name: ProfileField): Locator {
    return this.page.locator(`[id="${profileFields[name]}"]`);
  }

  validation(name: ProfileField): Locator {
    return this.page.locator(`#${profileErrors[name]}`);
  }

  /** Fields are pre-filled from GET /customers/{id} via AJAX. */
  async waitForPrefill(): Promise<void> {
    await expect(this.field('firstName')).not.toHaveValue('');
  }

  async update(values: Partial<Record<ProfileField, string>>): Promise<void> {
    await test.step('update profile', async () => {
      await this.waitForPrefill();
      for (const [k, v] of Object.entries(values) as [ProfileField, string][]) {
        await this.field(k).fill(v);
      }
      await this.submit.click();
    });
  }
}
