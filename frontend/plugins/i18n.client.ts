import { useAppI18n } from '~/composables/useAppI18n';
import { useUserSettings } from '~/composables/useUserSettings';

export default defineNuxtPlugin(() => {
  const { settings, hydrateFromStorage } = useUserSettings();
  const { setLocale } = useAppI18n();
  hydrateFromStorage();
  setLocale(settings.value.locale);
});
