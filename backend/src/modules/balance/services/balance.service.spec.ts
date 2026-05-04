import { ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { BalanceLedgerType } from '@/modules/balance/domain/balance-ledger-type.enum';
import { BalanceLedger } from '@/modules/balance/schemas/balance-ledger.schema';
import { BalanceService } from '@/modules/balance/services/balance.service';
import { Transaction } from '@/modules/transactions/schemas/transaction.schema';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';

const AGENT_A_ID = '661b8c0134e2c40fd2f89a11';
const AGENT_B_ID = '661b8c0134e2c40fd2f89a22';
const ACTOR_ID = '661b8c0134e2c40fd2f89a33';
const TRANSACTION_ID = '661b8c0134e2c40fd2f89b44';
const ORGANIZATION_ID = '661b8c0134e2c40fd2f89c11';

const createLeanSelectQuery = <T>(result: T) => {
  const query = {
    select: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.select.mockReturnValue(query);
  query.lean.mockReturnValue(query);

  return query;
};

const createFindLedgerQuery = <T>(result: T) => {
  const query = {
    sort: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.sort.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.lean.mockReturnValue(query);

  return query;
};

const createSelectQuery = <T>(result: T) => {
  const query = {
    select: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.select.mockReturnValue(query);

  return query;
};

describe('BalanceService', () => {
  let service: BalanceService;

  const agentModelMock = {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn()
  };

  const balanceLedgerModelMock = {
    find: jest.fn(),
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  };

  const transactionModelMock = {
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: getModelToken(Agent.name),
          useValue: agentModelMock
        },
        {
          provide: getModelToken(BalanceLedger.name),
          useValue: balanceLedgerModelMock
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: transactionModelMock
        }
      ]
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  it('returns zero balance for newly created user balance state', async () => {
    agentModelMock.findOne.mockReturnValue(
      createLeanSelectQuery({
        _id: new Types.ObjectId(AGENT_A_ID),
        balanceCents: 0
      })
    );
    balanceLedgerModelMock.find.mockReturnValue(createFindLedgerQuery([]));
    balanceLedgerModelMock.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([])
    });

    const result = await service.getMyBalance(AGENT_A_ID, ORGANIZATION_ID);

    expect(result.balanceCents).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.totalEarnedCents).toBe(0);
    expect(result.recentLedgerEntries).toEqual([]);
  });

  it('credits single-agent commission allocation and writes ledger entry', async () => {
    const balances = new Map<string, number>([[AGENT_A_ID, 0]]);
    const createdLedgerEntries: Array<Record<string, unknown>> = [];

    transactionModelMock.findOneAndUpdate.mockReturnValue(
      createSelectQuery({ _id: new Types.ObjectId(TRANSACTION_ID), stage: TransactionStage.COMPLETED })
    );
    agentModelMock.find.mockReturnValue(
      createLeanSelectQuery([{ _id: new Types.ObjectId(AGENT_A_ID) }])
    );
    agentModelMock.findOneAndUpdate.mockImplementation((filter: { _id: string }, update: { $inc: { balanceCents: number } }) => {
      const agentId = filter._id;
      const nextBalance = (balances.get(agentId) ?? 0) + update.$inc.balanceCents;
      balances.set(agentId, nextBalance);
      return createSelectQuery({ _id: new Types.ObjectId(agentId), balanceCents: nextBalance });
    });
    balanceLedgerModelMock.create.mockImplementation(async (payload: Record<string, unknown>) => {
      const entry = {
        _id: new Types.ObjectId(),
        ...payload,
        createdAt: new Date()
      };
      createdLedgerEntries.push(entry);
      return entry;
    });
    transactionModelMock.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    const result = await service.applyCommissionCreditsForCompletedTransaction({
      transactionId: TRANSACTION_ID,
      actorAgentId: ACTOR_ID,
      organizationId: ORGANIZATION_ID,
      allocations: [
        {
          agentId: AGENT_A_ID,
          amount: 500,
          role: 'listing_and_selling'
        }
      ]
    });

    expect(result.applied).toBe(true);
    expect(balances.get(AGENT_A_ID)).toBe(50000);
    expect(createdLedgerEntries).toHaveLength(1);
    expect(createdLedgerEntries[0]).toEqual(
      expect.objectContaining({
        type: BalanceLedgerType.COMMISSION_CREDIT,
        organizationId: expect.any(Types.ObjectId),
        amount: 50000,
        previousBalance: 0,
        newBalance: 50000,
        transactionId: expect.any(Types.ObjectId),
        createdBy: expect.any(Types.ObjectId)
      })
    );
  });

  it('splits credits across different agents and preserves per-agent balances', async () => {
    const balances = new Map<string, number>([
      [AGENT_A_ID, 1000],
      [AGENT_B_ID, 2500]
    ]);

    transactionModelMock.findOneAndUpdate.mockReturnValue(
      createSelectQuery({ _id: new Types.ObjectId(TRANSACTION_ID), stage: TransactionStage.COMPLETED })
    );
    agentModelMock.find.mockReturnValue(
      createLeanSelectQuery([
        { _id: new Types.ObjectId(AGENT_A_ID) },
        { _id: new Types.ObjectId(AGENT_B_ID) }
      ])
    );
    agentModelMock.findOneAndUpdate.mockImplementation((filter: { _id: string }, update: { $inc: { balanceCents: number } }) => {
      const agentId = filter._id;
      const nextBalance = (balances.get(agentId) ?? 0) + update.$inc.balanceCents;
      balances.set(agentId, nextBalance);
      return createSelectQuery({ _id: new Types.ObjectId(agentId), balanceCents: nextBalance });
    });
    balanceLedgerModelMock.create.mockImplementation(async (payload: Record<string, unknown>) => ({
      _id: new Types.ObjectId(),
      ...payload,
      createdAt: new Date()
    }));
    transactionModelMock.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await service.applyCommissionCreditsForCompletedTransaction({
      transactionId: TRANSACTION_ID,
      actorAgentId: ACTOR_ID,
      organizationId: ORGANIZATION_ID,
      allocations: [
        {
          agentId: AGENT_A_ID,
          amount: 250,
          role: 'listing'
        },
        {
          agentId: AGENT_B_ID,
          amount: 250,
          role: 'selling'
        }
      ]
    });

    expect(balances.get(AGENT_A_ID)).toBe(26000);
    expect(balances.get(AGENT_B_ID)).toBe(27500);
    expect(balanceLedgerModelMock.create).toHaveBeenCalledTimes(2);
  });

  it('does not double-credit if transaction completion credit is already claimed', async () => {
    transactionModelMock.findOneAndUpdate.mockReturnValue(createSelectQuery(null));

    const result = await service.applyCommissionCreditsForCompletedTransaction({
      transactionId: TRANSACTION_ID,
      actorAgentId: ACTOR_ID,
      organizationId: ORGANIZATION_ID,
      allocations: [
        {
          agentId: AGENT_A_ID,
          amount: 500,
          role: 'listing_and_selling'
        }
      ]
    });

    expect(result).toEqual({
      applied: false,
      ledgerIds: []
    });
    expect(agentModelMock.findOneAndUpdate).not.toHaveBeenCalled();
    expect(balanceLedgerModelMock.create).not.toHaveBeenCalled();
  });

  it('blocks non-admin roles from viewing other user balances', async () => {
    await expect(
      service.getAgentBalanceForViewer(AGENT_A_ID, 'agent', ORGANIZATION_ID, AGENT_B_ID)
    ).rejects.toThrow(ForbiddenException);
  });
});
