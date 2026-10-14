import { test, expect } from '../../src/fixtures/test';
import data from '../../src/data/login-negative.json';

test.describe('Data-driven: login rejections', { tag: '@data-driven' }, () => {
  for (const c of data.cases) {
    test(`${c.id}: ${c.title}`, async ({ app, workerUser }) => {
      const resolve = (v) =>
        v
          .replace('{{worker}}', workerUser.username)
          .replace('{{WORKER}}', workerUser.username.toUpperCase())
          .replace('{{workerPassword}}', workerUser.password)
          .replace('{{now}}', String(Date.now()));

      await app.home.goto();
      await app.home.login(resolve(c.username), resolve(c.password));

      await expect(app.home.error).toHaveText(c.message);
      await expect(app.home.accountServicesLink('Log Out')).toHaveCount(0);
    });
  }
});
