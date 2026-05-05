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

import { RESOURCE_CREATOR_ROLES, RESOURCE_VIEWER_ROLES } from '@/common/auth/role-permissions';
import { CurrentSession } from '@/common/auth/current-session.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { CreateTransactionNoteDto } from '@/modules/transaction-notes/dto/create-transaction-note.dto';
import { ListTransactionNotesQueryDto } from '@/modules/transaction-notes/dto/list-transaction-notes-query.dto';
import { UpdateTransactionNoteDto } from '@/modules/transaction-notes/dto/update-transaction-note.dto';
import { TransactionNotesService } from '@/modules/transaction-notes/services/transaction-notes.service';

@Controller('transaction-notes')
@UseGuards(SessionAuthGuard, RolesGuard)
export class TransactionNotesController {
  constructor(private readonly transactionNotesService: TransactionNotesService) {}

  @Post()
  @Roles(...RESOURCE_CREATOR_ROLES)
  create(
    @Body() createTransactionNoteDto: CreateTransactionNoteDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.transactionNotesService.create(
      createTransactionNoteDto,
      currentAgentId,
      organizationId
    );
  }

  @Get('recent')
  @Roles(...RESOURCE_VIEWER_ROLES)
  recent(
    @Query() query: ListTransactionNotesQueryDto,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.transactionNotesService.findRecent(organizationId, query.limit);
  }

  @Get()
  @Roles(...RESOURCE_VIEWER_ROLES)
  findAll(
    @Query() query: ListTransactionNotesQueryDto,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.transactionNotesService.findAll(query, organizationId);
  }

  @Get(':id')
  @Roles(...RESOURCE_VIEWER_ROLES)
  findOne(@Param('id') id: string, @CurrentSession('organizationId') organizationId: string) {
    return this.transactionNotesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(...RESOURCE_CREATOR_ROLES)
  update(
    @Param('id') id: string,
    @Body() updateTransactionNoteDto: UpdateTransactionNoteDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.transactionNotesService.update(
      id,
      updateTransactionNoteDto,
      currentAgentId,
      currentAgentRole,
      organizationId
    );
  }

  @Delete(':id')
  @Roles(...RESOURCE_CREATOR_ROLES)
  async remove(
    @Param('id') id: string,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    await this.transactionNotesService.remove(id, currentAgentId, currentAgentRole, organizationId);
    return { success: true };
  }
}
