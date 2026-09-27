import { APIRequestContext, APIResponse, test } from '@playwright/test';
import { endpoints } from './endpoints';
import {
  Account,
  AccountTypeCode,
  Address,
  BillPayResult,
  Customer,
  HistoryPoint,
  LoanResponse,
  Payee,
  Position,
  Transaction,
} from './types';

export type Format = 'json' | 'xml';
type Params = Record<string, string | number | boolean>;

export interface SendOptions {
  params?: Params;
  data?: unknown;
  format?: Format;
  headers?: Record<string, string>;
}

/** Thrown when a typed helper receives a non-2xx response. Carries the response for inspection. */
export class ParaBankApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
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
  constructor(
    private readonly request: APIRequestContext,
    private readonly defaultFormat: Format = 'json',
  ) {}

  /** Raw request. ParaBank uses query parameters for most POST inputs. */
  async send(method: 'GET' | 'POST', path: string, options: SendOptions = {}): Promise<APIResponse> {
    const format = options.format ?? this.defaultFormat;
    const accept = format === 'json' ? 'application/json' : 'application/xml';
    return test.step(`${method} /${path}`, async () =>
      this.request.fetch(path, {
        method,
        params: options.params,
        data: options.data,
        headers: { Accept: accept, ...options.headers },
      }),
    );
  }

  private async ok(res: APIResponse, what: string): Promise<APIResponse> {
    if (!res.ok()) {
      const body = await res.text();
      throw new ParaBankApiError(`${what} failed: HTTP ${res.status()} ${body.slice(0, 300)}`, res.status(), body);
    }
    return res;
  }

  private async json<T>(res: APIResponse, what: string): Promise<T> {
    return (await this.ok(res, what)).json() as Promise<T>;
  }

  private async text(res: APIResponse, what: string): Promise<string> {
    return (await this.ok(res, what)).text();
  }

  // ---------- Customers ----------

  login(username: string, password: string): Promise<Customer> {
    return this.send('GET', endpoints.login(username, password)).then((r) => this.json<Customer>(r, 'login'));
  }

  getCustomer(customerId: number): Promise<Customer> {
    return this.send('GET', endpoints.customer(customerId)).then((r) => this.json<Customer>(r, 'getCustomer'));
  }

  updateCustomer(
    customerId: number,
    c: { firstName: string; lastName: string; address: Address; phoneNumber: string; ssn: string; username: string; password: string },
  ): Promise<string> {
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

  getAccounts(customerId: number): Promise<Account[]> {
    return this.send('GET', endpoints.customerAccounts(customerId)).then((r) => this.json<Account[]>(r, 'getAccounts'));
  }

  getAccount(accountId: number): Promise<Account> {
    return this.send('GET', endpoints.account(accountId)).then((r) => this.json<Account>(r, 'getAccount'));
  }

  createAccount(customerId: number, type: keyof typeof AccountTypeCode, fromAccountId: number): Promise<Account> {
    return this.send('POST', endpoints.createAccount, {
      params: { customerId, newAccountType: AccountTypeCode[type], fromAccountId },
    }).then((r) => this.json<Account>(r, 'createAccount'));
  }

  // ---------- Money movement ----------

  deposit(accountId: number, amount: number): Promise<string> {
    return this.send('POST', endpoints.deposit, { params: { accountId, amount } }).then((r) => this.text(r, 'deposit'));
  }

  withdraw(accountId: number, amount: number): Promise<string> {
    return this.send('POST', endpoints.withdraw, { params: { accountId, amount } }).then((r) => this.text(r, 'withdraw'));
  }

  transfer(fromAccountId: number, toAccountId: number, amount: number): Promise<string> {
    return this.send('POST', endpoints.transfer, { params: { fromAccountId, toAccountId, amount } }).then((r) =>
      this.text(r, 'transfer'),
    );
  }

  billPay(accountId: number, amount: number, payee: Payee): Promise<BillPayResult> {
    return this.send('POST', endpoints.billPay, {
      params: { accountId, amount },
      data: payee,
      headers: { 'Content-Type': 'application/json' },
    }).then((r) => this.json<BillPayResult>(r, 'billPay'));
  }

  requestLoan(customerId: number, amount: number, downPayment: number, fromAccountId: number): Promise<LoanResponse> {
    return this.send('POST', endpoints.requestLoan, {
      params: { customerId, amount, downPayment, fromAccountId },
    }).then((r) => this.json<LoanResponse>(r, 'requestLoan'));
  }

  // ---------- Transactions ----------

  getTransactions(accountId: number): Promise<Transaction[]> {
    return this.send('GET', endpoints.accountTransactions(accountId)).then((r) =>
      this.json<Transaction[]>(r, 'getTransactions'),
    );
  }

  getTransaction(transactionId: number): Promise<Transaction> {
    return this.send('GET', endpoints.transaction(transactionId)).then((r) =>
      this.json<Transaction>(r, 'getTransaction'),
    );
  }

  findTransactionsByAmount(accountId: number, amount: number): Promise<Transaction[]> {
    return this.send('GET', endpoints.transactionsByAmount(accountId, amount)).then((r) =>
      this.json<Transaction[]>(r, 'findTransactionsByAmount'),
    );
  }

  findTransactionsOnDate(accountId: number, onDate: string): Promise<Transaction[]> {
    return this.send('GET', endpoints.transactionsOnDate(accountId, onDate)).then((r) =>
      this.json<Transaction[]>(r, 'findTransactionsOnDate'),
    );
  }

  findTransactionsByDateRange(accountId: number, fromDate: string, toDate: string): Promise<Transaction[]> {
    return this.send('GET', endpoints.transactionsByDateRange(accountId, fromDate, toDate)).then((r) =>
      this.json<Transaction[]>(r, 'findTransactionsByDateRange'),
    );
  }

  findTransactionsByMonthAndType(accountId: number, month: string, type: string): Promise<Transaction[]> {
    return this.send('GET', endpoints.transactionsByMonthAndType(accountId, month, type)).then((r) =>
      this.json<Transaction[]>(r, 'findTransactionsByMonthAndType'),
    );
  }

  // ---------- Positions ----------

  getPositions(customerId: number): Promise<Position[]> {
    return this.send('GET', endpoints.customerPositions(customerId)).then((r) => this.json<Position[]>(r, 'getPositions'));
  }

  getPosition(positionId: number): Promise<Position> {
    return this.send('GET', endpoints.position(positionId)).then((r) => this.json<Position>(r, 'getPosition'));
  }

  getPositionHistory(positionId: number, startDate: string, endDate: string): Promise<HistoryPoint[]> {
    return this.send('GET', endpoints.positionHistory(positionId, startDate, endDate)).then((r) =>
      this.json<HistoryPoint[]>(r, 'getPositionHistory'),
    );
  }

  buyPosition(
    customerId: number,
    p: { accountId: number; name: string; symbol: string; shares: number; pricePerShare: number },
  ): Promise<Position[]> {
    return this.send('POST', endpoints.buyPosition(customerId), { params: p }).then((r) =>
      this.json<Position[]>(r, 'buyPosition'),
    );
  }

  sellPosition(
    customerId: number,
    p: { accountId: number; positionId: number; shares: number; pricePerShare: number },
  ): Promise<Position[]> {
    return this.send('POST', endpoints.sellPosition(customerId), { params: p }).then((r) =>
      this.json<Position[]>(r, 'sellPosition'),
    );
  }

  // ---------- Admin (destructive) ----------

  initializeDB(): Promise<APIResponse> {
    return this.send('POST', endpoints.initializeDB);
  }

  cleanDB(): Promise<APIResponse> {
    return this.send('POST', endpoints.cleanDB);
  }
}
