import { Request } from 'express';

import { AgentRole } from '@/modules/agents/schemas/agent.schema';

export interface AuthenticatedSession {
  agentId: string;
  sessionId: string;
  sessionToken: string;
  role: AgentRole;
  organizationId: string;
}

export type AuthenticatedRequest = Request & {
  auth?: AuthenticatedSession;
};
