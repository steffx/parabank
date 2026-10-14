import { test as base, expect } from '@playwright/test';
import { ParaBankRestClient } from '../api/ParaBankRestClient';
import { ParaBankSoapClient } from '../api/ParaBankSoapClient';
import { loginStorageState, registerCustomer } from '../api/session';
import { buildCustomer } from '../data/builders';
import { ParaBankApp } from '../pages/ParaBankApp';

/**
 * @typedef {import('../api/session').RegisteredUser} RegisteredUser
 * @typedef {import('../api/types').NewCustomer} NewCustomer
 */

/**
 * Test-scoped fixtures.
 * @typedef {object} TestFixtures
 * @property {ParaBankRestClient} bank Typed REST client (JSON by default).
 * @property {ParaBankRestClient} bankXml Same REST client, but asking for XML responses.
 * @property {ParaBankSoapClient} soap SOAP client for /services/ParaBank.
 * @property {ParaBankApp} app Page objects bound to the default (anonymous) page.
 * @property {RegisteredUser} freshUser A brand-new customer registered for this test only (known starting balance).
 * @property {ParaBankApp} userApp Page objects bound to a page that is already logged in as the worker user.
 * @property {(user: {username: string, password: string}) => Promise<ParaBankApp>} loginAs
 *   Open a new logged-in page for any user (own browser context, own HTTP session).
 * @property {(overrides?: Partial<NewCustomer>) => Promise<RegisteredUser>} registerUser
 *   Register a new customer on demand.
 */

/**
 * Worker-scoped fixtures.
 * @typedef {object} WorkerFixtures
 * @property {RegisteredUser} workerUser One customer per worker, shared by read-mostly tests to keep the suite fast.
 */

/** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & TestFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions & WorkerFixtures>} */
export const test = base.extend({
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
    const pages = [];
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
