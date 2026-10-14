import Ajv from 'ajv';
import { expect } from '@playwright/test';

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
};

export const customerSchema = {
  type: 'object',
  required: ['id', 'firstName', 'lastName', 'address', 'phoneNumber', 'ssn'],
  properties: {
    id: { type: 'integer' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    address: address,
    phoneNumber: { type: 'string' },
    ssn: { type: 'string' },
  },
};

export const accountSchema = {
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
};

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
};

export const arrayOf = (item) => ({ type: 'array', items: item });

/** Assert that `data` matches `schema`; lists every violation on failure. */
export function expectSchema(data, schema, name = 'payload') {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  expect(valid, `${name} schema violations: ${ajv.errorsText(validate.errors, { separator: '\n' })}`).toBe(true);
}
