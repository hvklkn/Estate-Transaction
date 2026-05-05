import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { PropertiesModule } from '@/modules/properties/properties.module';
import { Task, TaskSchema } from '@/modules/tasks/schemas/task.schema';
import { TasksController } from '@/modules/tasks/controllers/tasks.controller';
import { TaskPolicyService } from '@/modules/tasks/services/task-policy.service';
import { TasksService } from '@/modules/tasks/services/tasks.service';
import { TransactionsModule } from '@/modules/transactions/transactions.module';

@Module({
  imports: [
    AgentsModule,
    ClientsModule,
    PropertiesModule,
    TransactionsModule,
    MongooseModule.forFeature([
      {
        name: Task.name,
        schema: TaskSchema
      }
    ])
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskPolicyService, SessionAuthGuard, RolesGuard],
  exports: [TasksService]
})
export class TasksModule {}
