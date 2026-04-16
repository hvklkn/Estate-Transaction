export interface AgentUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface RegisterAgentPayload {
  name: string;
  email: string;
}
