import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { canManageBalances } from '@/common/auth/role-permissions';
import { Agent, AgentDocument, AgentRole } from '@/modules/agents/schemas/agent.schema';
import { BalanceLedgerType } from '@/modules/balance/domain/balance-ledger-type.enum';
import { ListBalanceLedgerQueryDto } from '@/modules/balance/dto/list-balance-ledger-query.dto';
import { ManualBalanceAdjustmentDto } from '@/modules/balance/dto/manual-balance-adjustment.dto';
import {
  BalanceLedger,
  BalanceLedgerDocument
} from '@/modules/balance/schemas/balance-ledger.schema';
import { Transaction, TransactionDocument } from '@/modules/transactions/schemas/transaction.schema';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';

type CommissionAllocation = {
  agentId: string | Types.ObjectId;
  amount: number;
  role: string;
};

type LedgerViewSource = {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  transactionId?: Types.ObjectId | string | null;
  type: BalanceLedgerType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
  createdAt?: Date | string;
  createdBy: Types.ObjectId | string;
  organizationId?: Types.ObjectId | string;
};

export interface BalanceLedgerItemView {
  id: string;
  userId: string;
  transactionId: string | null;
  type: BalanceLedgerType;
  amount: number;
  amountCents: number;
  previousBalance: number;
  previousBalanceCents: number;
  newBalance: number;
  newBalanceCents: number;
  description: string;
  createdAt: string;
  createdBy: string;
  organizationId: string | null;
}

export interface PaginatedBalanceLedgerResult {
  items: BalanceLedgerItemView[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BalanceSummaryResult {
  userId: string;
  balance: number;
  balanceCents: number;
  totalEarned: number;
  totalEarnedCents: number;
  recentLedgerEntries: BalanceLedgerItemView[];
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_RECENT_LEDGER_LIMIT = 8;

@Injectable()
export class BalanceService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
    @InjectModel(BalanceLedger.name)
    private readonly balanceLedgerModel: Model<BalanceLedgerDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>
  ) {}

  async getMyBalance(agentId: string, organizationId: string): Promise<BalanceSummaryResult> {
    this.validateObjectId(agentId, 'agentId');
    this.validateObjectId(organizationId, 'organizationId');
    const organizationObjectId = new Types.ObjectId(organizationId);

    const [agent, recentEntries, totalEarnedResult] = await Promise.all([
      this.agentModel
        .findOne({ _id: agentId, organizationId: organizationObjectId })
        .select('_id balanceCents')
        .lean()
        .exec(),
      this.balanceLedgerModel
        .find({ userId: new Types.ObjectId(agentId), organizationId: organizationObjectId })
        .sort({ createdAt: -1 })
        .limit(DEFAULT_RECENT_LEDGER_LIMIT)
        .lean()
        .exec(),
      this.balanceLedgerModel
        .aggregate<{ totalEarnedCents: number }>([
          {
            $match: {
              userId: new Types.ObjectId(agentId),
              organizationId: organizationObjectId,
              type: BalanceLedgerType.COMMISSION_CREDIT
            }
          },
          {
            $group: {
              _id: null,
              totalEarnedCents: { $sum: '$amount' }
            }
          }
        ])
        .exec()
    ]);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const totalEarnedCents = totalEarnedResult[0]?.totalEarnedCents ?? 0;

    return {
      userId: agent._id.toString(),
      balance: this.fromCents(agent.balanceCents ?? 0),
      balanceCents: agent.balanceCents ?? 0,
      totalEarned: this.fromCents(totalEarnedCents),
      totalEarnedCents,
      recentLedgerEntries: recentEntries.map((entry) =>
        this.toLedgerView(entry as unknown as LedgerViewSource)
      )
    };
  }

  async getMyLedger(
    agentId: string,
    organizationId: string,
    query: ListBalanceLedgerQueryDto
  ): Promise<PaginatedBalanceLedgerResult> {
    this.validateObjectId(agentId, 'agentId');
    this.validateObjectId(organizationId, 'organizationId');

    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const filter = this.buildLedgerFilter(agentId, organizationId, query);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.balanceLedgerModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean().exec(),
      this.balanceLedgerModel.countDocuments(filter).exec()
    ]);

