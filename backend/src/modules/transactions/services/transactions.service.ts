import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AgentsService } from '@/modules/agents/services/agents.service';
import { CommissionCalculatorService } from '@/modules/commissions/commission-calculator.service';
import { StageTransitionPolicyService } from '@/modules/stage-policy/stage-transition-policy.service';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { CreateTransactionDto } from '@/modules/transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@/modules/transactions/dto/update-transaction.dto';
import {
  Transaction,
  TransactionDocument
} from '@/modules/transactions/schemas/transaction.schema';

export interface CompletedAgentEarningsSummaryItem {
  agentId: string;
  earnings: number;
}

export interface CompletedTransactionEarningsSummary {
  totalAgencyEarnings: number;
  totalAgentEarnings: number;
  byAgent: CompletedAgentEarningsSummaryItem[];
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly agentsService: AgentsService,
    private readonly commissionCalculatorService: CommissionCalculatorService,
    private readonly stageTransitionPolicyService: StageTransitionPolicyService
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
    const initialStage = this.stageTransitionPolicyService.resolveInitialStageForCreate(
      createTransactionDto.stage
    );

    await this.agentsService.ensureAgentExists(createTransactionDto.listingAgentId);
    await this.agentsService.ensureAgentExists(createTransactionDto.sellingAgentId);

    const financialBreakdown = this.commissionCalculatorService.calculate({
      totalServiceFee: createTransactionDto.totalServiceFee,
      listingAgentId: createTransactionDto.listingAgentId,
      sellingAgentId: createTransactionDto.sellingAgentId
    });

    const stageHistory = [
      this.createStageHistoryEntry({
        fromStage: null,
        toStage: initialStage
      })
    ];

    return this.transactionModel.create({
      ...createTransactionDto,
      stage: initialStage,
      financialBreakdown,
      stageHistory
    });
  }

  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find()
      .populate('listingAgentId', 'name email isActive')
      .populate('sellingAgentId', 'name email isActive')
      .populate('stageHistory.changedBy', 'name email isActive')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    this.validateObjectId(id, 'transactionId');

    const transaction = await this.transactionModel
      .findById(id)
      .populate('listingAgentId', 'name email isActive')
      .populate('sellingAgentId', 'name email isActive')
      .populate('stageHistory.changedBy', 'name email isActive')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<TransactionDocument> {
    this.validateObjectId(id, 'transactionId');

    const existingTransaction = await this.transactionModel.findById(id).exec();
    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (updateTransactionDto.listingAgentId) {
      await this.agentsService.ensureAgentExists(updateTransactionDto.listingAgentId);
    }

    if (updateTransactionDto.sellingAgentId) {
      await this.agentsService.ensureAgentExists(updateTransactionDto.sellingAgentId);
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

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(
        id,
        { ...updateTransactionDto, financialBreakdown },
        {
          new: true,
          runValidators: true
        }
      )
      .populate('listingAgentId', 'name email isActive')
      .populate('sellingAgentId', 'name email isActive')
      .populate('stageHistory.changedBy', 'name email isActive')
      .exec();

    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    return updatedTransaction;
  }

  async updateStage(
    id: string,
    stage: TransactionStage,
    changedBy?: string
  ): Promise<TransactionDocument> {
    this.validateObjectId(id, 'transactionId');

    if (changedBy) {
      this.validateObjectId(changedBy, 'changedBy');
      await this.agentsService.ensureAgentExists(changedBy);
    }

    const existingTransaction = await this.transactionModel.findById(id).exec();
    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.stageTransitionPolicyService.assertValidTransition(existingTransaction.stage, stage);

    const stageHistoryEntry = this.createStageHistoryEntry({
      fromStage: existingTransaction.stage,
      toStage: stage,
      changedBy
    });

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(
        id,
        {
          stage,
          $push: { stageHistory: stageHistoryEntry }
        },
        { new: true, runValidators: true }
      )
      .populate('listingAgentId', 'name email isActive')
      .populate('sellingAgentId', 'name email isActive')
      .populate('stageHistory.changedBy', 'name email isActive')
      .exec();

    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    return updatedTransaction;
  }

  async remove(id: string): Promise<void> {
    this.validateObjectId(id, 'transactionId');

    const deleted = await this.transactionModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async getCompletedEarningsSummary(): Promise<CompletedTransactionEarningsSummary> {
    const [totalsResult, agentBreakdownResult] = await Promise.all([
      this.transactionModel
        .aggregate<{
          totalAgencyEarnings: number;
          totalAgentEarnings: number;
        }>([
          {
            $match: {
              stage: TransactionStage.COMPLETED
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
              stage: TransactionStage.COMPLETED
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

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }

  private createStageHistoryEntry(params: {
    fromStage: TransactionStage | null;
    toStage: TransactionStage;
    changedBy?: string;
  }) {
    return {
      fromStage: params.fromStage,
      toStage: params.toStage,
      changedAt: new Date(),
      ...(params.changedBy ? { changedBy: new Types.ObjectId(params.changedBy) } : {})
    };
  }
}
