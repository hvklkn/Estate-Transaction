import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { AppModule } from '@/app.module';

const parseCorsOrigins = (origins: string): string[] =>
  origins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  const corsOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ORIGIN', 'http://localhost:3000')
  );
  const corsCredentials = configService.get<boolean>('CORS_CREDENTIALS', false);
  const allowAllOrigins = corsOrigins.includes('*');
  const usingLocalhostCorsDefault =
    corsOrigins.length === 1 && corsOrigins[0] === 'http://localhost:3000';

  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must include at least one origin.');
  }

  if (allowAllOrigins && corsCredentials) {
    throw new Error(
      'Invalid CORS configuration: CORS_ORIGIN cannot include "*" when CORS_CREDENTIALS is true.'
    );
  }

  if (nodeEnv === 'production' && usingLocalhostCorsDefault) {
    throw new Error(
      'Invalid production CORS configuration: set CORS_ORIGIN to your deployed frontend origin(s).'
    );
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void
    ) => {
      if (allowAllOrigins || !origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: corsCredentials,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}

bootstrap();
