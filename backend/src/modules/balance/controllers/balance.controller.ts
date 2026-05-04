import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentSession } from '@/common/auth/current-session.decorator';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { ListBalanceLedgerQueryDto } from '@/modules/balance/dto/list-balance-ledger-query.dto';
import { ManualBalanceAdjustmentDto } from '@/modules/balance/dto/manual-balance-adjustment.dto';
import { BalanceService } from '@/modules/balance/services/balance.service';

@Controller()
@UseGuards(SessionAuthGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('balance/me')
  getMyBalance(
    @CurrentSession('agentId') agentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.balanceService.getMyBalance(agentId, organizationId);
  }

  @Get('balance/me/ledger')
  getMyLedger(
    @CurrentSession('agentId') agentId: string,
    @CurrentSession('organizationId') organizationId: string,
    @Query() query: ListBalanceLedgerQueryDto
  ) {
    return this.balanceService.getMyLedger(agentId, organizationId, query);
  }

  @Get('agents/:id/balance')
  getAgentBalance(
    @Param('id') targetAgentId: string,
    @CurrentSession('agentId') viewerAgentId: string,
    @CurrentSession('role') viewerRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.balanceService.getAgentBalanceForViewer(
      viewerAgentId,
      viewerRole,
      organizationId,
      targetAgentId
    );
  }

  @Post('balance/manual-adjustment')
  createManualAdjustment(
    @Body() payload: ManualBalanceAdjustmentDto,
    @CurrentSession('agentId') viewerAgentId: string,
    @CurrentSession('role') viewerRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.balanceService.createManualAdjustment(
      viewerAgentId,
      viewerRole,
      organizationId,
      payload
    );
  }
}
