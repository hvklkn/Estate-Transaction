import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { TransactionNote } from '@/modules/transaction-notes/schemas/transaction-note.schema';
import { TransactionNotePolicyService } from '@/modules/transaction-notes/services/transaction-note-policy.service';
import { TransactionNotesService } from '@/modules/transaction-notes/services/transaction-notes.service';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

const ORGANIZATION_ID = '661b8c0134e2c40fd2f89c11';
const OTHER_ORGANIZATION_ID = '661b8c0134e2c40fd2f89c22';
const NOTE_ID = '661b8c0134e2c40fd2f89d11';
const TRANSACTION_ID = '661b8c0134e2c40fd2f89b33';
const AUTHOR_ID = '661b8c0134e2c40fd2f89a11';
const OTHER_AGENT_ID = '661b8c0134e2c40fd2f89a22';

const createQueryMock = <T>(result: T) => {
  const query = {
    populate: jest.fn(),
    sort: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn().mockResolvedValue(result)
  };

  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return query;
};

describe('TransactionNotesService', () => {
  let service: TransactionNotesService;

  const transactionNoteModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn()
  };

  const transactionsServiceMock = {
    ensureTransactionBelongsToOrganization: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionNotesService,
        TransactionNotePolicyService,
        {
          provide: getModelToken(TransactionNote.name),
          useValue: transactionNoteModelMock
        },
        {
          provide: TransactionsService,
          useValue: transactionsServiceMock
        }
      ]
    }).compile();

    service = module.get<TransactionNotesService>(TransactionNotesService);
  });

  it('creates notes with author from session and validates transaction organization', async () => {
    const payload = {
      transactionId: TRANSACTION_ID,
      content: 'Buyer requested updated payment schedule.'
    };
    const createdNote = { _id: NOTE_ID, ...payload, authorId: AUTHOR_ID };
    transactionNoteModelMock.create.mockResolvedValue(createdNote);

    const result = await service.create(payload, AUTHOR_ID, ORGANIZATION_ID);

    expect(transactionsServiceMock.ensureTransactionBelongsToOrganization).toHaveBeenCalledWith(
      TRANSACTION_ID,
      ORGANIZATION_ID
    );
    expect(transactionNoteModelMock.create).toHaveBeenCalledWith({
      transactionId: new Types.ObjectId(TRANSACTION_ID),
      authorId: new Types.ObjectId(AUTHOR_ID),
      content: payload.content,
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null,
      deletedBy: null
    });
    expect(result).toEqual(createdNote);
  });

  it('lists notes in reverse chronological order within the current organization', async () => {
    const query = createQueryMock([]);
    transactionNoteModelMock.find.mockReturnValue(query);

    await service.findAll({ transactionId: TRANSACTION_ID }, ORGANIZATION_ID);

    expect(transactionNoteModelMock.find).toHaveBeenCalledWith({
      organizationId: new Types.ObjectId(ORGANIZATION_ID),
      deletedAt: null,
      transactionId: new Types.ObjectId(TRANSACTION_ID)
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
  });

  it('does not return notes from another organization', async () => {
    transactionNoteModelMock.findOne.mockReturnValue(createQueryMock(null));

    await expect(service.findOne(NOTE_ID, OTHER_ORGANIZATION_ID)).rejects.toThrow(
      NotFoundException
    );
    expect(transactionNoteModelMock.findOne).toHaveBeenCalledWith({
      _id: NOTE_ID,
      organizationId: new Types.ObjectId(OTHER_ORGANIZATION_ID),
      deletedAt: null
    });
  });

  it('prevents agents from updating notes they did not author', async () => {
    transactionNoteModelMock.findOne.mockReturnValue(
      createQueryMock({
        _id: NOTE_ID,
        authorId: new Types.ObjectId(OTHER_AGENT_ID)
      })
    );

    await expect(
      service.update(NOTE_ID, { content: 'Updated note' }, AUTHOR_ID, 'agent', ORGANIZATION_ID)
    ).rejects.toThrow(ForbiddenException);
  });
});
