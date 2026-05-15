import { watch } from 'vue';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from '~/locales/messages';
import { DEFAULT_CURRENCY, normalizeCurrency, type SupportedCurrency } from '~/utils/formatCurrency';

export const USER_SETTINGS_STORAGE_KEY = 'real-estate-platform.user-settings';

export type UserSettings = {
  compactCards: boolean;
  pushNotifications: boolean;
  emailSummaries: boolean;
  locale: AppLocale;
  currency: SupportedCurrency;
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  compactCards: false,
  pushNotifications: true,
  emailSummaries: false,
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY
};

const SUPPORTED_LOCALE_CODES = new Set<AppLocale>(
  SUPPORTED_LOCALES.map((locale) => locale.code)
);

export const normalizeLocale = (value: string | null | undefined): AppLocale => {
  const normalizedValue = value?.trim().toLowerCase();
  return SUPPORTED_LOCALE_CODES.has(normalizedValue as AppLocale)
    ? (normalizedValue as AppLocale)
    : DEFAULT_LOCALE;
};

const parseStoredSettings = (value: string | null): Partial<UserSettings> => {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Partial<UserSettings>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
};

export const useUserSettings = () => {
  const settings = useState<UserSettings>('user-settings', () => ({ ...DEFAULT_USER_SETTINGS }));
  const isHydrated = useState<boolean>('user-settings-hydrated', () => false);
  const isPersistenceBound = useState<boolean>('user-settings-watch-bound', () => false);

  const hydrateFromStorage = () => {
    if (!import.meta.client || isHydrated.value) {
      return;
    }

    const parsedSettings = parseStoredSettings(window.localStorage.getItem(USER_SETTINGS_STORAGE_KEY));

    settings.value.compactCards = Boolean(parsedSettings.compactCards);
    settings.value.pushNotifications =
      typeof parsedSettings.pushNotifications === 'boolean'
        ? parsedSettings.pushNotifications
        : DEFAULT_USER_SETTINGS.pushNotifications;
    settings.value.emailSummaries = Boolean(parsedSettings.emailSummaries);
    settings.value.locale = normalizeLocale(parsedSettings.locale);
    settings.value.currency = normalizeCurrency(parsedSettings.currency);
    isHydrated.value = true;
  };

  if (import.meta.client && !isPersistenceBound.value) {
    watch(
      settings,
      (nextSettings) => {
        window.localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
      },
      { deep: true }
    );

    isPersistenceBound.value = true;
  }

  return {
    settings,
    hydrateFromStorage
  };
};
