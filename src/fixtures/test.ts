import { Page, test as base, expect } from '@playwright/test';
import { ParaBankRestClient } from '../api/ParaBankRestClient';
import { ParaBankSoapClient } from '../api/ParaBankSoapClient';
import { RegisteredUser, loginStorageState, registerCustomer } from '../api/session';
import { NewCustomer } from '../api/types';
import { buildCustomer } from '../data/builders';
import { ParaBankApp } from '../pages/ParaBankApp';

type TestFixtures = {
  /** Typed REST client (JSON by default). */
  bank: ParaBankRestClient;
  /** Same REST client, but asking for XML responses. */
  bankXml: ParaBankRestClient;
  /** SOAP client for /services/ParaBank. */
  soap: ParaBankSoapClient;
  /** Page objects bound to the default (anonymous) page. */
  app: ParaBankApp;
  /** A brand-new customer registered for this test only (known starting balance). */
  freshUser: RegisteredUser;
  /** Page objects bound to a page that is already logged in as the worker user. */
  userApp: ParaBankApp;
  /** Open a new logged-in page for any user (own browser context, own HTTP session). */
  loginAs: (user: Pick<NewCustomer, 'username' | 'password'>) => Promise<ParaBankApp>;
  /** Register a new customer on demand. */
  registerUser: (overrides?: Partial<NewCustomer>) => Promise<RegisteredUser>;
};

type WorkerFixtures = {
  /** One customer per worker, shared by read-mostly tests to keep the suite fast. */
  workerUser: RegisteredUser;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  workerUser: [
    async ({}, use) => {
      const user = await registerCustomer(buildCustomer({ firstName: 'Worker' }));
      await use(user);
    },
    { scope: 'worker', timeout: 120_000 },
  ],

  bank: async ({ request }, use) => {
    await use(new ParaBankRestClient(request, 'json'));
  },

  bankXml: async ({ request }, use) => {
    await use(new ParaBankRestClient(request, 'xml'));
  },

  soap: async ({ request }, use) => {
    await use(new ParaBankSoapClient(request));
  },

  app: async ({ page }, use) => {
    await use(new ParaBankApp(page));
  },

  registerUser: async ({}, use) => {
    await use((overrides = {}) => registerCustomer(buildCustomer(overrides)));
  },

  freshUser: async ({ registerUser }, use) => {
    await use(await registerUser());
  },

  loginAs: async ({ browser }, use) => {
    const pages: Page[] = [];
    await use(async (user) => {
      const storageState = await loginStorageState(user.username, user.password);
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      pages.push(page);
      return new ParaBankApp(page);
    });
    for (const p of pages) await p.context().close();
  },

  userApp: async ({ workerUser, loginAs }, use) => {
    await use(await loginAs(workerUser));
  },
});

export { expect };
