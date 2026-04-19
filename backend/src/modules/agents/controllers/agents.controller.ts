import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';

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

  private readSessionToken(authorizationHeader?: string): string {
    const header = authorizationHeader?.trim() ?? '';

    if (!header.toLowerCase().startsWith('bearer ')) {
      return '';
    }

    return header.slice(7).trim();
  }

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

  @Post('logout')
  async logout(@Headers('authorization') authorizationHeader?: string) {
    const sessionToken = this.readSessionToken(authorizationHeader);
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

  @Get('me/profile')
  getMyProfile(@Headers('authorization') authorizationHeader?: string) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.getMe(sessionToken);
  }

  @Patch('me/profile')
  updateMyProfile(
    @Body() updateAgentDto: UpdateAgentDto,
    @Headers('authorization') authorizationHeader?: string
  ) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.updateMyProfile(sessionToken, updateAgentDto);
  }

  @Patch('me/password')
  changeMyPassword(
    @Body() payload: ChangePasswordDto,
    @Headers('authorization') authorizationHeader?: string
  ) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.changeMyPassword(sessionToken, payload);
  }

  @Post('me/2fa/setup')
  setupMyTwoFactor(
    @Body() payload: SetupTwoFactorDto,
    @Headers('authorization') authorizationHeader?: string
  ) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.setupMyTwoFactor(sessionToken, payload);
  }

  @Post('me/2fa/verify')
  verifyMyTwoFactor(
    @Body() payload: VerifyTwoFactorDto,
    @Headers('authorization') authorizationHeader?: string
  ) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.verifyMyTwoFactor(sessionToken, payload);
  }

  @Post('me/2fa/disable')
  disableMyTwoFactor(@Headers('authorization') authorizationHeader?: string) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.disableMyTwoFactor(sessionToken);
  }

  @Get('me/sessions')
  getMySessions(@Headers('authorization') authorizationHeader?: string) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.listMySessions(sessionToken);
  }

  @Delete('me/sessions/:sessionId')
  revokeMySession(
    @Param('sessionId') sessionId: string,
    @Headers('authorization') authorizationHeader?: string
  ) {
    const sessionToken = this.readSessionToken(authorizationHeader);
    return this.agentsService.revokeMySession(sessionToken, sessionId);
  }

  @Delete('me/sessions')
  revokeMyOtherSessions(@Headers('authorization') authorizationHeader?: string) {
    const sessionToken = this.readSessionToken(authorizationHeader);
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
