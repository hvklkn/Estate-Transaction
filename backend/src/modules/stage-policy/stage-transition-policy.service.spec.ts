import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { StageTransitionPolicyService } from '@/modules/stage-policy/stage-transition-policy.service';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';

describe('StageTransitionPolicyService', () => {
  let service: StageTransitionPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StageTransitionPolicyService]
    }).compile();

    service = module.get<StageTransitionPolicyService>(StageTransitionPolicyService);
  });

  it('resolves the default initial stage when create stage is not provided', () => {
    expect(service.resolveInitialStageForCreate()).toBe(TransactionStage.AGREEMENT);
  });

  it('accepts agreement as the initial create stage', () => {
    expect(service.resolveInitialStageForCreate(TransactionStage.AGREEMENT)).toBe(
      TransactionStage.AGREEMENT
    );
  });

  it.each([
    [TransactionStage.EARNEST_MONEY],
    [TransactionStage.TITLE_DEED],
    [TransactionStage.COMPLETED]
  ])('rejects invalid create-stage input: %s', (stage) => {
    expect(() => service.resolveInitialStageForCreate(stage)).toThrow(BadRequestException);
    expect(() => service.resolveInitialStageForCreate(stage)).toThrow(
      /must start at "agreement" stage/i
    );
  });

  it.each([
    [TransactionStage.AGREEMENT, TransactionStage.EARNEST_MONEY],
    [TransactionStage.EARNEST_MONEY, TransactionStage.TITLE_DEED],
    [TransactionStage.TITLE_DEED, TransactionStage.COMPLETED]
  ])('allows only immediate forward transition: %s -> %s', (current, target) => {
    expect(() => service.assertValidTransition(current, target)).not.toThrow();
  });

  it.each([
    [TransactionStage.AGREEMENT, TransactionStage.TITLE_DEED],
    [TransactionStage.AGREEMENT, TransactionStage.COMPLETED],
    [TransactionStage.EARNEST_MONEY, TransactionStage.COMPLETED]
  ])('rejects skipping stages: %s -> %s', (current, target) => {
    expect(() => service.assertValidTransition(current, target)).toThrow(BadRequestException);
    expect(() => service.assertValidTransition(current, target)).toThrow(/cannot skip stages/i);
  });

  it.each([
    [TransactionStage.EARNEST_MONEY, TransactionStage.AGREEMENT],
    [TransactionStage.TITLE_DEED, TransactionStage.EARNEST_MONEY]
  ])('rejects moving backwards: %s -> %s', (current, target) => {
    expect(() => service.assertValidTransition(current, target)).toThrow(BadRequestException);
    expect(() => service.assertValidTransition(current, target)).toThrow(/cannot move backwards/i);
  });

  it.each([
    [TransactionStage.AGREEMENT],
    [TransactionStage.EARNEST_MONEY],
    [TransactionStage.TITLE_DEED],
    [TransactionStage.COMPLETED]
  ])('rejects no-op transition: %s -> %s', (stage) => {
    expect(() => service.assertValidTransition(stage, stage)).toThrow(BadRequestException);
    expect(() => service.assertValidTransition(stage, stage)).toThrow(/already in stage/i);
  });

  it('rejects transitions from final stage with clear error', () => {
    expect(() =>
      service.assertValidTransition(TransactionStage.COMPLETED, TransactionStage.AGREEMENT)
    ).toThrow(/final stage/i);
  });

  it('rejects unknown transition stages with clear error', () => {
    expect(() =>
      service.assertValidTransition('agreement' as TransactionStage, 'invalid_stage' as TransactionStage)
    ).toThrow(/Unknown transaction stage/i);
  });

  it.each([
    [TransactionStage.AGREEMENT, TransactionStage.EARNEST_MONEY],
    [TransactionStage.EARNEST_MONEY, TransactionStage.TITLE_DEED],
    [TransactionStage.TITLE_DEED, TransactionStage.COMPLETED],
    [TransactionStage.COMPLETED, null]
  ])('returns next allowed stage: %s -> %s', (current, expectedNext) => {
    expect(service.getNextAllowedStage(current)).toBe(expectedNext);
  });

  it('rejects getNextAllowedStage requests for unknown stages', () => {
    expect(() => service.getNextAllowedStage('invalid_stage' as TransactionStage)).toThrow(
      /Unknown transaction stage/i
    );
  });
});
