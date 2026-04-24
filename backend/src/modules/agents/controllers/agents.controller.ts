import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentSession } from '@/common/auth/current-session.decorator';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { ChangePasswordDto } from '@/modules/agents/dto/change-password.dto';
import { CreateAgentDto } from '@/modules/agents/dto/create-agent.dto';
import { ForgotPasswordDto } from '@/modules/agents/dto/forgot-password.dto';
import { LoginAgentDto } from '@/modules/agents/dto/login-agent.dto';
import { ResetPasswordWithCodeDto } from '@/modules/agents/dto/reset-password-with-code.dto';
import { SetupTwoFactorDto } from '@/modules/agents/dto/setup-two-factor.dto';
import { UpdateAgentDto } from '@/modules/agents/dto/update-agent.dto';
import { VerifyTwoFactorDto } from '@/modules/agents/dto/verify-two-factor.dto';
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

  @Post('password/forgot')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.agentsService.requestPasswordResetCode(forgotPasswordDto);
  }

  @Post('password/reset')
  resetPasswordWithCode(@Body() resetPasswordWithCodeDto: ResetPasswordWithCodeDto) {
    return this.agentsService.resetPasswordWithCode(resetPasswordWithCodeDto);
  }

  @UseGuards(SessionAuthGuard)
  @Post('logout')
  async logout(@CurrentSession('sessionToken') sessionToken: string) {
    await this.agentsService.logoutBySessionToken(sessionToken);

    return {
      success: true
    };
  }

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @UseGuards(SessionAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentSession('sessionToken') sessionToken: string) {
    return this.agentsService.getMe(sessionToken);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('me/profile')
  updateMyProfile(
    @Body() updateAgentDto: UpdateAgentDto,
    @CurrentSession('sessionToken') sessionToken: string
  ) {
    return this.agentsService.updateMyProfile(sessionToken, updateAgentDto);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('me/password')
  changeMyPassword(
    @Body() payload: ChangePasswordDto,
    @CurrentSession('sessionToken') sessionToken: string
  ) {
    return this.agentsService.changeMyPassword(sessionToken, payload);
  }

  @UseGuards(SessionAuthGuard)
  @Post('me/2fa/setup')
  setupMyTwoFactor(
    @Body() payload: SetupTwoFactorDto,
    @CurrentSession('sessionToken') sessionToken: string
  ) {
    return this.agentsService.setupMyTwoFactor(sessionToken, payload);
  }

  @UseGuards(SessionAuthGuard)
  @Post('me/2fa/verify')
  verifyMyTwoFactor(
    @Body() payload: VerifyTwoFactorDto,
    @CurrentSession('sessionToken') sessionToken: string
  ) {
    return this.agentsService.verifyMyTwoFactor(sessionToken, payload);
  }

  @UseGuards(SessionAuthGuard)
  @Post('me/2fa/disable')
  disableMyTwoFactor(@CurrentSession('sessionToken') sessionToken: string) {
    return this.agentsService.disableMyTwoFactor(sessionToken);
  }

  @UseGuards(SessionAuthGuard)
  @Get('me/sessions')
  getMySessions(@CurrentSession('sessionToken') sessionToken: string) {
    return this.agentsService.listMySessions(sessionToken);
  }

  @UseGuards(SessionAuthGuard)
  @Delete('me/sessions/:sessionId')
  revokeMySession(
    @Param('sessionId') sessionId: string,
    @CurrentSession('sessionToken') sessionToken: string
  ) {
    return this.agentsService.revokeMySession(sessionToken, sessionId);
  }

  @UseGuards(SessionAuthGuard)
  @Delete('me/sessions')
  revokeMyOtherSessions(@CurrentSession('sessionToken') sessionToken: string) {
    return this.agentsService.revokeMyOtherSessions(sessionToken);
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
