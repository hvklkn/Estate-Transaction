export const useApi = () => {
  const config = useRuntimeConfig();
  const apiBaseUrl = String(config.public.apiBaseUrl ?? '').trim();

  if (!apiBaseUrl) {
    throw new Error(
      'NUXT_PUBLIC_API_BASE_URL is required. Set it to your backend API base URL (for example: https://api.example.com/api).'
    );
  }

  const normalizedApiBaseUrl = apiBaseUrl.replace(/\/+$/, '');

  if (!import.meta.dev && /(?:localhost|127\.0\.0\.1)/i.test(normalizedApiBaseUrl)) {
    throw new Error(
      `Invalid production API configuration: "${normalizedApiBaseUrl}" points to localhost. Set NUXT_PUBLIC_API_BASE_URL to a deployed backend URL.`
    );
  }

  const client = $fetch.create({
    baseURL: normalizedApiBaseUrl,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });
  type ApiRequestOptions = Parameters<typeof client>[1];

  const request = <T>(path: string, options?: ApiRequestOptions) => client<T>(path, options);

  return {
    request
  };
};
