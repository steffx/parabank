import { test, expect } from '../../src/fixtures/test';
import { ParaBankSoapClient } from '../../src/api/ParaBankSoapClient';

test.describe('SOAP: ParaBank service', { tag: '@soap' }, () => {
  test('login returns the customer (wrapped in <customerId>)', { tag: '@smoke' }, async ({ soap, workerUser }) => {
    const res = await soap.call('login', {
      username: workerUser.username,
      password: workerUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.fault).toBeUndefined();
    // Quirk: @WebResult(name = "customerId") wraps the whole customer object.
    expect(res.body.customerId).toMatchObject({
      id: workerUser.id,
      firstName: workerUser.firstName,
      lastName: workerUser.lastName,
    });
  });

  test('getCustomer and getAccounts', async ({ soap, workerUser }) => {
    const customer = await soap.call('getCustomer', { customerId: workerUser.id });
    expect(customer.body.customer.id).toBe(workerUser.id);

    const accounts = await soap.call('getAccounts', { customerId: workerUser.id });
    expect(accounts.body.account.map((a) => a.id)).toContain(workerUser.primaryAccountId);
    expect(accounts.body.account.every((a) => a.customerId === workerUser.id)).toBe(true);
  });

  test('deposit and withdraw return confirmation strings and change the balance', async ({ soap, bank, freshUser }) => {
    const start = await bank.getAccount(freshUser.primaryAccountId);

    const dep = await soap.call('deposit', { accountId: freshUser.primaryAccountId, amount: '20.00' });
    expect(dep.body.depositReturn).toBe(`Successfully deposited $20.00 to account #${freshUser.primaryAccountId}`);

    const wd = await soap.call('withdraw', { accountId: freshUser.primaryAccountId, amount: '5.00' });
    expect(wd.body.withdrawReturn).toBe(`Successfully withdrew $5.00 from account #${freshUser.primaryAccountId}`);

    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(start.balance + 15, 2);
  });

  test('createAccount and transfer', async ({ soap, bank, freshUser }) => {
    const created = await soap.call('createAccount', {
      customerId: freshUser.id,
      newAccountType: 1,
      fromAccountId: freshUser.primaryAccountId,
    });
    const newAccount = created.body.account[0];
    expect(newAccount).toMatchObject({ customerId: freshUser.id, type: 'SAVINGS' });

    const transfer = await soap.call('transfer', {
      fromAccountId: freshUser.primaryAccountId,
      toAccountId: newAccount.id,
      amount: '10',
    });
    expect(transfer.body.transferReturn).toContain(`to account #${newAccount.id}`);
    expect((await bank.getAccount(newAccount.id)).balance).toBeCloseTo(Number(newAccount.balance) + 10, 2);
  });

  test('getTransactions after a deposit', async ({ soap, bank, freshUser }) => {
    await bank.deposit(freshUser.primaryAccountId, 9.99);
    const res = await soap.call('getTransactions', { accountId: freshUser.primaryAccountId });
    expect(res.body.transaction).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ amount: 9.99, type: 'Credit', description: 'Deposit via Web Service' }),
      ]),
    );
  });

  test('requestLoan is approved for a small amount', async ({ soap, freshUser }) => {
    const res = await soap.call('requestLoan', {
      customerId: freshUser.id,
      amount: '300',
      downPayment: '30',
      fromAccountId: freshUser.primaryAccountId,
    });
    expect(res.body.loanResponse.approved).toBe(true);
    expect(Number(res.body.loanResponse.accountId)).toBeGreaterThan(0);
  });

  test('SOAP and REST return the same account', async ({ soap, bank, workerUser }) => {
    const rest = await bank.getAccount(workerUser.primaryAccountId);
    const res = await soap.call('getAccount', { accountId: workerUser.primaryAccountId });

    const viaSoap = res.body.account[0];
    expect(viaSoap.id).toBe(rest.id);
    expect(viaSoap.type).toBe(rest.type);
    expect(Number(viaSoap.balance)).toBeCloseTo(rest.balance, 2);
  });

  test.describe('faults', () => {
    test('invalid login returns a SOAP fault', async ({ soap }) => {
      const res = await soap.call('login', { username: 'nobody', password: 'nothing' });

      expect(res.status).toBe(500);
      expect(res.fault?.faultstring).toContain('Invalid username and/or password');
    });

    test('unknown account returns a SOAP fault', async ({ soap }) => {
      const res = await soap.call('getAccount', { accountId: 1 });
      expect(res.fault?.faultstring).toContain('Could not find account #1');
    });

    test('unknown operation returns a SOAP fault', async ({ soap }) => {
      const res = await soap.call('stealMoney', { accountId: 1 });
      expect(res.status).toBe(500);
      expect(res.fault).toBeDefined();
    });

    test('malformed XML returns a fault, not a crash page', async ({ soap }) => {
      const res = await soap.sendRaw('<soapenv:Envelope><not-closed>');
      expect(res.status()).toBeGreaterThanOrEqual(400);
      const body = ParaBankSoapClient.parse(await res.text());
      expect(body.Envelope?.Body?.Fault).toBeDefined();
    });
  });
});
