import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { buildPayee } from '../../src/data/builders';

test.describe('REST: bill pay', { tag: '@api' }, () => {
  test('POST /billpay pays the payee and debits the account', { tag: '@smoke' }, async ({ bank, freshUser }) => {
    const payee = buildPayee();
    const before = await bank.getAccount(freshUser.primaryAccountId);

    const result = await bank.billPay(freshUser.primaryAccountId, 75.5, payee);

    expect(result).toEqual({ payeeName: payee.name, amount: 75.5, accountId: freshUser.primaryAccountId });
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(before.balance - 75.5, 2);
    const tx = (await bank.getTransactions(freshUser.primaryAccountId)).find(
      (t) => t.description === `Bill Payment to ${payee.name}`,
    );
    expect(tx).toMatchObject({ type: 'Debit', amount: 75.5 });
  });

  test('payee can be sent as XML', async ({ bank, freshUser }) => {
    const payee = buildPayee();
    const xml =
      `<payee><name>${payee.name}</name><address><street>${payee.address.street}</street><city>${payee.address.city}</city>` +
      `<state>${payee.address.state}</state><zipCode>${payee.address.zipCode}</zipCode></address>` +
      `<phoneNumber>${payee.phoneNumber}</phoneNumber><accountNumber>${payee.accountNumber}</accountNumber></payee>`;

    const res = await bank.send('POST', endpoints.billPay, {
      params: { accountId: freshUser.primaryAccountId, amount: 5 },
      data: xml,
      headers: { 'Content-Type': 'application/xml' },
    });

    expect(res.ok()).toBe(true);
    expect(await res.json()).toMatchObject({ payeeName: payee.name, amount: 5 });
  });

  test('missing payee body is rejected', async ({ bank, workerUser }) => {
    const res = await bank.send('POST', endpoints.billPay, {
      params: { accountId: workerUser.primaryAccountId, amount: 5 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBe(false);
  });

  test('unsupported content type returns 415', async ({ bank, workerUser }) => {
    const res = await bank.send('POST', endpoints.billPay, {
      params: { accountId: workerUser.primaryAccountId, amount: 5 },
      data: 'name=someone',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.status()).toBe(415);
  });
});
