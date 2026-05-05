import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { AgentsService } from '@/modules/agents/services/agents.service';
import { BalanceService } from '@/modules/balance/services/balance.service';
import { ClientsService } from '@/modules/clients/services/clients.service';
import { CommissionCalculatorService } from '@/modules/commissions/commission-calculator.service';
import { PropertiesService } from '@/modules/properties/services/properties.service';
import { StageTransitionPolicyService } from '@/modules/stage-policy/stage-transition-policy.service';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { CreateTransactionDto } from '@/modules/transactions/dto/create-transaction.dto';
import {
  ListTransactionsQueryDto,
  TransactionSortByField
} from '@/modules/transactions/dto/list-transactions-query.dto';
import { UpdateTransactionDto } from '@/modules/transactions/dto/update-transaction.dto';
import {
  Transaction,
  TransactionDocument
} from '@/modules/transactions/schemas/transaction.schema';
import { TransactionMutationPolicyService } from '@/modules/transactions/services/transaction-mutation-policy.service';

export interface CompletedAgentEarningsSummaryItem {
  agentId: string;
  earnings: number;
}

export interface CompletedTransactionEarningsSummary {
  totalAgencyEarnings: number;
  totalAgentEarnings: number;
  byAgent: CompletedAgentEarningsSummaryItem[];
}

export interface PaginatedTransactionsResult {
  items: TransactionDocument[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const SORT_DIRECTION_BY_ORDER = {
  asc: 1,
  desc: -1
} as const;
const SORT_FIELD_BY_OPTION: Record<TransactionSortByField, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  totalServiceFee: 'totalServiceFee',
  propertyTitle: 'propertyTitle'
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly agentsService: AgentsService,
    private readonly balanceService: BalanceService,
    private readonly clientsService: ClientsService,
    private readonly propertiesService: PropertiesService,
    private readonly commissionCalculatorService: CommissionCalculatorService,
    private readonly stageTransitionPolicyService: StageTransitionPolicyService,
    private readonly transactionMutationPolicyService: TransactionMutationPolicyService
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    creatorAgentId: string,
    organizationId: string
  ): Promise<TransactionDocument> {
    const initialStage = this.stageTransitionPolicyService.resolveInitialStageForCreate(
      createTransactionDto.stage
    );

    await this.agentsService.ensureAgentExists(createTransactionDto.listingAgentId, organizationId);
    await this.agentsService.ensureAgentExists(createTransactionDto.sellingAgentId, organizationId);
    await this.propertiesService.ensurePropertyBelongsToOrganization(
      createTransactionDto.propertyId,
      organizationId
    );
    await this.clientsService.ensureClientsBelongToOrganization(
      createTransactionDto.clientIds,
      organizationId
    );

    const financialBreakdown = this.commissionCalculatorService.calculate({
      totalServiceFee: createTransactionDto.totalServiceFee,
      listingAgentId: createTransactionDto.listingAgentId,
      sellingAgentId: createTransactionDto.sellingAgentId
    });

    const stageHistory = [
      this.createStageHistoryEntry({
        fromStage: null,
        toStage: initialStage,
        changedBy: creatorAgentId
      })
    ];

    return this.transactionModel.create({
      ...createTransactionDto,
      propertyId: createTransactionDto.propertyId
        ? new Types.ObjectId(createTransactionDto.propertyId)
        : null,
      clientIds: (createTransactionDto.clientIds ?? []).map(
        (clientId) => new Types.ObjectId(clientId)
      ),
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(creatorAgentId),
      stage: initialStage,
      financialBreakdown,
      stageHistory,
      balanceDistributionApplied: false,
      balanceDistributionAppliedAt: null,
      balanceDistributionAppliedBy: null,
      balanceDistributionLedgerIds: []
    });
  }

