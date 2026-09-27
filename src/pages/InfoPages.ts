import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Static / informational pages that need no login. */
export class InfoPage extends BasePage {
  constructor(
    page: Page,
    protected readonly path: string,
  ) {
    super(page);
  }

  links(): Locator {
    return this.page.locator('#rightPanel a, body > a');
  }
}

/** Public pages and a piece of text that proves each one rendered. */
export const infoPages = [
  { name: 'About Us', path: 'about.htm', marker: 'ParaSoft Demo Website' },
  { name: 'Services', path: 'services.htm', marker: 'Available ParaBank SOAP services' },
  { name: 'News', path: 'news.htm', marker: 'ParaBank News' },
  { name: 'Site Map', path: 'sitemap.htm', marker: 'Account Services' },
  { name: 'Customer Care', path: 'contact.htm', marker: 'Customer Care' },
  { name: 'Administration', path: 'admin.htm', marker: 'Administration' },
] as const;
