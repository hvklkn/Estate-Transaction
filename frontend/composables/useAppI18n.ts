import { computed } from 'vue';

import { DEFAULT_LOCALE, MESSAGES, SUPPORTED_LOCALES, type AppLocale } from '~/locales/messages';
import type { TransactionStage } from '~/types/transaction';
import { formatCurrencyAmount, type SupportedCurrency } from '~/utils/formatCurrency';
import { normalizeLocale, useUserSettings } from '~/composables/useUserSettings';

const INTL_LOCALE_MAP: Record<AppLocale, string> = {
  en: 'en-US',
  tr: 'tr-TR'
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const resolveMessageTemplate = (locale: AppLocale, key: string): string | null => {
  const segments = key.split('.');

  let cursor: unknown = MESSAGES[locale];

  for (const segment of segments) {
    if (!isObject(cursor)) {
      return null;
    }

    cursor = cursor[segment];
  }

  return typeof cursor === 'string' ? cursor : null;
};

const interpolateMessage = (
  template: string,
  params: Record<string, string | number | boolean>
): string =>
  template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });

export const useAppI18n = () => {
  const { settings, hydrateFromStorage } = useUserSettings();
  const locale = useState<AppLocale>('app-locale', () => DEFAULT_LOCALE);

  const currentIntlLocale = computed(() => INTL_LOCALE_MAP[locale.value]);
  const selectedCurrency = computed(() => settings.value.currency);

  if (import.meta.client) {
    hydrateFromStorage();
    locale.value = settings.value.locale;
  }

  const setLocale = (nextLocale: AppLocale | string) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    locale.value = normalizedLocale;
    settings.value.locale = normalizedLocale;
  };

  const t = (
    key: string,
    params: Record<string, string | number | boolean> = {}
  ): string => {
    const currentTemplate = resolveMessageTemplate(locale.value, key);
    const fallbackTemplate = resolveMessageTemplate(DEFAULT_LOCALE, key);
    const template = currentTemplate ?? fallbackTemplate ?? key;

    return interpolateMessage(template, params);
  };

  const formatCurrency = (
    amount: number,
    options: {
      currency?: SupportedCurrency | string | null;
      maximumFractionDigits?: number;
      minimumFractionDigits?: number;
    } = {}
  ): string =>
    formatCurrencyAmount(amount, {
      locale: currentIntlLocale.value,
      currency: options.currency ?? selectedCurrency.value,
      maximumFractionDigits: options.maximumFractionDigits,
      minimumFractionDigits: options.minimumFractionDigits
    });

  const formatDateTime = (isoDate?: string): string => {
    if (!isoDate) {
      return t('common.notAvailable');
    }

    return new Intl.DateTimeFormat(currentIntlLocale.value, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(isoDate));
  };

  const formatPercent = (percentValue: number): string =>
    new Intl.NumberFormat(currentIntlLocale.value, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentValue / 100);

  const getStageLabel = (stage: TransactionStage): string => t(`stages.${stage}`);

  return {
    locale,
    locales: SUPPORTED_LOCALES,
    currentIntlLocale,
    selectedCurrency,
    normalizeLocale,
    setLocale,
    t,
    formatCurrency,
    formatDateTime,
    formatPercent,
    getStageLabel
  };
};
