/** Domain types mirroring com.parasoft.parabank.domain.* (JSON representation). */

export type AccountType = 'CHECKING' | 'SAVINGS' | 'LOAN';
/** createAccount takes the enum ordinal, not the name. */
export const AccountTypeCode: Record<Exclude<AccountType, 'LOAN'>, number> = { CHECKING: 0, SAVINGS: 1 };

export type TransactionType = 'Credit' | 'Debit';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  ssn: string;
}

/** Registration payload (UI form) — a Customer plus credentials. */
export interface NewCustomer extends Omit<Customer, 'id'> {
  username: string;
  password: string;
}

export interface Account {
  id: number;
  customerId: number;
  type: AccountType;
  balance: number;
}

export interface Transaction {
  id: number;
  accountId: number;
  type: TransactionType;
  /** Epoch millis in JSON. */
  date: number | string;
  amount: number;
  description: string;
}

export interface Payee {
  name: string;
  address: Address;
  phoneNumber: string;
  accountNumber: number;
}

export interface BillPayResult {
  payeeName: string;
  amount: number;
  accountId: number;
}

export interface LoanResponse {
  responseDate: number | string;
  loanProviderName: string;
  approved: boolean;
  message?: string;
  accountId?: number;
}

export interface Position {
  positionId: number;
  customerId: number;
  name: string;
  symbol: string;
  shares: number;
  purchasePrice: number;
}

export interface HistoryPoint {
  symbol: string;
  date: number | string;
  closingPrice: number;
}
