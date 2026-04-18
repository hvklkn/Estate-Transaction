import { useAppI18n } from '~/composables/useAppI18n';

export default defineNuxtPlugin(() => {
  const { setLocale } = useAppI18n();
  setLocale('en');
});
