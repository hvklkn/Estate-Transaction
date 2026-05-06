import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { AgentDocument } from '@/modules/agents/schemas/agent.schema';
import { AgentsService } from '@/modules/agents/services/agents.service';
import { OrganizationsService } from '@/modules/organizations/services/organizations.service';

describe('AgentsService public registration rules', () => {
  const configServiceMock = {
    get: jest.fn((_key: string, fallback: unknown) => fallback)
  };
  const agentModelMock = {
    estimatedDocumentCount: jest.fn()
  };
  const organizationsServiceMock = {
    hasAnyOrganizations: jest.fn()
  };

  let service: AgentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgentsService(
      configServiceMock as unknown as ConfigService,
      agentModelMock as unknown as Model<AgentDocument>,
      organizationsServiceMock as unknown as OrganizationsService
    );
    agentModelMock.estimatedDocumentCount.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1)
    });
    organizationsServiceMock.hasAnyOrganizations.mockResolvedValue(true);
  });

  it('rejects public registration into an existing organization by id', async () => {
    await expect(
      service.register({
        name: 'Tenant Agent',
        email: 'agent@example.com',
        password: 'password123',
        organizationId: '661b8c0134e2c40fd2f89c11'
      })
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects public registration into an existing organization by slug', async () => {
    await expect(
      service.register({
        name: 'Tenant Agent',
        email: 'agent@example.com',
        password: 'password123',
        organizationSlug: 'existing-office'
      })
    ).rejects.toThrow(
      'Existing organization team members must be created by an office owner, admin, or manager from the authenticated app.'
    );
  });
});
