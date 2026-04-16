import { BadRequestException, Injectable } from '@nestjs/common';

import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';

@Injectable()
export class StageTransitionPolicyService {
  private static readonly ORDERED_STAGES: readonly TransactionStage[] = [
    TransactionStage.AGREEMENT,
    TransactionStage.EARNEST_MONEY,
    TransactionStage.TITLE_DEED,
    TransactionStage.COMPLETED
  ] as const;
  private static readonly INITIAL_STAGE = StageTransitionPolicyService.ORDERED_STAGES[0];
  private static readonly STAGE_INDEX_BY_STAGE: Record<TransactionStage, number> =
    StageTransitionPolicyService.ORDERED_STAGES.reduce(
      (acc, stage, index) => {
        acc[stage] = index;
        return acc;
      },
      {} as Record<TransactionStage, number>
    );
  private static readonly NEXT_STAGE_BY_STAGE: Record<
    TransactionStage,
    TransactionStage | null
  > = StageTransitionPolicyService.ORDERED_STAGES.reduce(
    (acc, stage, index) => {
      acc[stage] = StageTransitionPolicyService.ORDERED_STAGES[index + 1] ?? null;
      return acc;
    },
    {} as Record<TransactionStage, TransactionStage | null>
  );

  resolveInitialStageForCreate(stage?: TransactionStage): TransactionStage {
    const initialStage = StageTransitionPolicyService.INITIAL_STAGE;

    if (!stage) {
      return initialStage;
    }

    this.getStageIndex(stage);

    if (stage !== initialStage) {
      throw new BadRequestException(
        `New transactions must start at "${initialStage}" stage. Use the dedicated stage transition endpoint for progression.`
      );
    }

    return stage;
  }

  assertValidTransition(current: TransactionStage, target: TransactionStage): void {
    const currentIndex = this.getStageIndex(current);
    const targetIndex = this.getStageIndex(target);
    const nextAllowedStage = StageTransitionPolicyService.NEXT_STAGE_BY_STAGE[current];

    if (currentIndex === targetIndex) {
      throw new BadRequestException(`Transaction is already in stage "${target}".`);
    }

    if (!nextAllowedStage) {
      throw new BadRequestException(
        `Invalid stage transition: "${current}" is the final stage and cannot transition to "${target}".`
      );
    }

    if (targetIndex < currentIndex) {
      throw new BadRequestException(
        `Invalid stage transition: cannot move backwards from "${current}" to "${target}".`
      );
    }

    if (target !== nextAllowedStage) {
      throw new BadRequestException(
        `Invalid stage transition: cannot skip stages from "${current}" to "${target}". Next allowed stage is "${nextAllowedStage}".`
      );
    }
  }

  getNextAllowedStage(current: TransactionStage): TransactionStage | null {
    this.getStageIndex(current);
    return StageTransitionPolicyService.NEXT_STAGE_BY_STAGE[current];
  }

  private getStageIndex(stage: TransactionStage): number {
    const index = StageTransitionPolicyService.STAGE_INDEX_BY_STAGE[stage];

    if (index === undefined) {
      throw new BadRequestException(`Unknown transaction stage "${stage}".`);
    }

    return index;
  }
}
