import { watch } from 'vue';

import { LOCALE_STORAGE_KEY, useAppI18n } from '~/composables/useAppI18n';

export default defineNuxtPlugin(() => {
  const { locale, normalizeLocale, setLocale } = useAppI18n();

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  const browserLocale = window.navigator.language;
  const initialLocale = normalizeLocale(storedLocale ?? browserLocale);

  if (initialLocale !== locale.value) {
    setLocale(initialLocale);
  }

  watch(
    locale,
    (currentLocale) => {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
    },
    { immediate: true }
  );
});
