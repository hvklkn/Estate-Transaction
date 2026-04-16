import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();
  authStore.hydrateFromStorage();

  const isAuthRoute = to.path.startsWith('/auth');

  if (!authStore.isAuthenticated && !isAuthRoute) {
    return navigateTo('/auth');
  }

  if (authStore.isAuthenticated && isAuthRoute) {
    return navigateTo('/transactions');
  }
});
