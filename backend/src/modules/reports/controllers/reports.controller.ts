import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { REPORT_EXPORT_ROLES, REPORT_VIEWER_ROLES } from '@/common/auth/role-permissions';
import { CurrentSession } from '@/common/auth/current-session.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { ReportQueryDto } from '@/modules/reports/dto/report-query.dto';
import { ReportsService } from '@/modules/reports/services/reports.service';

@Controller('reports')
@UseGuards(SessionAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(...REPORT_VIEWER_ROLES)
  summary(
    @Query() query: ReportQueryDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.reportsService.getSummary(query, {
      currentAgentId,
      currentAgentRole,
      organizationId
    });
  }

  @Get('exports/transactions')
  @Roles(...REPORT_EXPORT_ROLES)
  async exportTransactions(
    @Query() query: ReportQueryDto,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.sendCsv(
      response,
      'transactions',
      await this.reportsService.exportTransactionsCsv(query, organizationId, currentAgentRole)
    );
  }

  @Get('exports/clients')
  @Roles(...REPORT_EXPORT_ROLES)
  async exportClients(
    @Query() query: ReportQueryDto,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.sendCsv(
      response,
      'clients',
      await this.reportsService.exportClientsCsv(query, organizationId, currentAgentRole)
    );
  }

  @Get('exports/properties')
  @Roles(...REPORT_EXPORT_ROLES)
  async exportProperties(
    @Query() query: ReportQueryDto,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.sendCsv(
      response,
      'properties',
      await this.reportsService.exportPropertiesCsv(query, organizationId, currentAgentRole)
    );
  }

  @Get('exports/tasks')
  @Roles(...REPORT_EXPORT_ROLES)
  async exportTasks(
    @Query() query: ReportQueryDto,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.sendCsv(
      response,
      'tasks',
      await this.reportsService.exportTasksCsv(query, organizationId, currentAgentRole)
    );
  }

  @Get('exports/commissions')
  @Roles(...REPORT_EXPORT_ROLES)
  async exportCommissions(
    @Query() query: ReportQueryDto,
    @CurrentSession('role') currentAgentRole: AgentRole,
    @CurrentSession('organizationId') organizationId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.sendCsv(
      response,
      'commissions',
      await this.reportsService.exportCommissionsCsv(query, organizationId, currentAgentRole)
    );
  }

  private sendCsv(response: Response, name: string, csv: string): string {
    const dateStamp = new Date().toISOString().slice(0, 10);
    response.type('text/csv');
    response.header('Content-Disposition', `attachment; filename="${name}-${dateStamp}.csv"`);
    return csv;
  }
}
