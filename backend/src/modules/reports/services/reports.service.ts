import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';

import { Agent, AgentDocument, AgentRole } from '@/modules/agents/schemas/agent.schema';
import {
  BalanceLedger,
  BalanceLedgerDocument
} from '@/modules/balance/schemas/balance-ledger.schema';
import { Client, ClientDocument } from '@/modules/clients/schemas/client.schema';
import { PropertyListingType } from '@/modules/properties/domain/property-listing-type.enum';
import { PropertyStatus } from '@/modules/properties/domain/property-status.enum';
import { Property, PropertyDocument } from '@/modules/properties/schemas/property.schema';
import { ReportQueryDto } from '@/modules/reports/dto/report-query.dto';
import { TaskStatus } from '@/modules/tasks/domain/task-status.enum';
import { Task, TaskDocument } from '@/modules/tasks/schemas/task.schema';
import {
  TransactionNote,
  TransactionNoteDocument
} from '@/modules/transaction-notes/schemas/transaction-note.schema';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';
import {
  Transaction,
  TransactionDocument
} from '@/modules/transactions/schemas/transaction.schema';

interface ReportSessionContext {
  currentAgentId: string;
  currentAgentRole: AgentRole;
  organizationId: string;
}

interface CountItem {
  key: string;
  count: number;
}

interface TrendItem {
  period: string;
  count?: number;
  totalServiceFee?: number;
}

interface AgentPerformanceItem {
  agentId: string;
  agentName: string;
  closedDeals: number;
  totalCommissionEarnings: number;
  totalCommissionEarningsCents: number;
}

interface ActivityItem {
  type: 'transaction' | 'task' | 'note' | 'balance';
  title: string;
  occurredAt: string;
  actorId: string | null;
}

export interface ReportSummary {
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    agentId: string | null;
    transactionType: TransactionType | null;
    transactionStage: TransactionStage | null;
    propertyListingType: PropertyListingType | null;
    status: string | null;
  };
  transactionCountsByStage: CountItem[];
  transactionCountsByType: CountItem[];
  completedDealsOverTime: TrendItem[];
  totalServiceFeeOverTime: TrendItem[];
  monthlyServiceFee: number;
  monthlyServiceFeeCents: number;
  agentPerformance: AgentPerformanceItem[];
  taskSummary: {
    pending: number;
    completed: number;
    overdue: number;
  };
  recentActivity: ActivityItem[];
  commissionSummary: {
    agencyTotal: number;
    agencyTotalCents: number;
    agentPoolTotal: number;
    agentPoolTotalCents: number;
    agentEarningsTotal: number;
    agentEarningsTotalCents: number;
  };
}

