import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

import { PropertyListingType } from '@/modules/properties/domain/property-listing-type.enum';
import { PropertyStatus } from '@/modules/properties/domain/property-status.enum';
import { PropertyType } from '@/modules/properties/domain/property-type.enum';

const normalizeOptionalObjectId = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export class CreatePropertyDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsEnum(PropertyType)
  type!: PropertyType;

  @IsEnum(PropertyListingType)
  listingType!: PropertyListingType;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  @IsOptional()
  city?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  @IsOptional()
  district?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(3000)
  @IsOptional()
  description?: string;

  @Transform(({ value }) => normalizeOptionalObjectId(value))
  @IsMongoId()
  @IsOptional()
  ownerClientId?: string;
}
