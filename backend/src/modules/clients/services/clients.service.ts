import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { CreateClientDto } from '@/modules/clients/dto/create-client.dto';
import { UpdateClientDto } from '@/modules/clients/dto/update-client.dto';
import { Client, ClientDocument } from '@/modules/clients/schemas/client.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>
  ) {}

  async create(
    createClientDto: CreateClientDto,
    actorAgentId: string,
    organizationId: string
  ): Promise<ClientDocument> {
    return this.clientModel.create({
      ...createClientDto,
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(actorAgentId),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null
    });
  }

  async findAll(organizationId: string): Promise<ClientDocument[]> {
    return this.withPopulation(
      this.clientModel.find(this.activeTenantFilter(organizationId)).sort({ fullName: 1, _id: 1 })
    ).exec();
  }

  async findOne(id: string, organizationId: string): Promise<ClientDocument> {
    this.validateObjectId(id, 'clientId');

    const client = await this.withPopulation(
      this.clientModel.findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
    ).exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
    actorAgentId: string,
    organizationId: string
  ): Promise<ClientDocument> {
    this.validateObjectId(id, 'clientId');

    const updatedClient = await this.withPopulation(
      this.clientModel.findOneAndUpdate(
        {
          ...this.activeTenantFilter(organizationId),
          _id: id
        },
        {
          ...updateClientDto,
          updatedBy: new Types.ObjectId(actorAgentId)
        },
        {
          new: true,
          runValidators: true
        }
      )
    ).exec();

    if (!updatedClient) {
      throw new NotFoundException('Client not found');
    }

    return updatedClient;
  }

  async remove(id: string, actorAgentId: string, organizationId: string): Promise<void> {
    this.validateObjectId(id, 'clientId');

    const deletedClient = await this.clientModel
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

    if (!deletedClient) {
      throw new NotFoundException('Client not found');
    }
  }

  async ensureClientsBelongToOrganization(
    clientIds: string[] | undefined,
    organizationId: string
  ): Promise<void> {
    const uniqueClientIds = [...new Set(clientIds ?? [])];
    if (uniqueClientIds.length === 0) {
      return;
    }

    uniqueClientIds.forEach((clientId) => this.validateObjectId(clientId, 'clientId'));

    const count = await this.clientModel
      .countDocuments({
        ...this.activeTenantFilter(organizationId),
        _id: {
          $in: uniqueClientIds.map((clientId) => new Types.ObjectId(clientId))
        }
      })
      .exec();

    if (count !== uniqueClientIds.length) {
      throw new BadRequestException(
        'One or more linked clients were not found for this organization.'
      );
    }
  }

  private activeTenantFilter(organizationId: string): FilterQuery<Client> {
    return {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null
    };
  }

  private withPopulation<T>(query: T): T {
    const queryWithPopulate = query as {
      populate(field: string, projection: string): unknown;
    };

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