const OPEN_TASK_STATUSES = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
const FULL_REPORT_ROLES: readonly AgentRole[] = ['super_admin', 'office_owner', 'admin', 'manager'];
const FINANCE_REPORT_ROLES: readonly AgentRole[] = ['finance'];
const BASIC_REPORT_ROLES: readonly AgentRole[] = ['assistant'];
const AGENT_REPORT_ROLES: readonly AgentRole[] = ['agent'];

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(TransactionNote.name)
    private readonly transactionNoteModel: Model<TransactionNoteDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(BalanceLedger.name)
    private readonly balanceLedgerModel: Model<BalanceLedgerDocument>
  ) {}

  async getSummary(query: ReportQueryDto, context: ReportSessionContext): Promise<ReportSummary> {
    const effectiveQuery = this.resolveQueryForRole(query, context);
    const organizationObjectId = new Types.ObjectId(context.organizationId);
    const transactionMatch = await this.buildTransactionMatch(effectiveQuery, organizationObjectId);
    const taskMatch = this.buildTaskMatch(effectiveQuery, organizationObjectId);
    const canViewFinancials = !BASIC_REPORT_ROLES.includes(context.currentAgentRole);
    const canViewActivity = !AGENT_REPORT_ROLES.includes(context.currentAgentRole);

    const [
      transactionCountsByStage,
      transactionCountsByType,
      completedDealsOverTime,
      totalServiceFeeOverTime,
      agentPerformance,
      taskSummary,
      recentActivity,
      commissionSummary
    ] = await Promise.all([
      this.countBy(this.transactionModel, transactionMatch, '$stage'),
      this.countBy(this.transactionModel, transactionMatch, '$transactionType'),
      this.completedDealsOverTime(transactionMatch),
      this.totalServiceFeeOverTime(transactionMatch),
      canViewFinancials ? this.agentPerformance(transactionMatch, organizationObjectId) : [],
      this.taskSummary(taskMatch),
      canViewActivity ? this.recentActivity(organizationObjectId) : [],
      canViewFinancials ? this.commissionSummary(transactionMatch) : this.emptyCommissionSummary()
    ]);

    const currentMonthMatch = {
      ...transactionMatch,
      createdAt: {
        $gte: this.startOfMonth(new Date()),
        $lte: this.endOfDay(new Date())
      }
    };
    const monthlyServiceFee = await this.sumTransactionServiceFee(currentMonthMatch);

    return {
      filters: this.toFilterView(effectiveQuery),
      transactionCountsByStage,
      transactionCountsByType,
      completedDealsOverTime,
      totalServiceFeeOverTime,
      monthlyServiceFee,
      monthlyServiceFeeCents: this.toCents(monthlyServiceFee),
      agentPerformance,
      taskSummary,
      recentActivity,
      commissionSummary
    };
  }

  async exportTransactionsCsv(
    query: ReportQueryDto,
    organizationId: string,
    role: AgentRole
  ): Promise<string> {
    this.assertCanExport(role);
    const match = await this.buildTransactionMatch(query, new Types.ObjectId(organizationId));
    const rows = await this.transactionModel
      .find(match)
      .sort({ createdAt: -1, _id: -1 })
      .limit(5000)
      .lean()
      .exec();

    return this.toCsv(
      [
        'id',
        'property_title',
        'transaction_type',
        'stage',
        'total_service_fee',
        'agency_amount',
        'agent_pool_amount',
        'listing_agent_id',
        'selling_agent_id',
        'created_at',
        'updated_at'
      ],
      rows.map((row) => [
        row._id,
        row.propertyTitle,
        row.transactionType,
        row.stage,
        row.totalServiceFee,
        row.financialBreakdown?.agencyAmount ?? 0,
        row.financialBreakdown?.agentPoolAmount ?? 0,
        row.listingAgentId,
        row.sellingAgentId,
        row.createdAt,
        row.updatedAt
      ])
    );
  }

  async exportClientsCsv(
    query: ReportQueryDto,
    organizationId: string,
    role: AgentRole
  ): Promise<string> {
    this.assertCanExport(role);
    const match: FilterQuery<Client> = {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null,
      ...this.createdAtRange(query)
    };
    const rows = await this.clientModel.find(match).sort({ createdAt: -1, _id: -1 }).limit(5000).lean().exec();

    return this.toCsv(
      ['id', 'full_name', 'email', 'phone', 'type', 'created_at', 'updated_at'],
      rows.map((row) => [
        row._id,
        row.fullName,
        row.email,
        row.phone,
        row.type,
        row.createdAt,
        row.updatedAt
      ])
    );
  }

  async exportPropertiesCsv(
    query: ReportQueryDto,
    organizationId: string,
    role: AgentRole
  ): Promise<string> {
    this.assertCanExport(role);
    const match: FilterQuery<Property> = {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null,
      ...this.createdAtRange(query),
      ...(query.propertyListingType ? { listingType: query.propertyListingType } : {}),
      ...(this.isPropertyStatus(query.status) ? { status: query.status } : {})
    };
    const rows = await this.propertyModel
      .find(match)
      .sort({ createdAt: -1, _id: -1 })
      .limit(5000)
      .lean()
      .exec();

    return this.toCsv(
      [
        'id',
        'title',
        'type',
        'listing_type',
        'status',
        'city',
        'district',
        'price',
        'currency',
        'created_at',
        'updated_at'
      ],
      rows.map((row) => [
        row._id,
        row.title,
        row.type,
        row.listingType,
        row.status,
        row.city,
        row.district,
        row.price ?? '',
        row.currency,
        row.createdAt,
        row.updatedAt
      ])
    );
  }

  async exportTasksCsv(
    query: ReportQueryDto,
    organizationId: string,
    role: AgentRole
  ): Promise<string> {
    this.assertCanExport(role);
    const rows = await this.taskModel
      .find(this.buildTaskMatch(query, new Types.ObjectId(organizationId)))
      .sort({ dueDate: 1, createdAt: -1, _id: -1 })
      .limit(5000)
      .lean()
      .exec();

    return this.toCsv(
      [
        'id',
        'title',
        'status',
        'priority',
        'due_date',
        'assigned_to',
        'related_transaction_id',
        'related_client_id',
        'related_property_id',
        'created_at',
        'updated_at'
      ],
      rows.map((row) => [
        row._id,
        row.title,
        row.status,
        row.priority,
        row.dueDate ?? '',
        row.assignedTo ?? '',
        row.relatedTransactionId ?? '',
        row.relatedClientId ?? '',
        row.relatedPropertyId ?? '',
        row.createdAt,
        row.updatedAt
      ])
    );
  }

  async exportCommissionsCsv(
    query: ReportQueryDto,
    organizationId: string,
    role: AgentRole
  ): Promise<string> {
    this.assertCanExport(role);
    const match = await this.buildTransactionMatch(query, new Types.ObjectId(organizationId));
    const rows = await this.agentPerformance(match, new Types.ObjectId(organizationId));

    return this.toCsv(
      [
        'agent_id',
        'agent_name',
        'closed_deals',
        'total_commission_earnings',
        'total_commission_earnings_cents'
      ],
      rows.map((row) => [
        row.agentId,
        row.agentName,
        row.closedDeals,
        row.totalCommissionEarnings,
        row.totalCommissionEarningsCents
      ])
    );
  }

  private resolveQueryForRole(query: ReportQueryDto, context: ReportSessionContext): ReportQueryDto {
    if (FULL_REPORT_ROLES.includes(context.currentAgentRole) || FINANCE_REPORT_ROLES.includes(context.currentAgentRole)) {
      return query;
    }

    if (AGENT_REPORT_ROLES.includes(context.currentAgentRole)) {
      return {
        ...query,
        agentId: context.currentAgentId
      };
    }

    if (BASIC_REPORT_ROLES.includes(context.currentAgentRole)) {
      return {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        transactionType: query.transactionType,
        transactionStage: query.transactionStage,
        propertyListingType: query.propertyListingType,
        status: query.status
      };
    }

    throw new ForbiddenException('Insufficient permissions for reports.');
  }

  private assertCanExport(role: AgentRole): void {
    if (![...FULL_REPORT_ROLES, ...FINANCE_REPORT_ROLES].includes(role)) {
      throw new ForbiddenException('Insufficient permissions for report exports.');
    }
  }

  private async buildTransactionMatch(
    query: ReportQueryDto,
    organizationId: Types.ObjectId
  ): Promise<FilterQuery<Transaction>> {
    const match: FilterQuery<Transaction> = {
      organizationId,
      isDeleted: false,
      ...this.createdAtRange(query),
      ...(query.transactionType ? { transactionType: query.transactionType } : {}),
      ...(query.transactionStage ? { stage: query.transactionStage } : {})
    };

    if (query.agentId) {
      const agentObjectId = new Types.ObjectId(query.agentId);
      match.$or = [
        { listingAgentId: agentObjectId },
        { sellingAgentId: agentObjectId },
        { 'financialBreakdown.agents.agentId': agentObjectId }
      ];
    }

    if (query.propertyListingType) {
      const propertyIds = await this.propertyModel
        .distinct('_id', {
          organizationId,
          deletedAt: null,
          listingType: query.propertyListingType
        })
        .exec();
      match.propertyId = { $in: propertyIds };
    }

    return match;
  }

  private buildTaskMatch(query: ReportQueryDto, organizationId: Types.ObjectId): FilterQuery<Task> {
    return {
      organizationId,
      deletedAt: null,
      ...this.createdAtRange(query),
      ...(query.agentId ? { assignedTo: new Types.ObjectId(query.agentId) } : {}),
      ...(this.isTaskStatus(query.status) ? { status: query.status } : {})
    };
  }

  private createdAtRange(query: ReportQueryDto): FilterQuery<{ createdAt: Date }> {
    const range: { $gte?: Date; $lte?: Date } = {};

    if (query.dateFrom) {
      range.$gte = this.startOfDay(new Date(query.dateFrom));
    }

    if (query.dateTo) {
      range.$lte = this.endOfDay(new Date(query.dateTo));
    }

    return Object.keys(range).length > 0 ? { createdAt: range } : {};
  }

  private async countBy(
    model: Model<unknown>,
    match: FilterQuery<unknown>,
    field: string
  ): Promise<CountItem[]> {
    const rows = await model
      .aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: field, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
      .exec();

    return rows.map((row) => ({ key: row._id, count: row.count }));
  }

  private async completedDealsOverTime(match: FilterQuery<Transaction>): Promise<TrendItem[]> {
    const rows = await this.transactionModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { ...match, stage: TransactionStage.COMPLETED } },
        { $group: { _id: this.monthExpression(), count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
      .exec();

    return rows.map((row) => ({ period: row._id, count: row.count }));
  }

  private async totalServiceFeeOverTime(match: FilterQuery<Transaction>): Promise<TrendItem[]> {
    const rows = await this.transactionModel
      .aggregate<{ _id: string; totalServiceFee: number }>([
        { $match: match },
        { $group: { _id: this.monthExpression(), totalServiceFee: { $sum: '$totalServiceFee' } } },
        { $sort: { _id: 1 } }
      ])
      .exec();

    return rows.map((row) => ({ period: row._id, totalServiceFee: row.totalServiceFee }));
  }

  private async agentPerformance(
    match: FilterQuery<Transaction>,
    organizationId: Types.ObjectId
  ): Promise<AgentPerformanceItem[]> {
    const commissionRows = await this.transactionModel
      .aggregate<{ _id: Types.ObjectId; totalCommissionEarnings: number }>([
        { $match: { ...match, stage: TransactionStage.COMPLETED } },
        { $unwind: '$financialBreakdown.agents' },
        {
          $group: {
            _id: '$financialBreakdown.agents.agentId',
            totalCommissionEarnings: { $sum: '$financialBreakdown.agents.amount' }
          }
        }
      ])
      .exec();

    const closedRows = await this.transactionModel
      .aggregate<{ _id: Types.ObjectId; closedDeals: number }>([
        { $match: { ...match, stage: TransactionStage.COMPLETED } },
        {
          $project: {
            agents: { $setUnion: [['$listingAgentId'], ['$sellingAgentId']] }
          }
        },
        { $unwind: '$agents' },
        { $group: { _id: '$agents', closedDeals: { $sum: 1 } } }
      ])
      .exec();

    const ids = Array.from(
      new Set([
        ...commissionRows.map((row) => row._id.toString()),
        ...closedRows.map((row) => row._id.toString())
      ])
    );
    const agents = ids.length
      ? await this.agentModel
          .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) }, organizationId })
          .select('name email')
          .lean()
          .exec()
      : [];
    const nameById = new Map(agents.map((agent) => [agent._id.toString(), agent.name || agent.email]));
    const closedById = new Map(closedRows.map((row) => [row._id.toString(), row.closedDeals]));
    const earningsById = new Map(
      commissionRows.map((row) => [row._id.toString(), row.totalCommissionEarnings])
    );

    return ids
      .map((id) => {
        const earnings = earningsById.get(id) ?? 0;
        return {
          agentId: id,
          agentName: nameById.get(id) ?? id,
          closedDeals: closedById.get(id) ?? 0,
          totalCommissionEarnings: earnings,
          totalCommissionEarningsCents: this.toCents(earnings)
        };
      })
      .sort((left, right) => {
        if (right.closedDeals !== left.closedDeals) {
          return right.closedDeals - left.closedDeals;
        }
        return right.totalCommissionEarningsCents - left.totalCommissionEarningsCents;
      })
      .slice(0, 10);
  }

  private async taskSummary(match: FilterQuery<Task>): Promise<ReportSummary['taskSummary']> {
    const now = this.startOfDay(new Date());
    const [pending, completed, overdue] = await Promise.all([
      this.taskModel.countDocuments({ ...match, status: { $in: OPEN_TASK_STATUSES } }).exec(),
      this.taskModel.countDocuments({ ...match, status: TaskStatus.DONE }).exec(),
      this.taskModel
        .countDocuments({
          ...match,
          status: { $in: OPEN_TASK_STATUSES },
          dueDate: { $lt: now }
        })
        .exec()
    ]);

    return { pending, completed, overdue };
  }

  private async recentActivity(organizationId: Types.ObjectId): Promise<ActivityItem[]> {
    const [transactions, tasks, notes, ledger] = await Promise.all([
      this.transactionModel
        .find({ organizationId, isDeleted: false })
        .select('propertyTitle createdAt createdBy')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      this.taskModel
        .find({ organizationId, deletedAt: null })
        .select('title createdAt createdBy')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      this.transactionNoteModel
        .find({ organizationId, deletedAt: null })
        .select('content createdAt authorId')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      this.balanceLedgerModel
        .find({ organizationId })
        .select('description createdAt createdBy')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec()
    ]);

    return [
      ...transactions.map((item) => ({
        type: 'transaction' as const,
        title: `Transaction: ${item.propertyTitle}`,
        occurredAt: new Date(item.createdAt).toISOString(),
        actorId: item.createdBy?.toString() ?? null
      })),
      ...tasks.map((item) => ({
        type: 'task' as const,
        title: `Task: ${item.title}`,
        occurredAt: new Date(item.createdAt).toISOString(),
        actorId: item.createdBy?.toString() ?? null
      })),
      ...notes.map((item) => ({
        type: 'note' as const,
        title: `Note: ${item.content.slice(0, 80)}`,
        occurredAt: new Date(item.createdAt).toISOString(),
        actorId: item.authorId?.toString() ?? null
      })),
      ...ledger.map((item) => ({
        type: 'balance' as const,
        title: `Balance: ${item.description}`,
        occurredAt: new Date(item.createdAt).toISOString(),
        actorId: item.createdBy?.toString() ?? null
      }))
    ]
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 12);
  }

  private async commissionSummary(
    match: FilterQuery<Transaction>
  ): Promise<ReportSummary['commissionSummary']> {
    const rows = await this.transactionModel
      .aggregate<{
        _id: null;
        agencyTotal: number;
        agentPoolTotal: number;
        agentEarningsTotal: number;
      }>([
        { $match: { ...match, stage: TransactionStage.COMPLETED } },
        {
          $group: {
            _id: null,
            agencyTotal: { $sum: '$financialBreakdown.agencyAmount' },
            agentPoolTotal: { $sum: '$financialBreakdown.agentPoolAmount' },
            agentEarningsTotal: { $sum: { $sum: '$financialBreakdown.agents.amount' } }
          }
        }
      ])
      .exec();

    const row = rows[0] ?? {
      agencyTotal: 0,
      agentPoolTotal: 0,
      agentEarningsTotal: 0
    };

    return {
      agencyTotal: row.agencyTotal,
      agencyTotalCents: this.toCents(row.agencyTotal),
      agentPoolTotal: row.agentPoolTotal,
      agentPoolTotalCents: this.toCents(row.agentPoolTotal),
      agentEarningsTotal: row.agentEarningsTotal,
      agentEarningsTotalCents: this.toCents(row.agentEarningsTotal)
    };
  }

  private async sumTransactionServiceFee(match: FilterQuery<Transaction>): Promise<number> {
    const rows = await this.transactionModel
      .aggregate<{ _id: null; total: number }>([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$totalServiceFee' } } }
      ])
      .exec();
    return rows[0]?.total ?? 0;
  }

  private emptyCommissionSummary(): ReportSummary['commissionSummary'] {
    return {
      agencyTotal: 0,
      agencyTotalCents: 0,
      agentPoolTotal: 0,
      agentPoolTotalCents: 0,
      agentEarningsTotal: 0,
      agentEarningsTotalCents: 0
    };
  }

  private monthExpression(): PipelineStage.Group['$group']['_id'] {
    return {
      $dateToString: {
        format: '%Y-%m',
        date: '$createdAt'
      }
    };
  }

  private toFilterView(query: ReportQueryDto): ReportSummary['filters'] {
    return {
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
      agentId: query.agentId ?? null,
      transactionType: query.transactionType ?? null,
      transactionStage: query.transactionStage ?? null,
      propertyListingType: query.propertyListingType ?? null,
      status: query.status ?? null
    };
  }

  private toCsv(headers: string[], rows: unknown[][]): string {
    return [
      headers.join(','),
      ...rows.map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
    ].join('\n');
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const normalizedValue =
      value instanceof Date ? value.toISOString() : value && typeof value === 'object' && 'toString' in value ? value.toString() : String(value);
    if (/[",\n\r]/.test(normalizedValue)) {
      return `"${normalizedValue.replace(/"/g, '""')}"`;
    }

    return normalizedValue;
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private endOfDay(value: Date): Date {
    const nextDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    nextDate.setHours(23, 59, 59, 999);
    return nextDate;
  }

  private toCents(value: number): number {
    return Math.round((value + Number.EPSILON) * 100);
  }

  private isTaskStatus(status: ReportQueryDto['status']): status is TaskStatus {
    return Boolean(status && Object.values(TaskStatus).includes(status as TaskStatus));
  }

  private isPropertyStatus(status: ReportQueryDto['status']): status is PropertyStatus {
    return Boolean(status && Object.values(PropertyStatus).includes(status as PropertyStatus));
  }
}
