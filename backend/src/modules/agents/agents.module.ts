import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { RolesGuard } from '@/common/auth/roles.guard';
import { AgentsController } from '@/modules/agents/controllers/agents.controller';
import { Agent, AgentSchema } from '@/modules/agents/schemas/agent.schema';
import { AgentsService } from '@/modules/agents/services/agents.service';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';

@Module({
  imports: [
    OrganizationsModule,
    MongooseModule.forFeature([
      {
        name: Agent.name,
        schema: AgentSchema
      }
    ])
  ],
  controllers: [AgentsController],
  providers: [AgentsService, SessionAuthGuard, RolesGuard],
  exports: [AgentsService]
})
export class AgentsModule {}
