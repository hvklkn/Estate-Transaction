import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  timingSafeEqual
} from 'crypto';

import { ChangePasswordDto } from '@/modules/agents/dto/change-password.dto';
import { CreateAgentDto } from '@/modules/agents/dto/create-agent.dto';
import { ForgotPasswordDto } from '@/modules/agents/dto/forgot-password.dto';
import { LoginAgentDto } from '@/modules/agents/dto/login-agent.dto';
import { ResetPasswordWithCodeDto } from '@/modules/agents/dto/reset-password-with-code.dto';
import { SetupTwoFactorDto } from '@/modules/agents/dto/setup-two-factor.dto';
import { UpdateAgentDto } from '@/modules/agents/dto/update-agent.dto';
import { VerifyTwoFactorDto } from '@/modules/agents/dto/verify-two-factor.dto';
import { Agent, AgentDocument, TwoFactorMethod } from '@/modules/agents/schemas/agent.schema';

type SanitizedAgent = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  iban: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: TwoFactorMethod;
  twoFactorVerifiedAt: string | null;
};

type SessionPublicData = {
  id: string;
  device: string;
  location: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};

const TOTP_TIME_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const PBKDF_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;
const PASSWORD_RESET_CODE_TTL_MINUTES = 10;

@Injectable()
export class AgentsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>
  ) {}

  async create(createAgentDto: CreateAgentDto): Promise<SanitizedAgent> {
    try {
      const nextAgent = await this.agentModel.create({
        ...createAgentDto,
        passwordHash: this.hashPassword(createAgentDto.password),
        firstName: '',
        lastName: '',
        phone: '',
        iban: '',
        twoFactorEnabled: false,
        twoFactorMethod: 'authenticator',
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
        sessions: []
      });

      return this.sanitizeAgent(nextAgent);
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('Agent email already exists');
      }

      throw error;
    }
  }

  async register(createAgentDto: CreateAgentDto): Promise<{
    agent: SanitizedAgent;
    sessionToken: string;
  }> {
    const createdAgent = await this.create(createAgentDto);
    const loginResult = await this.login({
      email: createdAgent.email,
      password: createAgentDto.password
    });

    if ('requiresTwoFactor' in loginResult) {
      throw new UnauthorizedException('Unable to start session for newly registered account.');
    }

    return loginResult;
  }

  async login(loginAgentDto: LoginAgentDto): Promise<
    | {
        requiresTwoFactor: true;
        twoFactorMethod: TwoFactorMethod;
      }
    | {
        agent: SanitizedAgent;
        sessionToken: string;
      }
  > {
    const agent = await this.agentModel
      .findOne({ email: loginAgentDto.email })
      .select('+passwordHash +twoFactorSecret')
      .exec();

    if (!agent) {
      throw new UnauthorizedException('No registered user found for this email');
    }

    if (!agent.isActive) {
      throw new UnauthorizedException('This user is inactive');
    }

    if (!this.verifyPassword(loginAgentDto.password, agent.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (agent.twoFactorEnabled) {
      if (!loginAgentDto.twoFactorCode) {
        return {
          requiresTwoFactor: true,
          twoFactorMethod: agent.twoFactorMethod
        };
      }

      if (!agent.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor secret is not configured.');
      }

      const validCode = this.verifyTotpCode(agent.twoFactorSecret, loginAgentDto.twoFactorCode);
      if (!validCode) {
        throw new UnauthorizedException('Invalid two-factor code');
      }
    }

    const sessionToken = this.createSessionToken();
    const now = new Date();

    agent.sessions.unshift({
      sessionId: randomUUID(),
      tokenHash: this.hashSessionToken(sessionToken),
      device: this.normalizeSessionValue(loginAgentDto.device, 'Web Browser'),
      location: this.normalizeSessionValue(loginAgentDto.location, 'Unknown Location'),
      userAgent: this.normalizeSessionValue(loginAgentDto.userAgent, 'Unknown User Agent'),
      createdAt: now,
      lastActiveAt: now
    });

    agent.sessions = agent.sessions.slice(0, 20);
    await agent.save();

    return {
      agent: this.sanitizeAgent(agent),
      sessionToken
    };
  }

  async logoutBySessionToken(sessionToken: string): Promise<void> {
    const tokenHash = this.hashSessionToken(sessionToken);
    const agent = await this.agentModel.findOne({ 'sessions.tokenHash': tokenHash }).exec();

    if (!agent) {
      return;
    }

    agent.sessions = agent.sessions.filter((session) => session.tokenHash !== tokenHash);
    await agent.save();
  }

  async findAll(): Promise<SanitizedAgent[]> {
    const agents = await this.agentModel.find().sort({ createdAt: -1 }).exec();
    return agents.map((agent) => this.sanitizeAgent(agent));
  }

  async findOne(id: string): Promise<SanitizedAgent> {
    this.validateObjectId(id, 'agentId');

    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.sanitizeAgent(agent);
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<SanitizedAgent> {
    this.validateObjectId(id, 'agentId');

    try {
      const updatedAgent = await this.agentModel
        .findByIdAndUpdate(id, updateAgentDto, {
          new: true,
          runValidators: true
        })
        .exec();

      if (!updatedAgent) {
        throw new NotFoundException('Agent not found');
      }

      return this.sanitizeAgent(updatedAgent);
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('Agent email already exists');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.validateObjectId(id, 'agentId');

    const deleted = await this.agentModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Agent not found');
    }
  }

  async ensureAgentExists(agentId: string): Promise<void> {
    this.validateObjectId(agentId, 'agentId');

    const exists = await this.agentModel.exists({ _id: agentId });
    if (!exists) {
      throw new NotFoundException(`Agent not found: ${agentId}`);
    }
  }

  async getMe(sessionToken: string): Promise<SanitizedAgent> {
    const { agent } = await this.resolveAgentBySessionToken(sessionToken);
    return this.sanitizeAgent(agent);
  }

  async getAgentIdBySessionToken(sessionToken: string): Promise<string> {
    const { agent } = await this.resolveAgentBySessionToken(sessionToken);
    return agent._id.toString();
  }

  async updateMyProfile(sessionToken: string, updateAgentDto: UpdateAgentDto): Promise<SanitizedAgent> {
    const { agent } = await this.resolveAgentBySessionToken(sessionToken);

    if (updateAgentDto.name !== undefined) {
      agent.name = updateAgentDto.name;
    }

    if (updateAgentDto.email !== undefined) {
      agent.email = updateAgentDto.email;
    }

    if (updateAgentDto.firstName !== undefined) {
      agent.firstName = updateAgentDto.firstName;
    }

    if (updateAgentDto.lastName !== undefined) {
      agent.lastName = updateAgentDto.lastName;
    }

    if (updateAgentDto.phone !== undefined) {
      agent.phone = updateAgentDto.phone;
    }

    if (updateAgentDto.iban !== undefined) {
      agent.iban = updateAgentDto.iban;
    }

    try {
      await agent.save();
      return this.sanitizeAgent(agent);
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('Agent email already exists');
      }

      throw error;
    }
  }

  async changeMyPassword(sessionToken: string, payload: ChangePasswordDto): Promise<{ success: true }> {
    if (payload.newPassword !== payload.confirmNewPassword) {
      throw new BadRequestException('newPassword and confirmNewPassword do not match.');
    }

    const { agent } = await this.resolveAgentBySessionToken(sessionToken, true);

    if (!this.verifyPassword(payload.currentPassword, agent.passwordHash)) {
      throw new UnauthorizedException('Current password is invalid.');
    }

    if (payload.currentPassword === payload.newPassword) {
      throw new BadRequestException('New password must be different from current password.');
    }

    agent.passwordHash = this.hashPassword(payload.newPassword);
    await agent.save();

    return { success: true };
  }

  async requestPasswordResetCode(
    forgotPasswordDto: ForgotPasswordDto
  ): Promise<{ success: true; developmentCode?: string }> {

    const agent = await this.agentModel
      .findOne({ email: forgotPasswordDto.email })
      .select('+passwordResetCodeHash +passwordResetExpiresAt +passwordResetRequestedAt')
      .exec();

    if (!agent || !agent.isActive) {
      return { success: true };
    }

    const now = new Date();
    const code = this.generatePasswordResetCode();

    agent.passwordResetCodeHash = this.hashPasswordResetCode(code);
    agent.passwordResetRequestedAt = now;
    agent.passwordResetExpiresAt = new Date(
      now.getTime() + PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000
    );
    await agent.save();

    try {
      this.ensureEmailProviderConfigured();
      await this.sendPasswordResetEmail(agent.email, code);
      return { success: true };
    } catch (error: unknown) {
      if (this.isDevelopmentEnvironment()) {
        return {
          success: true,
          developmentCode: code
        };
      }

      throw error;
    }
  }

  async resetPasswordWithCode(payload: ResetPasswordWithCodeDto): Promise<{ success: true }> {
    if (payload.newPassword !== payload.confirmNewPassword) {
      throw new BadRequestException('newPassword and confirmNewPassword do not match.');
    }

    const agent = await this.agentModel
      .findOne({ email: payload.email })
      .select('+passwordHash +passwordResetCodeHash +passwordResetExpiresAt')
      .exec();

    if (!agent || !agent.isActive) {
      throw new BadRequestException('Reset code is invalid or expired.');
    }

    if (!agent.passwordResetCodeHash || !agent.passwordResetExpiresAt) {
      throw new BadRequestException('Reset code is invalid or expired.');
    }

    if (agent.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset code is invalid or expired.');
    }

    if (!this.verifyPasswordResetCode(payload.code, agent.passwordResetCodeHash)) {
      throw new BadRequestException('Reset code is invalid or expired.');
    }

    if (this.verifyPassword(payload.newPassword, agent.passwordHash)) {
      throw new BadRequestException('New password must be different from current password.');
    }

    agent.passwordHash = this.hashPassword(payload.newPassword);
    agent.passwordResetCodeHash = null;
    agent.passwordResetExpiresAt = null;
    agent.passwordResetRequestedAt = null;
    agent.sessions = [];
    await agent.save();

    return { success: true };
  }

  async setupMyTwoFactor(
    sessionToken: string,
    payload: SetupTwoFactorDto
  ): Promise<{ method: TwoFactorMethod; secret: string; otpauthUrl: string }> {
    if (payload.method !== 'authenticator') {
      throw new BadRequestException(
        'SMS provider is not configured in this environment. Please use authenticator method.'
      );
    }

    const { agent } = await this.resolveAgentBySessionToken(sessionToken, true);
    const secret = this.generateTotpSecret();

    agent.twoFactorMethod = 'authenticator';
    agent.twoFactorSecret = secret;
    agent.twoFactorEnabled = false;
    agent.twoFactorVerifiedAt = null;
    await agent.save();

    const otpauthUrl = this.createOtpAuthUrl(agent.email, secret);

    return {
      method: 'authenticator',
      secret,
      otpauthUrl
    };
  }

  async verifyMyTwoFactor(
    sessionToken: string,
    payload: VerifyTwoFactorDto
  ): Promise<{ success: true; verifiedAt: string }> {
    const { agent } = await this.resolveAgentBySessionToken(sessionToken, true);

    if (!agent.twoFactorSecret) {
      throw new BadRequestException('Two-factor setup is required before verification.');
    }

    const validCode = this.verifyTotpCode(agent.twoFactorSecret, payload.code);
    if (!validCode) {
      throw new BadRequestException('Two-factor verification code is invalid.');
    }

    const verifiedAt = new Date();
    agent.twoFactorEnabled = true;
    agent.twoFactorVerifiedAt = verifiedAt;
    await agent.save();

    return {
      success: true,
      verifiedAt: verifiedAt.toISOString()
    };
  }

  async disableMyTwoFactor(sessionToken: string): Promise<{ success: true }> {
    const { agent } = await this.resolveAgentBySessionToken(sessionToken, true);

    agent.twoFactorEnabled = false;
    agent.twoFactorSecret = null;
    agent.twoFactorVerifiedAt = null;
    await agent.save();

    return { success: true };
  }

  async listMySessions(sessionToken: string): Promise<{
    currentSessionId: string;
    sessions: SessionPublicData[];
  }> {
    const { agent, currentSessionId } = await this.resolveAgentBySessionToken(sessionToken);

    const sessions = agent.sessions
      .map((session) => ({
        id: session.sessionId,
        device: session.device,
        location: session.location,
        userAgent: session.userAgent,
        createdAt: session.createdAt.toISOString(),
        lastActiveAt: session.lastActiveAt.toISOString(),
        current: session.sessionId === currentSessionId
      }))
      .sort(
        (left, right) =>
          new Date(right.lastActiveAt).getTime() - new Date(left.lastActiveAt).getTime()
      );

    return {
      currentSessionId,
      sessions
    };
  }

  async revokeMySession(sessionToken: string, sessionId: string): Promise<{ success: true }> {
    const { agent, currentSessionId } = await this.resolveAgentBySessionToken(sessionToken);

    if (sessionId === currentSessionId) {
      throw new BadRequestException('Current session cannot be revoked via this endpoint.');
    }

    agent.sessions = agent.sessions.filter((session) => session.sessionId !== sessionId);
    await agent.save();

    return { success: true };
  }

  async revokeMyOtherSessions(sessionToken: string): Promise<{ success: true }> {
    const { agent, currentSessionId } = await this.resolveAgentBySessionToken(sessionToken);

    agent.sessions = agent.sessions.filter((session) => session.sessionId === currentSessionId);
    await agent.save();

    return { success: true };
  }

  private async resolveAgentBySessionToken(
    rawToken: string,
    includeSensitive = false
  ): Promise<{ agent: AgentDocument; currentSessionId: string }> {
    const token = rawToken.trim();
    if (!token) {
      throw new UnauthorizedException('Session token is required.');
    }

    const tokenHash = this.hashSessionToken(token);
    const query = this.agentModel.findOne({ 'sessions.tokenHash': tokenHash });
    if (includeSensitive) {
      query.select('+passwordHash +twoFactorSecret');
    }

    const agent = await query.exec();
    if (!agent) {
      throw new UnauthorizedException('Session is invalid or expired.');
    }

    const currentSession = agent.sessions.find((session) => session.tokenHash === tokenHash);
    if (!currentSession) {
      throw new UnauthorizedException('Session is invalid or expired.');
    }

    currentSession.lastActiveAt = new Date();
    await agent.save();

    return {
      agent,
      currentSessionId: currentSession.sessionId
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(PBKDF_SALT_BYTES).toString('hex');
    const digest = scryptSync(password, salt, PASSWORD_KEY_BYTES).toString('hex');
    return `${salt}:${digest}`;
  }

  private verifyPassword(password: string, passwordHash: string | null | undefined): boolean {
    if (typeof passwordHash !== 'string' || passwordHash.length === 0) {
      return false;
    }

    const [salt, digest] = passwordHash.split(':');
    if (!salt || !digest) {
      return false;
    }

    const nextDigest = scryptSync(password, salt, PASSWORD_KEY_BYTES).toString('hex');

    try {
      return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(nextDigest, 'hex'));
    } catch {
      return false;
    }
  }

  private createSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generatePasswordResetCode(): string {
    return randomInt(100000, 1_000_000).toString();
  }

  private hashPasswordResetCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private verifyPasswordResetCode(code: string, storedHash: string): boolean {
    const nextHash = this.hashPasswordResetCode(code.trim());

    try {
      return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(nextHash, 'hex'));
    } catch {
      return false;
    }
  }

  private ensureEmailProviderConfigured(): void {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY', '').trim();
    const resendFromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', '').trim();

    if (!resendApiKey || !resendFromEmail) {
      throw new BadRequestException(
        'Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in backend environment.'
      );
    }
  }

  private isDevelopmentEnvironment(): boolean {
    return this.configService.get<string>('NODE_ENV', 'development') === 'development';
  }

  private async sendPasswordResetEmail(toEmail: string, code: string): Promise<void> {
    const resendApiKey = this.configService.getOrThrow<string>('RESEND_API_KEY').trim();
    const resendFromEmail = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL').trim();
    const resendFromName = this.configService.get<string>('RESEND_FROM_NAME', 'Iceberg').trim();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${resendFromName} <${resendFromEmail}>`,
        to: [toEmail],
        subject: 'Your Iceberg password reset code',
        html: `<p>Your password reset code is:</p><p><strong style="font-size:22px; letter-spacing:2px;">${code}</strong></p><p>This code expires in ${PASSWORD_RESET_CODE_TTL_MINUTES} minutes.</p>`
      })
    });

    if (!response.ok) {
      let providerMessage = '';

      try {
        const errorPayload = (await response.json()) as {
          message?: string;
          error?: { message?: string };
        };
        providerMessage =
          errorPayload.message?.trim() ??
          errorPayload.error?.message?.trim() ??
          '';
      } catch {
        providerMessage = '';
      }

      const reason = providerMessage ? ` (${providerMessage})` : '';
      throw new BadRequestException(
        `Password reset email could not be sent. Please verify email provider configuration.${reason}`
      );
    }
  }

  private normalizeSessionValue(value: string | undefined, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized.slice(0, 120) : fallback;
  }

  private sanitizeAgent(agent: AgentDocument): SanitizedAgent {
    return {
      id: agent._id.toString(),
      name: agent.name,
      email: agent.email,
      isActive: agent.isActive,
      firstName: agent.firstName ?? '',
      lastName: agent.lastName ?? '',
      phone: agent.phone ?? '',
      iban: agent.iban ?? '',
      twoFactorEnabled: Boolean(agent.twoFactorEnabled),
      twoFactorMethod: (agent.twoFactorMethod as TwoFactorMethod) ?? 'authenticator',
      twoFactorVerifiedAt: agent.twoFactorVerifiedAt
        ? new Date(agent.twoFactorVerifiedAt).toISOString()
        : null
    };
  }

  private generateTotpSecret(): string {
    const raw = randomBytes(20);
    return this.base32Encode(raw);
  }

  private createOtpAuthUrl(email: string, secret: string): string {
    const issuer = encodeURIComponent('Iceberg');
    const label = encodeURIComponent(`Iceberg:${email}`);
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_TIME_STEP_SECONDS}`;
  }

  private verifyTotpCode(secret: string, code: string): boolean {
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      return false;
    }

    const currentCounter = Math.floor(Date.now() / 1000 / TOTP_TIME_STEP_SECONDS);
    for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
      const generated = this.generateTotpCode(secret, currentCounter + offset);
      if (generated === normalizedCode) {
        return true;
      }
    }

    return false;
  }

  private generateTotpCode(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 10 ** TOTP_DIGITS;
    return otp.toString().padStart(TOTP_DIGITS, '0');
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.replace(/=+$/g, '').toUpperCase();
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (const char of cleaned) {
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new BadRequestException('Invalid two-factor secret.');
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  private validateObjectId(value: string, field: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${field} must be a valid MongoDB ObjectId`);
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
