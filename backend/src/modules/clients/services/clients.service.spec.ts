import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ClientType } from '@/modules/clients/domain/client-type.enum';
import { Client } from '@/modules/clients/schemas/client.schema';
import { ClientsService } from '@/modules/clients/services/clients.service';

const ORGANIZATION_ID = '661b8c0134e2c40fd2f89c11';
const OTHER_ORGANIZATION_ID = '661b8c0134e2c40fd2f89c22';
const CLIENT_ID = '661b8c0134e2c40fd2f89e11';
const ACTOR_AGENT_ID = '661b8c0134e2c40fd2f89a33';

const createQueryMock = <T>(result: T) => {
  const query = {
    populate: jest.fn(),
    sort: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);

  return query;
};

describe('ClientsService', () => {
  let service: ClientsService;

  const clientModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getModelToken(Client.name),
          useValue: clientModelMock
        }
      ]
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('creates clients in the authenticated organization with audit fields', async () => {
    const payload = {
      fullName: 'Ada Buyer',
      type: ClientType.BUYER
    };
    const createdClient = { _id: CLIENT_ID, ...payload };

    clientModelMock.create.mockResolvedValue(createdClient);

    const result = await service.create(payload, ACTOR_AGENT_ID, ORGANIZATION_ID);

    expect(clientModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Ada Buyer',
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        createdBy: new Types.ObjectId(ACTOR_AGENT_ID),
        deletedAt: null
      })
    );
    expect(result).toEqual(createdClient);
  });

  it('scopes list queries to active clients in the current organization', async () => {
    const query = createQueryMock([]);
    clientModelMock.find.mockReturnValue(query);

    await service.findAll(ORGANIZATION_ID);

    expect(clientModelMock.find).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null
    });
    expect(query.sort).toHaveBeenCalledWith({ fullName: 1, _id: 1 });
  });

  it('does not return a client from another organization', async () => {
    clientModelMock.findOne.mockReturnValue(createQueryMock(null));

    await expect(service.findOne(CLIENT_ID, OTHER_ORGANIZATION_ID)).rejects.toThrow(
      NotFoundException
    );
    expect(clientModelMock.findOne).toHaveBeenCalledWith({
      _id: CLIENT_ID,
      organizationId: new Types.ObjectId(OTHER_ORGANIZATION_ID),
      deletedAt: null
    });
  });

  it('validates linked clients using the organization filter', async () => {
    clientModelMock.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1)
    });

    await service.ensureClientsBelongToOrganization([CLIENT_ID], ORGANIZATION_ID);

    expect(clientModelMock.countDocuments).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null,
      _id: {
        $in: [new Types.ObjectId(CLIENT_ID)]
      }
    });
  });
});
