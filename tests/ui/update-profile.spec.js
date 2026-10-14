import { test, expect } from '../../src/fixtures/test';
import { buildCustomer } from '../../src/data/builders';

test.describe('Update Contact Info', { tag: '@profile' }, () => {
  test('form is pre-filled with the current profile', async ({ userApp, workerUser, bank }) => {
    const current = await bank.getCustomer(workerUser.id);
    await userApp.updateProfile.goto();
    await userApp.updateProfile.waitForPrefill();

    await expect(userApp.updateProfile.field('firstName')).toHaveValue(current.firstName);
    await expect(userApp.updateProfile.field('lastName')).toHaveValue(current.lastName);
    await expect(userApp.updateProfile.field('street')).toHaveValue(current.address.street);
    await expect(userApp.updateProfile.field('zipCode')).toHaveValue(current.address.zipCode);
  });

  test('updating the address is saved in the back end', { tag: '@smoke' }, async ({ loginAs, freshUser, bank }) => {
    const next = buildCustomer();
    const app = await loginAs(freshUser);

    await app.updateProfile.goto();
    await app.updateProfile.update({
      street: next.address.street,
      city: next.address.city,
      state: next.address.state,
      zipCode: next.address.zipCode,
      phoneNumber: next.phoneNumber,
    });

    await app.updateProfile.expectHeading('Profile Updated');
    const saved = await bank.getCustomer(freshUser.id);
    expect(saved.address).toEqual(next.address);
    expect(saved.phoneNumber).toBe(next.phoneNumber);
    expect(saved.firstName).toBe(freshUser.firstName); // untouched fields stay the same
  });

  const required = [
    ['firstName', 'First name is required.'],
    ['lastName', 'Last name is required.'],
    ['street', 'Address is required.'],
    ['city', 'City is required.'],
    ['state', 'State is required.'],
    ['zipCode', 'Zip Code is required.'],
  ];

  for (const [field, message] of required) {
    test(`clearing ${field} shows "${message}"`, async ({ userApp }) => {
      await userApp.updateProfile.goto();
      await userApp.updateProfile.update({ [field]: '' });

      await expect(userApp.updateProfile.validation(field)).toHaveText(message);
      await expect(userApp.updateProfile.result).toBeHidden();
    });
  }
});
