/**
 * Domain types mirroring com.parasoft.parabank.domain.* (JSON representation).
 * Declared as JSDoc typedefs so editors (VS Code) still give autocomplete in plain JavaScript:
 *   /** @type {import('../api/types').Customer} *\/
 */

/** @typedef {'CHECKING' | 'SAVINGS' | 'LOAN'} AccountType */

/** createAccount takes the enum ordinal, not the name. */
export const AccountTypeCode = Object.freeze({ CHECKING: 0, SAVINGS: 1 });

/** @typedef {'Credit' | 'Debit'} TransactionType */

/**
 * @typedef {object} Address
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {string} zipCode
 */

/**
 * @typedef {object} Customer
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {Address} address
 * @property {string} phoneNumber
 * @property {string} ssn
 */

/**
 * Registration payload (UI form) — a Customer without id, plus credentials.
 * @typedef {object} NewCustomer
 * @property {string} firstName
 * @property {string} lastName
 * @property {Address} address
 * @property {string} phoneNumber
 * @property {string} ssn
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {object} Account
 * @property {number} id
 * @property {number} customerId
 * @property {AccountType} type
 * @property {number} balance
 */

/**
 * @typedef {object} Transaction
 * @property {number} id
 * @property {number} accountId
 * @property {TransactionType} type
 * @property {number | string} date Epoch millis in JSON.
 * @property {number} amount
 * @property {string} description
 */

/**
 * @typedef {object} Payee
 * @property {string} name
 * @property {Address} address
 * @property {string} phoneNumber
 * @property {number} accountNumber
 */

/**
 * @typedef {object} BillPayResult
 * @property {string} payeeName
 * @property {number} amount
 * @property {number} accountId
 */

/**
 * @typedef {object} LoanResponse
 * @property {number | string} responseDate
 * @property {string} loanProviderName
 * @property {boolean} approved
 * @property {string} [message]
 * @property {number} [accountId]
 */

/**
 * @typedef {object} Position
 * @property {number} positionId
 * @property {number} customerId
 * @property {string} name
 * @property {string} symbol
 * @property {number} shares
 * @property {number} purchasePrice
 */

/**
 * @typedef {object} HistoryPoint
 * @property {string} symbol
 * @property {number | string} date
 * @property {number} closingPrice
 */
