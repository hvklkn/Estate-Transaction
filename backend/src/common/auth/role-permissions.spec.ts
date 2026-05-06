import {
  canAssignRole,
  canCreateProperties,
  canManageProperties,
  canViewProperties
} from '@/common/auth/role-permissions';
import { AGENT_ROLES, type AgentRole } from '@/modules/agents/schemas/agent.schema';

describe('property role permissions', () => {
  it.each<AgentRole>(['super_admin', 'office_owner', 'admin', 'manager'])(
    'allows %s to view, create, and manage properties',
    (role) => {
      expect(canViewProperties(role)).toBe(true);
      expect(canCreateProperties(role)).toBe(true);
      expect(canManageProperties(role)).toBe(true);
    }
  );

  it.each<AgentRole>(['agent', 'assistant'])(
    'allows %s to view and create properties without manage/archive permissions',
    (role) => {
      expect(canViewProperties(role)).toBe(true);
      expect(canCreateProperties(role)).toBe(true);
      expect(canManageProperties(role)).toBe(false);
    }
  );

  it('allows finance to view properties only', () => {
    expect(canViewProperties('finance')).toBe(true);
    expect(canCreateProperties('finance')).toBe(false);
    expect(canManageProperties('finance')).toBe(false);
  });

  it('covers every defined agent role', () => {
    AGENT_ROLES.forEach((role) => {
      expect(typeof canViewProperties(role)).toBe('boolean');
      expect(typeof canCreateProperties(role)).toBe('boolean');
      expect(typeof canManageProperties(role)).toBe('boolean');
    });
  });
});

describe('team role assignment permissions', () => {
  it.each<AgentRole>(['office_owner', 'admin'])(
    'allows %s to assign tenant roles except super_admin',
    (actorRole) => {
      expect(canAssignRole(actorRole, 'super_admin')).toBe(false);
      expect(canAssignRole(actorRole, 'office_owner')).toBe(true);
      expect(canAssignRole(actorRole, 'admin')).toBe(true);
      expect(canAssignRole(actorRole, 'manager')).toBe(true);
      expect(canAssignRole(actorRole, 'agent')).toBe(true);
      expect(canAssignRole(actorRole, 'assistant')).toBe(true);
      expect(canAssignRole(actorRole, 'finance')).toBe(true);
    }
  );

  it('allows manager to assign only agent, assistant, and finance', () => {
    expect(canAssignRole('manager', 'agent')).toBe(true);
    expect(canAssignRole('manager', 'assistant')).toBe(true);
    expect(canAssignRole('manager', 'finance')).toBe(true);
    expect(canAssignRole('manager', 'admin')).toBe(false);
    expect(canAssignRole('manager', 'office_owner')).toBe(false);
    expect(canAssignRole('manager', 'super_admin')).toBe(false);
  });
});
