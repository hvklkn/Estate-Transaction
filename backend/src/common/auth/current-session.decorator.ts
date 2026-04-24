import { UnauthorizedException, createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthenticatedRequest, AuthenticatedSession } from '@/common/auth/authenticated-request.interface';

export const CurrentSession = createParamDecorator(
  (field: keyof AuthenticatedSession | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = request.auth;

    if (!session) {
      throw new UnauthorizedException('Authenticated session is required.');
    }

    if (!field) {
      return session;
    }

    return session[field];
  }
);
