import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthenticatedRequest } from '@/common/auth/authenticated-request.interface';
import { ROLES_KEY } from '@/common/auth/roles.decorator';
import { AgentRole } from '@/modules/agents/schemas/agent.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<AgentRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.auth?.role;

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    throw new ForbiddenException('Insufficient role permissions.');
  }
}
