import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';
import { TransactionMutationPolicyService } from '@/modules/transactions/services/transaction-mutation-policy.service';

const CREATOR_AGENT_ID = '661b8c0134e2c40fd2f89a33';
const LISTING_AGENT_ID = '661b8c0134e2c40fd2f89a11';
const SELLING_AGENT_ID = '661b8c0134e2c40fd2f89a22';
const OUTSIDER_AGENT_ID = '661b8c0134e2c40fd2f89a99';
const MANAGER_AGENT_ID = '661b8c0134e2c40fd2f89a44';

describe('TransactionMutationPolicyService', () => {
  let service: TransactionMutationPolicyService;

  const buildTransaction = (stage: TransactionStage, overrides?: Partial<{ isDeleted: boolean }>) => ({
    stage,
    isDeleted: false,
    createdBy: new Types.ObjectId(CREATOR_AGENT_ID),
    listingAgentId: new Types.ObjectId(LISTING_AGENT_ID),
    sellingAgentId: new Types.ObjectId(SELLING_AGENT_ID),
    ...overrides
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionMutationPolicyService]
    }).compile();

    service = module.get<TransactionMutationPolicyService>(TransactionMutationPolicyService);
  });

  it.each([CREATOR_AGENT_ID, LISTING_AGENT_ID, SELLING_AGENT_ID])(
    'allows allowed actor to mutate (%s)',
    (actorAgentId) => {
      expect(() => service.assertCanMutate(buildTransaction(TransactionStage.AGREEMENT), actorAgentId)).not.toThrow();
    }
  );

  it('rejects mutation for non-participant actors', () => {
    expect(() =>
      service.assertCanMutate(buildTransaction(TransactionStage.AGREEMENT), OUTSIDER_AGENT_ID)
    ).toThrow(ForbiddenException);
  });

  it('marks completed transactions as immutable', () => {
    expect(() => service.assertNotCompleted(buildTransaction(TransactionStage.COMPLETED))).toThrow(
      ConflictException
    );
  });

  it('marks deleted transactions as immutable', () => {
    expect(() =>
      service.assertNotDeleted(buildTransaction(TransactionStage.AGREEMENT, { isDeleted: true }))
    ).toThrow(ConflictException);
  });

  it('rejects completed delete for normal actor', () => {
    expect(() =>
      service.assertCanDelete(
        buildTransaction(TransactionStage.COMPLETED),
        CREATOR_AGENT_ID,
        'agent'
      )
    ).toThrow(ConflictException);
  });

  it('allows completed delete for manager/admin actor', () => {
    expect(() =>
      service.assertCanDelete(
        buildTransaction(TransactionStage.COMPLETED),
        MANAGER_AGENT_ID,
        'manager'
      )
    ).not.toThrow();
    expect(() =>
      service.assertCanDelete(
        buildTransaction(TransactionStage.COMPLETED),
        MANAGER_AGENT_ID,
        'admin'
      )
    ).not.toThrow();
  });

  it('allows workflow-critical field updates during agreement stage', () => {
    expect(() =>
      service.assertValidUpdatePayloadForCurrentStage(buildTransaction(TransactionStage.AGREEMENT), {
        totalServiceFee: 150000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: SELLING_AGENT_ID,
        transactionType: TransactionType.RENTED
      })
    ).not.toThrow();
  });

  it('blocks workflow-critical field updates after agreement stage', () => {
    expect(() =>
      service.assertValidUpdatePayloadForCurrentStage(
        buildTransaction(TransactionStage.EARNEST_MONEY),
        {
          totalServiceFee: 150000
        }
      )
    ).toThrow(ConflictException);
  });

  it('allows metadata-only updates after agreement stage', () => {
    expect(() =>
      service.assertValidUpdatePayloadForCurrentStage(
        buildTransaction(TransactionStage.TITLE_DEED),
        {
          propertyTitle: 'Updated title'
        }
      )
    ).not.toThrow();
  });
});
