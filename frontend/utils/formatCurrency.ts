export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'TRY';

export const SUPPORTED_CURRENCIES: Array<{ code: SupportedCurrency; label: string }> = [
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'GBP', label: 'GBP - British Pound' },
  { code: 'TRY', label: 'TRY - Turkish Lira' }
];

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

const SUPPORTED_CURRENCY_CODES = new Set<SupportedCurrency>(
  SUPPORTED_CURRENCIES.map((currency) => currency.code)
);

export const normalizeCurrency = (
  value: string | null | undefined
): SupportedCurrency => {
  const normalizedValue = value?.trim().toUpperCase();
  return SUPPORTED_CURRENCY_CODES.has(normalizedValue as SupportedCurrency)
    ? (normalizedValue as SupportedCurrency)
    : DEFAULT_CURRENCY;
};

export const formatCurrencyAmount = (
  amount: number,
  options: {
    locale: string;
    currency?: string | null;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
): string => {
  const currency = normalizeCurrency(options.currency);

  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  }).format(amount);
};
