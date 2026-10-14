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
  setParameter: (name, value) => `${REST}/setParameter/${name}/${value}`,
  startJms: `${REST}/startupJmsListener`,
  stopJms: `${REST}/shutdownJmsListener`,

  // Customers
  login: (username, password) => `${REST}/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
  customer: (customerId) => `${REST}/customers/${customerId}`,
  updateCustomer: (customerId) => `${REST}/customers/update/${customerId}`,
  customerAccounts: (customerId) => `${REST}/customers/${customerId}/accounts`,
  customerPositions: (customerId) => `${REST}/customers/${customerId}/positions`,
  buyPosition: (customerId) => `${REST}/customers/${customerId}/buyPosition`,
  sellPosition: (customerId) => `${REST}/customers/${customerId}/sellPosition`,

  // Accounts & money movement
  account: (accountId) => `${REST}/accounts/${accountId}`,
  createAccount: `${REST}/createAccount`,
  deposit: `${REST}/deposit`,
  withdraw: `${REST}/withdraw`,
  transfer: `${REST}/transfer`,
  billPay: `${REST}/billpay`,
  requestLoan: `${REST}/requestLoan`,

  // Transactions
  transaction: (transactionId) => `${REST}/transactions/${transactionId}`,
  accountTransactions: (accountId) => `${REST}/accounts/${accountId}/transactions`,
  transactionsByAmount: (accountId, amount) => `${REST}/accounts/${accountId}/transactions/amount/${amount}`,
  transactionsByMonthAndType: (accountId, month, type) =>
    `${REST}/accounts/${accountId}/transactions/month/${month}/type/${type}`,
  transactionsByDateRange: (accountId, fromDate, toDate) =>
    `${REST}/accounts/${accountId}/transactions/fromDate/${fromDate}/toDate/${toDate}`,
  transactionsOnDate: (accountId, onDate) => `${REST}/accounts/${accountId}/transactions/onDate/${onDate}`,

  // Positions (stock trading)
  position: (positionId) => `${REST}/positions/${positionId}`,
  positionHistory: (positionId, startDate, endDate) => `${REST}/positions/${positionId}/${startDate}/${endDate}`,

  // Contracts
  openApi: `${REST}/openapi.yaml`,
  wadl: `${REST}?_wadl&_type=xml`,

  // SOAP
  soapParaBank: 'services/ParaBank',
  soapParaBankWsdl: 'services/ParaBank?wsdl',
  soapLoanProcessorWsdl: 'services/LoanProcessor?wsdl',
};
