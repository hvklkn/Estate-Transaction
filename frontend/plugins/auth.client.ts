import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  authStore.hydrateFromStorage();

  try {
    if (authStore.sessionToken) {
      await authStore.refreshCurrentUser({ silent: true });
    }
    await authStore.fetchUsers();
  } catch {
    // Auth store keeps API errors in state; suppress startup hard failures.
  }
});
