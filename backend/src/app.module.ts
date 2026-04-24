import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { envValidationSchema } from '@/config/env.validation';
import { AgentsModule } from '@/modules/agents/agents.module';
import { BalanceModule } from '@/modules/balance/balance.module';
import { CommissionsModule } from '@/modules/commissions/commissions.module';
import { HealthModule } from '@/modules/health/health.module';
import { StagePolicyModule } from '@/modules/stage-policy/stage-policy.module';
import { TransactionsModule } from '@/modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    AgentsModule,
    BalanceModule,
    TransactionsModule,
    CommissionsModule,
    StagePolicyModule
  ]
})
export class AppModule {}
