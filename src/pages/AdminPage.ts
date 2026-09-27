import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  protected readonly path = 'admin.htm';
  readonly initializeButton: Locator;
  readonly cleanButton: Locator;
  readonly jmsButton: Locator;
  readonly settingsForm: Locator;
  readonly submitSettings: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    super(page);
    this.initializeButton = page.locator('button[name="action"][value="INIT"]');
    this.cleanButton = page.locator('button[name="action"][value="CLEAN"]');
    this.jmsButton = page.locator('form[name="toggleJms"] input[type="submit"]');
    this.settingsForm = page.locator('#adminForm');
    this.submitSettings = this.settingsForm.locator('input[type="submit"]');
    this.message = this.rightPanel.locator('p b, p.error').first();
  }

  /** Radio buttons / inputs generated from the adminForm model. */
  accessMode(mode: 'soap' | 'restxml' | 'restjson' | 'jdbc'): Locator {
    return this.settingsForm.locator(`input[name="accessMode"][value="${mode}"]`);
  }

  setting(path: 'soapEndpoint' | 'restEndpoint' | 'endpoint' | 'initialBalance' | 'minimumBalance' | 'loanProcessorThreshold'): Locator {
    return this.settingsForm.locator(`[id="${path}"]`);
  }

  select(path: 'loanProvider' | 'loanProcessor'): Locator {
    return this.settingsForm.locator(`select[id="${path}"]`);
  }
}
