import { ForbiddenException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { RESOURCE_MANAGER_ROLES } from '@/common/auth/role-permissions';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';

type TransactionNotePolicyTarget = {
  authorId: Types.ObjectId;
};

@Injectable()
export class TransactionNotePolicyService {
  private readonly managerRoles = new Set<AgentRole>(RESOURCE_MANAGER_ROLES);

  assertCanModify(
    note: TransactionNotePolicyTarget,
    actorAgentId: string,
    actorRole: AgentRole
  ): void {
    if (this.managerRoles.has(actorRole)) {
      return;
    }

    if (note.authorId.toString() === actorAgentId) {
      return;
    }

    throw new ForbiddenException('You can only modify notes you authored.');
  }
}
