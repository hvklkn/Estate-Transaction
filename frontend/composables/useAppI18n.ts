import { computed } from 'vue';

import { DEFAULT_LOCALE, MESSAGES, SUPPORTED_LOCALES, type AppLocale } from '~/locales/messages';
import type { TransactionStage } from '~/types/transaction';

export const LOCALE_STORAGE_KEY = 'iceberg.locale';

const SUPPORTED_LOCALE_SET = new Set<AppLocale>(SUPPORTED_LOCALES.map((locale) => locale.code));

const INTL_LOCALE_MAP: Record<AppLocale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  fr: 'fr-FR',
  de: 'de-DE'
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeLocaleCandidate = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.split('-')[0] ?? null;
};

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
  const locale = useState<AppLocale>('app-locale', () => DEFAULT_LOCALE);

  const currentIntlLocale = computed(() => INTL_LOCALE_MAP[locale.value]);

  const normalizeLocale = (value: string | null | undefined): AppLocale => {
    const candidate = normalizeLocaleCandidate(value);

    if (!candidate || !SUPPORTED_LOCALE_SET.has(candidate as AppLocale)) {
      return DEFAULT_LOCALE;
    }

    return candidate as AppLocale;
  };

  const setLocale = (nextLocale: AppLocale | string) => {
    locale.value = normalizeLocale(String(nextLocale));
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

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat(currentIntlLocale.value, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(amount);

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
    normalizeLocale,
    setLocale,
    t,
    formatCurrency,
    formatDateTime,
    formatPercent,
    getStageLabel
  };
};
