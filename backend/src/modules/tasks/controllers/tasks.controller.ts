import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';

import {
  RESOURCE_CREATOR_ROLES,
  RESOURCE_MANAGER_ROLES,
  RESOURCE_VIEWER_ROLES
} from '@/common/auth/role-permissions';
import { CurrentSession } from '@/common/auth/current-session.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { CreateTaskDto } from '@/modules/tasks/dto/create-task.dto';
import { ListTasksQueryDto } from '@/modules/tasks/dto/list-tasks-query.dto';
import { UpdateTaskDto } from '@/modules/tasks/dto/update-task.dto';
import { TasksService } from '@/modules/tasks/services/tasks.service';

@Controller('tasks')
@UseGuards(SessionAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(...RESOURCE_CREATOR_ROLES)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.tasksService.create(
      createTaskDto,
      currentAgentId,
      currentAgentRole,
      organizationId
    );
  }

  @Get('summary')
  @Roles(...RESOURCE_VIEWER_ROLES)
  summary(@CurrentSession('organizationId') organizationId: string) {
    return this.tasksService.getSummary(organizationId);
  }

  @Get()
  @Roles(...RESOURCE_VIEWER_ROLES)
  findAll(
    @Query() query: ListTasksQueryDto,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.tasksService.findAll(query, organizationId);
  }

  @Get(':id')
  @Roles(...RESOURCE_VIEWER_ROLES)
  findOne(@Param('id') id: string, @CurrentSession('organizationId') organizationId: string) {
    return this.tasksService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(...RESOURCE_CREATOR_ROLES)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.tasksService.update(
      id,
      updateTaskDto,
      currentAgentId,
      currentAgentRole,
      organizationId
    );
  }

  @Delete(':id')
  @Roles(...RESOURCE_MANAGER_ROLES)
  async remove(
    @Param('id') id: string,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    await this.tasksService.remove(id, currentAgentId, organizationId);
    return { success: true };
  }
}
