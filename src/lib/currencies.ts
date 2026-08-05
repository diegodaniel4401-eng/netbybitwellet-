export interface FiatCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRateToUsd: number;
}

export const SUPPORTED_FIAT_CURRENCIES: FiatCurrency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', defaultRateToUsd: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', defaultRateToUsd: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', defaultRateToUsd: 0.78 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', defaultRateToUsd: 1550.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', defaultRateToUsd: 1.36 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', defaultRateToUsd: 1.52 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', defaultRateToUsd: 155.0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', defaultRateToUsd: 7.23 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', defaultRateToUsd: 83.5 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', defaultRateToUsd: 3.67 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦', defaultRateToUsd: 3.75 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', defaultRateToUsd: 18.4 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', defaultRateToUsd: 5.45 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽', defaultRateToUsd: 18.2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', defaultRateToUsd: 1380.0 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', defaultRateToUsd: 1.35 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', defaultRateToUsd: 0.89 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', defaultRateToUsd: 7.81 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', defaultRateToUsd: 16200.0 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', defaultRateToUsd: 58.5 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', defaultRateToUsd: 32.8 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', defaultRateToUsd: 88.0 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', defaultRateToUsd: 10.5 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', defaultRateToUsd: 1.64 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', defaultRateToUsd: 3.98 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', defaultRateToUsd: 36.5 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', defaultRateToUsd: 25400.0 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', defaultRateToUsd: 48.2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', defaultRateToUsd: 129.5 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', defaultRateToUsd: 15.2 },
];

export async function fetchLiveFiatRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        return data.rates;
      }
    }
  } catch (err) {
    console.warn('Live exchange rates API fallback in effect', err);
  }

  const fallback: Record<string, number> = {};
  SUPPORTED_FIAT_CURRENCIES.forEach((c) => {
    fallback[c.code] = c.defaultRateToUsd;
  });
  return fallback;
}

export function convertUsdToFiat(usdAmount: number, currencyCode: string, liveRates?: Record<string, number>): number {
  const currency = SUPPORTED_FIAT_CURRENCIES.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase()) || SUPPORTED_FIAT_CURRENCIES[0];
  const rate = (liveRates && liveRates[currency.code]) || currency.defaultRateToUsd;
  return usdAmount * rate;
}

export function formatFiatValue(
  usdAmount: number,
  currencyCode: string,
  liveRates?: Record<string, number>
): { formatted: string; amount: number; symbol: string; code: string } {
  const currency = SUPPORTED_FIAT_CURRENCIES.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase()) || SUPPORTED_FIAT_CURRENCIES[0];
  const convertedAmount = convertUsdToFiat(usdAmount, currency.code, liveRates);

  const noDecimals = ['JPY', 'KRW', 'IDR', 'VND', 'GHS'].includes(currency.code);
  const formattedNumber = convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  });

  return {
    formatted: `${currency.symbol} ${formattedNumber}`,
    amount: convertedAmount,
    symbol: currency.symbol,
    code: currency.code,
  };
}
