/** "$1,234.56" -> 1234.56, "-$100.00" -> -100 */
export const parseMoney = (text: string): number => {
  const cleaned = text.replace(/[$,\s]/g, '');
  const value = Number(cleaned);
  if (Number.isNaN(value)) throw new Error(`Cannot parse money value from "${text}"`);
  return value;
};

/** 1234.5 -> "$1234.50" (ParaBank's own format has no thousands separator). */
export const formatMoney = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`;

/** Avoid floating point noise when comparing balances. */
export const round2 = (value: number): number => Math.round(value * 100) / 100;
