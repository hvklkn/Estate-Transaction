import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import {
  PROPERTY_CREATOR_ROLES,
  PROPERTY_MANAGER_ROLES,
  PROPERTY_VIEWER_ROLES
} from '@/common/auth/role-permissions';
import { CurrentSession } from '@/common/auth/current-session.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { CreatePropertyDto } from '@/modules/properties/dto/create-property.dto';
import { UpdatePropertyDto } from '@/modules/properties/dto/update-property.dto';
import { PropertiesService } from '@/modules/properties/services/properties.service';

@Controller('properties')
@UseGuards(SessionAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles(...PROPERTY_CREATOR_ROLES)
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.propertiesService.create(createPropertyDto, currentAgentId, organizationId);
  }

  @Get()
  @Roles(...PROPERTY_VIEWER_ROLES)
  findAll(@CurrentSession('organizationId') organizationId: string) {
    return this.propertiesService.findAll(organizationId);
  }

  @Get(':id')
  @Roles(...PROPERTY_VIEWER_ROLES)
  findOne(@Param('id') id: string, @CurrentSession('organizationId') organizationId: string) {
    return this.propertiesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(...PROPERTY_MANAGER_ROLES)
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    return this.propertiesService.update(id, updatePropertyDto, currentAgentId, organizationId);
  }

  @Delete(':id')
  @Roles(...PROPERTY_MANAGER_ROLES)
  async remove(
    @Param('id') id: string,
    @CurrentSession('agentId') currentAgentId: string,
    @CurrentSession('organizationId') organizationId: string
  ) {
    await this.propertiesService.remove(id, currentAgentId, organizationId);
    return { success: true };
  }
}
