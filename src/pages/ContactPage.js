import { test } from '@playwright/test';
import { BasePage } from './BasePage';

/** @typedef {'name' | 'email' | 'phone' | 'message'} ContactField */

export class ContactPage extends BasePage {
  path = 'contact.htm';

  constructor(page) {
    super(page);
    this.submit = page.locator('#contactForm input[type="submit"]');
  }

  field(name) {
    return this.page.locator(`#contactForm [id="${name}"]`);
  }

  error(name) {
    return this.page.locator(`[id="${name}.errors"]`);
  }

  async send(values) {
    await test.step(`send contact form as ${values.name}`, async () => {
      for (const [k, v] of Object.entries(values)) {
        await this.field(k).fill(v);
      }
      await this.submit.click();
    });
  }
}
