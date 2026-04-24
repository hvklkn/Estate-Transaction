import { defineNuxtConfig } from 'nuxt/config';

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env ?? {};
const nodeEnv = env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const nitroPreset = env.NITRO_PRESET?.trim();

export default defineNuxtConfig({
  compatibilityDate: '2026-04-16',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  experimental: {
    // Keep runtime stable in local/CI dev where manifest virtual import can intermittently break.
    appManifest: false
  },
  css: ['~/assets/css/tailwind.css'],
  devtools: {
    enabled: !isProduction
  },
  typescript: {
    strict: true,
    // Keep type checks in CI/manual command (`npm run typecheck`) to avoid unstable dev checker runtime.
    typeCheck: false
  },
  runtimeConfig: {
    public: {
      apiBaseUrl:
        env.NUXT_PUBLIC_API_BASE_URL ??
        (isProduction ? '' : 'http://localhost:3001/api'),
      appEnv: env.NUXT_PUBLIC_APP_ENV ?? nodeEnv
    }
  },
  nitro: {
    preset: nitroPreset || undefined
  },
  app: {
    head: {
      title: 'Iceberg Dashboard',
      titleTemplate: '%s | Iceberg'
    }
  }
});
