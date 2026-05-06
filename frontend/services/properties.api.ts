import { normalizeClientSummary } from '~/services/clients.api';
import { toApiErrorMessage } from '~/services/api.errors';
import { createStoredAuthHeaders, isObject, normalizeAgentSummary, normalizeOptionalIsoDate, toOptionalObjectIdString, toOptionalString, toRequiredObjectIdString, toRequiredString } from '~/services/resource-normalizers';
import type { CreatePropertyPayload, Property, PropertyListingType, PropertyStatus, PropertySummary, PropertyType, UpdatePropertyPayload } from '~/types/property';

const PROPERTIES_ENDPOINT = '/properties';
const PROPERTY_ENDPOINT = (id: string) => `${PROPERTIES_ENDPOINT}/${id}`;
const PROPERTY_TYPES = new Set<PropertyType>(['apartment', 'house', 'land', 'office', 'shop', 'building', 'other']);
const LISTING_TYPES = new Set<PropertyListingType>(['sale', 'rent']);
const PROPERTY_STATUSES = new Set<PropertyStatus>(['draft', 'active', 'reserved', 'sold', 'rented', 'archived']);

type ObjectIdLike = string | { toString(): string };

interface PropertyApiErrorPayload {
  message?: string | string[];
  reason?: string;
  currentRole?: string;
  allowedRoles?: string[];
}

interface PropertyApiErrorEnvelope {
  statusCode?: number;
  error?: string | PropertyApiErrorPayload;
}

interface ApiProperty {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  title?: string;
  type?: PropertyType;
  listingType?: PropertyListingType;
  address?: string;
  city?: string;
  district?: string;
  price?: number | null;
  currency?: string;
  status?: PropertyStatus;
  description?: string;
  ownerClientId?: string | Record<string, unknown> | null;
  createdBy?: unknown;
  updatedBy?: unknown;
  deletedBy?: unknown;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const normalizePropertyType = (value: unknown): PropertyType => (typeof value === 'string' && PROPERTY_TYPES.has(value as PropertyType) ? (value as PropertyType) : 'other');

const normalizeListingType = (value: unknown): PropertyListingType => (typeof value === 'string' && LISTING_TYPES.has(value as PropertyListingType) ? (value as PropertyListingType) : 'sale');

const normalizeStatus = (value: unknown): PropertyStatus => (typeof value === 'string' && PROPERTY_STATUSES.has(value as PropertyStatus) ? (value as PropertyStatus) : 'draft');

const normalizePrice = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

const normalizePropertyPayload = <T extends CreatePropertyPayload | UpdatePropertyPayload>(payload: T): T => {
  const normalizedPayload = { ...payload } as T;
  const runtimePayload = normalizedPayload as T & {
    ownerClientId?: unknown;
    price?: unknown;
  };

  if (typeof runtimePayload.ownerClientId === 'string') {
    const ownerClientId = runtimePayload.ownerClientId.trim();
    if (ownerClientId.length > 0) {
      runtimePayload.ownerClientId = ownerClientId;
    } else {
      delete runtimePayload.ownerClientId;
    }
  }

  if ('price' in runtimePayload) {
    const rawPrice: unknown = runtimePayload.price;
    if (rawPrice === null || rawPrice === undefined || (typeof rawPrice === 'string' && rawPrice.trim() === '')) {
      delete runtimePayload.price;
    } else {
      const price = Number(rawPrice);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Price must be a valid non-negative number.');
      }
      runtimePayload.price = price;
    }
  }

  return normalizedPayload;
};

const getApiErrorEnvelope = (unknownError: unknown): PropertyApiErrorEnvelope | undefined => (unknownError as { data?: PropertyApiErrorEnvelope })?.data;

const getApiErrorStatus = (unknownError: unknown): number | undefined => {
  const errorRecord = unknownError as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };

  return errorRecord.status ?? errorRecord.statusCode ?? errorRecord.response?.status ?? getApiErrorEnvelope(unknownError)?.statusCode;
};

const getPropertyApiErrorMessage = (unknownError: unknown, action: string): string => {
  const baseMessage = toApiErrorMessage(unknownError);
  const status = getApiErrorStatus(unknownError);
  const errorPayload = getApiErrorEnvelope(unknownError)?.error;
  const currentRole = isObject(errorPayload) && typeof errorPayload.currentRole === 'string' ? errorPayload.currentRole : null;

  if (status === 401) {
    return `Session error while ${action}: ${baseMessage}. Please sign in again.`;
  }

  if (status === 403) {
    return [`Permission error while ${action}: ${baseMessage}.`, currentRole ? `Current backend role: ${currentRole}.` : '', 'Refresh your session or sign in again if your role was recently changed.'].filter(Boolean).join(' ');
  }

  if (status === 400) {
    if (/linked clients?|same organization/i.test(baseMessage)) {
      return `Owner client organization mismatch while ${action}: ${baseMessage}`;
    }

    return `Validation error while ${action}: ${baseMessage}`;
  }

  return baseMessage;
};

