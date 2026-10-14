import { test, expect } from '../../src/fixtures/test';
import { buildCustomer } from '../../src/data/builders';

test.describe('Registration', { tag: '@registration' }, () => {
  test('new customer can register and is logged in', { tag: '@smoke' }, async ({ app, bank }) => {
    const customer = buildCustomer();

    await app.register.goto();
    await app.register.expectHeading('Signing up is easy!');
    await app.register.register(customer);

    await app.register.expectHeading(`Welcome ${customer.username}`);
    await expect(app.register.successMessage).toBeVisible();
    await expect(app.register.accountServicesLink('Log Out')).toBeVisible();

    // The new customer exists in the back end with exactly one checking account.
    const found = await bank.login(customer.username, customer.password);
    expect(found).toMatchObject({ firstName: customer.firstName, lastName: customer.lastName, ssn: customer.ssn });
    const accounts = await bank.getAccounts(found.id);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].type).toBe('CHECKING');
  });

  test('duplicate username is rejected', async ({ app, workerUser }) => {
    await app.register.goto();
    await app.register.register(buildCustomer({ username: workerUser.username }));

    await expect(app.register.error('username')).toHaveText('This username already exists.');
  });

  test('password confirmation must match', async ({ app }) => {
    await app.register.goto();
    await app.register.register(buildCustomer(), 'SomethingElse1');

    await expect(app.register.error('repeatedPassword')).toHaveText('Passwords did not match.');
  });

  test('submitting an empty form shows every required-field message', async ({ app }) => {
    await app.register.goto();
    await app.register.submit.click();

    const expected = {
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      street: 'Address is required.',
      city: 'City is required.',
      state: 'State is required.',
      zipCode: 'Zip Code is required.',
      ssn: 'Social Security Number is required.',
      username: 'Username is required.',
      password: 'Password is required.',
      repeatedPassword: 'Password confirmation is required.',
    };
    for (const [field, message] of Object.entries(expected)) {
      await expect.soft(app.register.error(field), field).toHaveText(message);
    }
    // phone number is optional
    await expect(app.register.error('phoneNumber')).toHaveCount(0);
  });

  test('"Register" link on the home page opens the form', async ({ app, page }) => {
    await app.home.goto();
    await app.home.registerLink.click();
    await expect(page).toHaveURL(/register\.htm/);
    await expect(app.register.submit).toBeVisible();
  });
});
