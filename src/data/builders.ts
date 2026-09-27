import { faker } from '@faker-js/faker';
import { NewCustomer, Payee } from '../api/types';

/** Short, unique, ParaBank-safe username (letters + digits only). */
export const uniqueUsername = (prefix = 'pw'): string =>
  `${prefix}${Date.now().toString(36)}${faker.string.alphanumeric({ length: 4, casing: 'lower' })}`;

export const buildCustomer = (overrides: Partial<NewCustomer> = {}): NewCustomer => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
  },
  phoneNumber: faker.string.numeric(10),
  ssn: faker.string.numeric(9),
  username: uniqueUsername(),
  password: `Pw${faker.string.alphanumeric(8)}1`,
  ...overrides,
});

export const buildPayee = (overrides: Partial<Payee> = {}): Payee => ({
  name: faker.company.name().replace(/[^A-Za-z ]/g, '').slice(0, 30),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
  },
  phoneNumber: faker.string.numeric(10),
  accountNumber: faker.number.int({ min: 10000, max: 99999 }),
  ...overrides,
});

/** Money amounts with two decimals, never zero. */
export const amount = (min = 1, max = 50): number => faker.number.float({ min, max, fractionDigits: 2 });