const withPropertyApiError = async <T>(action: string, request: () => Promise<T>): Promise<T> => {
  try {
    if (import.meta.dev) {
      console.debug('[properties-api]', `${action}: request started`);
    }
    return await request();
  } catch (unknownError) {
    if (import.meta.dev) {
      console.debug('[properties-api]', `${action}: request failed`, {
        status: getApiErrorStatus(unknownError),
        message: getPropertyApiErrorMessage(unknownError, action)
      });
    }
    throw new Error(getPropertyApiErrorMessage(unknownError, action));
  }
};

export const normalizePropertySummary = (apiProperty: ApiProperty): PropertySummary => ({
  id: toRequiredObjectIdString(apiProperty.id ?? apiProperty._id, 'property.id'),
  title: toRequiredString(apiProperty.title, 'property.title'),
  type: normalizePropertyType(apiProperty.type),
  listingType: normalizeListingType(apiProperty.listingType),
  city: toOptionalString(apiProperty.city),
  district: toOptionalString(apiProperty.district),
  price: normalizePrice(apiProperty.price),
  currency: toOptionalString(apiProperty.currency) || 'USD',
  status: normalizeStatus(apiProperty.status)
});

export const normalizeProperty = (apiProperty: ApiProperty): Property => {
  const ownerClientId = typeof apiProperty.ownerClientId === 'string' ? toOptionalObjectIdString(apiProperty.ownerClientId) : isObject(apiProperty.ownerClientId) ? toOptionalObjectIdString(apiProperty.ownerClientId.id ?? apiProperty.ownerClientId._id) : null;
  const ownerClient = isObject(apiProperty.ownerClientId) ? normalizeClientSummary(apiProperty.ownerClientId as never) : undefined;

  return {
    ...normalizePropertySummary(apiProperty),
    address: toOptionalString(apiProperty.address),
    description: toOptionalString(apiProperty.description),
    ownerClientId,
    ownerClient,
    createdBy: normalizeAgentSummary(apiProperty.createdBy as never),
    updatedBy: normalizeAgentSummary(apiProperty.updatedBy as never),
    deletedBy: normalizeAgentSummary(apiProperty.deletedBy as never),
    deletedAt: normalizeOptionalIsoDate(apiProperty.deletedAt, 'deletedAt'),
    createdAt: apiProperty.createdAt,
    updatedAt: apiProperty.updatedAt
  };
};

export const usePropertiesApi = () => {
  const api = useApi();

  return {
    async listProperties(): Promise<Property[]> {
      const response = await withPropertyApiError('loading properties', () =>
        api.request<ApiProperty[]>(PROPERTIES_ENDPOINT, {
          headers: createStoredAuthHeaders()
        })
      );

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a property array.');
      }

      return response.map(normalizeProperty);
    },

    async createProperty(payload: CreatePropertyPayload): Promise<Property> {
      const body = normalizePropertyPayload(payload);
      if (import.meta.dev) {
        console.debug('[properties-api] creating property: POST /properties', {
          titlePresent: String(body.title ?? '').trim().length > 0,
          ownerClientLinked: Boolean(body.ownerClientId)
        });
      }

      const response = await withPropertyApiError('creating property', () =>
        api.request<ApiProperty>(PROPERTIES_ENDPOINT, {
          method: 'POST',
          headers: createStoredAuthHeaders(),
          body
        })
      );

      const property = normalizeProperty(response);
      if (import.meta.dev) {
        console.debug('[properties-api] creating property: response normalized', {
          id: property.id,
          title: property.title
        });
      }

      return property;
    },

    async updateProperty(id: string, payload: UpdatePropertyPayload): Promise<Property> {
      const response = await withPropertyApiError('updating property', () =>
        api.request<ApiProperty>(PROPERTY_ENDPOINT(id), {
          method: 'PATCH',
          headers: createStoredAuthHeaders(),
          body: normalizePropertyPayload(payload)
        })
      );

      return normalizeProperty(response);
    },

    async deleteProperty(id: string): Promise<{ success: boolean }> {
      const response = await withPropertyApiError('archiving property', () =>
        api.request<{ success?: boolean }>(PROPERTY_ENDPOINT(id), {
          method: 'DELETE',
          headers: createStoredAuthHeaders()
        })
      );

      return { success: Boolean(response.success) };
    }
  };
};
