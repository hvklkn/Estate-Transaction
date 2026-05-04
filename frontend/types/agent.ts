export type AgentRole =
  | 'super_admin'
  | 'office_owner'
  | 'manager'
  | 'agent'
  | 'finance'
  | 'assistant'
  | 'admin';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface AgentUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: AgentRole;
  organizationId: string | null;
  organization: OrganizationSummary | null;
  balance?: number;
  balanceCents?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  iban?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator';
  twoFactorVerifiedAt?: string | null;
}

export interface RegisterAgentPayload {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
  organizationSlug?: string;
  organizationId?: string;
}
