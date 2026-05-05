import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { ClientType } from '@/modules/clients/domain/client-type.enum';

export type ClientDocument = HydratedDocument<Client>;

@Schema({
  timestamps: true,
  collection: 'clients'
})
export class Client {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ trim: true, default: '' })
  phone!: string;

  @Prop({ trim: true, lowercase: true, default: '' })
  email!: string;

  @Prop({ required: true, type: String, enum: ClientType, default: ClientType.OTHER })
  type!: ClientType;

  @Prop({ trim: true, default: '' })
  notes!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' })
  organizationId!: Types.ObjectId;

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

export const ClientSchema = SchemaFactory.createForClass(Client);

ClientSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
ClientSchema.index({ organizationId: 1, fullName: 1 });
ClientSchema.index({ organizationId: 1, email: 1 });
ClientSchema.index({ organizationId: 1, type: 1, createdAt: -1 });
