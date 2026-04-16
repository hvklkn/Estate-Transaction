import { BadRequestException, Injectable } from '@nestjs/common';

import {
  CommissionAgentRole,
  CommissionCalculationInput,
  CommissionCalculationResult
} from '@/modules/commissions/domain/commission.types';

@Injectable()
export class CommissionCalculatorService {
  private static readonly AGENCY_SHARE_RATIO = 0.5;
  private static readonly SAME_AGENT_EXPLANATION =
    'Listing and selling agent is the same person, so this agent receives the full agent portion.';
  private static readonly SPLIT_EQUAL_EXPLANATION =
    'Listing and selling agents are different people, so the agent portion is split equally.';
  private static readonly SPLIT_LISTING_REMAINDER_EXPLANATION =
    'Listing and selling agents are different people, so the agent portion is split as evenly as possible. Listing agent receives the remainder cent.';
  private static readonly SPLIT_SELLING_REMAINDER_EXPLANATION =
    'Listing and selling agents are different people, so the agent portion is split as evenly as possible. Selling agent receives the remaining amount.';

  calculate(input: CommissionCalculationInput): CommissionCalculationResult {
    const normalizedInput = this.validateAndNormalizeInput(input);
    const totalServiceFeeCents = this.toCents(normalizedInput.totalServiceFee);
    const agencyAmountCents = Math.round(
      totalServiceFeeCents * CommissionCalculatorService.AGENCY_SHARE_RATIO
    );
    const agentPoolAmountCents = totalServiceFeeCents - agencyAmountCents;

    if (normalizedInput.listingAgentId === normalizedInput.sellingAgentId) {
      return {
        agencyAmount: this.fromCents(agencyAmountCents),
        agentPoolAmount: this.fromCents(agentPoolAmountCents),
        agents: [
          {
            agentId: normalizedInput.listingAgentId,
            role: CommissionAgentRole.LISTING_AND_SELLING,
            amount: this.fromCents(agentPoolAmountCents),
            explanation: CommissionCalculatorService.SAME_AGENT_EXPLANATION
          }
        ]
      };
    }

    const listingAgentAmountCents = Math.ceil(agentPoolAmountCents / 2);
    const sellingAgentAmountCents = agentPoolAmountCents - listingAgentAmountCents;
    const hasRemainderCent = listingAgentAmountCents !== sellingAgentAmountCents;

    return {
      agencyAmount: this.fromCents(agencyAmountCents),
      agentPoolAmount: this.fromCents(agentPoolAmountCents),
      agents: [
        {
          agentId: normalizedInput.listingAgentId,
          role: CommissionAgentRole.LISTING,
          amount: this.fromCents(listingAgentAmountCents),
          explanation: hasRemainderCent
            ? CommissionCalculatorService.SPLIT_LISTING_REMAINDER_EXPLANATION
            : CommissionCalculatorService.SPLIT_EQUAL_EXPLANATION
        },
        {
          agentId: normalizedInput.sellingAgentId,
          role: CommissionAgentRole.SELLING,
          amount: this.fromCents(sellingAgentAmountCents),
          explanation: hasRemainderCent
            ? CommissionCalculatorService.SPLIT_SELLING_REMAINDER_EXPLANATION
            : CommissionCalculatorService.SPLIT_EQUAL_EXPLANATION
        }
      ]
    };
  }

  private toCents(value: number): number {
    return Math.round((value + Number.EPSILON) * 100);
  }

  private fromCents(value: number): number {
    return value / 100;
  }

  private validateAndNormalizeInput(
    input: CommissionCalculationInput
  ): CommissionCalculationInput {
    if (!Number.isFinite(input.totalServiceFee) || input.totalServiceFee < 0) {
      throw new BadRequestException('totalServiceFee must be a non-negative number.');
    }

    if (typeof input.listingAgentId !== 'string' || typeof input.sellingAgentId !== 'string') {
      throw new BadRequestException('listingAgentId and sellingAgentId must be strings.');
    }

    const listingAgentId = input.listingAgentId.trim();
    const sellingAgentId = input.sellingAgentId.trim();

    if (!listingAgentId || !sellingAgentId) {
      throw new BadRequestException('listingAgentId and sellingAgentId are required.');
    }

    return {
      ...input,
      listingAgentId,
      sellingAgentId
    };
  }
}
