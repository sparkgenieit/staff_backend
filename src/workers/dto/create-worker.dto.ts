import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

type RateUnit = 'HOUR' | 'DAY' | 'FIXED';
type RoleName = 'maid' | 'driver' | 'telecaller' | 'carpenter';

export class CreateWorkerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  // Decimal as string for Prisma
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return value;
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) return n.toFixed(2);
    return String(value);
  })
  @IsString()
  @IsNotEmpty()
  baseRate!: string;

  @IsEnum(['HOUR', 'DAY', 'FIXED'] as any)
  rateUnit!: RateUnit;

  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsNumber()
  radiusKm!: number;

  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  expYears?: number;

  // rating as number 0..5 (service converts to decimal string)
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  strikes?: number;

  // NEW: arrays
  @IsOptional()
  @IsArray()
  @IsEnum(['maid', 'driver', 'telecaller', 'carpenter'] as any, { each: true })
  skills?: RoleName[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  langs?: string[];
}