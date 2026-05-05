import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { Client } from '@/modules/clients/schemas/client.schema';
import { PropertyListingType } from '@/modules/properties/domain/property-listing-type.enum';
import { PropertyStatus } from '@/modules/properties/domain/property-status.enum';
import { PropertyType } from '@/modules/properties/domain/property-type.enum';

export type PropertyDocument = HydratedDocument<Property>;

@Schema({
  timestamps: true,
  collection: 'properties'
})
export class Property {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, type: String, enum: PropertyType, default: PropertyType.OTHER })
  type!: PropertyType;

  @Prop({ required: true, type: String, enum: PropertyListingType })
  listingType!: PropertyListingType;

  @Prop({ trim: true, default: '' })
  address!: string;

  @Prop({ trim: true, default: '' })
  city!: string;

  @Prop({ trim: true, default: '' })
  district!: string;

  @Prop({ type: Number, min: 0, default: null })
  price!: number | null;

  @Prop({ trim: true, uppercase: true, default: 'USD' })
  currency!: string;

  @Prop({ required: true, type: String, enum: PropertyStatus, default: PropertyStatus.DRAFT })
  status!: PropertyStatus;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Client.name, default: null })
  ownerClientId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Agent.name, default: null })
  createdBy!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Agent.name, default: null })
  updatedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  @Prop({ type: Types.ObjectId, ref: Agent.name, default: null })
  deletedBy!: Types.ObjectId | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

PropertySchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
PropertySchema.index({ organizationId: 1, status: 1, createdAt: -1 });
PropertySchema.index({ organizationId: 1, listingType: 1, status: 1 });
PropertySchema.index({ organizationId: 1, title: 1 });
PropertySchema.index({ organizationId: 1, city: 1, district: 1 });
PropertySchema.index({ organizationId: 1, ownerClientId: 1 });
