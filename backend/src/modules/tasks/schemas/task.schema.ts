import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { Client } from '@/modules/clients/schemas/client.schema';
import { Property } from '@/modules/properties/schemas/property.schema';
import { TaskPriority } from '@/modules/tasks/domain/task-priority.enum';
import { TaskStatus } from '@/modules/tasks/domain/task-status.enum';
import { Transaction } from '@/modules/transactions/schemas/transaction.schema';

export type TaskDocument = HydratedDocument<Task>;

@Schema({
  timestamps: true,
  collection: 'tasks'
})
export class Task {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ type: Date, default: null })
  dueDate!: Date | null;

  @Prop({ required: true, type: String, enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Prop({ required: true, type: String, enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: Agent.name, default: null })
  assignedTo!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Transaction.name, default: null })
  relatedTransactionId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Client.name, default: null })
  relatedClientId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Property.name, default: null })
  relatedPropertyId!: Types.ObjectId | null;

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

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ organizationId: 1, deletedAt: 1, dueDate: 1 });
TaskSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ organizationId: 1, priority: 1, dueDate: 1 });
TaskSchema.index({ organizationId: 1, assignedTo: 1, dueDate: 1 });
TaskSchema.index({ organizationId: 1, relatedTransactionId: 1, createdAt: -1 });
TaskSchema.index({ organizationId: 1, relatedClientId: 1, createdAt: -1 });
TaskSchema.index({ organizationId: 1, relatedPropertyId: 1, createdAt: -1 });
