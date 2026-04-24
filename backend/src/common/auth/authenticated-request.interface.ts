import { Request } from 'express';

export interface AuthenticatedSession {
  agentId: string;
  sessionId: string;
  sessionToken: string;
  role: 'agent' | 'manager' | 'admin';
}

export type AuthenticatedRequest = Request & {
  auth?: AuthenticatedSession;
};
