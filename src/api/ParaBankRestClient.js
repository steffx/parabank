import { test } from '@playwright/test';
import { endpoints } from './endpoints';
import { AccountTypeCode } from './types';

/** @typedef {'json' | 'xml'} Format */

/**
 * @typedef {object} SendOptions
 * @property {Record<string, string | number | boolean>} [params] Query parameters (ParaBank uses them for most POST inputs).
 * @property {unknown} [data] Request body.
 * @property {Format} [format] Overrides the client's default response format.
 * @property {Record<string, string>} [headers]
 */

/** Thrown when a typed helper receives a non-2xx response. Carries the response for inspection. */
export class ParaBankApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Thin, typed wrapper around Playwright's APIRequestContext for the ParaBank REST API.
 *
 * - Typed helpers (getCustomer, transfer, ...) assert success and return parsed bodies.
 * - `send()` returns the raw APIResponse for negative / contract tests.
 * - Every call is wrapped in a Playwright step, so it shows up in the HTML and Allure reports.
 */
export class ParaBankRestClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {Format} [defaultFormat]
   */
  constructor(request, defaultFormat = 'json') {
    this.request = request;
    this.defaultFormat = defaultFormat;
  }

  /**
   * Raw request. ParaBank uses query parameters for most POST inputs.
   * @param {'GET' | 'POST'} method
   * @param {string} path
   * @param {SendOptions} [options]
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async send(method, path, options = {}) {
    const format = options.format ?? this.defaultFormat;
    const accept = format === 'json' ? 'application/json' : 'application/xml';
    return test.step(`${method} /${path}`, async () =>
      this.request.fetch(path, {
        method,
        params: options.params,
        data: options.data,
        headers: { Accept: accept, ...options.headers },
      }));
  }

  async ok(res, what) {
    if (!res.ok()) {
      const body = await res.text();
      throw new ParaBankApiError(`${what} failed: HTTP ${res.status()} ${body.slice(0, 300)}`, res.status(), body);
    }
    return res;
  }

  async json(res, what) {
    return (await this.ok(res, what)).json();
  }

  async text(res, what) {
    return (await this.ok(res, what)).text();
  }

  // ---------- Customers ----------

  login(username, password) {
    return this.send('GET', endpoints.login(username, password)).then((r) => this.json(r, 'login'));
  }

  getCustomer(customerId) {
    return this.send('GET', endpoints.customer(customerId)).then((r) => this.json(r, 'getCustomer'));
  }

  updateCustomer(customerId, c) {
    return this.send('POST', endpoints.updateCustomer(customerId), {
      params: {
        firstName: c.firstName,
        lastName: c.lastName,
        street: c.address.street,
        city: c.address.city,
        state: c.address.state,
        zipCode: c.address.zipCode,
        phoneNumber: c.phoneNumber,
        ssn: c.ssn,
        username: c.username,
        password: c.password,
      },
    }).then((r) => this.text(r, 'updateCustomer'));
  }

  // ---------- Accounts ----------

  getAccounts(customerId) {
    return this.send('GET', endpoints.customerAccounts(customerId)).then((r) => this.json(r, 'getAccounts'));
  }

  getAccount(accountId) {
    return this.send('GET', endpoints.account(accountId)).then((r) => this.json(r, 'getAccount'));
  }

  createAccount(customerId, type, fromAccountId) {
    return this.send('POST', endpoints.createAccount, {
      params: { customerId, newAccountType: AccountTypeCode[type], fromAccountId },
    }).then((r) => this.json(r, 'createAccount'));
  }

  // ---------- Money movement ----------

  deposit(accountId, amount) {
    return this.send('POST', endpoints.deposit, { params: { accountId, amount } }).then((r) => this.text(r, 'deposit'));
  }

  withdraw(accountId, amount) {
    return this.send('POST', endpoints.withdraw, { params: { accountId, amount } }).then((r) =>
      this.text(r, 'withdraw'),
    );
  }

  transfer(fromAccountId, toAccountId, amount) {
    return this.send('POST', endpoints.transfer, { params: { fromAccountId, toAccountId, amount } }).then((r) =>
      this.text(r, 'transfer'),
    );
  }

  billPay(accountId, amount, payee) {
    return this.send('POST', endpoints.billPay, {
      params: { accountId, amount },
      data: payee,
      headers: { 'Content-Type': 'application/json' },
    }).then((r) => this.json(r, 'billPay'));
  }

  requestLoan(customerId, amount, downPayment, fromAccountId) {
    return this.send('POST', endpoints.requestLoan, {
      params: { customerId, amount, downPayment, fromAccountId },
    }).then((r) => this.json(r, 'requestLoan'));
  }

  // ---------- Transactions ----------

  getTransactions(accountId) {
    return this.send('GET', endpoints.accountTransactions(accountId)).then((r) => this.json(r, 'getTransactions'));
  }

  getTransaction(transactionId) {
    return this.send('GET', endpoints.transaction(transactionId)).then((r) => this.json(r, 'getTransaction'));
  }

  findTransactionsByAmount(accountId, amount) {
    return this.send('GET', endpoints.transactionsByAmount(accountId, amount)).then((r) =>
      this.json(r, 'findTransactionsByAmount'),
    );
  }

  findTransactionsOnDate(accountId, onDate) {
    return this.send('GET', endpoints.transactionsOnDate(accountId, onDate)).then((r) =>
      this.json(r, 'findTransactionsOnDate'),
    );
  }

  findTransactionsByDateRange(accountId, fromDate, toDate) {
    return this.send('GET', endpoints.transactionsByDateRange(accountId, fromDate, toDate)).then((r) =>
      this.json(r, 'findTransactionsByDateRange'),
    );
  }

  findTransactionsByMonthAndType(accountId, month, type) {
    return this.send('GET', endpoints.transactionsByMonthAndType(accountId, month, type)).then((r) =>
      this.json(r, 'findTransactionsByMonthAndType'),
    );
  }

  // ---------- Positions ----------

  getPositions(customerId) {
    return this.send('GET', endpoints.customerPositions(customerId)).then((r) => this.json(r, 'getPositions'));
  }

  getPosition(positionId) {
    return this.send('GET', endpoints.position(positionId)).then((r) => this.json(r, 'getPosition'));
  }

  getPositionHistory(positionId, startDate, endDate) {
    return this.send('GET', endpoints.positionHistory(positionId, startDate, endDate)).then((r) =>
      this.json(r, 'getPositionHistory'),
    );
  }

  buyPosition(customerId, p) {
    return this.send('POST', endpoints.buyPosition(customerId), { params: p }).then((r) => this.json(r, 'buyPosition'));
  }

  sellPosition(customerId, p) {
    return this.send('POST', endpoints.sellPosition(customerId), { params: p }).then((r) =>
      this.json(r, 'sellPosition'),
    );
  }

  // ---------- Admin (destructive) ----------

  initializeDB() {
    return this.send('POST', endpoints.initializeDB);
  }

  cleanDB() {
    return this.send('POST', endpoints.cleanDB);
  }
}
