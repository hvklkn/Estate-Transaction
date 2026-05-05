import type { AgentSummary } from '~/types/transaction';

export type ClientType = 'buyer' | 'seller' | 'landlord' | 'tenant' | 'investor' | 'other';

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  type: ClientType;
  notes: string;
  createdBy?: AgentSummary;
  updatedBy?: AgentSummary;
  deletedBy?: AgentSummary;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientSummary {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  type: ClientType;
}

export interface CreateClientPayload {
  fullName: string;
  phone?: string;
  email?: string;
  type: ClientType;
  notes?: string;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export const CLIENT_TYPE_OPTIONS: Array<{ value: ClientType; label: string }> = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'investor', label: 'Investor' },
  { value: 'other', label: 'Other' }
];
