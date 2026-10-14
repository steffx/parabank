import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { customerSchema, expectSchema } from '../../src/api/schemas';
import { buildCustomer } from '../../src/data/builders';

test.describe('REST: customers', { tag: '@api' }, () => {
  test('GET /customers/{id} returns the profile', async ({ bank, workerUser }) => {
    const customer = await bank.getCustomer(workerUser.id);

    expectSchema(customer, customerSchema, 'customer');
    expect(customer.id).toBe(workerUser.id);
    expect(customer.phoneNumber).toBe(workerUser.phoneNumber);
  });

  test('POST /customers/update/{id} changes the profile', async ({ bank, freshUser }) => {
    const next = buildCustomer({ username: freshUser.username, password: freshUser.password, ssn: freshUser.ssn });

    const message = await bank.updateCustomer(freshUser.id, next);

    expect(message).toContain('Successfully updated customer profile');
    const saved = await bank.getCustomer(freshUser.id);
    expect(saved).toMatchObject({
      firstName: next.firstName,
      lastName: next.lastName,
      address: next.address,
      phoneNumber: next.phoneNumber,
    });
    // credentials still work
    await bank.login(freshUser.username, freshUser.password);
  });

  test('unknown customer id returns an error', async ({ bank }) => {
    const res = await bank.send('GET', endpoints.customer(999_999_999));

    expect(res.ok()).toBe(false);
    expect(await res.text()).toContain('Could not find customer #999999999');
  });

  test('non-numeric customer id is rejected', async ({ bank }) => {
    const res = await bank.send('GET', 'services/bank/customers/abc');
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
