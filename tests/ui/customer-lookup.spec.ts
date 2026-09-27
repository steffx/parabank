import { test, expect } from '../../src/fixtures/test';
import { buildCustomer } from '../../src/data/builders';

test.describe('Forgot login info (customer lookup)', { tag: '@lookup' }, () => {
  test('registered customer can recover username and password', async ({ app, freshUser }) => {
    await app.home.goto();
    await app.home.forgotLoginLink.click();
    await app.lookup.expectHeading('Customer Lookup');

    await app.lookup.lookup(freshUser);

    await expect(app.lookup.rightPanel).toContainText('Your login information was located successfully');
    await expect(app.lookup.rightPanel).toContainText(`Username: ${freshUser.username}`);
    await expect(app.lookup.rightPanel).toContainText(`Password: ${freshUser.password}`);
    // Lookup also logs the customer in.
    await expect(app.lookup.accountServicesLink('Log Out')).toBeVisible();
  });

  test('unknown customer data is rejected', async ({ app }) => {
    await app.lookup.goto();
    await app.lookup.lookup(buildCustomer());

    await expect(app.lookup.rightPanel.locator('.error')).toHaveText(
      'The customer information provided could not be found.',
    );
  });

  test('all lookup fields are required', async ({ app }) => {
    await app.lookup.goto();
    await app.lookup.submit.click();

    for (const [id, message] of [
      ['firstName', 'First name is required.'],
      ['lastName', 'Last name is required.'],
      ['address.street', 'Address is required.'],
      ['address.city', 'City is required.'],
      ['address.state', 'State is required.'],
      ['address.zipCode', 'Zip Code is required.'],
      ['ssn', 'Social Security Number is required.'],
    ]) {
      await expect.soft(app.lookup.error(id), id).toHaveText(message);
    }
  });
});
