import { APIRequestContext, expect, request as playwrightRequest } from '@playwright/test';
import { env } from '../config/env';
import { ParaBankRestClient } from './ParaBankRestClient';
import { Account, Customer, NewCustomer } from './types';

export interface RegisteredUser extends NewCustomer {
  id: number;
  /** Accounts that existed right after registration (one CHECKING account, balance = initialBalance). */
  initialAccounts: Account[];
  /** Convenience: id of the first account. */
  primaryAccountId: number;
}

type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>;

const newContext = () => playwrightRequest.newContext({ baseURL: `${env.baseUrl}/` });

const retry = async <T>(label: string, attempts: number, fn: () => Promise<T>): Promise<T> => {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${String(last)}`);
};

/**
 * Registers a customer by POSTing the Spring MVC registration form directly.
 * Much faster than driving the UI, and exercises the same server-side validation.
 * Returns the customer with its id and initial accounts (looked up via the REST API).
 */
export async function registerCustomer(customer: NewCustomer): Promise<RegisteredUser> {
  return retry(`register ${customer.username}`, 3, async () => {
    const ctx = await newContext();
    try {
      // The form must be loaded first: Spring keeps the form backing object in the HTTP session,
      // and a POST without that session fails with HTTP 500 ("An internal error has occurred").
      await ctx.get('register.htm');
      const res = await ctx.post('register.htm', {
        form: {
          'customer.firstName': customer.firstName,
          'customer.lastName': customer.lastName,
          'customer.address.street': customer.address.street,
          'customer.address.city': customer.address.city,
          'customer.address.state': customer.address.state,
          'customer.address.zipCode': customer.address.zipCode,
          'customer.phoneNumber': customer.phoneNumber,
          'customer.ssn': customer.ssn,
          'customer.username': customer.username,
          'customer.password': customer.password,
          repeatedPassword: customer.password,
        },
      });
      const html = await res.text();
      expect(html, 'registration confirmation page').toContain('Your account was created successfully');

      const bank = new ParaBankRestClient(ctx);
      const found: Customer = await bank.login(customer.username, customer.password);
      const initialAccounts = await bank.getAccounts(found.id);
      return { ...customer, id: found.id, initialAccounts, primaryAccountId: initialAccounts[0].id };
    } finally {
      await ctx.dispose();
    }
  });
}

/**
 * Logs in through the login form (POST login.htm) and returns the resulting cookies,
 * ready to be loaded into a BrowserContext. One fresh HTTP session per call, so tests
 * never share (or log out of) each other's sessions.
 */
export async function loginStorageState(username: string, password: string): Promise<StorageState> {
  return retry(`login ${username}`, 3, async () => {
    const ctx = await newContext();
    try {
      await ctx.get('index.htm');
      const res = await ctx.post('login.htm', { form: { username, password } });
      const html = await res.text();
      expect(html, 'login should land on the Accounts Overview page').toContain('Accounts Overview');
      return await ctx.storageState();
    } finally {
      await ctx.dispose();
    }
  });
}
