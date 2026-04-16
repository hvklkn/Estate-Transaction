import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

@Schema({
  timestamps: true,
  collection: 'agents'
})
export class Agent {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  email!: string;

  @Prop({ required: true, default: true })
  isActive!: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
