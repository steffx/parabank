import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { ParaBankSoapClient } from '../../src/api/ParaBankSoapClient';

/** Every resource the suite relies on must be published in the OpenAPI document. */
const expectedPaths = [
  '/login/{username}/{password}',
  '/customers/{customerId}',
  '/customers/update/{customerId}',
  '/customers/{customerId}/accounts',
  '/customers/{customerId}/positions',
  '/customers/{customerId}/buyPosition',
  '/customers/{customerId}/sellPosition',
  '/accounts/{accountId}',
  '/accounts/{accountId}/transactions',
  '/accounts/{accountId}/transactions/amount/{amount}',
  '/accounts/{accountId}/transactions/month/{month}/type/{type}',
  '/accounts/{accountId}/transactions/fromDate/{fromDate}/toDate/{toDate}',
  '/accounts/{accountId}/transactions/onDate/{onDate}',
  '/transactions/{transactionId}',
  '/positions/{positionId}',
  '/positions/{positionId}/{startDate}/{endDate}',
  '/createAccount',
  '/deposit',
  '/withdraw',
  '/transfer',
  '/billpay',
  '/requestLoan',
  '/initializeDB',
  '/cleanDB',
];

test.describe('REST: contract and content negotiation', { tag: '@api' }, () => {
  test('OpenAPI document lists every resource', async ({ request }) => {
    const res = await request.get(endpoints.openApi);
    expect(res.ok()).toBe(true);
    const yaml = await res.text();

    expect(yaml).toMatch(/openapi:\s*["']?3\./);
    for (const path of expectedPaths) {
      expect.soft(yaml, `OpenAPI path ${path}`).toContain(`${path}:`);
    }
  });

  test('WADL is published', async ({ request }) => {
    const res = await request.get(endpoints.wadl);
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain('<application');
  });

  test('Swagger UI is reachable', async ({ page }) => {
    const res = await page.goto('api-docs/index.html');
    expect(res?.ok()).toBe(true);
  });

  test('same account in JSON and XML carries identical data', async ({ bank, bankXml, workerUser }) => {
    const json = await bank.getAccount(workerUser.primaryAccountId);
    const res = await bankXml.send('GET', endpoints.account(workerUser.primaryAccountId));

    expect(res.headers()['content-type']).toContain('application/xml');
    const xml = ParaBankSoapClient.parse<{ account: { id: number; customerId: number; type: string; balance: number } }>(
      await res.text(),
    );
    expect(xml.account).toMatchObject({ id: json.id, customerId: json.customerId, type: json.type });
    expect(Number(xml.account.balance)).toBeCloseTo(json.balance, 2);
  });

  test('JSON is returned when JSON is requested', async ({ bank, workerUser }) => {
    const res = await bank.send('GET', endpoints.account(workerUser.primaryAccountId));
    expect(res.headers()['content-type']).toContain('application/json');
  });

  test('unsupported Accept header returns 406', async ({ bank, workerUser }) => {
    const res = await bank.send('GET', endpoints.account(workerUser.primaryAccountId), {
      headers: { Accept: 'text/csv' },
    });
    expect(res.status()).toBe(406);
  });

  test('CORS pre-flight is answered', async ({ request, workerUser }) => {
    const res = await request.fetch(endpoints.account(workerUser.primaryAccountId), {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()['access-control-allow-origin']).toBeTruthy();
  });

  test('unknown resource returns 404', async ({ bank }) => {
    const res = await bank.send('GET', 'services/bank/does-not-exist');
    expect(res.status()).toBe(404);
  });

  test('typical read is answered within 5 seconds', async ({ bank, workerUser }) => {
    const started = Date.now();
    await bank.getAccounts(workerUser.id);
    expect(Date.now() - started).toBeLessThan(5000);
  });
});
