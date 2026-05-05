import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

import { PropertyListingType } from '@/modules/properties/domain/property-listing-type.enum';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';
import { ReportsService } from '@/modules/reports/services/reports.service';

const ORGANIZATION_ID = '665f1f77bcf86cd799439011';
const OTHER_ORGANIZATION_ID = '665f1f77bcf86cd799439012';
const AGENT_ID = '665f1f77bcf86cd799439021';
const OTHER_AGENT_ID = '665f1f77bcf86cd799439022';
const PROPERTY_ID = '665f1f77bcf86cd799439031';

const createQuery = <T>(value: T) => {
  const query: {
    select: jest.Mock;
    sort: jest.Mock;
    limit: jest.Mock;
    lean: jest.Mock;
    exec: jest.Mock;
  } = {
    select: jest.fn(),
    sort: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(value)
  };
  query.select.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.lean.mockReturnValue(query);
  return query;
};

const createReportModel = (aggregateResolver: (pipeline: unknown[]) => unknown[] = () => []) => ({
  aggregate: jest.fn((pipeline: unknown[]) => ({
    exec: jest.fn().mockResolvedValue(aggregateResolver(pipeline))
  })),
  countDocuments: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(0) })),
  distinct: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
  find: jest.fn(() => createQuery([]))
});

describe('ReportsService', () => {
  const createService = () => {
    const transactionModel = createReportModel((pipeline) => {
      const group = (pipeline[1] as { $group?: { _id?: unknown } })?.$group;
      if (group?._id === '$stage') {
        return [{ _id: TransactionStage.COMPLETED, count: 2 }];
      }

      if (group?._id === '$transactionType') {
        return [{ _id: TransactionType.SOLD, count: 2 }];
      }

      return [];
    });
    const agentModel = createReportModel();
    const taskModel = createReportModel();
    const noteModel = createReportModel();
    const clientModel = createReportModel();
    const propertyModel = createReportModel();
    const ledgerModel = createReportModel();

    const service = new ReportsService(
      transactionModel as never,
      agentModel as never,
      taskModel as never,
      noteModel as never,
      clientModel as never,
      propertyModel as never,
      ledgerModel as never
    );

    return {
      service,
      transactionModel,
      propertyModel
    };
  };

  it('scopes summary aggregations to the current organization', async () => {
    const { service, transactionModel } = createService();

    const result = await service.getSummary({}, {
      currentAgentId: AGENT_ID,
      currentAgentRole: 'manager',
      organizationId: ORGANIZATION_ID
    });

    expect(result.transactionCountsByStage).toEqual([
      { key: TransactionStage.COMPLETED, count: 2 }
    ]);
    const firstPipeline = transactionModel.aggregate.mock.calls[0][0] as Array<{ $match?: Record<string, unknown> }>;
    expect(firstPipeline[0].$match?.organizationId?.toString()).toBe(ORGANIZATION_ID);
    expect(firstPipeline[0].$match?.organizationId?.toString()).not.toBe(OTHER_ORGANIZATION_ID);
  });

  it('limits agent report access to the current agent', async () => {
    const { service, transactionModel } = createService();

    await service.getSummary(
      { agentId: OTHER_AGENT_ID },
      {
        currentAgentId: AGENT_ID,
        currentAgentRole: 'agent',
        organizationId: ORGANIZATION_ID
      }
    );

    const firstPipeline = transactionModel.aggregate.mock.calls[0][0] as Array<{ $match?: { $or?: Array<Record<string, Types.ObjectId>> } }>;
    const matchedAgentIds = firstPipeline[0].$match?.$or?.map((condition) =>
      Object.values(condition)[0].toString()
    );
    expect(matchedAgentIds).toEqual([AGENT_ID, AGENT_ID, AGENT_ID]);
  });

  it('blocks agent CSV exports', async () => {
    const { service } = createService();

    await expect(service.exportTransactionsCsv({}, ORGANIZATION_ID, 'agent')).rejects.toThrow(
      ForbiddenException
    );
  });

  it('applies tenant and property-listing filters to transaction exports', async () => {
    const { service, transactionModel, propertyModel } = createService();
    propertyModel.distinct.mockReturnValue({
      exec: jest.fn().mockResolvedValue([new Types.ObjectId(PROPERTY_ID)])
    });

    await service.exportTransactionsCsv(
      { propertyListingType: PropertyListingType.SALE },
      ORGANIZATION_ID,
      'manager'
    );

    expect(propertyModel.distinct).toHaveBeenCalledWith('_id', {
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null,
      listingType: 'sale'
    });
    const transactionFindFilter = ((transactionModel.find as jest.Mock).mock.calls[0][0] as unknown) as {
      organizationId: Types.ObjectId;
      propertyId: { $in: Types.ObjectId[] };
    };
    expect(transactionFindFilter.organizationId.toString()).toBe(ORGANIZATION_ID);
    expect(transactionFindFilter.propertyId.$in[0].toString()).toBe(PROPERTY_ID);
  });
});
