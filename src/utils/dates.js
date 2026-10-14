/** ParaBank date format used by REST paths and the Find Transactions page: MM-dd-yyyy */
export const toParaBankDate = (d = new Date()) =>
  `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;

export const daysFromToday = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

/** English month name of today, as listed in the Account Activity "Activity Period" filter. */
export const currentMonthName = () => new Date().toLocaleString('en-US', { month: 'long' });
