import { Page } from '@playwright/test';
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
  readonly home: HomePage;
  readonly register: RegisterPage;
  readonly lookup: LookupPage;
  readonly overview: AccountsOverviewPage;
  readonly openAccount: OpenAccountPage;
  readonly transfer: TransferFundsPage;
  readonly billPay: BillPayPage;
  readonly findTransactions: FindTransactionsPage;
  readonly activity: AccountActivityPage;
  readonly transaction: TransactionDetailsPage;
  readonly updateProfile: UpdateProfilePage;
  readonly requestLoan: RequestLoanPage;
  readonly contact: ContactPage;
  readonly admin: AdminPage;

  constructor(readonly page: Page) {
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

  info(path: string): InfoPage {
    return new InfoPage(this.page, path);
  }
}
