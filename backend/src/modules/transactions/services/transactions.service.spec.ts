import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AgentsService } from '@/modules/agents/services/agents.service';
import { CommissionCalculatorService } from '@/modules/commissions/commission-calculator.service';
import { CommissionAgentRole } from '@/modules/commissions/domain/commission.types';
import { StageTransitionPolicyService } from '@/modules/stage-policy/stage-transition-policy.service';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { Transaction } from '@/modules/transactions/schemas/transaction.schema';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

const LISTING_AGENT_ID = '661b8c0134e2c40fd2f89a11';
const SELLING_AGENT_ID = '661b8c0134e2c40fd2f89a22';
const NEW_LISTING_AGENT_ID = '661b8c0134e2c40fd2f89a44';
const VALID_TRANSACTION_ID = '661b8c0134e2c40fd2f89b33';
const INVALID_TRANSACTION_ID = 'not-a-valid-object-id';

const createQueryMock = <T>(result: T) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result)
});

const buildFinancialBreakdown = (overrides?: Partial<Record<string, unknown>>) => ({
  agencyAmount: 50000,
  agentPoolAmount: 50000,
  agents: [
    {
      agentId: LISTING_AGENT_ID,
      role: CommissionAgentRole.LISTING,
      amount: 25000,
      explanation: 'Listing and selling agents are different people, so the agent portion is split equally.'
    },
    {
      agentId: SELLING_AGENT_ID,
      role: CommissionAgentRole.SELLING,
      amount: 25000,
      explanation: 'Listing and selling agents are different people, so the agent portion is split equally.'
    }
  ],
  ...overrides
});

const buildExistingTransaction = (
  overrides?: Partial<{
    _id: string;
    propertyTitle: string;
    totalServiceFee: number;
    listingAgentId: Types.ObjectId;
    sellingAgentId: Types.ObjectId;
    stage: TransactionStage;
  }>
) => ({
  _id: VALID_TRANSACTION_ID,
  propertyTitle: 'Sunset Villas #12',
  totalServiceFee: 100000,
  listingAgentId: new Types.ObjectId(LISTING_AGENT_ID),
  sellingAgentId: new Types.ObjectId(SELLING_AGENT_ID),
  stage: TransactionStage.AGREEMENT,
  ...overrides
});

