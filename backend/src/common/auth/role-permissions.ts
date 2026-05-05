import { AgentRole } from '@/modules/agents/schemas/agent.schema';

export const TENANT_ADMIN_ROLES: readonly AgentRole[] = ['super_admin', 'office_owner', 'admin'];

export const TEAM_MANAGER_ROLES: readonly AgentRole[] = [
  'super_admin',
  'office_owner',
  'admin',
  'manager'
];

export const BALANCE_MANAGER_ROLES: readonly AgentRole[] = [
  'super_admin',
  'office_owner',
  'admin',
  'manager',
  'finance'
];

export const RESOURCE_VIEWER_ROLES: readonly AgentRole[] = [
  'super_admin',
  'office_owner',
  'admin',
  'manager',
  'agent',
  'assistant',
  'finance'
];

export const RESOURCE_CREATOR_ROLES: readonly AgentRole[] = [
  'super_admin',
  'office_owner',
  'admin',
  'manager',
  'agent',
  'assistant'
];

export const RESOURCE_MANAGER_ROLES: readonly AgentRole[] = [
  'super_admin',
  'office_owner',
  'admin',
  'manager'
];

export const canManageTeam = (role: AgentRole): boolean => TEAM_MANAGER_ROLES.includes(role);

export const canAdministerUsers = (role: AgentRole): boolean => TENANT_ADMIN_ROLES.includes(role);

export const canManageBalances = (role: AgentRole): boolean => BALANCE_MANAGER_ROLES.includes(role);

export const canViewTenantResources = (role: AgentRole): boolean =>
  RESOURCE_VIEWER_ROLES.includes(role);

export const canCreateTenantResources = (role: AgentRole): boolean =>
  RESOURCE_CREATOR_ROLES.includes(role);

export const canManageTenantResources = (role: AgentRole): boolean =>
  RESOURCE_MANAGER_ROLES.includes(role);

export const canAssignRole = (actorRole: AgentRole, targetRole: AgentRole): boolean => {
  if (actorRole === 'super_admin') {
    return true;
  }

  if (actorRole === 'office_owner' || actorRole === 'admin') {
    return targetRole !== 'super_admin';
  }

  if (actorRole === 'manager') {
    return ['agent', 'assistant', 'finance'].includes(targetRole);
  }

  return false;
};
