import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsController } from '@/modules/agents/controllers/agents.controller';
import { Agent, AgentSchema } from '@/modules/agents/schemas/agent.schema';
import { AgentsService } from '@/modules/agents/services/agents.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Agent.name,
        schema: AgentSchema
      }
    ])
  ],
  controllers: [AgentsController],
  providers: [AgentsService, SessionAuthGuard],
  exports: [AgentsService]
})
export class AgentsModule {}
