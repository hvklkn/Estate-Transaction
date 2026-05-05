import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { PropertiesController } from '@/modules/properties/controllers/properties.controller';
import { Property, PropertySchema } from '@/modules/properties/schemas/property.schema';
import { PropertiesService } from '@/modules/properties/services/properties.service';

@Module({
  imports: [
    AgentsModule,
    ClientsModule,
    MongooseModule.forFeature([
      {
        name: Property.name,
        schema: PropertySchema
      }
    ])
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, SessionAuthGuard, RolesGuard],
  exports: [PropertiesService]
})
export class PropertiesModule {}
