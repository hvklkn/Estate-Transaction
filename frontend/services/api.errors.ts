import type { FetchError } from 'ofetch';

interface ApiValidationErrorPayload {
  message?: string | string[];
}

interface ApiErrorEnvelope {
  error?: string | ApiValidationErrorPayload;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const toApiErrorMessage = (
  unknownError: unknown,
  fallback = 'An unexpected error occurred. Please try again.'
): string => {
  const fetchError = unknownError as FetchError<ApiErrorEnvelope>;
  const errorPayload = fetchError?.data?.error;

  if (typeof errorPayload === 'string' && errorPayload.trim().length > 0) {
    return errorPayload;
  }

  if (isObject(errorPayload) && 'message' in errorPayload) {
    const message = errorPayload.message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
  }

  if (typeof fetchError?.statusMessage === 'string' && fetchError.statusMessage.length > 0) {
    return fetchError.statusMessage;
  }

  if (unknownError instanceof Error && unknownError.message) {
    return unknownError.message;
  }

  return fallback;
};
