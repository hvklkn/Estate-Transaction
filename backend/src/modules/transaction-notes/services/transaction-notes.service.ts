import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { AgentRole } from '@/modules/agents/schemas/agent.schema';
import { CreateTransactionNoteDto } from '@/modules/transaction-notes/dto/create-transaction-note.dto';
import { ListTransactionNotesQueryDto } from '@/modules/transaction-notes/dto/list-transaction-notes-query.dto';
import { UpdateTransactionNoteDto } from '@/modules/transaction-notes/dto/update-transaction-note.dto';
import {
  TransactionNote,
  TransactionNoteDocument
} from '@/modules/transaction-notes/schemas/transaction-note.schema';
import { TransactionNotePolicyService } from '@/modules/transaction-notes/services/transaction-note-policy.service';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

const DEFAULT_RECENT_LIMIT = 8;

@Injectable()
export class TransactionNotesService {
  constructor(
    @InjectModel(TransactionNote.name)
    private readonly transactionNoteModel: Model<TransactionNoteDocument>,
    private readonly transactionsService: TransactionsService,
    private readonly transactionNotePolicyService: TransactionNotePolicyService
  ) {}

  async create(
    createTransactionNoteDto: CreateTransactionNoteDto,
    actorAgentId: string,
    organizationId: string
  ): Promise<TransactionNoteDocument> {
    await this.transactionsService.ensureTransactionBelongsToOrganization(
      createTransactionNoteDto.transactionId,
      organizationId
    );

    return this.transactionNoteModel.create({
      transactionId: new Types.ObjectId(createTransactionNoteDto.transactionId),
      authorId: new Types.ObjectId(actorAgentId),
      content: createTransactionNoteDto.content,
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null,
      deletedBy: null
    });
  }

  async findAll(
    query: ListTransactionNotesQueryDto,
    organizationId: string
  ): Promise<TransactionNoteDocument[]> {
    const filter: FilterQuery<TransactionNote> = this.activeTenantFilter(organizationId);

    if (query.transactionId) {
      await this.transactionsService.ensureTransactionBelongsToOrganization(
        query.transactionId,
        organizationId
      );
      filter.transactionId = new Types.ObjectId(query.transactionId);
    }

    return this.withPopulation(
      this.transactionNoteModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(query.limit ?? 100)
    ).exec();
  }

  async findRecent(
    organizationId: string,
    limit = DEFAULT_RECENT_LIMIT
  ): Promise<TransactionNoteDocument[]> {
    return this.withPopulation(
      this.transactionNoteModel
        .find(this.activeTenantFilter(organizationId))
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
    ).exec();
  }

  async findOne(id: string, organizationId: string): Promise<TransactionNoteDocument> {
    this.validateObjectId(id, 'noteId');

    const note = await this.withPopulation(
      this.transactionNoteModel.findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
    ).exec();

    if (!note) {
      throw new NotFoundException('Transaction note not found');
    }

    return note;
  }

  async update(
    id: string,
    updateTransactionNoteDto: UpdateTransactionNoteDto,
    actorAgentId: string,
    actorRole: AgentRole,
    organizationId: string
  ): Promise<TransactionNoteDocument> {
    this.validateObjectId(id, 'noteId');

    const existingNote = await this.transactionNoteModel
      .findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
      .exec();

    if (!existingNote) {
      throw new NotFoundException('Transaction note not found');
    }

    this.transactionNotePolicyService.assertCanModify(existingNote, actorAgentId, actorRole);

    const updatedNote = await this.withPopulation(
      this.transactionNoteModel.findOneAndUpdate(
        {
          ...this.activeTenantFilter(organizationId),
          _id: id
        },
        {
          content: updateTransactionNoteDto.content
        },
        {
          new: true,
          runValidators: true
        }
      )
    ).exec();

    if (!updatedNote) {
      throw new NotFoundException('Transaction note not found');
    }

    return updatedNote;
  }

  async remove(
    id: string,
    actorAgentId: string,
    actorRole: AgentRole,
    organizationId: string
  ): Promise<void> {
    this.validateObjectId(id, 'noteId');

    const existingNote = await this.transactionNoteModel
      .findOne({
        ...this.activeTenantFilter(organizationId),
        _id: id
      })
      .exec();

    if (!existingNote) {
      throw new NotFoundException('Transaction note not found');
    }

    this.transactionNotePolicyService.assertCanModify(existingNote, actorAgentId, actorRole);

    await this.transactionNoteModel
      .findOneAndUpdate(
        {
          ...this.activeTenantFilter(organizationId),
          _id: id
        },
        {
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(actorAgentId)
        },
        { new: false }
      )
      .exec();
  }

  private activeTenantFilter(organizationId: string): FilterQuery<TransactionNote> {
    return {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null
    };
  }

  private withPopulation<T>(query: T): T {
    const queryWithPopulate = query as {
      populate(field: string, projection: string): unknown;
    };

    queryWithPopulate.populate('transactionId', 'propertyTitle stage transactionType');
    queryWithPopulate.populate('authorId', 'name email isActive');
    queryWithPopulate.populate('deletedBy', 'name email isActive');

    return query;
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }
}