describe('TransactionsService', () => {
  let service: TransactionsService;

  const transactionModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn()
  };

  const agentsServiceMock = {
    ensureAgentExists: jest.fn()
  };

  const commissionCalculatorServiceMock = {
    calculate: jest.fn()
  };

  const stageTransitionPolicyServiceMock = {
    assertValidTransition: jest.fn(),
    resolveInitialStageForCreate: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: transactionModelMock
        },
        {
          provide: AgentsService,
          useValue: agentsServiceMock
        },
        {
          provide: CommissionCalculatorService,
          useValue: commissionCalculatorServiceMock
        },
        {
          provide: StageTransitionPolicyService,
          useValue: stageTransitionPolicyServiceMock
        }
      ]
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('create', () => {
    it('rejects creation when initial stage is invalid', async () => {
      const createDto = {
        propertyTitle: 'Sunset Villas #12',
        totalServiceFee: 100000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID,
        stage: TransactionStage.TITLE_DEED
      };

      stageTransitionPolicyServiceMock.resolveInitialStageForCreate.mockImplementation(() => {
        throw new BadRequestException(
          'New transactions must start at "agreement" stage. Use the dedicated stage transition endpoint for progression.'
        );
      });

      await expect(service.create(createDto)).rejects.toThrow(/must start at "agreement" stage/i);

      expect(agentsServiceMock.ensureAgentExists).not.toHaveBeenCalled();
      expect(commissionCalculatorServiceMock.calculate).not.toHaveBeenCalled();
      expect(transactionModelMock.create).not.toHaveBeenCalled();
    });

    it('validates agents, computes financial breakdown, and stores policy-resolved stage', async () => {
      const createDto = {
        propertyTitle: 'Sunset Villas #12',
        totalServiceFee: 100000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID,
        stage: TransactionStage.AGREEMENT
      };

      const financialBreakdown = buildFinancialBreakdown();
      const createdTransaction = {
        _id: VALID_TRANSACTION_ID,
        ...createDto,
        financialBreakdown
      };

      stageTransitionPolicyServiceMock.resolveInitialStageForCreate.mockReturnValue(
        TransactionStage.AGREEMENT
      );
      commissionCalculatorServiceMock.calculate.mockReturnValue(financialBreakdown);
      transactionModelMock.create.mockResolvedValue(createdTransaction);

      const result = await service.create(createDto);

      expect(agentsServiceMock.ensureAgentExists).toHaveBeenCalledWith(LISTING_AGENT_ID);
      expect(agentsServiceMock.ensureAgentExists).toHaveBeenCalledWith(SELLING_AGENT_ID);
      expect(commissionCalculatorServiceMock.calculate).toHaveBeenCalledWith({
        totalServiceFee: 100000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID
      });
      expect(transactionModelMock.create).toHaveBeenCalledWith({
        ...createDto,
        stage: TransactionStage.AGREEMENT,
        financialBreakdown,
        stageHistory: [
          {
            fromStage: null,
            toStage: TransactionStage.AGREEMENT,
            changedAt: expect.any(Date)
          }
        ]
      });
      expect(result).toEqual(createdTransaction);
    });

    it('defaults to agreement stage when create payload omits stage', async () => {
      const createDto = {
        propertyTitle: 'Maple Residency #7',
        totalServiceFee: 95000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID
      };

      const financialBreakdown = buildFinancialBreakdown({
        agencyAmount: 47500,
        agentPoolAmount: 47500,
        agents: [
          {
            agentId: LISTING_AGENT_ID,
            role: CommissionAgentRole.LISTING,
            amount: 23750,
            explanation:
              'Listing and selling agents are different people, so the agent portion is split equally.'
          },
          {
            agentId: SELLING_AGENT_ID,
            role: CommissionAgentRole.SELLING,
            amount: 23750,
            explanation:
              'Listing and selling agents are different people, so the agent portion is split equally.'
          }
        ]
      });

      stageTransitionPolicyServiceMock.resolveInitialStageForCreate.mockReturnValue(
        TransactionStage.AGREEMENT
      );
      commissionCalculatorServiceMock.calculate.mockReturnValue(financialBreakdown);
      transactionModelMock.create.mockResolvedValue({
        _id: VALID_TRANSACTION_ID,
        ...createDto,
        stage: TransactionStage.AGREEMENT,
        financialBreakdown
      });

      await service.create(createDto);

      expect(stageTransitionPolicyServiceMock.resolveInitialStageForCreate).toHaveBeenCalledWith(
        undefined
      );
      expect(transactionModelMock.create).toHaveBeenCalledWith({
        ...createDto,
        stage: TransactionStage.AGREEMENT,
        financialBreakdown,
        stageHistory: [
          {
            fromStage: null,
            toStage: TransactionStage.AGREEMENT,
            changedAt: expect.any(Date)
          }
        ]
      });
    });

    it('returns create failure when listing agent validation fails', async () => {
      const createDto = {
        propertyTitle: 'Sunset Villas #12',
        totalServiceFee: 100000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID
      };

      stageTransitionPolicyServiceMock.resolveInitialStageForCreate.mockReturnValue(
        TransactionStage.AGREEMENT
      );
      agentsServiceMock.ensureAgentExists.mockRejectedValueOnce(
        new NotFoundException(`Agent not found: ${LISTING_AGENT_ID}`)
      );

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);

      expect(commissionCalculatorServiceMock.calculate).not.toHaveBeenCalled();
      expect(transactionModelMock.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects invalid MongoDB transaction ids', async () => {
      await expect(service.update(INVALID_TRANSACTION_ID, { propertyTitle: 'Updated' })).rejects.toThrow(
        /transactionId must be a valid MongoDB ObjectId/i
      );

      expect(transactionModelMock.findById).not.toHaveBeenCalled();
      expect(transactionModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('returns not found when updating a missing transaction', async () => {
      transactionModelMock.findById.mockReturnValue(createQueryMock(null));

      await expect(service.update(VALID_TRANSACTION_ID, { propertyTitle: 'Updated' })).rejects.toThrow(
        NotFoundException
      );

      expect(commissionCalculatorServiceMock.calculate).not.toHaveBeenCalled();
      expect(transactionModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('recalculates financial breakdown from merged existing and updated values', async () => {
      const existingTransaction = buildExistingTransaction({ stage: TransactionStage.EARNEST_MONEY });
      const updateDto = {
        totalServiceFee: 120000
      };
      const recalculatedBreakdown = buildFinancialBreakdown({
        agencyAmount: 60000,
        agentPoolAmount: 60000,
        agents: [
          {
            agentId: LISTING_AGENT_ID,
            role: CommissionAgentRole.LISTING,
            amount: 30000,
            explanation:
              'Listing and selling agents are different people, so the agent portion is split equally.'
          },
          {
            agentId: SELLING_AGENT_ID,
            role: CommissionAgentRole.SELLING,
            amount: 30000,
            explanation:
              'Listing and selling agents are different people, so the agent portion is split equally.'
          }
        ]
      });
      const updatedTransaction = {
        ...existingTransaction,
        ...updateDto,
        financialBreakdown: recalculatedBreakdown
      };

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      commissionCalculatorServiceMock.calculate.mockReturnValue(recalculatedBreakdown);
      transactionModelMock.findByIdAndUpdate.mockReturnValue(createQueryMock(updatedTransaction));

      const result = await service.update(VALID_TRANSACTION_ID, updateDto);

      expect(commissionCalculatorServiceMock.calculate).toHaveBeenCalledWith({
        totalServiceFee: 120000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID
      });
      expect(transactionModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_TRANSACTION_ID,
        {
          ...updateDto,
          financialBreakdown: recalculatedBreakdown
        },
        {
          new: true,
          runValidators: true
        }
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('validates only agent ids that changed during update', async () => {
      const existingTransaction = buildExistingTransaction({
        propertyTitle: 'Lakeside Residence #3'
      });
      const updateDto = {
        listingAgentId: NEW_LISTING_AGENT_ID
      };
      const recalculatedBreakdown = buildFinancialBreakdown({
        agents: [
          {
            agentId: NEW_LISTING_AGENT_ID,
            role: CommissionAgentRole.LISTING,
            amount: 25000,
            explanation:
              'Listing and selling agents are different people, so the agent portion is split equally.'
          },
          {
            agentId: SELLING_AGENT_ID,
            role: CommissionAgentRole.SELLING,
            amount: 25000,
            explanation:
              'Listing and selling agents are different people, so the agent portion is split equally.'
          }
        ]
      });

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      commissionCalculatorServiceMock.calculate.mockReturnValue(recalculatedBreakdown);
      transactionModelMock.findByIdAndUpdate.mockReturnValue(
        createQueryMock({
          ...existingTransaction,
          ...updateDto,
          financialBreakdown: recalculatedBreakdown
        })
      );

      await service.update(VALID_TRANSACTION_ID, updateDto);

      expect(agentsServiceMock.ensureAgentExists).toHaveBeenCalledTimes(1);
      expect(agentsServiceMock.ensureAgentExists).toHaveBeenCalledWith(NEW_LISTING_AGENT_ID);
      expect(commissionCalculatorServiceMock.calculate).toHaveBeenCalledWith({
        totalServiceFee: existingTransaction.totalServiceFee,
        listingAgentId: NEW_LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID
      });
    });

    it('does not alter stage history on non-stage transaction updates', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.EARNEST_MONEY
      });
      const updateDto = {
        propertyTitle: 'Updated Property Title'
      };
      const recalculatedBreakdown = buildFinancialBreakdown();

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      commissionCalculatorServiceMock.calculate.mockReturnValue(recalculatedBreakdown);
      transactionModelMock.findByIdAndUpdate.mockReturnValue(
        createQueryMock({
          ...existingTransaction,
          ...updateDto,
          financialBreakdown: recalculatedBreakdown
        })
      );

      await service.update(VALID_TRANSACTION_ID, updateDto);

      expect(transactionModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_TRANSACTION_ID,
        {
          ...updateDto,
          financialBreakdown: recalculatedBreakdown
        },
        {
          new: true,
          runValidators: true
        }
      );
      const updatePayload = transactionModelMock.findByIdAndUpdate.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('stage');
      expect(updatePayload).not.toHaveProperty('stageHistory');
      expect(updatePayload).not.toHaveProperty('$push');
    });
  });

  describe('updateStage', () => {
    it('rejects invalid MongoDB transaction ids', async () => {
      await expect(
        service.updateStage(INVALID_TRANSACTION_ID, TransactionStage.EARNEST_MONEY)
      ).rejects.toThrow(/transactionId must be a valid MongoDB ObjectId/i);

      expect(transactionModelMock.findById).not.toHaveBeenCalled();
      expect(stageTransitionPolicyServiceMock.assertValidTransition).not.toHaveBeenCalled();
    });

    it('returns not found when stage update target does not exist', async () => {
      transactionModelMock.findById.mockReturnValue(createQueryMock(null));

      await expect(
        service.updateStage(VALID_TRANSACTION_ID, TransactionStage.EARNEST_MONEY)
      ).rejects.toThrow(NotFoundException);

      expect(stageTransitionPolicyServiceMock.assertValidTransition).not.toHaveBeenCalled();
      expect(transactionModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('applies valid transition through policy and returns updated transaction', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.EARNEST_MONEY
      });
      const updatedTransaction = {
        ...existingTransaction,
        stage: TransactionStage.TITLE_DEED
      };

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      transactionModelMock.findByIdAndUpdate.mockReturnValue(createQueryMock(updatedTransaction));

      const result = await service.updateStage(VALID_TRANSACTION_ID, TransactionStage.TITLE_DEED);

      expect(stageTransitionPolicyServiceMock.assertValidTransition).toHaveBeenCalledWith(
        TransactionStage.EARNEST_MONEY,
        TransactionStage.TITLE_DEED
      );
      expect(transactionModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_TRANSACTION_ID,
        {
          stage: TransactionStage.TITLE_DEED,
          $push: {
            stageHistory: {
              fromStage: TransactionStage.EARNEST_MONEY,
              toStage: TransactionStage.TITLE_DEED,
              changedAt: expect.any(Date)
            }
          }
        },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('appends stage history with changedBy when stage update includes agent context', async () => {
      const changedBy = '661b8c0134e2c40fd2f89a77';
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.TITLE_DEED
      });

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      transactionModelMock.findByIdAndUpdate.mockReturnValue(
        createQueryMock({
          ...existingTransaction,
          stage: TransactionStage.COMPLETED
        })
      );

      await service.updateStage(VALID_TRANSACTION_ID, TransactionStage.COMPLETED, changedBy);

      expect(agentsServiceMock.ensureAgentExists).toHaveBeenCalledWith(changedBy);
      expect(transactionModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_TRANSACTION_ID,
        {
          stage: TransactionStage.COMPLETED,
          $push: {
            stageHistory: {
              fromStage: TransactionStage.TITLE_DEED,
              toStage: TransactionStage.COMPLETED,
              changedAt: expect.any(Date),
              changedBy: expect.any(Types.ObjectId)
            }
          }
        },
        { new: true, runValidators: true }
      );
    });

    it('rejects stage update when changedBy is not a valid object id', async () => {
      await expect(
        service.updateStage(VALID_TRANSACTION_ID, TransactionStage.EARNEST_MONEY, 'invalid-id')
      ).rejects.toThrow(/changedBy must be a valid MongoDB ObjectId/i);

      expect(transactionModelMock.findById).not.toHaveBeenCalled();
      expect(stageTransitionPolicyServiceMock.assertValidTransition).not.toHaveBeenCalled();
    });

    it('does not update stage when policy rejects skipping transitions', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.AGREEMENT
      });

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      stageTransitionPolicyServiceMock.assertValidTransition.mockImplementation(() => {
        throw new BadRequestException('Invalid stage transition: cannot skip stages.');
      });

      await expect(
        service.updateStage(VALID_TRANSACTION_ID, TransactionStage.TITLE_DEED)
      ).rejects.toThrow(/cannot skip stages/i);

      expect(transactionModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('does not update stage when requested stage is unchanged', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.EARNEST_MONEY
      });

      transactionModelMock.findById.mockReturnValue(createQueryMock(existingTransaction));
      stageTransitionPolicyServiceMock.assertValidTransition.mockImplementation(() => {
        throw new BadRequestException('Transaction is already in stage "earnest_money".');
      });

      await expect(
        service.updateStage(VALID_TRANSACTION_ID, TransactionStage.EARNEST_MONEY)
      ).rejects.toThrow(/already in stage/i);

      expect(transactionModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getCompletedEarningsSummary', () => {
    it('returns totals and per-agent earnings from completed transactions', async () => {
      transactionModelMock.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([
            {
              totalAgencyEarnings: 175000,
              totalAgentEarnings: 175000
            }
          ])
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([
            { agentId: LISTING_AGENT_ID, earnings: 100000 },
            { agentId: SELLING_AGENT_ID, earnings: 75000 }
          ])
        });

      const result = await service.getCompletedEarningsSummary();

      expect(result).toEqual({
        totalAgencyEarnings: 175000,
        totalAgentEarnings: 175000,
        byAgent: [
          { agentId: LISTING_AGENT_ID, earnings: 100000 },
          { agentId: SELLING_AGENT_ID, earnings: 75000 }
        ]
      });
      expect(transactionModelMock.aggregate).toHaveBeenCalledTimes(2);
    });

    it('returns zeroed totals when there are no completed transactions', async () => {
      transactionModelMock.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([])
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([])
        });

      const result = await service.getCompletedEarningsSummary();

      expect(result).toEqual({
        totalAgencyEarnings: 0,
        totalAgentEarnings: 0,
        byAgent: []
      });
    });
  });
});
