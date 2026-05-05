import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { envValidationSchema } from '@/config/env.validation';
import { AgentsModule } from '@/modules/agents/agents.module';
import { BalanceModule } from '@/modules/balance/balance.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { CommissionsModule } from '@/modules/commissions/commissions.module';
import { HealthModule } from '@/modules/health/health.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { PropertiesModule } from '@/modules/properties/properties.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { StagePolicyModule } from '@/modules/stage-policy/stage-policy.module';
import { TasksModule } from '@/modules/tasks/tasks.module';
import { TransactionNotesModule } from '@/modules/transaction-notes/transaction-notes.module';
import { TransactionsModule } from '@/modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: Boolean(process.env.JEST_WORKER_ID),
      validationSchema: envValidationSchema
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB', 'iceberg')
      })
    }),
    HealthModule,
    OrganizationsModule,
    AgentsModule,
    ClientsModule,
    PropertiesModule,
    ReportsModule,
    TasksModule,
    TransactionNotesModule,
    BalanceModule,
    TransactionsModule,
    CommissionsModule,
    StagePolicyModule
  ]
})
export class AppModule {}
