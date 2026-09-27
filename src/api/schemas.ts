import Ajv, { JSONSchemaType } from 'ajv';
import { expect } from '@playwright/test';
import { Account, Customer, LoanResponse, Transaction } from './types';

const ajv = new Ajv({ allErrors: true, strict: false });

const address = {
  type: 'object',
  required: ['street', 'city', 'state', 'zipCode'],
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zipCode: { type: 'string' },
  },
} as const;

export const customerSchema: JSONSchemaType<Customer> = {
  type: 'object',
  required: ['id', 'firstName', 'lastName', 'address', 'phoneNumber', 'ssn'],
  properties: {
    id: { type: 'integer' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    address: address as unknown as JSONSchemaType<Customer['address']>,
    phoneNumber: { type: 'string' },
    ssn: { type: 'string' },
  },
};

export const accountSchema: JSONSchemaType<Account> = {
  type: 'object',
  required: ['id', 'customerId', 'type', 'balance'],
  properties: {
    id: { type: 'integer' },
    customerId: { type: 'integer' },
    type: { type: 'string', enum: ['CHECKING', 'SAVINGS', 'LOAN'] },
    balance: { type: 'number' },
  },
};

export const transactionSchema = {
  type: 'object',
  required: ['id', 'accountId', 'type', 'date', 'amount', 'description'],
  properties: {
    id: { type: 'integer' },
    accountId: { type: 'integer' },
    type: { type: 'string', enum: ['Credit', 'Debit'] },
    date: { type: ['integer', 'string'] },
    amount: { type: 'number' },
    description: { type: 'string' },
  },
} as unknown as JSONSchemaType<Transaction>;

export const loanResponseSchema = {
  type: 'object',
  required: ['responseDate', 'loanProviderName', 'approved'],
  properties: {
    responseDate: { type: ['integer', 'string'] },
    loanProviderName: { type: 'string' },
    approved: { type: 'boolean' },
    message: { type: ['string', 'null'] },
    accountId: { type: ['integer', 'null'] },
  },
} as unknown as JSONSchemaType<LoanResponse>;

export const arrayOf = <T>(item: JSONSchemaType<T>): JSONSchemaType<T[]> =>
  ({ type: 'array', items: item }) as unknown as JSONSchemaType<T[]>;

/** Assert that `data` matches `schema`; lists every violation on failure. */
export function expectSchema<T>(data: unknown, schema: JSONSchemaType<T>, name = 'payload'): asserts data is T {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  expect(valid, `${name} schema violations: ${ajv.errorsText(validate.errors, { separator: '\n' })}`).toBe(true);
}
