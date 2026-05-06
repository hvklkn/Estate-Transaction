import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ClientsService } from '@/modules/clients/services/clients.service';
import { PropertyListingType } from '@/modules/properties/domain/property-listing-type.enum';
import { PropertyType } from '@/modules/properties/domain/property-type.enum';
import { Property } from '@/modules/properties/schemas/property.schema';
import { PropertiesService } from '@/modules/properties/services/properties.service';

const ORGANIZATION_ID = '661b8c0134e2c40fd2f89c11';
const OTHER_ORGANIZATION_ID = '661b8c0134e2c40fd2f89c22';
const PROPERTY_ID = '661b8c0134e2c40fd2f89d11';
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

describe('PropertiesService', () => {
  let service: PropertiesService;

  const propertyModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    exists: jest.fn()
  };

  const clientsServiceMock = {
    ensureClientsBelongToOrganization: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getModelToken(Property.name),
          useValue: propertyModelMock
        },
        {
          provide: ClientsService,
          useValue: clientsServiceMock
        }
      ]
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  it('validates owner client and creates property in the authenticated organization', async () => {
    const payload = {
      title: 'Sunset Villas #12',
      type: PropertyType.APARTMENT,
      listingType: PropertyListingType.SALE,
      ownerClientId: CLIENT_ID
    };
    const createdProperty = { _id: PROPERTY_ID, ...payload };

    propertyModelMock.create.mockResolvedValue(createdProperty);

    const result = await service.create(payload, ACTOR_AGENT_ID, ORGANIZATION_ID);

    expect(clientsServiceMock.ensureClientsBelongToOrganization).toHaveBeenCalledWith(
      [CLIENT_ID],
      ORGANIZATION_ID
    );
    expect(propertyModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sunset Villas #12',
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        ownerClientId: new Types.ObjectId(CLIENT_ID),
        createdBy: new Types.ObjectId(ACTOR_AGENT_ID),
        deletedAt: null
      })
    );
    expect(result).toEqual(createdProperty);
  });

  it('creates property without an owner client when ownerClientId is omitted', async () => {
    const payload = {
      title: 'No Owner Listing',
      type: PropertyType.HOUSE,
      listingType: PropertyListingType.RENT
    };
    const createdProperty = { _id: PROPERTY_ID, ...payload, ownerClientId: null };

    propertyModelMock.create.mockResolvedValue(createdProperty);

    const result = await service.create(payload, ACTOR_AGENT_ID, ORGANIZATION_ID);

    expect(clientsServiceMock.ensureClientsBelongToOrganization).not.toHaveBeenCalled();
    expect(propertyModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'No Owner Listing',
        organizationId: new Types.ObjectId(ORGANIZATION_ID),
        ownerClientId: null
      })
    );
    expect(result).toEqual(createdProperty);
  });

  it('returns a clear owner client organization mismatch error', async () => {
    clientsServiceMock.ensureClientsBelongToOrganization.mockRejectedValue(
      new BadRequestException('One or more linked clients were not found for this organization.')
    );

    await expect(
      service.create(
        {
          title: 'Mismatch Listing',
          type: PropertyType.APARTMENT,
          listingType: PropertyListingType.SALE,
          ownerClientId: CLIENT_ID
        },
        ACTOR_AGENT_ID,
        ORGANIZATION_ID
      )
    ).rejects.toThrow('ownerClientId must reference an active client in the same organization.');
  });

  it('scopes list queries to active properties in the current organization', async () => {
    const query = createQueryMock([]);
    propertyModelMock.find.mockReturnValue(query);

    await service.findAll(ORGANIZATION_ID);

    expect(propertyModelMock.find).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
  });

  it('does not return a property from another organization', async () => {
    propertyModelMock.findOne.mockReturnValue(createQueryMock(null));

    await expect(service.findOne(PROPERTY_ID, OTHER_ORGANIZATION_ID)).rejects.toThrow(
      NotFoundException
    );
    expect(propertyModelMock.findOne).toHaveBeenCalledWith({
      _id: PROPERTY_ID,
      organizationId: new Types.ObjectId(OTHER_ORGANIZATION_ID),
      deletedAt: null
    });
  });

  it('validates linked transaction property using the organization filter', async () => {
    propertyModelMock.exists.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: PROPERTY_ID })
    });

    await service.ensurePropertyBelongsToOrganization(PROPERTY_ID, ORGANIZATION_ID);

    expect(propertyModelMock.exists).toHaveBeenCalledWith({
      _id: new Types.ObjectId(PROPERTY_ID),
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null
    });
  });
});
