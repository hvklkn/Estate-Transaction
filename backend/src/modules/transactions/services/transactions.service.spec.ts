import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AgentsService } from '@/modules/agents/services/agents.service';
import { BalanceService } from '@/modules/balance/services/balance.service';
import { ClientsService } from '@/modules/clients/services/clients.service';
import { CommissionCalculatorService } from '@/modules/commissions/commission-calculator.service';
import { PropertiesService } from '@/modules/properties/services/properties.service';
import { PropertyStatus } from '@/modules/properties/domain/property-status.enum';
import { CommissionAgentRole } from '@/modules/commissions/domain/commission.types';
import { StageTransitionPolicyService } from '@/modules/stage-policy/stage-transition-policy.service';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';
import { Transaction } from '@/modules/transactions/schemas/transaction.schema';
import { TransactionMutationPolicyService } from '@/modules/transactions/services/transaction-mutation-policy.service';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

const LISTING_AGENT_ID = '661b8c0134e2c40fd2f89a11';
const SELLING_AGENT_ID = '661b8c0134e2c40fd2f89a22';
const CREATOR_AGENT_ID = '661b8c0134e2c40fd2f89a33';
const MANAGER_AGENT_ID = '661b8c0134e2c40fd2f89a44';
const VALID_TRANSACTION_ID = '661b8c0134e2c40fd2f89b33';
const PROPERTY_ID = '661b8c0134e2c40fd2f89d11';
const CLIENT_ID = '661b8c0134e2c40fd2f89e11';
const INVALID_TRANSACTION_ID = 'not-a-valid-object-id';
const ORGANIZATION_ID = '661b8c0134e2c40fd2f89c11';
const OTHER_ORGANIZATION_ID = '661b8c0134e2c40fd2f89c22';

