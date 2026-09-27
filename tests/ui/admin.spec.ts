import { test, expect } from '../../src/fixtures/test';
import { env, isPublicDemo } from '../../src/config/env';

test.describe('Administration page', { tag: '@admin' }, () => {
  test('shows database, JMS and application settings', async ({ app }) => {
    await app.admin.goto();
    await app.admin.expectHeading('Administration');

    await expect(app.admin.initializeButton).toBeVisible();
    await expect(app.admin.cleanButton).toBeVisible();
    await expect(app.admin.jmsButton).toBeVisible();
    for (const mode of ['soap', 'restxml', 'restjson', 'jdbc'] as const) {
      await expect(app.admin.accessMode(mode)).toBeAttached();
    }
    await expect(app.admin.settingsForm.locator('input[name="accessMode"]:checked')).toHaveCount(1);
    await expect(app.admin.setting('initialBalance')).not.toHaveValue('');
    await expect(app.admin.setting('minimumBalance')).not.toHaveValue('');
    await expect(app.admin.select('loanProvider')).toBeVisible();
    await expect(app.admin.select('loanProcessor')).toBeVisible();
  });
});

/**
 * Tests that change global state. They only run with PARABANK_DESTRUCTIVE=true
 * and never against the shared public demo.
 */
test.describe('Administration (destructive)', { tag: '@destructive' }, () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!env.destructive || isPublicDemo, 'Set PARABANK_DESTRUCTIVE=true and use a local ParaBank instance');

  test('Initialize restores the seed data (john/demo can log in)', async ({ app, bank }) => {
    await app.admin.goto();
    await app.admin.initializeButton.click();
    await expect(app.admin.rightPanel).toContainText('Database Initialized');

    const john = await bank.login('john', 'demo');
    expect(john).toMatchObject({ id: 12212, firstName: 'John', lastName: 'Smith' });
  });

  test('Clean removes all customers except the seed data', async ({ app, bank }) => {
    await app.admin.goto();
    await app.admin.cleanButton.click();
    await expect(app.admin.rightPanel).toContainText('Database Cleaned');

    await app.admin.initializeButton.click(); // leave the instance usable
    await expect(app.admin.rightPanel).toContainText('Database Initialized');
    await bank.login('john', 'demo');
  });

  test('changing minimum balance changes the Open Account note', async ({ app, workerUser, loginAs }) => {
    await app.admin.goto();
    const original = await app.admin.setting('minimumBalance').inputValue();
    try {
      await app.admin.setting('minimumBalance').fill('150.00');
      await app.admin.submitSettings.click();
      await expect(app.admin.rightPanel).toContainText('Settings saved successfully.');

      const userApp = await loginAs(workerUser);
      await userApp.openAccount.goto();
      await expect(userApp.openAccount.minimumDepositNote).toContainText('$150.00');
    } finally {
      await app.admin.goto();
      await app.admin.setting('minimumBalance').fill(original);
      await app.admin.submitSettings.click();
    }
  });

  test('switching the data access mode to REST (JSON) keeps login working', async ({ app, freshUser, loginAs }) => {
    await app.admin.goto();
    try {
      await app.admin.accessMode('restjson').check();
      await app.admin.submitSettings.click();
      await expect(app.admin.rightPanel).toContainText('Settings saved successfully.');

      const userApp = await loginAs(freshUser);
      await userApp.overview.goto();
      await userApp.overview.waitForAccounts();
    } finally {
      await app.admin.goto();
      await app.admin.accessMode('jdbc').check();
      await app.admin.submitSettings.click();
    }
  });
});
