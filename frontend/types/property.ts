import type { ClientSummary } from '~/types/client';
import type { AgentSummary } from '~/types/transaction';

export type PropertyType = 'apartment' | 'house' | 'land' | 'office' | 'shop' | 'building' | 'other';
export type PropertyListingType = 'sale' | 'rent';
export type PropertyStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'rented' | 'archived';

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  listingType: PropertyListingType;
  address: string;
  city: string;
  district: string;
  price: number | null;
  currency: string;
  status: PropertyStatus;
  description: string;
  ownerClientId: string | null;
  ownerClient?: ClientSummary;
  createdBy?: AgentSummary;
  updatedBy?: AgentSummary;
  deletedBy?: AgentSummary;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertySummary {
  id: string;
  title: string;
  type: PropertyType;
  listingType: PropertyListingType;
  city: string;
  district: string;
  price: number | null;
  currency: string;
  status: PropertyStatus;
}

export interface CreatePropertyPayload {
  title: string;
  type: PropertyType;
  listingType: PropertyListingType;
  address?: string;
  city?: string;
  district?: string;
  price?: number;
  currency?: string;
  status?: PropertyStatus;
  description?: string;
  ownerClientId?: string;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export const PROPERTY_TYPE_OPTIONS: Array<{ value: PropertyType; label: string }> = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'land', label: 'Land' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'building', label: 'Building' },
  { value: 'other', label: 'Other' }
];

export const PROPERTY_LISTING_TYPE_OPTIONS: Array<{ value: PropertyListingType; label: string }> = [
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' }
];

export const PROPERTY_STATUS_OPTIONS: Array<{ value: PropertyStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
  { value: 'archived', label: 'Archived' }
];
