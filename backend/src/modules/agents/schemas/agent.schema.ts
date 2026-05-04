import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

export type TwoFactorMethod = 'sms' | 'authenticator';
export const AGENT_ROLES = [
  'super_admin',
  'office_owner',
  'manager',
  'agent',
  'finance',
  'assistant',
  'admin'
] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];

@Schema({
  _id: false
})
export class AgentSession {
  @Prop({ required: true, trim: true })
  sessionId!: string;

  @Prop({ required: true, trim: true })
  tokenHash!: string;

  @Prop({ required: true, trim: true })
  device!: string;

  @Prop({ required: true, trim: true })
  location!: string;

  @Prop({ required: true, trim: true })
  userAgent!: string;

  @Prop({ required: true })
  createdAt!: Date;

  @Prop({ required: true })
  lastActiveAt!: Date;
}

export const AgentSessionSchema = SchemaFactory.createForClass(AgentSession);

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

  @Prop({ trim: true, default: '' })
  firstName!: string;

  @Prop({ trim: true, default: '' })
  lastName!: string;

  @Prop({ trim: true, default: '' })
  phone!: string;

  @Prop({ trim: true, default: '' })
  iban!: string;

  @Prop({ required: true, enum: AGENT_ROLES, default: 'agent' })
  role!: AgentRole;

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organizationId!: Types.ObjectId | null;

  @Prop({ required: true, default: 0 })
  balanceCents!: number;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ default: false })
  twoFactorEnabled!: boolean;

  @Prop({ type: String, enum: ['sms', 'authenticator'], default: 'authenticator' })
  twoFactorMethod!: TwoFactorMethod;

  @Prop({ type: String, default: null, select: false })
  twoFactorSecret!: string | null;

  @Prop({ type: Date, default: null })
  twoFactorVerifiedAt!: Date | null;

  @Prop({ type: [AgentSessionSchema], default: [] })
  sessions!: AgentSession[];

  @Prop({ type: String, default: null, select: false })
  passwordResetCodeHash!: string | null;

  @Prop({ type: Date, default: null, select: false })
  passwordResetExpiresAt!: Date | null;

  @Prop({ type: Date, default: null, select: false })
  passwordResetRequestedAt!: Date | null;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
