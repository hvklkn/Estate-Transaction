import { ForbiddenException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { RESOURCE_MANAGER_ROLES } from '@/common/auth/role-permissions';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { CreateTaskDto } from '@/modules/tasks/dto/create-task.dto';
import { UpdateTaskDto } from '@/modules/tasks/dto/update-task.dto';

type TaskPolicyTarget = {
  assignedTo?: Types.ObjectId | null;
};

@Injectable()
export class TaskPolicyService {
  private readonly managerRoles = new Set<AgentRole>(RESOURCE_MANAGER_ROLES);

  assertCanCreate(createTaskDto: CreateTaskDto, actorAgentId: string, actorRole: AgentRole): void {
    if (this.managerRoles.has(actorRole)) {
      return;
    }

    if (createTaskDto.assignedTo && createTaskDto.assignedTo !== actorAgentId) {
      throw new ForbiddenException('Only managers can assign tasks to another user.');
    }
  }

  resolveAssignedToForCreate(
    createTaskDto: CreateTaskDto,
    actorAgentId: string,
    actorRole: AgentRole
  ): string | null | undefined {
    this.assertCanCreate(createTaskDto, actorAgentId, actorRole);

    if (this.managerRoles.has(actorRole)) {
      return createTaskDto.assignedTo;
    }

    return createTaskDto.assignedTo ?? actorAgentId;
  }

  assertCanUpdate(
    task: TaskPolicyTarget,
    updateTaskDto: UpdateTaskDto,
    actorAgentId: string,
    actorRole: AgentRole
  ): void {
    if (this.managerRoles.has(actorRole)) {
      return;
    }

    if (updateTaskDto.assignedTo !== undefined) {
      throw new ForbiddenException('Only managers can reassign tasks.');
    }

    if (task.assignedTo?.toString() !== actorAgentId) {
      throw new ForbiddenException('You can only update tasks assigned to you.');
    }
  }
}
