import { AccountActivityPage } from './AccountActivityPage';
import { AccountsOverviewPage } from './AccountsOverviewPage';
import { AdminPage } from './AdminPage';
import { BillPayPage } from './BillPayPage';
import { ContactPage } from './ContactPage';
import { FindTransactionsPage } from './FindTransactionsPage';
import { HomePage } from './HomePage';
import { InfoPage } from './InfoPages';
import { LookupPage } from './LookupPage';
import { OpenAccountPage } from './OpenAccountPage';
import { RegisterPage } from './RegisterPage';
import { RequestLoanPage } from './RequestLoanPage';
import { TransactionDetailsPage } from './TransactionDetailsPage';
import { TransferFundsPage } from './TransferFundsPage';
import { UpdateProfilePage } from './UpdateProfilePage';

/** One object that exposes every page object bound to the same Playwright Page. */
export class ParaBankApp {
  constructor(page) {
    this.page = page;
    this.home = new HomePage(page);
    this.register = new RegisterPage(page);
    this.lookup = new LookupPage(page);
    this.overview = new AccountsOverviewPage(page);
    this.openAccount = new OpenAccountPage(page);
    this.transfer = new TransferFundsPage(page);
    this.billPay = new BillPayPage(page);
    this.findTransactions = new FindTransactionsPage(page);
    this.activity = new AccountActivityPage(page);
    this.transaction = new TransactionDetailsPage(page);
    this.updateProfile = new UpdateProfilePage(page);
    this.requestLoan = new RequestLoanPage(page);
    this.contact = new ContactPage(page);
    this.admin = new AdminPage(page);
  }

  info(path) {
    return new InfoPage(this.page, path);
  }
}
