import { watch } from 'vue';

export const USER_SETTINGS_STORAGE_KEY = 'iceberg.user-settings';

export type UserSettings = {
  compactCards: boolean;
  pushNotifications: boolean;
  emailSummaries: boolean;
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  compactCards: false,
  pushNotifications: true,
  emailSummaries: false
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
    isHydrated.value = true;
  };

  if (!isPersistenceBound.value) {
    watch(
      settings,
      (nextSettings) => {
        if (!import.meta.client) {
          return;
        }

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