    return {
      items: entries.map((entry) => this.toLedgerView(entry as unknown as LedgerViewSource)),
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit)
    };
  }

  async getAgentBalanceForViewer(
    viewerAgentId: string,
    viewerRole: AgentRole,
    organizationId: string,
    targetAgentId: string
  ): Promise<BalanceSummaryResult> {
    this.assertPrivilegedViewer(viewerRole);
    this.validateObjectId(viewerAgentId, 'viewerAgentId');
    this.validateObjectId(targetAgentId, 'targetAgentId');
    this.validateObjectId(organizationId, 'organizationId');

    return this.getMyBalance(targetAgentId, organizationId);
  }

  async createManualAdjustment(
    viewerAgentId: string,
    viewerRole: AgentRole,
    organizationId: string,
    payload: ManualBalanceAdjustmentDto
  ): Promise<{
    userId: string;
    balance: number;
    balanceCents: number;
    ledgerEntry: BalanceLedgerItemView;
  }> {
    this.assertPrivilegedViewer(viewerRole);
    this.validateObjectId(viewerAgentId, 'viewerAgentId');
    this.validateObjectId(organizationId, 'organizationId');
    this.validateObjectId(payload.userId, 'userId');
    const organizationObjectId = new Types.ObjectId(organizationId);

    const amountCents = this.toCents(payload.amount, 'amount');
    if (amountCents === 0) {
      throw new BadRequestException('amount cannot be zero.');
    }

    const updatedAgent = await this.agentModel
      .findOneAndUpdate(
        {
          _id: payload.userId,
          organizationId: organizationObjectId
        },
        {
          $inc: {
            balanceCents: amountCents
          }
        },
        {
          new: true,
          runValidators: true
        }
      )
      .select('_id balanceCents')
      .exec();

    if (!updatedAgent) {
      throw new NotFoundException('Agent not found');
    }

    const previousBalanceCents = updatedAgent.balanceCents - amountCents;
    const transactionObjectId = payload.transactionId ? new Types.ObjectId(payload.transactionId) : null;
    const ledgerType =
      amountCents < 0 ? BalanceLedgerType.REVERSAL : BalanceLedgerType.MANUAL_ADJUSTMENT;

    const ledgerEntry = await this.balanceLedgerModel.create({
      organizationId: organizationObjectId,
      userId: new Types.ObjectId(payload.userId),
      transactionId: transactionObjectId,
      type: ledgerType,
      amount: amountCents,
      previousBalance: previousBalanceCents,
      newBalance: updatedAgent.balanceCents,
      description: payload.description.trim(),
      createdBy: new Types.ObjectId(viewerAgentId)
    });

    return {
      userId: payload.userId,
      balance: this.fromCents(updatedAgent.balanceCents),
      balanceCents: updatedAgent.balanceCents,
      ledgerEntry: this.toLedgerView(ledgerEntry.toObject())
    };
  }

  async applyCommissionCreditsForCompletedTransaction(params: {
    transactionId: string;
    actorAgentId: string;
    organizationId: string;
    allocations: CommissionAllocation[];
  }): Promise<{ applied: boolean; ledgerIds: string[] }> {
    this.validateObjectId(params.transactionId, 'transactionId');
    this.validateObjectId(params.actorAgentId, 'actorAgentId');
    this.validateObjectId(params.organizationId, 'organizationId');
    const organizationObjectId = new Types.ObjectId(params.organizationId);

    const normalizedAllocations = params.allocations
      .map((allocation) => {
        const agentId = allocation.agentId.toString();
        this.validateObjectId(agentId, 'allocation.agentId');
        const amountCents = this.toCents(allocation.amount, 'allocation.amount');

        return {
          agentId,
          amountCents
        };
      })
      .filter((allocation) => allocation.amountCents !== 0);

    const uniqueAgentIds = Array.from(
      new Set(normalizedAllocations.map((allocation) => allocation.agentId))
    );
    if (uniqueAgentIds.length > 0) {
      const existingAgents = await this.agentModel
        .find({
          _id: {
            $in: uniqueAgentIds.map((agentId) => new Types.ObjectId(agentId))
          },
          organizationId: organizationObjectId
        })
        .select('_id')
        .lean()
        .exec();

      const existingAgentIdSet = new Set(existingAgents.map((agent) => agent._id.toString()));
      const missingAgentId = uniqueAgentIds.find((agentId) => !existingAgentIdSet.has(agentId));
      if (missingAgentId) {
        throw new NotFoundException(`Agent not found: ${missingAgentId}`);
      }
    }

    const appliedAt = new Date();
    const claimedTransaction = await this.transactionModel
      .findOneAndUpdate(
        {
          _id: params.transactionId,
          organizationId: organizationObjectId,
          stage: TransactionStage.COMPLETED,
          balanceDistributionApplied: false
        },
        {
          $set: {
            balanceDistributionApplied: true,
            balanceDistributionAppliedAt: appliedAt,
            balanceDistributionAppliedBy: new Types.ObjectId(params.actorAgentId)
          }
        },
        {
          new: true
        }
      )
      .select('_id')
      .exec();

    if (!claimedTransaction) {
      return {
        applied: false,
        ledgerIds: []
      };
    }

    const ledgerIds: Types.ObjectId[] = [];
    const appliedAdjustments: Array<{ agentId: string; amountCents: number; ledgerId: Types.ObjectId }> = [];

    try {
      for (const allocation of normalizedAllocations) {
        const updatedAgent = await this.agentModel
          .findOneAndUpdate(
            {
              _id: allocation.agentId,
              organizationId: organizationObjectId
            },
            {
              $inc: {
                balanceCents: allocation.amountCents
              }
            },
            {
              new: true,
              runValidators: true
            }
          )
          .select('_id balanceCents')
          .exec();

        if (!updatedAgent) {
          throw new NotFoundException(`Agent not found: ${allocation.agentId}`);
        }

        const previousBalanceCents = updatedAgent.balanceCents - allocation.amountCents;
        const ledgerEntry = await this.balanceLedgerModel.create({
          organizationId: organizationObjectId,
          userId: new Types.ObjectId(allocation.agentId),
          transactionId: new Types.ObjectId(params.transactionId),
          type: BalanceLedgerType.COMMISSION_CREDIT,
          amount: allocation.amountCents,
          previousBalance: previousBalanceCents,
          newBalance: updatedAgent.balanceCents,
          description: `Commission credit from completed transaction ${params.transactionId}`,
          createdBy: new Types.ObjectId(params.actorAgentId)
        });

        appliedAdjustments.push({
          agentId: allocation.agentId,
          amountCents: allocation.amountCents,
          ledgerId: ledgerEntry._id
        });
        ledgerIds.push(ledgerEntry._id);
      }

      await this.transactionModel
        .findOneAndUpdate(
          {
            _id: params.transactionId,
            organizationId: organizationObjectId
          },
          {
            $set: {
              balanceDistributionLedgerIds: ledgerIds
            }
          }
        )
        .exec();
    } catch (error) {
      // Best-effort compensation for partial failures without DB-level transactions.
      await Promise.all(
        appliedAdjustments.map((adjustment) =>
          this.agentModel
            .findOneAndUpdate(
              {
                _id: adjustment.agentId,
                organizationId: organizationObjectId
              },
              {
                $inc: {
                  balanceCents: -adjustment.amountCents
                }
              }
            )
            .exec()
        )
      );

      if (appliedAdjustments.length > 0) {
        await this.balanceLedgerModel
          .deleteMany({
            organizationId: organizationObjectId,
            _id: {
              $in: appliedAdjustments.map((adjustment) => adjustment.ledgerId)
            }
          })
          .exec();
      }

      await this.transactionModel
        .findOneAndUpdate(
          {
            _id: params.transactionId,
            organizationId: organizationObjectId
          },
          {
            $set: {
              balanceDistributionApplied: false,
              balanceDistributionAppliedAt: null,
              balanceDistributionAppliedBy: null,
              balanceDistributionLedgerIds: []
            }
          }
        )
        .exec();

      throw error;
    }

    return {
      applied: true,
      ledgerIds: ledgerIds.map((ledgerId) => ledgerId.toString())
    };
  }

  private buildLedgerFilter(
    agentId: string,
    organizationId: string,
    query: ListBalanceLedgerQueryDto
  ): FilterQuery<BalanceLedger> {
    const filter: FilterQuery<BalanceLedger> = {
      userId: new Types.ObjectId(agentId),
      organizationId: new Types.ObjectId(organizationId)
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.dateFrom || query.dateTo) {
      const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
      const dateTo = query.dateTo ? new Date(query.dateTo) : null;

      if (dateFrom && Number.isNaN(dateFrom.getTime())) {
        throw new BadRequestException('dateFrom must be a valid date string.');
      }

      if (dateTo && Number.isNaN(dateTo.getTime())) {
        throw new BadRequestException('dateTo must be a valid date string.');
      }

      if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
        throw new BadRequestException('dateFrom cannot be after dateTo.');
      }

      filter.createdAt = {
        ...(dateFrom ? { $gte: dateFrom } : {}),
        ...(dateTo ? { $lte: dateTo } : {})
      };
    }

    return filter;
  }

  private toLedgerView(ledger: LedgerViewSource | BalanceLedgerDocument): BalanceLedgerItemView {
    const amountCents = Math.trunc(Number(ledger.amount));
    const previousBalanceCents = Math.trunc(Number(ledger.previousBalance));
    const newBalanceCents = Math.trunc(Number(ledger.newBalance));
    const createdAt = ledger.createdAt ? new Date(ledger.createdAt) : new Date();

    return {
      id: ledger._id.toString(),
      userId: ledger.userId.toString(),
      transactionId: ledger.transactionId ? ledger.transactionId.toString() : null,
      type: ledger.type,
      amount: this.fromCents(amountCents),
      amountCents,
      previousBalance: this.fromCents(previousBalanceCents),
      previousBalanceCents,
      newBalance: this.fromCents(newBalanceCents),
      newBalanceCents,
      description: ledger.description,
      createdAt: createdAt.toISOString(),
      createdBy: ledger.createdBy.toString(),
      organizationId: ledger.organizationId ? ledger.organizationId.toString() : null
    };
  }

  private fromCents(value: number): number {
    return Math.trunc(value) / 100;
  }

  private toCents(value: number, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException(`${fieldName} must be a finite number.`);
    }

    return Math.round(value * 100);
  }

  private assertPrivilegedViewer(role: AgentRole): void {
    if (!canManageBalances(role)) {
      throw new ForbiddenException('Insufficient permissions for balance access.');
    }
  }

  private validateObjectId(value: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${fieldName} must be a valid MongoDB ObjectId`);
    }
  }
}
