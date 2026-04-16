import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateAgentDto } from '@/modules/agents/dto/create-agent.dto';
import { LoginAgentDto } from '@/modules/agents/dto/login-agent.dto';
import { UpdateAgentDto } from '@/modules/agents/dto/update-agent.dto';
import { AgentsService } from '@/modules/agents/services/agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('register')
  register(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.register(createAgentDto);
  }

  @Post('login')
  login(@Body() loginAgentDto: LoginAgentDto) {
    return this.agentsService.login(loginAgentDto);
  }

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.agentsService.remove(id);
    return {
      success: true
    };
  }
}
