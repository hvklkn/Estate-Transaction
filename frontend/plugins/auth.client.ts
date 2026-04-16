import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  authStore.hydrateFromStorage();

  try {
    await authStore.fetchUsers();
  } catch {
    // Auth store keeps API errors in state; suppress startup hard failures.
  }
});
