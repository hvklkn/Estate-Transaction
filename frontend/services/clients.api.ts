import type { Client, ClientSummary, ClientType, CreateClientPayload, UpdateClientPayload } from '~/types/client';
import {
  createStoredAuthHeaders,
  normalizeAgentSummary,
  normalizeOptionalIsoDate,
  toOptionalString,
  toRequiredObjectIdString,
  toRequiredString
} from '~/services/resource-normalizers';

const CLIENTS_ENDPOINT = '/clients';
const CLIENT_ENDPOINT = (id: string) => `${CLIENTS_ENDPOINT}/${id}`;
const CLIENT_TYPES = new Set<ClientType>(['buyer', 'seller', 'landlord', 'tenant', 'investor', 'other']);

type ObjectIdLike = string | { toString(): string };

interface ApiClient {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  fullName?: string;
  phone?: string;
  email?: string;
  type?: ClientType;
  notes?: string;
  createdBy?: unknown;
  updatedBy?: unknown;
  deletedBy?: unknown;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeClientType = (value: unknown): ClientType =>
  typeof value === 'string' && CLIENT_TYPES.has(value as ClientType)
    ? (value as ClientType)
    : 'other';

export const normalizeClientSummary = (apiClient: ApiClient): ClientSummary => ({
  id: toRequiredObjectIdString(apiClient.id ?? apiClient._id, 'client.id'),
  fullName: toRequiredString(apiClient.fullName, 'client.fullName'),
  phone: toOptionalString(apiClient.phone),
  email: toOptionalString(apiClient.email),
  type: normalizeClientType(apiClient.type)
});

export const normalizeClient = (apiClient: ApiClient): Client => ({
  ...normalizeClientSummary(apiClient),
  notes: toOptionalString(apiClient.notes),
  createdBy: normalizeAgentSummary(apiClient.createdBy as never),
  updatedBy: normalizeAgentSummary(apiClient.updatedBy as never),
  deletedBy: normalizeAgentSummary(apiClient.deletedBy as never),
  deletedAt: normalizeOptionalIsoDate(apiClient.deletedAt, 'deletedAt'),
  createdAt: apiClient.createdAt,
  updatedAt: apiClient.updatedAt
});

export const useClientsApi = () => {
  const api = useApi();

  return {
    async listClients(): Promise<Client[]> {
      const response = await api.request<ApiClient[]>(CLIENTS_ENDPOINT, {
        headers: createStoredAuthHeaders()
      });

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a client array.');
      }

      return response.map(normalizeClient);
    },

    async createClient(payload: CreateClientPayload): Promise<Client> {
      const response = await api.request<ApiClient>(CLIENTS_ENDPOINT, {
        method: 'POST',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeClient(response);
    },

    async updateClient(id: string, payload: UpdateClientPayload): Promise<Client> {
      const response = await api.request<ApiClient>(CLIENT_ENDPOINT(id), {
        method: 'PATCH',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeClient(response);
    },

    async deleteClient(id: string): Promise<{ success: boolean }> {
      const response = await api.request<{ success?: boolean }>(CLIENT_ENDPOINT(id), {
        method: 'DELETE',
        headers: createStoredAuthHeaders()
      });

      return { success: Boolean(response.success) };
    }
  };
};
