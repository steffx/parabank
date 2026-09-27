import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { PARABANK_TNS } from '../../src/api/ParaBankSoapClient';

/** Operations of the ParaBank JAX-WS service (ParaBankService + IBillPayService). */
export const soapOperations = [
  'billPay', 'buyPosition', 'cleanDB', 'createAccount', 'deposit', 'getAccount', 'getAccounts',
  'getCustomer', 'getPosition', 'getPositionHistory', 'getPositions', 'getTransaction', 'getTransactions',
  'getTransactionsByAmount', 'getTransactionsByMonthAndType', 'getTransactionsByToFromDate',
  'getTransactionsOnDate', 'initializeDB', 'login', 'requestLoan', 'sellPosition', 'setParameter',
  'shutdownJmsListener', 'startupJmsListener', 'transfer', 'updateCustomer', 'withdraw',
];

test.describe('SOAP: WSDL contracts', { tag: '@soap' }, () => {
  test('ParaBank WSDL is published with the expected namespace', { tag: '@smoke' }, async ({ request }) => {
    const res = await request.get(endpoints.soapParaBankWsdl);
    expect(res.ok()).toBe(true);
    const wsdl = await res.text();

    expect(wsdl).toContain('wsdl:definitions');
    expect(wsdl).toContain(`targetNamespace="${PARABANK_TNS}"`);
    expect(wsdl).toContain('soap:address');
  });

  test('ParaBank WSDL declares every operation', async ({ request }) => {
    const wsdl = await (await request.get(endpoints.soapParaBankWsdl)).text();
    const declared = [...wsdl.matchAll(/<wsdl:operation name="([^"]+)"/g)].map((m) => m[1]);

    for (const op of soapOperations) {
      expect.soft(declared, `operation ${op}`).toContain(op);
    }
  });

  test('LoanProcessor WSDL is published', async ({ request }) => {
    const res = await request.get(endpoints.soapLoanProcessorWsdl);
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain('wsdl:definitions');
  });
});
