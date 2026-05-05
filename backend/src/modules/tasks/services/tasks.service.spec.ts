import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AgentsService } from '@/modules/agents/services/agents.service';
import { ClientsService } from '@/modules/clients/services/clients.service';
import { PropertiesService } from '@/modules/properties/services/properties.service';
import { TaskPriority } from '@/modules/tasks/domain/task-priority.enum';
import { TaskStatus } from '@/modules/tasks/domain/task-status.enum';
import { Task } from '@/modules/tasks/schemas/task.schema';
import { TaskPolicyService } from '@/modules/tasks/services/task-policy.service';
import { TasksService } from '@/modules/tasks/services/tasks.service';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

const ORGANIZATION_ID = '661b8c0134e2c40fd2f89c11';
const OTHER_ORGANIZATION_ID = '661b8c0134e2c40fd2f89c22';
const TASK_ID = '661b8c0134e2c40fd2f89d11';
const ACTOR_AGENT_ID = '661b8c0134e2c40fd2f89a11';
const OTHER_AGENT_ID = '661b8c0134e2c40fd2f89a22';
const TRANSACTION_ID = '661b8c0134e2c40fd2f89b33';
const CLIENT_ID = '661b8c0134e2c40fd2f89e11';
const PROPERTY_ID = '661b8c0134e2c40fd2f89f11';

const createQueryMock = <T>(result: T) => {
  const query = {
    populate: jest.fn(),
    sort: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return query;
};

describe('TasksService', () => {
  let service: TasksService;

  const taskModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn()
  };

  const agentsServiceMock = {
    ensureAgentExists: jest.fn()
  };

  const clientsServiceMock = {
    ensureClientsBelongToOrganization: jest.fn()
  };

  const propertiesServiceMock = {
    ensurePropertyBelongsToOrganization: jest.fn()
  };

  const transactionsServiceMock = {
    ensureTransactionBelongsToOrganization: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        TaskPolicyService,
        {
          provide: getModelToken(Task.name),
          useValue: taskModelMock
        },
        {
          provide: AgentsService,
          useValue: agentsServiceMock
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
          provide: TransactionsService,
          useValue: transactionsServiceMock
        }
      ]
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('creates tasks with tenant/audit fields and validates all provided relations', async () => {
    const payload = {
      title: 'Call seller',
      description: 'Confirm deed documents.',
      dueDate: '2026-05-06T09:00:00.000Z',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assignedTo: ACTOR_AGENT_ID,
      relatedTransactionId: TRANSACTION_ID,
      relatedClientId: CLIENT_ID,
      relatedPropertyId: PROPERTY_ID
    };
    const createdTask = { _id: TASK_ID, ...payload };
    taskModelMock.create.mockResolvedValue(createdTask);

    const result = await service.create(payload, ACTOR_AGENT_ID, 'agent', ORGANIZATION_ID);

    expect(agentsServiceMock.ensureAgentExists).toHaveBeenCalledWith(
      ACTOR_AGENT_ID,
      ORGANIZATION_ID
    );
    expect(transactionsServiceMock.ensureTransactionBelongsToOrganization).toHaveBeenCalledWith(
      TRANSACTION_ID,
      ORGANIZATION_ID
    );
    expect(clientsServiceMock.ensureClientsBelongToOrganization).toHaveBeenCalledWith(
      [CLIENT_ID],
      ORGANIZATION_ID
    );
    expect(propertiesServiceMock.ensurePropertyBelongsToOrganization).toHaveBeenCalledWith(
      PROPERTY_ID,
      ORGANIZATION_ID
    );
    expect(taskModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Call seller',
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        assignedTo: new Types.ObjectId(ACTOR_AGENT_ID),
        relatedTransactionId: new Types.ObjectId(TRANSACTION_ID),
        relatedClientId: new Types.ObjectId(CLIENT_ID),
        relatedPropertyId: new Types.ObjectId(PROPERTY_ID),
        createdBy: new Types.ObjectId(ACTOR_AGENT_ID),
        deletedAt: null
      })
    );
    expect(result).toEqual(createdTask);
  });

  it('scopes task list queries to the current organization', async () => {
    const query = createQueryMock([]);
    taskModelMock.find.mockReturnValue(query);

    await service.findAll({}, ORGANIZATION_ID);

    expect(taskModelMock.find).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null
    });
  });

  it('does not return a task from another organization', async () => {
    taskModelMock.findOne.mockReturnValue(createQueryMock(null));

    await expect(service.findOne(TASK_ID, OTHER_ORGANIZATION_ID)).rejects.toThrow(
      NotFoundException
    );
    expect(taskModelMock.findOne).toHaveBeenCalledWith({
      _id: TASK_ID,
      organizationId: new Types.ObjectId(OTHER_ORGANIZATION_ID),
      deletedAt: null
    });
  });

  it('prevents agents from updating tasks assigned to someone else', async () => {
    taskModelMock.findOne.mockReturnValue(
      createQueryMock({
        _id: TASK_ID,
        assignedTo: new Types.ObjectId(OTHER_AGENT_ID)
      })
    );

    await expect(
      service.update(
        TASK_ID,
        { status: TaskStatus.IN_PROGRESS },
        ACTOR_AGENT_ID,
        'agent',
        ORGANIZATION_ID
      )
    ).rejects.toThrow(ForbiddenException);
  });
});
