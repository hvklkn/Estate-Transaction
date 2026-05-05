import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { ClientsController } from '@/modules/clients/controllers/clients.controller';
import { Client, ClientSchema } from '@/modules/clients/schemas/client.schema';
import { ClientsService } from '@/modules/clients/services/clients.service';

@Module({
  imports: [
    AgentsModule,
    MongooseModule.forFeature([
      {
        name: Client.name,
        schema: ClientSchema
      }
    ])
  ],
  controllers: [ClientsController],
  providers: [ClientsService, SessionAuthGuard, RolesGuard],
  exports: [ClientsService]
})
export class ClientsModule {}
