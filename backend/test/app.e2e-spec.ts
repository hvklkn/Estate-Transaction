import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

type SessionAgent = {
  id: string;
  email: string;
  password: string;
  sessionToken: string;
};

describe('Auth + Transactions (e2e)', () => {
  let app: INestApplication;
  let mongodb: MongoMemoryServer;
  let creator: SessionAgent;
  let listingAgent: SessionAgent;
  let sellingAgent: SessionAgent;
  let outsiderAgent: SessionAgent;
  let managerAgent: SessionAgent;
  let splitTransactionId: string;
  let sameAgentTransactionId: string;
  let editableTransactionId: string;
  let softDeletedTransactionId: string;

  const createAuthHeaders = (sessionToken: string) => ({
    Authorization: `Bearer ${sessionToken}`
  });

  const extractObjectId = (
    value: unknown
  ): string | null => {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value === 'object') {
      const objectValue = value as { _id?: string; id?: string };
      if (typeof objectValue._id === 'string') {
        return objectValue._id;
      }
      if (typeof objectValue.id === 'string') {
        return objectValue.id;
      }
    }

    return null;
  };

  const registerAgent = async (seed: string): Promise<SessionAgent> => {
    const email = `${seed}.${Date.now()}@example.com`;
    const password = 'StrongPass123!';
    const response = await request(app.getHttpServer())
      .post('/api/agents/register')
      .send({
        name: `${seed} agent`,
        email,
        password
      })
      .expect(201);

    return {
      id: response.body.agent.id,
      sessionToken: response.body.sessionToken,
      email,
      password
    };
  };

  const createAgentWithRole = async (
    seed: string,
    role: 'agent' | 'manager' | 'admin'
  ): Promise<SessionAgent> => {
    const email = `${seed}.${Date.now()}@example.com`;
    const password = 'StrongPass123!';

    await request(app.getHttpServer())
      .post('/api/agents')
      .send({
        name: `${seed} ${role}`,
        email,
        password,
        role
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/agents/login')
      .send({
        email,
        password,
        device: 'E2E Browser',
        location: 'CI',
        userAgent: 'Jest'
      })
      .expect(201);

    return {
      id: loginResponse.body.agent.id,
      sessionToken: loginResponse.body.sessionToken,
      email,
      password
    };
  };

  beforeAll(async () => {
    mongodb = await MongoMemoryServer.create({
      instance: {
        ip: '127.0.0.1',
        port: 27027
      }
    });

    process.env.NODE_ENV = 'test';
    process.env.PORT = '3101';
    process.env.API_PREFIX = 'api';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.CORS_CREDENTIALS = 'false';
    process.env.MONGODB_URI = mongodb.getUri();
    process.env.MONGODB_DB = `iceberg_e2e_${Date.now()}`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(process.env.API_PREFIX);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (mongodb) {
      await mongodb.stop();
    }
  });

  it('supports register/login basic flow', async () => {
    creator = await registerAgent('creator');

    await request(app.getHttpServer())
      .post('/api/agents/logout')
      .set(createAuthHeaders(creator.sessionToken))
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/agents/login')
      .send({
        email: creator.email,
        password: creator.password,
        device: 'E2E Browser',
        location: 'CI',
        userAgent: 'Jest'
      })
      .expect(201);

    creator.sessionToken = loginResponse.body.sessionToken;

    expect(loginResponse.body.agent.id).toBe(creator.id);
    expect(typeof loginResponse.body.sessionToken).toBe('string');
  });

  it('rejects creating transaction without bearer auth', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions')
      .send({
        propertyTitle: 'Unauthorized Transaction',
        totalServiceFee: 100000,
        listingAgentId: '661b8c0134e2c40fd2f89a11',
        sellingAgentId: '661b8c0134e2c40fd2f89a22',
        transactionType: 'sold'
      })
      .expect(401);
  });

  it('creates transaction with authenticated actor and records audit fields', async () => {
    listingAgent = await registerAgent('listing');
    sellingAgent = await registerAgent('selling');

    const response = await request(app.getHttpServer())
      .post('/api/transactions')
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        propertyTitle: 'Sunset Villas #12',
        totalServiceFee: 100000,
        listingAgentId: listingAgent.id,
        sellingAgentId: sellingAgent.id,
        transactionType: 'sold'
      })
      .expect(201);

    splitTransactionId = response.body._id;

    expect(response.body.stage).toBe('agreement');
    expect(response.body.createdBy).toBe(creator.id);
    expect(Array.isArray(response.body.stageHistory)).toBe(true);
    expect(response.body.stageHistory[0].changedBy).toBe(creator.id);
  });

  it('edits a transaction and persists updatedBy from authenticated actor', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/transactions')
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        propertyTitle: 'Editable Record #1',
        totalServiceFee: 82000,
        listingAgentId: listingAgent.id,
        sellingAgentId: sellingAgent.id,
        transactionType: 'sold'
      })
      .expect(201);

    editableTransactionId = createResponse.body._id;

    const patchResponse = await request(app.getHttpServer())
      .patch(`/api/transactions/${editableTransactionId}`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        propertyTitle: 'Editable Record #1 - Updated'
      })
      .expect(200);

    expect(patchResponse.body.propertyTitle).toBe('Editable Record #1 - Updated');

    const updatedBy = extractObjectId(patchResponse.body.updatedBy);
    expect(updatedBy).toBe(creator.id);
  });

  it('soft-deletes a transaction and keeps delete audit fields', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/transactions')
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        propertyTitle: 'Soft Delete Candidate',
        totalServiceFee: 90000,
        listingAgentId: listingAgent.id,
        sellingAgentId: sellingAgent.id,
        transactionType: 'sold'
      })
      .expect(201);

    softDeletedTransactionId = createResponse.body._id;

    await request(app.getHttpServer())
      .delete(`/api/transactions/${softDeletedTransactionId}`)
      .set(createAuthHeaders(creator.sessionToken))
      .expect(200);

    const listWithoutDeleted = await request(app.getHttpServer())
      .get('/api/transactions')
      .set(createAuthHeaders(creator.sessionToken))
      .expect(200);

    const idsWithoutDeleted = (listWithoutDeleted.body.items as Array<{ _id?: string }>).map(
      (item) => item._id
    );
    expect(idsWithoutDeleted).not.toContain(softDeletedTransactionId);

    const listWithDeleted = await request(app.getHttpServer())
      .get('/api/transactions?includeDeleted=true')
      .set(createAuthHeaders(creator.sessionToken))
      .expect(200);

    const deletedRecord = (listWithDeleted.body.items as Array<Record<string, unknown>>).find(
      (item) => item._id === softDeletedTransactionId
    );
    expect(deletedRecord).toBeDefined();
    expect(deletedRecord?.isDeleted).toBe(true);
    expect(extractObjectId(deletedRecord?.deletedBy)).toBe(creator.id);
  });

  it('rejects invalid transaction payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        totalServiceFee: -10,
        listingAgentId: listingAgent.id,
        sellingAgentId: sellingAgent.id,
        transactionType: 'invalid'
      })
      .expect(400);
  });

  it('rejects invalid stage transitions (skip forward)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/transactions/${splitTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        stage: 'completed'
      })
      .expect(400);
  });

  it('rejects forbidden stage updates from non-participants', async () => {
    outsiderAgent = await registerAgent('outsider');

    await request(app.getHttpServer())
      .patch(`/api/transactions/${splitTransactionId}/stage`)
      .set(createAuthHeaders(outsiderAgent.sessionToken))
      .send({
        stage: 'earnest_money'
      })
      .expect(403);
  });

  it('updates stage with authenticated participant and resolves changedBy server-side', async () => {
    await request(app.getHttpServer())
      .patch(`/api/transactions/${splitTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        stage: 'earnest_money'
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/transactions/${splitTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        stage: 'title_deed'
      })
      .expect(200);

    const completedResponse = await request(app.getHttpServer())
      .patch(`/api/transactions/${splitTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        stage: 'completed'
      })
      .expect(200);

    expect(completedResponse.body.stage).toBe('completed');

    const stageHistory = completedResponse.body.stageHistory as Array<{
      toStage: string;
      changedBy?: string | { _id?: string; id?: string };
    }>;
    const finalHistoryEntry = stageHistory[stageHistory.length - 1];
    const changedByValue =
      typeof finalHistoryEntry?.changedBy === 'string'
        ? finalHistoryEntry.changedBy
        : finalHistoryEntry?.changedBy?._id ?? finalHistoryEntry?.changedBy?.id;

    expect(finalHistoryEntry?.toStage).toBe('completed');
    expect(changedByValue).toBe(creator.id);
  });

  it('credits balances for split-agent completed transaction', async () => {
    const listingBalanceResponse = await request(app.getHttpServer())
      .get('/api/balance/me')
      .set(createAuthHeaders(listingAgent.sessionToken))
      .expect(200);

    const sellingBalanceResponse = await request(app.getHttpServer())
      .get('/api/balance/me')
      .set(createAuthHeaders(sellingAgent.sessionToken))
      .expect(200);

    expect(listingBalanceResponse.body.balanceCents).toBe(2500000);
    expect(sellingBalanceResponse.body.balanceCents).toBe(2500000);
  });

  it('creates ledger entries for completed transaction credits', async () => {
    const ledgerResponse = await request(app.getHttpServer())
      .get('/api/balance/me/ledger')
      .set(createAuthHeaders(listingAgent.sessionToken))
      .expect(200);

    expect(Array.isArray(ledgerResponse.body.items)).toBe(true);
    expect(ledgerResponse.body.items.length).toBeGreaterThan(0);
    expect(ledgerResponse.body.items[0]).toEqual(
      expect.objectContaining({
        type: 'commission_credit',
        transactionId: splitTransactionId,
        amountCents: 2500000
      })
    );
  });

  it('same agent receives full agent pool when listing and selling agent are the same', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/transactions')
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        propertyTitle: 'Single Agent Commission Case',
        totalServiceFee: 120000,
        listingAgentId: creator.id,
        sellingAgentId: creator.id,
        transactionType: 'sold'
      })
      .expect(201);

    sameAgentTransactionId = createResponse.body._id;

    await request(app.getHttpServer())
      .patch(`/api/transactions/${sameAgentTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({ stage: 'earnest_money' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/transactions/${sameAgentTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({ stage: 'title_deed' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/transactions/${sameAgentTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({ stage: 'completed' })
      .expect(200);

    const creatorBalanceResponse = await request(app.getHttpServer())
      .get('/api/balance/me')
      .set(createAuthHeaders(creator.sessionToken))
      .expect(200);

    // 120000.00 total fee -> 60000.00 agent pool
    expect(creatorBalanceResponse.body.balanceCents).toBe(6000000);
  });

  it('does not double-credit balances if completed stage is requested again', async () => {
    const beforeRetryBalance = await request(app.getHttpServer())
      .get('/api/balance/me')
      .set(createAuthHeaders(listingAgent.sessionToken))
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/transactions/${splitTransactionId}/stage`)
      .set(createAuthHeaders(creator.sessionToken))
      .send({
        stage: 'completed'
      })
      .expect(409);

    const afterRetryBalance = await request(app.getHttpServer())
      .get('/api/balance/me')
      .set(createAuthHeaders(listingAgent.sessionToken))
      .expect(200);

    expect(afterRetryBalance.body.balanceCents).toBe(beforeRetryBalance.body.balanceCents);
  });

  it('prevents normal users from deleting completed transactions', async () => {
    await request(app.getHttpServer())
      .delete(`/api/transactions/${splitTransactionId}`)
      .set(createAuthHeaders(creator.sessionToken))
      .expect(409);
  });

  it('allows manager role to soft-delete completed transactions', async () => {
    managerAgent = await createAgentWithRole('manager', 'manager');

    await request(app.getHttpServer())
      .delete(`/api/transactions/${splitTransactionId}`)
      .set(createAuthHeaders(managerAgent.sessionToken))
      .expect(200);

    const withDeleted = await request(app.getHttpServer())
      .get('/api/transactions?includeDeleted=true')
      .set(createAuthHeaders(managerAgent.sessionToken))
      .expect(200);

    const deletedCompleted = (withDeleted.body.items as Array<Record<string, unknown>>).find(
      (item) => item._id === splitTransactionId
    );
    expect(deletedCompleted).toBeDefined();
    expect(deletedCompleted?.isDeleted).toBe(true);
    expect(extractObjectId(deletedCompleted?.deletedBy)).toBe(managerAgent.id);
  });

  it('prevents users from viewing another user balance unless privileged', async () => {
    await request(app.getHttpServer())
      .get(`/api/agents/${sellingAgent.id}/balance`)
      .set(createAuthHeaders(listingAgent.sessionToken))
      .expect(403);
  });

  it('returns completed earnings summary for authenticated requests', async () => {
    const summaryResponse = await request(app.getHttpServer())
      .get('/api/transactions/summary')
      .set(createAuthHeaders(creator.sessionToken))
      .expect(200);

    expect(summaryResponse.body.totalAgencyEarnings).toBeGreaterThan(0);
    expect(summaryResponse.body.totalAgentEarnings).toBeGreaterThan(0);
    expect(Array.isArray(summaryResponse.body.byAgent)).toBe(true);
  });

  it('rejects unauthorized summary requests', async () => {
    await request(app.getHttpServer()).get('/api/transactions/summary').expect(401);
  });
});
