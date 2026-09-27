import { Locator, Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export type ContactField = 'name' | 'email' | 'phone' | 'message';

export class ContactPage extends BasePage {
  protected readonly path = 'contact.htm';
  readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    this.submit = page.locator('#contactForm input[type="submit"]');
  }

  field(name: ContactField): Locator {
    return this.page.locator(`#contactForm [id="${name}"]`);
  }

  error(name: ContactField): Locator {
    return this.page.locator(`[id="${name}.errors"]`);
  }

  async send(values: Record<ContactField, string>): Promise<void> {
    await test.step(`send contact form as ${values.name}`, async () => {
      for (const [k, v] of Object.entries(values) as [ContactField, string][]) {
        await this.field(k).fill(v);
      }
      await this.submit.click();
    });
  }
}
