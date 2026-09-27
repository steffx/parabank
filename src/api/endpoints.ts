/**
 * Every ParaBank REST resource, relative to the application root.
 * Source: com.parasoft.parabank.service.ParaBankService (JAX-RS @Path annotations),
 * mounted by CXF at /services/bank. The browser UI calls the same resources
 * through /services_proxy/bank.
 */
const REST = 'services/bank';

export const endpoints = {
  // Misc / database
  initializeDB: `${REST}/initializeDB`,
  cleanDB: `${REST}/cleanDB`,
  setParameter: (name: string, value: string) => `${REST}/setParameter/${name}/${value}`,
  startJms: `${REST}/startupJmsListener`,
  stopJms: `${REST}/shutdownJmsListener`,

  // Customers
  login: (username: string, password: string) =>
    `${REST}/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
  customer: (customerId: number) => `${REST}/customers/${customerId}`,
  updateCustomer: (customerId: number) => `${REST}/customers/update/${customerId}`,
  customerAccounts: (customerId: number) => `${REST}/customers/${customerId}/accounts`,
  customerPositions: (customerId: number) => `${REST}/customers/${customerId}/positions`,
  buyPosition: (customerId: number) => `${REST}/customers/${customerId}/buyPosition`,
  sellPosition: (customerId: number) => `${REST}/customers/${customerId}/sellPosition`,

  // Accounts & money movement
  account: (accountId: number) => `${REST}/accounts/${accountId}`,
  createAccount: `${REST}/createAccount`,
  deposit: `${REST}/deposit`,
  withdraw: `${REST}/withdraw`,
  transfer: `${REST}/transfer`,
  billPay: `${REST}/billpay`,
  requestLoan: `${REST}/requestLoan`,

  // Transactions
  transaction: (transactionId: number) => `${REST}/transactions/${transactionId}`,
  accountTransactions: (accountId: number) => `${REST}/accounts/${accountId}/transactions`,
  transactionsByAmount: (accountId: number, amount: number | string) =>
    `${REST}/accounts/${accountId}/transactions/amount/${amount}`,
  transactionsByMonthAndType: (accountId: number, month: string, type: string) =>
    `${REST}/accounts/${accountId}/transactions/month/${month}/type/${type}`,
  transactionsByDateRange: (accountId: number, fromDate: string, toDate: string) =>
    `${REST}/accounts/${accountId}/transactions/fromDate/${fromDate}/toDate/${toDate}`,
  transactionsOnDate: (accountId: number, onDate: string) =>
    `${REST}/accounts/${accountId}/transactions/onDate/${onDate}`,

  // Positions (stock trading)
  position: (positionId: number) => `${REST}/positions/${positionId}`,
  positionHistory: (positionId: number, startDate: string, endDate: string) =>
    `${REST}/positions/${positionId}/${startDate}/${endDate}`,

  // Contracts
  openApi: `${REST}/openapi.yaml`,
  wadl: `${REST}?_wadl&_type=xml`,

  // SOAP
  soapParaBank: 'services/ParaBank',
  soapParaBankWsdl: 'services/ParaBank?wsdl',
  soapLoanProcessorWsdl: 'services/LoanProcessor?wsdl',
} as const;
