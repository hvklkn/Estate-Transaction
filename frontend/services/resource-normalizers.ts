const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

type ObjectIdLike = string | { toString(): string };

export interface ApiAgentSummary {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  name?: string;
  email?: string;
  isActive?: boolean;
}

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const toRequiredString = (value: unknown, fieldName: string): string => {
  const normalizedValue = toNonEmptyString(value);
  if (!normalizedValue) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalizedValue;
};

export const toOptionalString = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

export const toOptionalObjectIdString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return toNonEmptyString(value);
  }

  if (isObject(value) && typeof value.toString === 'function') {
    return toNonEmptyString(value.toString());
  }

  return null;
};

export const toRequiredObjectIdString = (value: unknown, fieldName: string): string => {
  const normalizedValue = toOptionalObjectIdString(value);

  if (!normalizedValue || !OBJECT_ID_REGEX.test(normalizedValue)) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalizedValue;
};

export const normalizeOptionalIsoDate = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = toRequiredString(value, fieldName);
  const dateValue = new Date(stringValue);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error(`Invalid API response: invalid "${fieldName}".`);
  }

  return dateValue.toISOString();
};

export const readSessionTokenFromStorage = (): string | null => {
  if (!import.meta.client) {
    return null;
  }

  const token = window.localStorage.getItem('iceberg.session-token');
  if (typeof token !== 'string') {
    return null;
  }

  const normalizedToken = token.trim();
  return normalizedToken.length > 0 ? normalizedToken : null;
};

export const createStoredAuthHeaders = (): HeadersInit => {
  const sessionToken = readSessionTokenFromStorage();
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
};

export const normalizeAgentSummary = (
  apiAgent: ApiAgentSummary | string | null | undefined
) => {
  if (!apiAgent || typeof apiAgent === 'string') {
    return undefined;
  }

  const name = toNonEmptyString(apiAgent.name);
  const email = toNonEmptyString(apiAgent.email);
  const id = toOptionalObjectIdString(apiAgent.id ?? apiAgent._id);
  if (!id || !name || !email) {
    return undefined;
  }

  return {
    id,
    name,
    email,
    isActive: Boolean(apiAgent.isActive)
  };
};
