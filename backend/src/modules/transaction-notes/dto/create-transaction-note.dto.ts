import { Transform } from 'class-transformer';
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTransactionNoteDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  transactionId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content!: string;
}
