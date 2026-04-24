export interface AgentUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: 'agent' | 'manager' | 'admin';
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
}
