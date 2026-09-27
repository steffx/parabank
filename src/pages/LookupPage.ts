import { Locator, Page, test } from '@playwright/test';
import { NewCustomer } from '../api/types';
import { BasePage } from './BasePage';

export class LookupPage extends BasePage {
  protected readonly path = 'lookup.htm';
  readonly submit: Locator;
  readonly result: Locator;

  constructor(page: Page) {
    super(page);
    this.submit = page.locator('#lookupForm input[type="submit"]');
    this.result = this.rightPanel;
  }

  field(id: string): Locator {
    return this.page.locator(`[id="${id}"]`);
  }

  error(id: string): Locator {
    return this.page.locator(`[id="${id}.errors"]`);
  }

  async lookup(c: Pick<NewCustomer, 'firstName' | 'lastName' | 'address' | 'ssn'>): Promise<void> {
    await test.step(`look up login for ${c.firstName} ${c.lastName}`, async () => {
      await this.field('firstName').fill(c.firstName);
      await this.field('lastName').fill(c.lastName);
      await this.field('address.street').fill(c.address.street);
      await this.field('address.city').fill(c.address.city);
      await this.field('address.state').fill(c.address.state);
      await this.field('address.zipCode').fill(c.address.zipCode);
      await this.field('ssn').fill(c.ssn);
      await this.submit.click();
    });
  }
}
