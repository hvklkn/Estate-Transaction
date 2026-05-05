import { normalizeClientSummary } from '~/services/clients.api';
import {
  createStoredAuthHeaders,
  isObject,
  normalizeAgentSummary,
  normalizeOptionalIsoDate,
  toOptionalObjectIdString,
  toOptionalString,
  toRequiredObjectIdString,
  toRequiredString
} from '~/services/resource-normalizers';
import type {
  CreatePropertyPayload,
  Property,
  PropertyListingType,
  PropertyStatus,
  PropertySummary,
  PropertyType,
  UpdatePropertyPayload
} from '~/types/property';

const PROPERTIES_ENDPOINT = '/properties';
const PROPERTY_ENDPOINT = (id: string) => `${PROPERTIES_ENDPOINT}/${id}`;
const PROPERTY_TYPES = new Set<PropertyType>(['apartment', 'house', 'land', 'office', 'shop', 'building', 'other']);
const LISTING_TYPES = new Set<PropertyListingType>(['sale', 'rent']);
const PROPERTY_STATUSES = new Set<PropertyStatus>(['draft', 'active', 'reserved', 'sold', 'rented', 'archived']);

type ObjectIdLike = string | { toString(): string };

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

const normalizePropertyType = (value: unknown): PropertyType =>
  typeof value === 'string' && PROPERTY_TYPES.has(value as PropertyType)
    ? (value as PropertyType)
    : 'other';

const normalizeListingType = (value: unknown): PropertyListingType =>
  typeof value === 'string' && LISTING_TYPES.has(value as PropertyListingType)
    ? (value as PropertyListingType)
    : 'sale';

const normalizeStatus = (value: unknown): PropertyStatus =>
  typeof value === 'string' && PROPERTY_STATUSES.has(value as PropertyStatus)
    ? (value as PropertyStatus)
    : 'draft';

const normalizePrice = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

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
  const ownerClientId =
    typeof apiProperty.ownerClientId === 'string'
      ? toOptionalObjectIdString(apiProperty.ownerClientId)
      : isObject(apiProperty.ownerClientId)
        ? toOptionalObjectIdString(apiProperty.ownerClientId.id ?? apiProperty.ownerClientId._id)
        : null;
  const ownerClient =
    isObject(apiProperty.ownerClientId)
      ? normalizeClientSummary(apiProperty.ownerClientId as never)
      : undefined;

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
      const response = await api.request<ApiProperty[]>(PROPERTIES_ENDPOINT, {
        headers: createStoredAuthHeaders()
      });

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a property array.');
      }

      return response.map(normalizeProperty);
    },

    async createProperty(payload: CreatePropertyPayload): Promise<Property> {
      const response = await api.request<ApiProperty>(PROPERTIES_ENDPOINT, {
        method: 'POST',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeProperty(response);
    },

    async updateProperty(id: string, payload: UpdatePropertyPayload): Promise<Property> {
      const response = await api.request<ApiProperty>(PROPERTY_ENDPOINT(id), {
        method: 'PATCH',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeProperty(response);
    },

    async deleteProperty(id: string): Promise<{ success: boolean }> {
      const response = await api.request<{ success?: boolean }>(PROPERTY_ENDPOINT(id), {
        method: 'DELETE',
        headers: createStoredAuthHeaders()
      });

      return { success: Boolean(response.success) };
    }
  };
};
