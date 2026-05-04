import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { TEAM_MANAGER_ROLES } from '@/common/auth/role-permissions';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { UpdateTransactionDto } from '@/modules/transactions/dto/update-transaction.dto';

type TransactionMutationTarget = {
  stage: TransactionStage;
  isDeleted?: boolean;
  createdBy?: Types.ObjectId | null;
  listingAgentId: Types.ObjectId;
  sellingAgentId: Types.ObjectId;
};

const LOCKED_FIELDS_AFTER_AGREEMENT: ReadonlyArray<keyof UpdateTransactionDto> = [
  'listingAgentId',
  'sellingAgentId',
  'transactionType',
  'totalServiceFee'
];

@Injectable()
export class TransactionMutationPolicyService {
  private readonly privilegedRoles = new Set<AgentRole>(TEAM_MANAGER_ROLES);

  assertCanMutate(transaction: TransactionMutationTarget, actorAgentId: string): void {
    const allowedActorIds = new Set(
      [
        transaction.createdBy?.toString() ?? null,
        transaction.listingAgentId.toString(),
        transaction.sellingAgentId.toString()
      ].filter((value): value is string => Boolean(value))
    );

    if (!allowedActorIds.has(actorAgentId)) {
      throw new ForbiddenException(
        'You are not allowed to modify this transaction. Only creator, listing agent, or selling agent can mutate.'
      );
    }
  }

  assertNotCompleted(transaction: TransactionMutationTarget): void {
    if (transaction.stage === TransactionStage.COMPLETED) {
      throw new ConflictException(
        'Completed transactions are immutable and cannot be edited, staged, or deleted.'
      );
    }
  }

  assertNotDeleted(transaction: TransactionMutationTarget): void {
    if (transaction.isDeleted) {
      throw new ConflictException('Deleted transactions cannot be modified.');
    }
  }

  assertCanDelete(
    transaction: TransactionMutationTarget,
    actorAgentId: string,
    actorRole: AgentRole
  ): void {
    if (this.privilegedRoles.has(actorRole)) {
      return;
    }

    this.assertCanMutate(transaction, actorAgentId);
    this.assertNotCompleted(transaction);
  }

  assertValidUpdatePayloadForCurrentStage(
    transaction: TransactionMutationTarget,
    updateTransactionDto: UpdateTransactionDto
  ): void {
    if (transaction.stage === TransactionStage.AGREEMENT) {
      return;
    }

    const attemptedLockedFields = LOCKED_FIELDS_AFTER_AGREEMENT.filter(
      (field) => updateTransactionDto[field] !== undefined
    );

    if (attemptedLockedFields.length > 0) {
      throw new ConflictException(
        `The following fields cannot be updated after "${TransactionStage.AGREEMENT}" stage: ${attemptedLockedFields.join(
          ', '
        )}.`
      );
    }
  }
}
