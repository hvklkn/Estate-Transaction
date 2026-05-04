import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Organization,
  OrganizationDocument
} from '@/modules/organizations/schemas/organization.schema';

export type OrganizationView = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>
  ) {}

  async hasAnyOrganizations(): Promise<boolean> {
    const count = await this.organizationModel.estimatedDocumentCount().exec();
    return count > 0;
  }

  async create(params: {
    name: string;
    ownerId: string;
    slug?: string;
  }): Promise<OrganizationDocument> {
    this.validateObjectId(params.ownerId, 'ownerId');

    const name = params.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Organization name must be at least 2 characters.');
    }

    const slug = this.normalizeSlug(params.slug ?? name);
    if (slug.length < 2) {
      throw new BadRequestException('Organization slug must be at least 2 characters.');
    }

    try {
      return await this.organizationModel.create({
        name,
        slug,
        ownerId: new Types.ObjectId(params.ownerId),
        isActive: true
      });
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Organization slug already exists');
      }

      throw error;
    }
  }

  async createDefaultForAgent(params: {
    agentId: string;
    agentName: string;
    agentEmail: string;
  }): Promise<OrganizationDocument> {
    const fallbackName = params.agentName.trim() || params.agentEmail.split('@')[0] || 'Workspace';
    const name = `${fallbackName} Organization`;
    const slugBase = this.normalizeSlug(fallbackName);
    const slug = `${slugBase}-${params.agentId.slice(-6)}`;

    return this.create({
      name,
      slug,
      ownerId: params.agentId
    });
  }

  async findActiveById(id: string): Promise<OrganizationDocument> {
    this.validateObjectId(id, 'organizationId');

    const organization = await this.organizationModel.findById(id).exec();
    if (!organization || !organization.isActive) {
      throw new NotFoundException('Organization not found or inactive');
    }

    return organization;
  }

  async findActiveBySlug(slug: string): Promise<OrganizationDocument> {
    const normalizedSlug = this.normalizeSlug(slug);
    const organization = await this.organizationModel.findOne({ slug: normalizedSlug }).exec();
    if (!organization || !organization.isActive) {
      throw new NotFoundException('Organization not found or inactive');
    }

    return organization;
  }

  async resolveActiveOrganization(params: {
    organizationId?: string;
    organizationSlug?: string;
  }): Promise<OrganizationDocument> {
    if (params.organizationId) {
      return this.findActiveById(params.organizationId);
    }

    if (params.organizationSlug) {
      return this.findActiveBySlug(params.organizationSlug);
    }

    throw new BadRequestException('organizationId or organizationSlug is required.');
  }

  toView(organization: OrganizationDocument): OrganizationView {
    return {
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      isActive: organization.isActive
    };
  }

  normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