const buildFinancialBreakdown = (overrides?: Partial<Record<string, unknown>>) => ({
  agencyAmount: 50000,
  agentPoolAmount: 50000,
  agents: [
    {
      agentId: LISTING_AGENT_ID,
      role: CommissionAgentRole.LISTING,
      amount: 25000,
      explanation: 'Split equally.'
    },
    {
      agentId: SELLING_AGENT_ID,
      role: CommissionAgentRole.SELLING,
      amount: 25000,
      explanation: 'Split equally.'
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
    organizationId: Types.ObjectId;
    createdBy: Types.ObjectId | null;
    stage: TransactionStage;
    transactionType: TransactionType;
    propertyId: Types.ObjectId | null;
    isDeleted: boolean;
  }>
) => ({
  _id: VALID_TRANSACTION_ID,
  propertyTitle: 'Sunset Villas #12',
  totalServiceFee: 100000,
  listingAgentId: new Types.ObjectId(LISTING_AGENT_ID),
  sellingAgentId: new Types.ObjectId(SELLING_AGENT_ID),
  organizationId: new Types.ObjectId(ORGANIZATION_ID),
  createdBy: new Types.ObjectId(CREATOR_AGENT_ID),
  transactionType: TransactionType.SOLD,
  stage: TransactionStage.AGREEMENT,
  propertyId: null,
  isDeleted: false,
  ...overrides
});

const createBasicQueryMock = <T>(result: T) => ({
  exec: jest.fn().mockResolvedValue(result)
});

const createFindQueryMock = <T>(result: T) => {
  const query = {
    populate: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return query;
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  const transactionModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exists: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  };

  const agentsServiceMock = {
    ensureAgentExists: jest.fn(),
    findAgentIdsBySearchTerm: jest.fn()
  };

  const commissionCalculatorServiceMock = {
    calculate: jest.fn()
  };

  const balanceServiceMock = {
    applyCommissionCreditsForCompletedTransaction: jest.fn()
  };

  const clientsServiceMock = {
    ensureClientsBelongToOrganization: jest.fn()
  };

  const propertiesServiceMock = {
    ensurePropertyBelongsToOrganization: jest.fn(),
    ensurePropertyIsSelectableForTransaction: jest.fn(),
    markReservedForTransaction: jest.fn(),
    markCompletedForTransaction: jest.fn(),
    restoreActiveForTransaction: jest.fn()
  };

  const stageTransitionPolicyServiceMock = {
    assertValidTransition: jest.fn(),
    resolveInitialStageForCreate: jest.fn()
  };

  const transactionMutationPolicyServiceMock = {
    assertNotDeleted: jest.fn(),
    assertCanMutate: jest.fn(),
    assertCanDelete: jest.fn(),
    assertNotCompleted: jest.fn(),
    assertValidUpdatePayloadForCurrentStage: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    transactionModelMock.exists.mockReturnValue(createBasicQueryMock(null));
    propertiesServiceMock.ensurePropertyIsSelectableForTransaction.mockResolvedValue({
      _id: PROPERTY_ID,
      status: PropertyStatus.ACTIVE
    });
    propertiesServiceMock.markReservedForTransaction.mockResolvedValue(undefined);
    propertiesServiceMock.markCompletedForTransaction.mockResolvedValue(undefined);
    propertiesServiceMock.restoreActiveForTransaction.mockResolvedValue(undefined);

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
          provide: BalanceService,
          useValue: balanceServiceMock
        },
        {
          provide: ClientsService,
          useValue: clientsServiceMock
        },
        {
          provide: PropertiesService,
          useValue: propertiesServiceMock
        },
        {
          provide: CommissionCalculatorService,
          useValue: commissionCalculatorServiceMock
        },
        {
          provide: StageTransitionPolicyService,
          useValue: stageTransitionPolicyServiceMock
        },
        {
          provide: TransactionMutationPolicyService,
          useValue: transactionMutationPolicyServiceMock
        }
      ]
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('create', () => {
    it('stores createdBy and stageHistory.changedBy from authenticated actor context', async () => {
      const createDto = {
        propertyTitle: 'Sunset Villas #12',
        propertyId: PROPERTY_ID,
        clientIds: [CLIENT_ID],
        totalServiceFee: 100000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID,
        transactionType: TransactionType.SOLD
      };

      const financialBreakdown = buildFinancialBreakdown();
      const createdTransaction = {
        _id: VALID_TRANSACTION_ID,
        ...createDto,
        stage: TransactionStage.AGREEMENT,
        financialBreakdown
      };

      stageTransitionPolicyServiceMock.resolveInitialStageForCreate.mockReturnValue(
        TransactionStage.AGREEMENT
      );
      commissionCalculatorServiceMock.calculate.mockReturnValue(financialBreakdown);
      transactionModelMock.create.mockResolvedValue(createdTransaction);

      const result = await service.create(createDto, CREATOR_AGENT_ID, ORGANIZATION_ID);

      expect(transactionModelMock.create).toHaveBeenCalledWith({
        ...createDto,
        propertyId: expect.any(Types.ObjectId),
        clientIds: [expect.any(Types.ObjectId)],
        organizationId: expect.any(Types.ObjectId),
        createdBy: expect.any(Types.ObjectId),
        stage: TransactionStage.AGREEMENT,
        financialBreakdown,
        balanceDistributionApplied: false,
        balanceDistributionAppliedAt: null,
        balanceDistributionAppliedBy: null,
        balanceDistributionLedgerIds: [],
        stageHistory: [
          {
            fromStage: null,
            toStage: TransactionStage.AGREEMENT,
            changedAt: expect.any(Date),
            changedBy: expect.any(Types.ObjectId)
          }
        ]
      });
      expect(propertiesServiceMock.ensurePropertyIsSelectableForTransaction).toHaveBeenCalledWith(
        PROPERTY_ID,
        ORGANIZATION_ID
      );
      expect(transactionModelMock.exists).toHaveBeenCalledWith({
        propertyId: new Types.ObjectId(PROPERTY_ID),
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        isDeleted: false,
        stage: { $ne: TransactionStage.COMPLETED }
      });
      expect(propertiesServiceMock.markReservedForTransaction).toHaveBeenCalledWith(
        PROPERTY_ID,
        ORGANIZATION_ID
      );
      expect(clientsServiceMock.ensureClientsBelongToOrganization).toHaveBeenCalledWith(
        [CLIENT_ID],
        ORGANIZATION_ID
      );
      expect(result).toEqual(createdTransaction);
    });

    it('rejects create when the linked property is already used by another active transaction', async () => {
      const createDto = {
        propertyTitle: 'Sunset Villas #12',
        propertyId: PROPERTY_ID,
        clientIds: [CLIENT_ID],
        totalServiceFee: 100000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID,
        transactionType: TransactionType.SOLD
      };

      stageTransitionPolicyServiceMock.resolveInitialStageForCreate.mockReturnValue(
        TransactionStage.AGREEMENT
      );
      transactionModelMock.exists.mockReturnValue(
        createBasicQueryMock({ _id: '661b8c0134e2c40fd2f89b44' })
      );

      await expect(service.create(createDto, CREATOR_AGENT_ID, ORGANIZATION_ID)).rejects.toThrow(
        'This property is already linked to another active transaction.'
      );

      expect(transactionModelMock.create).not.toHaveBeenCalled();
      expect(propertiesServiceMock.markReservedForTransaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated transaction envelope with defaults', async () => {
      const findResult = [buildExistingTransaction()];
      const findQuery = createFindQueryMock(findResult);
      const countQuery = createBasicQueryMock(1);
      transactionModelMock.find.mockReturnValue(findQuery);
      transactionModelMock.countDocuments.mockReturnValue(countQuery);

      const result = await service.findAll({}, ORGANIZATION_ID);

      expect(transactionModelMock.find).toHaveBeenCalledWith({
        organizationId: expect.any(Types.ObjectId),
        isDeleted: false
      });
      expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(findQuery.skip).toHaveBeenCalledWith(0);
      expect(findQuery.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        items: findResult,
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      });
    });

    it('supports search+filters and deterministic sort options', async () => {
      const findResult = [buildExistingTransaction({ propertyTitle: 'Maple Heights #5' })];
      const findQuery = createFindQueryMock(findResult);
      const countQuery = createBasicQueryMock(1);

      agentsServiceMock.findAgentIdsBySearchTerm.mockResolvedValue([LISTING_AGENT_ID]);
      transactionModelMock.find.mockReturnValue(findQuery);
      transactionModelMock.countDocuments.mockReturnValue(countQuery);

      await service.findAll(
        {
          page: 2,
          limit: 10,
          search: 'maple',
          stage: TransactionStage.EARNEST_MONEY,
          transactionType: TransactionType.RENTED,
          sortBy: 'propertyTitle',
          sortOrder: 'asc'
        },
        ORGANIZATION_ID
      );

      expect(agentsServiceMock.findAgentIdsBySearchTerm).toHaveBeenCalledWith(
        'maple',
        ORGANIZATION_ID
      );
      expect(transactionModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: expect.any(Types.ObjectId),
          isDeleted: false,
          stage: TransactionStage.EARNEST_MONEY,
          transactionType: TransactionType.RENTED,
          $or: expect.any(Array)
        })
      );
      expect(findQuery.sort).toHaveBeenCalledWith({ propertyTitle: 1, _id: 1 });
      expect(findQuery.skip).toHaveBeenCalledWith(10);
      expect(findQuery.limit).toHaveBeenCalledWith(10);
    });

    it('includes soft-deleted records when includeDeleted=true', async () => {
      const findResult = [buildExistingTransaction()];
      const findQuery = createFindQueryMock(findResult);
      const countQuery = createBasicQueryMock(1);

      transactionModelMock.find.mockReturnValue(findQuery);
      transactionModelMock.countDocuments.mockReturnValue(countQuery);

      await service.findAll(
        {
          includeDeleted: true
        },
        ORGANIZATION_ID
      );

      expect(transactionModelMock.find).toHaveBeenCalledWith({
        organizationId: expect.any(Types.ObjectId)
      });
    });

    it('always scopes list queries to the current organization', async () => {
      const findQuery = createFindQueryMock([]);
      const countQuery = createBasicQueryMock(0);
      transactionModelMock.find.mockReturnValue(findQuery);
      transactionModelMock.countDocuments.mockReturnValue(countQuery);

      await service.findAll({}, OTHER_ORGANIZATION_ID);

      expect(transactionModelMock.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(OTHER_ORGANIZATION_ID),
        isDeleted: false
      });
    });
  });

  describe('findOne', () => {
    it('rejects invalid MongoDB transaction ids', async () => {
      await expect(service.findOne(INVALID_TRANSACTION_ID, ORGANIZATION_ID)).rejects.toThrow(
        /transactionId must be a valid MongoDB ObjectId/i
      );
    });

    it('throws not found for unknown transactions', async () => {
      transactionModelMock.findOne.mockReturnValue(createFindQueryMock(null));

      await expect(service.findOne(VALID_TRANSACTION_ID, ORGANIZATION_ID)).rejects.toThrow(
        NotFoundException
      );
      expect(transactionModelMock.findOne).toHaveBeenCalledWith({
        _id: VALID_TRANSACTION_ID,
        organizationId: expect.any(Types.ObjectId)
      });
    });
  });

  describe('update', () => {
    it('enforces mutation policy checks before update', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.EARNEST_MONEY
      });
      const updateDto = {
        propertyTitle: 'Updated property title'
      };
      const recalculatedBreakdown = buildFinancialBreakdown();
      const updatedTransaction = {
        ...existingTransaction,
        ...updateDto,
        financialBreakdown: recalculatedBreakdown
      };

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      commissionCalculatorServiceMock.calculate.mockReturnValue(recalculatedBreakdown);
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createFindQueryMock(updatedTransaction)
      );

      const result = await service.update(
        VALID_TRANSACTION_ID,
        updateDto,
        CREATOR_AGENT_ID,
        ORGANIZATION_ID
      );

      expect(transactionMutationPolicyServiceMock.assertCanMutate).toHaveBeenCalledWith(
        existingTransaction,
        CREATOR_AGENT_ID
      );
      expect(transactionMutationPolicyServiceMock.assertNotDeleted).toHaveBeenCalledWith(
        existingTransaction
      );
      expect(transactionMutationPolicyServiceMock.assertNotCompleted).toHaveBeenCalledWith(
        existingTransaction
      );
      expect(
        transactionMutationPolicyServiceMock.assertValidUpdatePayloadForCurrentStage
      ).toHaveBeenCalledWith(existingTransaction, updateDto);
      expect(transactionModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: VALID_TRANSACTION_ID,
          organizationId: expect.any(Types.ObjectId)
        },
        expect.objectContaining({
          updatedBy: expect.any(Types.ObjectId)
        }),
        {
          new: true,
          runValidators: true
        }
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('validates linked property and clients against the current organization on update', async () => {
      const existingTransaction = buildExistingTransaction();
      const updateDto = {
        propertyId: PROPERTY_ID,
        clientIds: [CLIENT_ID]
      };
      const recalculatedBreakdown = buildFinancialBreakdown();

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      commissionCalculatorServiceMock.calculate.mockReturnValue(recalculatedBreakdown);
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createFindQueryMock({
          ...existingTransaction,
          propertyId: new Types.ObjectId(PROPERTY_ID),
          clientIds: [new Types.ObjectId(CLIENT_ID)],
          financialBreakdown: recalculatedBreakdown
        })
      );

      await service.update(VALID_TRANSACTION_ID, updateDto, CREATOR_AGENT_ID, ORGANIZATION_ID);

      expect(propertiesServiceMock.ensurePropertyIsSelectableForTransaction).toHaveBeenCalledWith(
        PROPERTY_ID,
        ORGANIZATION_ID
      );
      expect(transactionModelMock.exists).toHaveBeenCalledWith({
        propertyId: new Types.ObjectId(PROPERTY_ID),
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        isDeleted: false,
        stage: { $ne: TransactionStage.COMPLETED },
        _id: { $ne: new Types.ObjectId(VALID_TRANSACTION_ID) }
      });
      expect(propertiesServiceMock.markReservedForTransaction).toHaveBeenCalledWith(
        PROPERTY_ID,
        ORGANIZATION_ID
      );
      expect(clientsServiceMock.ensureClientsBelongToOrganization).toHaveBeenCalledWith(
        [CLIENT_ID],
        ORGANIZATION_ID
      );
      expect(transactionModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          propertyId: expect.any(Types.ObjectId),
          clientIds: [expect.any(Types.ObjectId)]
        }),
        expect.any(Object)
      );
    });

    it('rejects update when the linked property is already used by another active transaction', async () => {
      const existingTransaction = buildExistingTransaction();
      const updateDto = {
        propertyId: PROPERTY_ID
      };

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      transactionModelMock.exists.mockReturnValue(
        createBasicQueryMock({ _id: '661b8c0134e2c40fd2f89b44' })
      );

      await expect(
        service.update(VALID_TRANSACTION_ID, updateDto, CREATOR_AGENT_ID, ORGANIZATION_ID)
      ).rejects.toThrow('This property is already linked to another active transaction.');

      expect(transactionModelMock.exists).toHaveBeenCalledWith({
        propertyId: new Types.ObjectId(PROPERTY_ID),
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        isDeleted: false,
        stage: { $ne: TransactionStage.COMPLETED },
        _id: { $ne: new Types.ObjectId(VALID_TRANSACTION_ID) }
      });
      expect(transactionModelMock.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('restores the old property to active when a non-completed transaction removes its link', async () => {
      const existingTransaction = buildExistingTransaction({
        propertyId: new Types.ObjectId(PROPERTY_ID),
        stage: TransactionStage.EARNEST_MONEY
      });
      const updateDto = {
        propertyId: null
      };
      const recalculatedBreakdown = buildFinancialBreakdown();
      const updatedTransaction = {
        ...existingTransaction,
        propertyId: null,
        financialBreakdown: recalculatedBreakdown
      };

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      transactionModelMock.exists.mockReturnValue(createBasicQueryMock(null));
      commissionCalculatorServiceMock.calculate.mockReturnValue(recalculatedBreakdown);
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createFindQueryMock(updatedTransaction)
      );

      await service.update(VALID_TRANSACTION_ID, updateDto, CREATOR_AGENT_ID, ORGANIZATION_ID);

      expect(transactionModelMock.exists).toHaveBeenCalledWith({
        propertyId: new Types.ObjectId(PROPERTY_ID),
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        isDeleted: false,
        stage: { $ne: TransactionStage.COMPLETED },
        _id: { $ne: new Types.ObjectId(VALID_TRANSACTION_ID) }
      });
      expect(propertiesServiceMock.restoreActiveForTransaction).toHaveBeenCalledWith(
        PROPERTY_ID,
        ORGANIZATION_ID
      );
    });
  });

  describe('updateStage', () => {
    it('records stage history changedBy from authenticated actor', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.EARNEST_MONEY
      });

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createFindQueryMock({
          ...existingTransaction,
          stage: TransactionStage.TITLE_DEED
        })
      );

      await service.updateStage(
        VALID_TRANSACTION_ID,
        TransactionStage.TITLE_DEED,
        CREATOR_AGENT_ID,
        ORGANIZATION_ID
      );

      expect(transactionMutationPolicyServiceMock.assertCanMutate).toHaveBeenCalledWith(
        existingTransaction,
        CREATOR_AGENT_ID
      );
      expect(transactionMutationPolicyServiceMock.assertNotDeleted).toHaveBeenCalledWith(
        existingTransaction
      );
      expect(stageTransitionPolicyServiceMock.assertValidTransition).toHaveBeenCalledWith(
        TransactionStage.EARNEST_MONEY,
        TransactionStage.TITLE_DEED
      );
      expect(transactionModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: VALID_TRANSACTION_ID,
          organizationId: expect.any(Types.ObjectId)
        },
        {
          stage: TransactionStage.TITLE_DEED,
          updatedBy: expect.any(Types.ObjectId),
          $push: {
            stageHistory: {
              fromStage: TransactionStage.EARNEST_MONEY,
              toStage: TransactionStage.TITLE_DEED,
              changedAt: expect.any(Date),
              changedBy: expect.any(Types.ObjectId)
            }
          }
        },
        { new: true, runValidators: true }
      );
    });

    it('applies commission credits once when transition reaches completed', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.TITLE_DEED
      });
      const completedTransaction = {
        ...existingTransaction,
        stage: TransactionStage.COMPLETED,
        financialBreakdown: buildFinancialBreakdown()
      };

      transactionModelMock.findOne
        .mockReturnValueOnce(createBasicQueryMock(existingTransaction))
        .mockReturnValueOnce(createFindQueryMock(completedTransaction));
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createFindQueryMock(completedTransaction)
      );
      balanceServiceMock.applyCommissionCreditsForCompletedTransaction.mockResolvedValue({
        applied: true,
        ledgerIds: ['661b8c0134e2c40fd2f89f11']
      });

      const result = await service.updateStage(
        VALID_TRANSACTION_ID,
        TransactionStage.COMPLETED,
        CREATOR_AGENT_ID,
        ORGANIZATION_ID
      );

      expect(balanceServiceMock.applyCommissionCreditsForCompletedTransaction).toHaveBeenCalledWith(
        {
          transactionId: VALID_TRANSACTION_ID,
          actorAgentId: CREATOR_AGENT_ID,
          organizationId: ORGANIZATION_ID,
          allocations: [
            {
              agentId: LISTING_AGENT_ID,
              amount: 25000,
              role: CommissionAgentRole.LISTING
            },
            {
              agentId: SELLING_AGENT_ID,
              amount: 25000,
              role: CommissionAgentRole.SELLING
            }
          ]
        }
      );
      expect(result).toEqual(completedTransaction);
    });

    it.each([
      [TransactionType.SOLD, PropertyStatus.SOLD],
      [TransactionType.RENTED, PropertyStatus.RENTED]
    ])(
      'marks a linked property as %s when a transaction is completed',
      async (transactionType, expectedPropertyStatus) => {
        const existingTransaction = buildExistingTransaction({
          stage: TransactionStage.TITLE_DEED,
          transactionType,
          propertyId: new Types.ObjectId(PROPERTY_ID)
        });
        const completedTransaction = {
          ...existingTransaction,
          stage: TransactionStage.COMPLETED,
          financialBreakdown: buildFinancialBreakdown()
        };

        transactionModelMock.findOne
          .mockReturnValueOnce(createBasicQueryMock(existingTransaction))
          .mockReturnValueOnce(createFindQueryMock(completedTransaction));
        transactionModelMock.findOneAndUpdate.mockReturnValue(
          createFindQueryMock(completedTransaction)
        );
        balanceServiceMock.applyCommissionCreditsForCompletedTransaction.mockResolvedValue({
          applied: true,
          ledgerIds: []
        });

        await service.updateStage(
          VALID_TRANSACTION_ID,
          TransactionStage.COMPLETED,
          CREATOR_AGENT_ID,
          ORGANIZATION_ID
        );

        expect(propertiesServiceMock.markCompletedForTransaction).toHaveBeenCalledWith(
          PROPERTY_ID,
          ORGANIZATION_ID,
          expectedPropertyStatus
        );
      }
    );

    it('rejects invalid ids for stage updates', async () => {
      await expect(
        service.updateStage(
          INVALID_TRANSACTION_ID,
          TransactionStage.EARNEST_MONEY,
          CREATOR_AGENT_ID,
          ORGANIZATION_ID
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('enforces delete policy and soft-deletes transaction with audit fields', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.AGREEMENT
      });

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createBasicQueryMock(existingTransaction)
      );

      await service.remove(VALID_TRANSACTION_ID, CREATOR_AGENT_ID, 'agent', ORGANIZATION_ID);

      expect(transactionMutationPolicyServiceMock.assertNotDeleted).toHaveBeenCalledWith(
        existingTransaction
      );
      expect(transactionMutationPolicyServiceMock.assertCanDelete).toHaveBeenCalledWith(
        existingTransaction,
        CREATOR_AGENT_ID,
        'agent'
      );
      expect(transactionModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: VALID_TRANSACTION_ID,
          organizationId: expect.any(Types.ObjectId)
        },
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Date),
          deletedBy: expect.any(Types.ObjectId),
          updatedBy: expect.any(Types.ObjectId)
        }),
        { new: false }
      );
    });

    it('restores linked property to active when soft-deleting a non-completed transaction', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.EARNEST_MONEY,
        propertyId: new Types.ObjectId(PROPERTY_ID)
      });

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createBasicQueryMock(existingTransaction)
      );
      transactionModelMock.exists.mockReturnValue(createBasicQueryMock(null));

      await service.remove(VALID_TRANSACTION_ID, CREATOR_AGENT_ID, 'agent', ORGANIZATION_ID);

      expect(transactionModelMock.exists).toHaveBeenCalledWith({
        propertyId: new Types.ObjectId(PROPERTY_ID),
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        isDeleted: false,
        stage: { $ne: TransactionStage.COMPLETED },
        _id: { $ne: new Types.ObjectId(VALID_TRANSACTION_ID) }
      });
      expect(propertiesServiceMock.restoreActiveForTransaction).toHaveBeenCalledWith(
        PROPERTY_ID,
        ORGANIZATION_ID
      );
    });

    it('allows manager/admin delete flow for completed transactions', async () => {
      const existingTransaction = buildExistingTransaction({
        stage: TransactionStage.COMPLETED
      });

      transactionModelMock.findOne.mockReturnValue(createBasicQueryMock(existingTransaction));
      transactionModelMock.findOneAndUpdate.mockReturnValue(
        createBasicQueryMock(existingTransaction)
      );

      await service.remove(VALID_TRANSACTION_ID, MANAGER_AGENT_ID, 'manager', ORGANIZATION_ID);

      expect(transactionMutationPolicyServiceMock.assertCanDelete).toHaveBeenCalledWith(
        existingTransaction,
        MANAGER_AGENT_ID,
        'manager'
      );
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

      const result = await service.getCompletedEarningsSummary(ORGANIZATION_ID);

      expect(result).toEqual({
        totalAgencyEarnings: 175000,
        totalAgentEarnings: 175000,
        byAgent: [
          { agentId: LISTING_AGENT_ID, earnings: 100000 },
          { agentId: SELLING_AGENT_ID, earnings: 75000 }
        ]
      });
      expect(transactionModelMock.aggregate).toHaveBeenCalledTimes(2);
      expect(transactionModelMock.aggregate).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              stage: TransactionStage.COMPLETED,
              organizationId: expect.any(Types.ObjectId),
              isDeleted: false
            })
          })
        ])
      );
    });
  });
});
