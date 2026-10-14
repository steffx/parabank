import { faker } from '@faker-js/faker';
import { test, expect } from '../../src/fixtures/test';

test.describe('Customer Care (contact form)', { tag: '@contact' }, () => {
  test('message is accepted and the customer is thanked by name', async ({ app }) => {
    const name = faker.person.fullName();
    await app.contact.goto();
    await app.contact.expectHeading('Customer Care');

    await app.contact.send({
      name,
      email: faker.internet.email(),
      phone: faker.string.numeric(10),
      message: faker.lorem.sentences(2),
    });

    await expect(app.contact.rightPanel).toContainText(`Thank you ${name}`);
    await expect(app.contact.rightPanel).toContainText('A Customer Care Representative will be contacting you.');
  });

  test('all fields are required', async ({ app }) => {
    await app.contact.goto();
    await app.contact.submit.click();

    await expect.soft(app.contact.error('name')).toHaveText('Name is required.');
    await expect.soft(app.contact.error('email')).toHaveText('Email is required.');
    await expect.soft(app.contact.error('phone')).toHaveText('Phone is required.');
    await expect.soft(app.contact.error('message')).toHaveText('Message is required.');
  });
});
