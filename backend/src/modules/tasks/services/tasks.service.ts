import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { AgentsService } from '@/modules/agents/services/agents.service';
import { ClientsService } from '@/modules/clients/services/clients.service';
import { PropertiesService } from '@/modules/properties/services/properties.service';
import { CreateTaskDto } from '@/modules/tasks/dto/create-task.dto';
import { ListTasksQueryDto } from '@/modules/tasks/dto/list-tasks-query.dto';
import { UpdateTaskDto } from '@/modules/tasks/dto/update-task.dto';
import { TaskStatus } from '@/modules/tasks/domain/task-status.enum';
import { Task, TaskDocument } from '@/modules/tasks/schemas/task.schema';
import { TaskPolicyService } from '@/modules/tasks/services/task-policy.service';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

export interface TasksSummary {
  pending: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

const OPEN_TASK_STATUSES = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly agentsService: AgentsService,
    private readonly clientsService: ClientsService,
    private readonly propertiesService: PropertiesService,
    private readonly transactionsService: TransactionsService,
    private readonly taskPolicyService: TaskPolicyService
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    actorAgentId: string,
    actorRole: AgentRole,
    organizationId: string
  ): Promise<TaskDocument> {
    const assignedTo = this.taskPolicyService.resolveAssignedToForCreate(
      createTaskDto,
      actorAgentId,
      actorRole
    );
    await this.validateRelations({ ...createTaskDto, assignedTo }, organizationId);

    return this.taskModel.create({
      title: createTaskDto.title,
      description: createTaskDto.description ?? '',
      dueDate: this.toDateOrNull(createTaskDto.dueDate),
      status: createTaskDto.status ?? TaskStatus.TODO,
      priority: createTaskDto.priority,
      assignedTo: this.toObjectIdOrNull(assignedTo),
      relatedTransactionId: this.toObjectIdOrNull(createTaskDto.relatedTransactionId),
      relatedClientId: this.toObjectIdOrNull(createTaskDto.relatedClientId),
      relatedPropertyId: this.toObjectIdOrNull(createTaskDto.relatedPropertyId),
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(actorAgentId),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null
    });
  }

  async findAll(query: ListTasksQueryDto, organizationId: string): Promise<TaskDocument[]> {
    return this.withPopulation(
      this.taskModel.find(this.buildFilter(query, organizationId)).sort({
        dueDate: 1,
        priority: -1,
        createdAt: -1,
        _id: -1
      })
    ).exec();
  }

  async findOne(id: string, organizationId: string): Promise<TaskDocument> {
    this.validateObjectId(id, 'taskId');

    const task = await this.withPopulation(
      this.taskModel.findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
    ).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    actorAgentId: string,
    actorRole: AgentRole,
    organizationId: string
  ): Promise<TaskDocument> {
    this.validateObjectId(id, 'taskId');

    const existingTask = await this.taskModel
      .findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
      .exec();

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    this.taskPolicyService.assertCanUpdate(existingTask, updateTaskDto, actorAgentId, actorRole);
    await this.validateRelations(updateTaskDto, organizationId);

    const updatedTask = await this.withPopulation(
      this.taskModel.findOneAndUpdate(
        {
          ...this.activeTenantFilter(organizationId),
          _id: id
        },
        {
          ...updateTaskDto,
          ...(updateTaskDto.dueDate !== undefined
            ? { dueDate: this.toDateOrNull(updateTaskDto.dueDate) }
            : {}),
          ...(updateTaskDto.assignedTo !== undefined
            ? { assignedTo: this.toObjectIdOrNull(updateTaskDto.assignedTo) }
            : {}),
          ...(updateTaskDto.relatedTransactionId !== undefined
            ? {
                relatedTransactionId: this.toObjectIdOrNull(updateTaskDto.relatedTransactionId)
              }
            : {}),
          ...(updateTaskDto.relatedClientId !== undefined
            ? { relatedClientId: this.toObjectIdOrNull(updateTaskDto.relatedClientId) }
            : {}),
          ...(updateTaskDto.relatedPropertyId !== undefined
            ? { relatedPropertyId: this.toObjectIdOrNull(updateTaskDto.relatedPropertyId) }
            : {}),
          updatedBy: new Types.ObjectId(actorAgentId)
        },
        {
          new: true,
          runValidators: true
        }
      )
    ).exec();

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    return updatedTask;
  }

  async remove(id: string, actorAgentId: string, organizationId: string): Promise<void> {
    this.validateObjectId(id, 'taskId');

    const deletedTask = await this.taskModel
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

    if (!deletedTask) {
      throw new NotFoundException('Task not found');
    }
  }

  async getSummary(organizationId: string): Promise<TasksSummary> {
    const now = new Date();
    const startOfToday = this.startOfDay(now);
    const startOfTomorrow = this.addDays(startOfToday, 1);
    const endOfWeekWindow = this.addDays(startOfToday, 7);
    const baseFilter = {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null,
      status: { $in: OPEN_TASK_STATUSES }
    };

    const [pending, overdue, dueToday, dueThisWeek] = await Promise.all([
      this.taskModel.countDocuments(baseFilter).exec(),
      this.taskModel.countDocuments({ ...baseFilter, dueDate: { $lt: startOfToday } }).exec(),
      this.taskModel
        .countDocuments({
          ...baseFilter,
          dueDate: { $gte: startOfToday, $lt: startOfTomorrow }
        })
        .exec(),
      this.taskModel
        .countDocuments({
          ...baseFilter,
          dueDate: { $gte: startOfToday, $lt: endOfWeekWindow }
        })
        .exec()
    ]);

    return {
      pending,
      overdue,
      dueToday,
      dueThisWeek
    };
  }

  private async validateRelations(
    payload: CreateTaskDto | UpdateTaskDto,
    organizationId: string
  ): Promise<void> {
    if (payload.assignedTo) {
      await this.agentsService.ensureAgentExists(payload.assignedTo, organizationId);
    }

    if (payload.relatedTransactionId) {
      await this.transactionsService.ensureTransactionBelongsToOrganization(
        payload.relatedTransactionId,
        organizationId
      );
    }

    if (payload.relatedClientId) {
      await this.clientsService.ensureClientsBelongToOrganization(
        [payload.relatedClientId],
        organizationId
      );
    }

    if (payload.relatedPropertyId) {
      await this.propertiesService.ensurePropertyBelongsToOrganization(
        payload.relatedPropertyId,
        organizationId
      );
    }
  }

  private buildFilter(query: ListTasksQueryDto, organizationId: string): FilterQuery<Task> {
    const filter: FilterQuery<Task> = this.activeTenantFilter(organizationId);

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.assignedTo) {
      this.validateObjectId(query.assignedTo, 'assignedTo');
      filter.assignedTo = new Types.ObjectId(query.assignedTo);
    }

    if (query.relatedTransactionId) {
      this.validateObjectId(query.relatedTransactionId, 'relatedTransactionId');
      filter.relatedTransactionId = new Types.ObjectId(query.relatedTransactionId);
    }

    if (query.dueFilter) {
      Object.assign(filter, this.buildDueDateFilter(query.dueFilter));
      filter.status = query.status ?? { $in: OPEN_TASK_STATUSES };
    }

    return filter;
  }

  private buildDueDateFilter(dueFilter: ListTasksQueryDto['dueFilter']): FilterQuery<Task> {
    const now = new Date();
    const startOfToday = this.startOfDay(now);

    if (dueFilter === 'overdue') {
      return { dueDate: { $lt: startOfToday } };
    }

    if (dueFilter === 'today') {
      return { dueDate: { $gte: startOfToday, $lt: this.addDays(startOfToday, 1) } };
    }

    if (dueFilter === 'week') {
      return { dueDate: { $gte: startOfToday, $lt: this.addDays(startOfToday, 7) } };
    }

    return {};
  }

  private activeTenantFilter(organizationId: string): FilterQuery<Task> {
    return {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null
    };
  }

  private withPopulation<T>(query: T): T {
    const queryWithPopulate = query as {
      populate(field: string, projection: string): unknown;
    };

    queryWithPopulate.populate('assignedTo', 'name email isActive');
    queryWithPopulate.populate('relatedTransactionId', 'propertyTitle stage transactionType');
    queryWithPopulate.populate('relatedClientId', 'fullName email phone type');
    queryWithPopulate.populate(
      'relatedPropertyId',
      'title type listingType city district price currency status'
    );
    queryWithPopulate.populate('createdBy', 'name email isActive');
    queryWithPopulate.populate('updatedBy', 'name email isActive');
    queryWithPopulate.populate('deletedBy', 'name email isActive');

    return query;
  }

  private toObjectIdOrNull(value: string | null | undefined): Types.ObjectId | null {
    return value ? new Types.ObjectId(value) : null;
  }

  private toDateOrNull(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private addDays(value: Date, days: number): Date {
    const nextDate = new Date(value);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }
}
