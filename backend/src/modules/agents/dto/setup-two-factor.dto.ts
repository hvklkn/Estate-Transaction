import { IsIn, IsString } from 'class-validator';

export class SetupTwoFactorDto {
  @IsString()
  @IsIn(['sms', 'authenticator'])
  method!: 'sms' | 'authenticator';
}
