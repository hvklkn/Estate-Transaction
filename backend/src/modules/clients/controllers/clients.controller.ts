import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import {
  RESOURCE_CREATOR_ROLES,
  RESOURCE_MANAGER_ROLES,
  RESOURCE_VIEWER_ROLES
} from '@/common/auth/role-permissions';
import { CurrentSession } from '@/common/auth/current-session.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { CreateClientDto } from '@/modules/clients/dto/create-client.dto';
import { UpdateClientDto } from '@/modules/clients/dto/update-client.dto';
import { ClientsService } from '@/modules/clients/services/clients.service';

@Controller('clients')
@UseGuards(SessionAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(...RESOURCE_CREATOR_ROLES)
  create(
    @Body() createClientDto: CreateClientDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.clientsService.create(createClientDto, currentAgentId, organizationId);
  }

  @Get()
  @Roles(...RESOURCE_VIEWER_ROLES)
  findAll(@CurrentSession('organizationId') organizationId: string) {
    return this.clientsService.findAll(organizationId);
  }

  @Get(':id')
  @Roles(...RESOURCE_VIEWER_ROLES)
  findOne(@Param('id') id: string, @CurrentSession('organizationId') organizationId: string) {
    return this.clientsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(...RESOURCE_MANAGER_ROLES)
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.clientsService.update(id, updateClientDto, currentAgentId, organizationId);
  }

  @Delete(':id')
  @Roles(...RESOURCE_MANAGER_ROLES)
  async remove(
    @Param('id') id: string,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    await this.clientsService.remove(id, currentAgentId, organizationId);
    return { success: true };
  }
}