  async findAll(
    query: ListTransactionsQueryDto,
    organizationId: string
  ): Promise<PaginatedTransactionsResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const normalizedSearch = query.search?.trim() ?? '';
    const filter = await this.buildFilter(query, normalizedSearch, organizationId);
    const sort = this.resolveSort(query.sortBy, query.sortOrder);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.withPopulation(this.transactionModel.find(filter))
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec()
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit)
    };
  }

  async findOne(id: string, organizationId: string): Promise<TransactionDocument> {
    this.validateObjectId(id, 'transactionId');

    const transaction = await this.withPopulation(
      this.transactionModel.findOne({
        _id: id,
        organizationId: new Types.ObjectId(organizationId)
      })
    ).exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    actorAgentId: string,
    organizationId: string
  ): Promise<TransactionDocument> {
    this.validateObjectId(id, 'transactionId');

    const tenantFilter = {
      _id: id,
      organizationId: new Types.ObjectId(organizationId)
    };
    const existingTransaction = await this.transactionModel.findOne(tenantFilter).exec();
    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.transactionMutationPolicyService.assertNotDeleted(existingTransaction);
    this.transactionMutationPolicyService.assertCanMutate(existingTransaction, actorAgentId);
    this.transactionMutationPolicyService.assertNotCompleted(existingTransaction);
    this.transactionMutationPolicyService.assertValidUpdatePayloadForCurrentStage(
      existingTransaction,
      updateTransactionDto
    );

    if (updateTransactionDto.listingAgentId) {
      await this.agentsService.ensureAgentExists(
        updateTransactionDto.listingAgentId,
        organizationId
      );
    }

    if (updateTransactionDto.sellingAgentId) {
      await this.agentsService.ensureAgentExists(
        updateTransactionDto.sellingAgentId,
        organizationId
      );
    }

    if (updateTransactionDto.propertyId !== undefined) {
      await this.propertiesService.ensurePropertyBelongsToOrganization(
        updateTransactionDto.propertyId,
        organizationId
      );
    }

    if (updateTransactionDto.clientIds !== undefined) {
      await this.clientsService.ensureClientsBelongToOrganization(
        updateTransactionDto.clientIds,
        organizationId
      );
    }

    const listingAgentId =
      updateTransactionDto.listingAgentId ?? existingTransaction.listingAgentId.toString();
    const sellingAgentId =
      updateTransactionDto.sellingAgentId ?? existingTransaction.sellingAgentId.toString();
    const totalServiceFee =
      updateTransactionDto.totalServiceFee ?? existingTransaction.totalServiceFee;

    const financialBreakdown = this.commissionCalculatorService.calculate({
      totalServiceFee,
      listingAgentId,
      sellingAgentId
    });

    const updatedTransaction = await this.withPopulation(
      this.transactionModel.findOneAndUpdate(
        tenantFilter,
        {
          ...updateTransactionDto,
          ...(updateTransactionDto.propertyId !== undefined
            ? {
                propertyId: updateTransactionDto.propertyId
                  ? new Types.ObjectId(updateTransactionDto.propertyId)
                  : null
              }
            : {}),
          ...(updateTransactionDto.clientIds !== undefined
            ? {
                clientIds: updateTransactionDto.clientIds.map(
                  (clientId) => new Types.ObjectId(clientId)
                )
              }
            : {}),
          financialBreakdown,
          updatedBy: new Types.ObjectId(actorAgentId)
        },
        {
          new: true,
          runValidators: true
        }
      )
    ).exec();

    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    return updatedTransaction;
  }

  async updateStage(
    id: string,
    stage: TransactionStage,
    actorAgentId: string,
    organizationId: string
  ): Promise<TransactionDocument> {
    this.validateObjectId(id, 'transactionId');

    const existingTransaction = await this.transactionModel
      .findOne({
        _id: id,
        organizationId: new Types.ObjectId(organizationId)
      })
      .exec();
    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.transactionMutationPolicyService.assertNotDeleted(existingTransaction);
    this.transactionMutationPolicyService.assertCanMutate(existingTransaction, actorAgentId);
    this.transactionMutationPolicyService.assertNotCompleted(existingTransaction);
    this.stageTransitionPolicyService.assertValidTransition(existingTransaction.stage, stage);

    const stageHistoryEntry = this.createStageHistoryEntry({
      fromStage: existingTransaction.stage,
      toStage: stage,
      changedBy: actorAgentId
    });

    const updatedTransaction = await this.withPopulation(
      this.transactionModel.findOneAndUpdate(
        {
          _id: id,
          organizationId: new Types.ObjectId(organizationId)
        },
        {
          stage,
          updatedBy: new Types.ObjectId(actorAgentId),
          $push: { stageHistory: stageHistoryEntry }
        },
        { new: true, runValidators: true }
      )
    ).exec();

    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (stage === TransactionStage.COMPLETED) {
      await this.balanceService.applyCommissionCreditsForCompletedTransaction({
        transactionId: id,
        actorAgentId,
        organizationId,
        allocations: updatedTransaction.financialBreakdown.agents.map((allocation) => ({
          agentId: allocation.agentId.toString(),
          amount: allocation.amount,
          role: allocation.role
        }))
      });

      const refreshedTransaction = await this.withPopulation(
        this.transactionModel.findOne({
          _id: id,
          organizationId: new Types.ObjectId(organizationId)
        })
      ).exec();

      if (!refreshedTransaction) {
        throw new NotFoundException('Transaction not found');
      }

      return refreshedTransaction;
    }

    return updatedTransaction;
  }

  async remove(
    id: string,
    actorAgentId: string,
    actorRole: AgentRole,
    organizationId: string
  ): Promise<void> {
    this.validateObjectId(id, 'transactionId');

    const existingTransaction = await this.transactionModel
      .findOne({
        _id: id,
        organizationId: new Types.ObjectId(organizationId)
      })
      .exec();
    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.transactionMutationPolicyService.assertNotDeleted(existingTransaction);
    this.transactionMutationPolicyService.assertCanDelete(
      existingTransaction,
      actorAgentId,
      actorRole
    );

    await this.transactionModel
      .findOneAndUpdate(
        {
          _id: id,
          organizationId: new Types.ObjectId(organizationId)
        },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(actorAgentId),
          updatedBy: new Types.ObjectId(actorAgentId)
        },
        { new: false }
      )
      .exec();
  }

  async getCompletedEarningsSummary(
    organizationId: string
  ): Promise<CompletedTransactionEarningsSummary> {
    const organizationObjectId = new Types.ObjectId(organizationId);
    const [totalsResult, agentBreakdownResult] = await Promise.all([
      this.transactionModel
        .aggregate<{
          totalAgencyEarnings: number;
          totalAgentEarnings: number;
        }>([
          {
            $match: {
              organizationId: organizationObjectId,
              stage: TransactionStage.COMPLETED,
              isDeleted: false
            }
          },
          {
            $group: {
              _id: null,
              totalAgencyEarnings: { $sum: '$financialBreakdown.agencyAmount' },
              totalAgentEarnings: { $sum: '$financialBreakdown.agentPoolAmount' }
            }
          }
        ])
        .exec(),
      this.transactionModel
        .aggregate<CompletedAgentEarningsSummaryItem>([
          {
            $match: {
              organizationId: organizationObjectId,
              stage: TransactionStage.COMPLETED,
              isDeleted: false
            }
          },
          {
            $unwind: '$financialBreakdown.agents'
          },
          {
            $group: {
              _id: '$financialBreakdown.agents.agentId',
              earnings: { $sum: '$financialBreakdown.agents.amount' }
            }
          },
          {
            $sort: {
              earnings: -1
            }
          },
          {
            $project: {
              _id: 0,
              agentId: { $toString: '$_id' },
              earnings: 1
            }
          }
        ])
        .exec()
    ]);

    const totals = totalsResult[0] ?? {
      totalAgencyEarnings: 0,
      totalAgentEarnings: 0
    };

    return {
      totalAgencyEarnings: totals.totalAgencyEarnings,
      totalAgentEarnings: totals.totalAgentEarnings,
      byAgent: agentBreakdownResult
    };
  }

  private async buildFilter(
    query: ListTransactionsQueryDto,
    normalizedSearch: string,
    organizationId: string
  ): Promise<FilterQuery<Transaction>> {
    const filter: FilterQuery<Transaction> = {
      organizationId: new Types.ObjectId(organizationId),
      ...(query.includeDeleted ? {} : { isDeleted: false })
    };

    if (query.stage) {
      filter.stage = query.stage;
    }

    if (query.transactionType) {
      filter.transactionType = query.transactionType;
    }

    if (!normalizedSearch) {
      return filter;
    }

    const escapedSearch = this.escapeRegex(normalizedSearch);
    const searchRegex = new RegExp(escapedSearch, 'i');
    const matchedAgentIds = await this.agentsService.findAgentIdsBySearchTerm(
      normalizedSearch,
      organizationId
    );
    const matchedAgentObjectIds = matchedAgentIds.map((agentId) => new Types.ObjectId(agentId));
    const matchesTransactionId = Types.ObjectId.isValid(normalizedSearch)
      ? [new Types.ObjectId(normalizedSearch)]
      : [];

    filter.$or = [
      { propertyTitle: { $regex: searchRegex } },
      ...(matchesTransactionId.length > 0 ? [{ _id: { $in: matchesTransactionId } }] : []),
      ...(matchedAgentObjectIds.length > 0
        ? [
            { listingAgentId: { $in: matchedAgentObjectIds } },
            { sellingAgentId: { $in: matchedAgentObjectIds } }
          ]
        : [])
    ];

    return filter;
  }

  private resolveSort(
    sortBy: TransactionSortByField | undefined,
    sortOrder: 'asc' | 'desc' | undefined
  ): Record<string, 1 | -1> {
    const resolvedSortBy = sortBy ?? 'createdAt';
    const resolvedSortOrder = sortOrder ?? 'desc';
    const direction = SORT_DIRECTION_BY_ORDER[resolvedSortOrder];
    const field = SORT_FIELD_BY_OPTION[resolvedSortBy];

    return {
      [field]: direction,
      _id: direction
    };
  }

  private withPopulation<T>(query: T): T {
    const queryWithPopulate = query as {
      populate(field: string, projection: string): unknown;
    };

    queryWithPopulate.populate('listingAgentId', 'name email isActive');
    queryWithPopulate.populate('sellingAgentId', 'name email isActive');
    queryWithPopulate.populate(
      'propertyId',
      'title type listingType city district price currency status'
    );
    queryWithPopulate.populate('clientIds', 'fullName email phone type');
    queryWithPopulate.populate('createdBy', 'name email isActive');
    queryWithPopulate.populate('updatedBy', 'name email isActive');
    queryWithPopulate.populate('deletedBy', 'name email isActive');
    queryWithPopulate.populate('stageHistory.changedBy', 'name email isActive');
    queryWithPopulate.populate('balanceDistributionAppliedBy', 'name email isActive');

    return query;
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }

  private createStageHistoryEntry(params: {
    fromStage: TransactionStage | null;
    toStage: TransactionStage;
    changedBy: string;
  }) {
    return {
      fromStage: params.fromStage,
      toStage: params.toStage,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(params.changedBy)
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
