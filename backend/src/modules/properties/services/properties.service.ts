import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { ClientsService } from '@/modules/clients/services/clients.service';
import { CreatePropertyDto } from '@/modules/properties/dto/create-property.dto';
import { UpdatePropertyDto } from '@/modules/properties/dto/update-property.dto';
import { Property, PropertyDocument } from '@/modules/properties/schemas/property.schema';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly clientsService: ClientsService
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    actorAgentId: string,
    organizationId: string
  ): Promise<PropertyDocument> {
    await this.ensureOwnerClientBelongsToOrganization(
      createPropertyDto.ownerClientId,
      organizationId
    );

    return this.propertyModel.create({
      ...createPropertyDto,
      ownerClientId: createPropertyDto.ownerClientId
        ? new Types.ObjectId(createPropertyDto.ownerClientId)
        : null,
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(actorAgentId),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null
    });
  }

  async findAll(organizationId: string): Promise<PropertyDocument[]> {
    return this.withPopulation(
      this.propertyModel
        .find(this.activeTenantFilter(organizationId))
        .sort({ createdAt: -1, _id: -1 })
    ).exec();
  }

  async findOne(id: string, organizationId: string): Promise<PropertyDocument> {
    this.validateObjectId(id, 'propertyId');

    const property = await this.withPopulation(
      this.propertyModel.findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
    ).exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    actorAgentId: string,
    organizationId: string
  ): Promise<PropertyDocument> {
    this.validateObjectId(id, 'propertyId');
    await this.ensureOwnerClientBelongsToOrganization(
      updatePropertyDto.ownerClientId,
      organizationId
    );
    const ownerClientUpdate = this.buildOwnerClientUpdate(updatePropertyDto.ownerClientId);

    const updatePayload = {
      ...updatePropertyDto,
      ...ownerClientUpdate,
      updatedBy: new Types.ObjectId(actorAgentId)
    };

    const updatedProperty = await this.withPopulation(
      this.propertyModel.findOneAndUpdate(
        {
          ...this.activeTenantFilter(organizationId),
          _id: id
        },
        updatePayload,
        {
          new: true,
          runValidators: true
        }
      )
    ).exec();

    if (!updatedProperty) {
      throw new NotFoundException('Property not found');
    }

    return updatedProperty;
  }

  async remove(id: string, actorAgentId: string, organizationId: string): Promise<void> {
    this.validateObjectId(id, 'propertyId');

    const deletedProperty = await this.propertyModel
      .findOneAndUpdate(
        {
          ...this.activeTenantFilter(organizationId),
          _id: id
        },
        {
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(actorAgentId),
          updatedBy: new Types.ObjectId(actorAgentId)
        },
        { new: false }
      )
      .exec();

    if (!deletedProperty) {
      throw new NotFoundException('Property not found');
    }
  }

  async ensurePropertyBelongsToOrganization(
    propertyId: string | null | undefined,
    organizationId: string
  ): Promise<void> {
    if (!propertyId) {
      return;
    }

    this.validateObjectId(propertyId, 'propertyId');

    const exists = await this.propertyModel
      .exists({
        ...this.activeTenantFilter(organizationId),
        _id: new Types.ObjectId(propertyId)
      })
      .exec();

    if (!exists) {
      throw new BadRequestException('Linked property was not found for this organization.');
    }
  }

  private async ensureOwnerClientBelongsToOrganization(
    ownerClientId: string | null | undefined,
    organizationId: string
  ): Promise<void> {
    if (!ownerClientId) {
      return;
    }

    this.validateObjectId(ownerClientId, 'ownerClientId');

    try {
      await this.clientsService.ensureClientsBelongToOrganization([ownerClientId], organizationId);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          'ownerClientId must reference an active client in the same organization.'
        );
      }

      throw error;
    }
  }

  private buildOwnerClientUpdate(ownerClientId: string | null | undefined): {
    ownerClientId?: Types.ObjectId | null;
  } {
    if (ownerClientId === undefined) {
      return {};
    }

    return {
      ownerClientId: ownerClientId ? new Types.ObjectId(ownerClientId) : null
    };
  }

  private activeTenantFilter(organizationId: string): FilterQuery<Property> {
    return {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null
    };
  }

  private withPopulation<T>(query: T): T {
    const queryWithPopulate = query as {
      populate(field: string, projection: string): unknown;
    };

    queryWithPopulate.populate('ownerClientId', 'fullName email phone type');
    queryWithPopulate.populate('createdBy', 'name email isActive');
    queryWithPopulate.populate('updatedBy', 'name email isActive');
    queryWithPopulate.populate('deletedBy', 'name email isActive');

    return query;
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }
}
