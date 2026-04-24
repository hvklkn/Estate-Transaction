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

import { CurrentSession } from '@/common/auth/current-session.decorator';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { CreateTransactionDto } from '@/modules/transactions/dto/create-transaction.dto';
import { ListTransactionsQueryDto } from '@/modules/transactions/dto/list-transactions-query.dto';
import { UpdateTransactionDto } from '@/modules/transactions/dto/update-transaction.dto';
import { UpdateTransactionStageDto } from '@/modules/transactions/dto/update-transaction-stage.dto';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

@Controller('transactions')
@UseGuards(SessionAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentSession('agentId') currentAgentId: string
  ) {
    return this.transactionsService.create(createTransactionDto, currentAgentId);
  }

  @Get()
  findAll(@Query() query: ListTransactionsQueryDto) {
    return this.transactionsService.findAll(query);
  }

  @Get('summary')
  summary() {
    return this.transactionsService.getCompletedEarningsSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/stage')
  updateStage(
    @Param('id') id: string,
    @Body() updateTransactionStageDto: UpdateTransactionStageDto,
    @CurrentSession('agentId') currentAgentId: string
  ) {
    return this.transactionsService.updateStage(id, updateTransactionStageDto.stage, currentAgentId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentSession('agentId') currentAgentId: string
  ) {
    return this.transactionsService.update(id, updateTransactionDto, currentAgentId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('role') currentAgentRole: AgentRole
  ) {
    await this.transactionsService.remove(id, currentAgentId, currentAgentRole);
    return {
      success: true
    };
  }
}
