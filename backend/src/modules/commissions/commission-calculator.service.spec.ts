import { Test, TestingModule } from '@nestjs/testing';

import { CommissionCalculatorService } from '@/modules/commissions/commission-calculator.service';
import { CommissionAgentRole } from '@/modules/commissions/domain/commission.types';

const LISTING_AGENT_ID = '661b8c0134e2c40fd2f89a11';
const SELLING_AGENT_ID = '661b8c0134e2c40fd2f89a22';

const expectDistributedTotalToMatchFee = (
  totalServiceFee: number,
  result: ReturnType<CommissionCalculatorService['calculate']>
) => {
  const distributedTotal = result.agencyAmount + result.agents.reduce((sum, agent) => sum + agent.amount, 0);
  expect(distributedTotal).toBe(totalServiceFee);
};

describe('CommissionCalculatorService', () => {
  let service: CommissionCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionCalculatorService]
    }).compile();

    service = module.get<CommissionCalculatorService>(CommissionCalculatorService);
  });

  it('allocates the full agent-side amount to one agent when listing and selling are the same', () => {
    const result = service.calculate({
      totalServiceFee: 120000,
      listingAgentId: LISTING_AGENT_ID,
      sellingAgentId: LISTING_AGENT_ID
    });

    expect(result.agencyAmount).toBeCloseTo(60000, 2);
    expect(result.agentPoolAmount).toBeCloseTo(60000, 2);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]).toMatchObject({
      agentId: LISTING_AGENT_ID,
      role: CommissionAgentRole.LISTING_AND_SELLING,
      amount: 60000
    });
    expect(result.agents[0].explanation).toContain('same person');
    expectDistributedTotalToMatchFee(120000, result);
  });

  it('splits the agent-side amount equally when listing and selling agents are different', () => {
    const result = service.calculate({
      totalServiceFee: 100000,
      listingAgentId: LISTING_AGENT_ID,
      sellingAgentId: SELLING_AGENT_ID
    });

    expect(result.agencyAmount).toBeCloseTo(50000, 2);
    expect(result.agentPoolAmount).toBeCloseTo(50000, 2);
    expect(result.agents).toHaveLength(2);
    expect(result.agents[0]).toMatchObject({
      agentId: LISTING_AGENT_ID,
      role: CommissionAgentRole.LISTING,
      amount: 25000
    });
    expect(result.agents[1]).toMatchObject({
      agentId: SELLING_AGENT_ID,
      role: CommissionAgentRole.SELLING,
      amount: 25000
    });
    expect(result.agents[0].explanation).toContain('split equally');
    expect(result.agents[1].explanation).toContain('split equally');
    expectDistributedTotalToMatchFee(100000, result);
  });

  it('handles odd-cent distributions deterministically and preserves the exact total', () => {
    const result = service.calculate({
      totalServiceFee: 999.99,
      listingAgentId: LISTING_AGENT_ID,
      sellingAgentId: SELLING_AGENT_ID
    });

    expect(result.agencyAmount).toBe(500);
    expect(result.agentPoolAmount).toBe(499.99);
    expect(result.agents[0].amount).toBe(250);
    expect(result.agents[1].amount).toBe(249.99);

    expectDistributedTotalToMatchFee(999.99, result);
    expect(result.agents[0].explanation).toContain('split as evenly as possible');
  });

  it.each([
    0,
    100000,
    87550,
    999.99
  ])('always allocates the agency share as half of the total fee (rounded to cents): %p', (totalServiceFee) => {
    const result = service.calculate({
      totalServiceFee,
      listingAgentId: LISTING_AGENT_ID,
      sellingAgentId: SELLING_AGENT_ID
    });

    expect(result.agencyAmount).toBeCloseTo(totalServiceFee / 2, 2);
    expectDistributedTotalToMatchFee(totalServiceFee, result);
  });

  it('returns deterministic output for the same input', () => {
    const input = {
      totalServiceFee: 120000,
      listingAgentId: LISTING_AGENT_ID,
      sellingAgentId: SELLING_AGENT_ID
    };

    const first = service.calculate(input);
    const second = service.calculate(input);

    expect(second).toEqual(first);
  });

  it.each([-100, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects invalid totalServiceFee values: %p',
    (totalServiceFee) => {
      expect(() =>
        service.calculate({
          totalServiceFee,
          listingAgentId: LISTING_AGENT_ID,
          sellingAgentId: SELLING_AGENT_ID
        })
      ).toThrow(/totalServiceFee must be a non-negative number/i);
    }
  );

  it('rejects missing agent ids', () => {
    expect(() =>
      service.calculate({
        totalServiceFee: 1000,
        listingAgentId: '',
        sellingAgentId: '   '
      })
    ).toThrow(/listingAgentId and sellingAgentId are required/i);
  });

  it('rejects non-string agent ids', () => {
    expect(() =>
      service.calculate({
        totalServiceFee: 1000,
        listingAgentId: LISTING_AGENT_ID,
        sellingAgentId: 42 as unknown as string
      })
    ).toThrow(/must be strings/i);
  });

  it('normalizes agent ids before returning allocations', () => {
    const result = service.calculate({
      totalServiceFee: 1000,
      listingAgentId: ` ${LISTING_AGENT_ID} `,
      sellingAgentId: ` ${SELLING_AGENT_ID} `
    });

    expect(result.agents[0].agentId).toBe(LISTING_AGENT_ID);
    expect(result.agents[1].agentId).toBe(SELLING_AGENT_ID);
  });
});
