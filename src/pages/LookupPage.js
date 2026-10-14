import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LookupPage extends BasePage {
  path = 'lookup.htm';

  constructor(page) {
    super(page);
    this.submit = page.locator('#lookupForm input[type="submit"]');
    this.result = this.rightPanel;
  }

  field(id) {
    return this.page.locator(`[id="${id}"]`);
  }

  error(id) {
    return this.page.locator(`[id="${id}.errors"]`);
  }

  async lookup(c) {
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
