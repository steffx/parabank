import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  path = 'admin.htm';

  constructor(page) {
    super(page);
    this.initializeButton = page.locator('button[name="action"][value="INIT"]');
    this.cleanButton = page.locator('button[name="action"][value="CLEAN"]');
    this.jmsButton = page.locator('form[name="toggleJms"] input[type="submit"]');
    this.settingsForm = page.locator('#adminForm');
    this.submitSettings = this.settingsForm.locator('input[type="submit"]');
    this.message = this.rightPanel.locator('p b, p.error').first();
  }

  /** Radio buttons / inputs generated from the adminForm model. */
  accessMode(mode) {
    return this.settingsForm.locator(`input[name="accessMode"][value="${mode}"]`);
  }

  setting(path) {
    return this.settingsForm.locator(`[id="${path}"]`);
  }

  select(path) {
    return this.settingsForm.locator(`select[id="${path}"]`);
  }
}
