import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthenticatedRequest } from '@/common/auth/authenticated-request.interface';
import { AgentsService } from '@/modules/agents/services/agents.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly agentsService: AgentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;
    const sessionToken = this.readBearerSessionToken(authorizationHeader);

    const sessionContext = await this.agentsService.getSessionContextByToken(sessionToken);
    request.auth = {
      agentId: sessionContext.agentId,
      sessionId: sessionContext.sessionId,
      sessionToken,
      role: sessionContext.role,
      organizationId: sessionContext.organizationId
    };

    return true;
  }

  private readBearerSessionToken(authorizationHeader?: string): string {
    const header = authorizationHeader?.trim() ?? '';

    if (!header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Bearer session token is required.');
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Bearer session token is required.');
    }

    return token;
  }
}
