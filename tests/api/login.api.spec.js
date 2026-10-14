import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { customerSchema, expectSchema } from '../../src/api/schemas';
import { ParaBankSoapClient } from '../../src/api/ParaBankSoapClient';

test.describe('REST: login', { tag: '@api' }, () => {
  test('valid credentials return the customer', { tag: '@smoke' }, async ({ bank, workerUser }) => {
    const customer = await bank.login(workerUser.username, workerUser.password);

    expectSchema(customer, customerSchema, 'customer');
    expect(customer).toMatchObject({
      id: workerUser.id,
      firstName: workerUser.firstName,
      lastName: workerUser.lastName,
      ssn: workerUser.ssn,
      address: workerUser.address,
    });
  });

  test('password is never returned in the customer payload', async ({ bank, workerUser }) => {
    const res = await bank.send('GET', endpoints.login(workerUser.username, workerUser.password));
    expect(await res.text()).not.toContain(workerUser.password);
  });

  test('wrong password is rejected', async ({ bank, workerUser }) => {
    const res = await bank.send('GET', endpoints.login(workerUser.username, 'not-the-password'));

    expect(res.ok()).toBe(false);
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await res.text()).toContain('Invalid username and/or password');
  });

  test('unknown user is rejected with the same message (no user enumeration)', async ({ bank, workerUser }) => {
    const wrongPassword = await bank.send('GET', endpoints.login(workerUser.username, 'x'));
    const unknownUser = await bank.send('GET', endpoints.login(`nobody_${Date.now()}`, 'x'));

    expect(unknownUser.status()).toBe(wrongPassword.status());
    expect(await unknownUser.text()).toBe(await wrongPassword.text());
  });

  test('XML representation contains the same customer', async ({ bankXml, workerUser }) => {
    const res = await bankXml.send('GET', endpoints.login(workerUser.username, workerUser.password));

    expect(res.headers()['content-type']).toContain('application/xml');
    const doc = ParaBankSoapClient.parse(await res.text());
    expect(doc.customer.id).toBe(workerUser.id);
    expect(doc.customer.firstName).toBe(workerUser.firstName);
  });
});
