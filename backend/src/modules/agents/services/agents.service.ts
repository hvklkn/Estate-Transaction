import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateAgentDto } from '@/modules/agents/dto/create-agent.dto';
import { LoginAgentDto } from '@/modules/agents/dto/login-agent.dto';
import { UpdateAgentDto } from '@/modules/agents/dto/update-agent.dto';
import { Agent, AgentDocument } from '@/modules/agents/schemas/agent.schema';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>
  ) {}

  async create(createAgentDto: CreateAgentDto): Promise<AgentDocument> {
    try {
      return await this.agentModel.create(createAgentDto);
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('Agent email already exists');
      }

      throw error;
    }
  }

  async register(createAgentDto: CreateAgentDto): Promise<AgentDocument> {
    return this.create(createAgentDto);
  }

  async login(loginAgentDto: LoginAgentDto): Promise<AgentDocument> {
    const agent = await this.agentModel.findOne({ email: loginAgentDto.email }).exec();

    if (!agent) {
      throw new UnauthorizedException('No registered user found for this email');
    }

    if (!agent.isActive) {
      throw new UnauthorizedException('This user is inactive');
    }

    return agent;
  }

  async findAll(): Promise<AgentDocument[]> {
    return this.agentModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<AgentDocument> {
    this.validateObjectId(id, 'agentId');

    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentDocument> {
    this.validateObjectId(id, 'agentId');

    try {
      const updatedAgent = await this.agentModel
        .findByIdAndUpdate(id, updateAgentDto, {
          new: true,
          runValidators: true
        })
        .exec();

      if (!updatedAgent) {
        throw new NotFoundException('Agent not found');
      }

      return updatedAgent;
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('Agent email already exists');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.validateObjectId(id, 'agentId');

    const deleted = await this.agentModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Agent not found');
    }
  }

  async ensureAgentExists(agentId: string): Promise<void> {
    this.validateObjectId(agentId, 'agentId');

    const exists = await this.agentModel.exists({ _id: agentId });
    if (!exists) {
      throw new NotFoundException(`Agent not found: ${agentId}`);
    }
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
